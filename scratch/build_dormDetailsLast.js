const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = [];
  let cur = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      cur += c;
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (cur.trim().length > 0) lines.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim().length > 0) lines.push(cur);

  function splitLine(line) {
    const res = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        res.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    res.push(field.trim());
    return res;
  }

  const header = splitLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const r = splitLine(lines[i]);
    const id = parseInt(r[0]);
    if (id >= 1 && id <= 60) {
      rows.push(r);
    }
  }
  return { header, rows };
}

function formatPrice(val) {
  if (!val || val === '-') return 'ไม่มีข้อมูล';
  let s = val.trim();
  if (s.includes('พัดลม') && s.includes('แอร์')) {
    // Dorm 60: "พัดลม2,900 แอร์3,200"
    return 'พัดลม 2,900 แอร์ 3,200 บาท/เดือน';
  }
  s = s.replace(/บาท\/เดือน/g, '').replace(/บาท/g, '').trim();
  if (s.includes('-') || s.includes('–')) {
    const parts = s.split(/[-–]/).map(p => {
      const clean = p.replace(/[^\d.]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? p.trim() : num.toLocaleString();
    });
    return `${parts[0]}-${parts[1]} บาท/เดือน`;
  }
  const clean = s.replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return `${num.toLocaleString()} บาท/เดือน`;
  }
  return `${s} บาท/เดือน`;
}

function formatWater(val) {
  if (!val || val === '-') return 'ไม่มีข้อมูล';
  let s = val.trim();
  // 1. "เหมาจ่าย 100/คน" -> "100 บาท/คน (เหมาจ่าย)"
  if (s.includes('เหมาจ่าย') && s.includes('/คน')) {
    const num = s.replace(/[^\d.]/g, '');
    return `${num} บาท/คน (เหมาจ่าย)`;
  }
  // 2. "150 เหมาจ่าย" -> "150 บาท (เหมาจ่าย)"
  if (s.includes('เหมาจ่าย')) {
    const num = s.replace(/[^\d.]/g, '');
    return `${num} บาท (เหมาจ่าย)`;
  }
  // 3. Per unit: "20", "25", "100", "19", "150", "18", "45" -> "X บาท/หน่วย"
  const clean = s.replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return `${num} บาท/หน่วย`;
  }
  return `${s} บาท/หน่วย`;
}

function formatElectric(val) {
  if (!val || val === '-') return 'ไม่มีข้อมูล';
  let s = val.trim();
  const clean = s.replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return `${num} บาท/หน่วย`;
  }
  return `${s} บาท/หน่วย`;
}

function formatDeposit(val) {
  if (!val || val === '-') return 'ไม่มีข้อมูล';
  let s = val.trim().replace(/บาท/g, '').trim();
  if (s.includes('-') || s.includes('–')) {
    const parts = s.split(/[-–]/).map(p => {
      const clean = p.replace(/[^\d.]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? p.trim() : Math.round(num).toLocaleString();
    });
    return `${parts[0]}-${parts[1]} บาท`;
  }
  const clean = s.replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return `${Math.round(num).toLocaleString()} บาท`;
  }
  return `${s} บาท`;
}

function formatLease(val) {
  if (!val || val === '-' || val === 'ไม่มีข้อมูล') return 'ไม่มีข้อมูล';
  let s = val.trim();
  if (s === 'ไม่ขั้นต่ำ' || s === 'สิ้นทุกเดือนเมษายน') return s;
  s = s.replace(/(\d+)\s*เดือน/g, '$1 เดือน');
  s = s.replace(/(\d+)\s*ปั/g, '$1 ปี');
  s = s.replace(/(\d+)\s*ปี/g, '$1 ปี');
  return s;
}

function formatDistance(val) {
  if (!val || val === '-' || val === 'ไม่มีข้อมูล') return 'ไม่มีข้อมูล';
  let s = val.trim();
  // MUST CHECK กิโลเมตร FIRST before เมตร!
  if (s.includes('กิโลเมตร')) {
    const num = s.replace('กิโลเมตร', '').trim();
    return `${num} Km`;
  }
  if (s.includes('เมตร')) {
    const num = s.replace('เมตร', '').trim();
    return `${num} m`;
  }
  if (s.endsWith('m') || s.endsWith('Km')) return s;
  return s;
}

function cleanCell(val) {
  if (val === undefined || val === null) return 'ไม่มีข้อมูล';
  const s = String(val).trim();
  if (!s || s === '-' || s === 'nan' || s === 'null') return 'ไม่มีข้อมูล';
  return s;
}

const csvPath = path.resolve('scratch/latest_dorms_from_user.csv');
const content = fs.readFileSync(csvPath, 'utf8');
const { header, rows } = parseCSV(content);

console.log(`Processing ${rows.length} rows from CSV...`);

const dormDetails = rows.map((cols, idx) => {
  const id = parseInt(cols[0], 10);
  const rawExcel = {};
  header.forEach((h, hIdx) => {
    rawExcel[h] = cols[hIdx] !== undefined ? cols[hIdx] : '';
  });

  return {
    id,
    excelId: String(cols[0]).trim(),
    excelName: cleanCell(cols[2]),
    evaluationDate: cleanCell(cols[1]),
    zone: cleanCell(cols[3]),
    evalResult: cleanCell(cols[6]),
    expenses: {
      rentPrice: formatPrice(cols[10]),
      waterRate: formatWater(cols[11]),
      electricRate: formatElectric(cols[12]),
      deposit: formatDeposit(cols[13]),
      minLease: formatLease(cols[14]),
      note: 'หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง กรุณาติดต่อหอพักเพื่อยืนยันราคาและเงื่อนไขก่อนทำสัญญา'
    },
    roomAndTenant: {
      genderType: cleanCell(cols[15]),
      roomType: cleanCell(cols[16])
    },
    roomAmenities: {
      waterHeater: cleanCell(cols[17]),
      refrigerator: cleanCell(cols[18]),
      wardrobe: cleanCell(cols[19]),
      bed: cleanCell(cols[20]),
      desk: cleanCell(cols[21]),
      wifi: cleanCell(cols[22])
    },
    commonFacilities: {
      elevator: cleanCell(cols[23]),
      commonArea: cleanCell(cols[24]),
      washingMachine: cleanCell(cols[25]),
      parking: cleanCell(cols[26])
    },
    security: {
      keycard: cleanCell(cols[27]),
      cctv: cleanCell(cols[28]),
      guard: cleanCell(cols[29])
    },
    rules: {
      pet: cleanCell(cols[33]),
      cooking: cleanCell(cols[34]),
      gateClosingTime: cleanCell(cols[35])
    },
    environment: {
      nearMainRoad: cleanCell(cols[36]),
      nearPub: cleanCell(cols[37]),
      noiseLevel: cleanCell(cols[38]),
      floodRisk: cleanCell(cols[44])
    },
    nearbyPlaces: {
      sevenEleven: formatDistance(cols[39]),
      lotusGoFresh: formatDistance(cols[40]),
      bigCMini: formatDistance(cols[41]),
      bungEunMarket: formatDistance(cols[42]),
      meeCharoenFoodCenter: formatDistance(cols[43])
    },
    contact: {
      phone: cleanCell(cols[30]),
      lineId: cleanCell(cols[31]),
      facebook: cleanCell(cols[32])
    },
    rawExcel
  };
});

const outPath = path.resolve('src/data/dormDetailsLast.json');
fs.writeFileSync(outPath, JSON.stringify(dormDetails, null, 2), 'utf8');
console.log(`Successfully generated ${dormDetails.length} dorm details into ${outPath}!`);
