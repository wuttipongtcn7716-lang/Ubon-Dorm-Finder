const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function formatGateClosingTime(val) {
  if (!val || val.trim() === '' || val === 'ไม่ปิด') return 'ไม่จำกัดเวลา (ไม่ปิด)';
  let str = val.toString().trim();
  str = str.replace(/\.\./g, ':');
  if (str.includes('-')) {
    const parts = str.split('-').map(s => {
      let part = s.trim().replace(/\./g, ':');
      if (!part.includes(':') && part.length === 2) part = `${part}:00`;
      return part;
    });
    return `${parts[0]} - ${parts[1]} น.`;
  }
  return `${str.replace(/\./g, ':')} น.`;
}

function formatWaterRate(val) {
  if (!val || val.trim() === '') return 'เหมาจ่าย';
  let str = val.toString().trim().replace(/\.0\b/g, '');
  if (str === 'เหมาจ่าย 100/คน' || str.includes('100/คน')) return 'เหมาจ่าย 100 บาท/คน';
  if (str.includes('เหมา')) return str;
  if (!str.includes('บาท')) return `${str} บาท/ยูนิต`;
  return str;
}

function formatElectricRate(val) {
  if (!val || val.trim() === '') return '8 บาท/หน่วย';
  let str = val.toString().trim().replace(/\.0\b/g, '');
  str = str.replace(/บาท\/หน่วย\s*บาท\/หน่วย/g, 'บาท/หน่วย');
  str = str.replace(/7บาท\/หน่วย/g, '7 บาท/หน่วย');
  if (!str.includes('บาท/หน่วย')) return `${str} บาท/หน่วย`;
  return str;
}

function formatMinLease(val) {
  if (!val || val.trim() === '') return '6 เดือน';
  let str = val.toString().trim();
  str = str.replace(/(\d+)\s*(เดือน|ปี)/g, '$1 $2');
  if (str === 'ไม่ขั้นต่ำ') return 'ไม่มีขั้นต่ำ';
  return str;
}

function formatDistance(val) {
  if (!val || val.trim() === '') return '';
  let str = val.toString().trim().replace(/\.0\b/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  if (num < 10) return `${num} กม.`;
  return `${num} ม.`;
}

function normalizeGenderType(val) {
  if (!val) return 'หอพักรวม';
  const str = val.toString().trim();
  if (str.includes('หญิง')) return 'หอพักหญิง';
  if (str.includes('ชาย')) return 'หอพักชาย';
  return 'หอพักรวม';
}

function parseDorms() {
  const tempDir = path.join(__dirname, '../temp_xlsx_parse');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  
  execSync('powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory(\'Dormitory_Evaluation_2569 copy.xlsx\', \'temp_xlsx_parse\')"');

  const sharedStringsPath = path.join(tempDir, 'xl/sharedStrings.xml');
  const sheetPath = path.join(tempDir, 'xl/worksheets/sheet1.xml');

  // Read shared strings
  const stringsXml = fs.readFileSync(sharedStringsPath, 'utf8');
  const sharedStrings = [];
  const siMatches = stringsXml.match(/<si>([\s\S]*?)<\/si>/g) || [];
  for (const si of siMatches) {
    const textMatches = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
    const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
    sharedStrings.push(text.trim());
  }

  // Read Sheet rows
  const sheetXml = fs.readFileSync(sheetPath, 'utf8');
  const rowMatches = sheetXml.match(/<row[^>]*>([\s\S]*?)<\/row>/g) || [];

  const dorms = [];

  for (let r = 1; r < rowMatches.length; r++) { // skip header
    const rowContent = rowMatches[r];
    const cellRegex = /<c\s+r="([A-Z]+)[0-9]+"(?:\s+s="[^"]*")?(?:\s+t="([^"]*)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g;
    
    const rowData = {};
    let match;
    while ((match = cellRegex.exec(rowContent)) !== null) {
      const colLetter = match[1];
      const type = match[2];
      const rawVal = match[3];
      const val = type === 's' ? sharedStrings[parseInt(rawVal, 10)] : (rawVal || '');
      rowData[colLetter] = val;
    }

    const name = rowData['C'];
    if (!name || name.trim() === '') continue;

    const evalResult = rowData['G'] || 'ผ่าน';
    const isWhiteDorm = evalResult.includes('ผ่าน') && !evalResult.includes('ไม่ผ่าน');

    // Parse lat / lng
    const lat = parseFloat(rowData['I']) || 15.118944;
    const lng = parseFloat(rowData['J']) || 104.902778;

    const roomType = (rowData['Q'] || 'ห้องแอร์').trim();
    const hasAir = roomType.includes('แอร์');
    const hasFan = roomType.includes('พัดลม');

    // Price parsing
    const rawPrice = (rowData['K'] || '3000').toString().replace(/,/g, '');
    let minPrice = 3000;
    let maxPrice = 3000;
    let fanPrice = null;
    let airPrice = null;

    if (rawPrice.includes('-')) {
      const parts = rawPrice.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
      minPrice = parts[0] || 3000;
      maxPrice = parts[1] || minPrice;
      if (hasFan && hasAir) {
        fanPrice = Math.min(minPrice, maxPrice);
        airPrice = Math.max(minPrice, maxPrice);
      } else if (hasFan && !hasAir) {
        fanPrice = minPrice;
        airPrice = null;
      } else {
        fanPrice = null;
        airPrice = minPrice;
      }
    } else {
      const parsedSingle = parseFloat(rawPrice) || 3000;
      if (hasFan && hasAir) {
        fanPrice = Math.max(1500, parsedSingle - 500);
        airPrice = parsedSingle;
        minPrice = fanPrice;
        maxPrice = airPrice;
      } else if (hasFan && !hasAir) {
        fanPrice = parsedSingle;
        airPrice = null;
        minPrice = fanPrice;
        maxPrice = fanPrice;
      } else {
        fanPrice = null;
        airPrice = parsedSingle;
        minPrice = airPrice;
        maxPrice = airPrice;
      }
    }

    const priceObj = {
      fan: fanPrice,
      air: airPrice,
    };

    const evalDate = rowData['B'] || '5-พ.ค.-69';
    const zone = rowData['D'] || 'รอบมหาวิทยาลัยอุบลราชธานี';
    const defaultImage = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';

    const gateClosing = formatGateClosingTime(rowData['AJ']);
    const waterRate = formatWaterRate(rowData['L']);
    const electricRate = formatElectricRate(rowData['M']);
    const minLease = formatMinLease(rowData['O']);
    const genderType = normalizeGenderType(rowData['P']);

    const dist7Eleven = formatDistance(rowData['AN']);
    const distLotus = formatDistance(rowData['AO']);
    const distBigC = formatDistance(rowData['AP']);
    const distMarket = formatDistance(rowData['AQ']);
    const distFoodCourt = formatDistance(rowData['AR']);

    const dorm = {
      id: dorms.length + 1,
      name: name.trim(),
      zone: zone.trim(),
      evaluationDate: evalDate.trim(),
      status: evalResult.trim(),
      lat: lat,
      lng: lng,
      price: priceObj,
      prices: priceObj,
      type: roomType,
      image: defaultImage,

      // Enhanced schema properties for Dormie UBU
      originalId: (dorms.length + 1).toString(),
      evalDate: evalDate.trim(),
      requiredStandards: rowData['E'] || 'ครบ',
      additionalStandards: rowData['F'] || 'ครบ',
      evalResult: evalResult.trim(),
      isWhiteDorm: isWhiteDorm,
      remarks: (rowData['H'] || '').trim(),
      latitude: lat,
      longitude: lng,
      minPrice: minPrice,
      maxPrice: maxPrice,
      waterRate: waterRate,
      electricRate: electricRate,
      deposit: parseFloat((rowData['N'] || '3000').toString().replace(/,/g, '')) || minPrice,
      minLease: minLease,
      genderType: genderType,
      roomType: roomType,
      waterHeater: (rowData['R'] || '').includes('มี'),
      fridge: (rowData['S'] || '').includes('มี'),
      wardrobe: (rowData['T'] || '').includes('มี'),
      bed: (rowData['U'] || '').includes('มี'),
      desk: (rowData['V'] || '').includes('มี'),
      wifi: (rowData['W'] || '').includes('มี') || (rowData['W'] || '').includes('ฟรี'),
      elevator: (rowData['X'] || '').includes('มี'),
      commonArea: (rowData['Y'] || '').includes('มี'),
      washingMachine: (rowData['Z'] || '').includes('มี'),
      parking: (rowData['AA'] || '').includes('มี'),
      keycard: (rowData['AB'] || '').includes('มี'),
      cctv: (rowData['AC'] || '').includes('มี'),
      securityGuard: (rowData['AD'] || '').includes('มี'),
      phone: (rowData['AE'] || '-').trim(),
      lineId: (rowData['AF'] || '').trim(),
      facebook: (rowData['AG'] || '').trim(),
      allowPet: (rowData['AH'] || '').includes('ได้') && !(rowData['AH'] || '').includes('ไม่ได้'),
      allowCooking: (rowData['AI'] || '').includes('ได้') && !(rowData['AI'] || '').includes('ไม่ได้'),
      gateClosingTime: gateClosing,
      nearMainRoad: (rowData['AK'] || 'ถนนสถลมาร์ค').trim(),
      nearPub: (rowData['AL'] || 'ไกล').trim(),
      noiseLevel: (rowData['AM'] || 'เงียบสงบ').includes('สงบ') ? 'เงียบสงบ' : ((rowData['AM'] || '').includes('ปานกลาง') ? 'ปานกลาง' : 'พลุกพล่าน'),
      dist7Eleven: dist7Eleven,
      distLotus: distLotus,
      distBigC: distBigC,
      distMarket: distMarket,
      distFoodCourt: distFoodCourt,
      floodRisk: (rowData['AS'] || '').includes('เสี่ยง') && !(rowData['AS'] || '').includes('ไม่เสี่ยง'),
      images: [
        defaultImage,
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
      ]
    };

    dorms.push(dorm);
  }

  console.log(`Parsed ${dorms.length} dormitories successfully!`);

  const dataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(path.join(dataDir, 'dorms.json'), JSON.stringify(dorms, null, 2), 'utf8');
  console.log('Saved src/data/dorms.json');

  fs.rmSync(tempDir, { recursive: true, force: true });
}

parseDorms();
