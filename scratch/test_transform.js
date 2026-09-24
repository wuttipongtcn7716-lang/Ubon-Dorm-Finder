const fs = require('fs');

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
  // Remove existing "บาท/เดือน" or "บาท"
  s = s.replace(/บาท\/เดือน/g, '').replace(/บาท/g, '').trim();
  // Handle ranges like "3000-3500" or "2,500 – 3,200"
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
  // Case 1: "เหมาจ่าย 100/คน"
  if (s.includes('เหมาจ่าย') && s.includes('/คน')) {
    const num = s.replace(/[^\d.]/g, '');
    return `${num} บาท/คน (เหมาจ่าย)`;
  }
  // Case 2: "150 เหมาจ่าย"
  if (s.includes('เหมาจ่าย')) {
    const num = s.replace(/[^\d.]/g, '');
    return `${num} บาท (เหมาจ่าย)`;
  }
  // Case 3: Per unit - "20", "25", "100", "19", "150", "18", "45"
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
  if (s.includes('เมตร')) {
    const num = s.replace('เมตร', '').trim();
    return `${num} m`;
  }
  if (s.includes('กิโลเมตร')) {
    const num = s.replace('กิโลเมตร', '').trim();
    return `${num} Km`;
  }
  // fallback if already has m or Km
  if (s.endsWith('m') || s.endsWith('Km')) return s;
  return s;
}

const content = fs.readFileSync('scratch/latest_dorms_from_user.csv', 'utf8');
const { header, rows } = parseCSV(content);

console.log('Testing transformation on all 60 rows:');
for (let i = 0; i < 60; i++) {
  const r = rows[i];
  const id = parseInt(r[0]);
  const name = r[2];
  const rent = formatPrice(r[10]);
  const water = formatWater(r[11]);
  const electric = formatElectric(r[12]);
  const deposit = formatDeposit(r[13]);
  const lease = formatLease(r[14]);
  const p7 = formatDistance(r[39]);
  const plotus = formatDistance(r[40]);
  const pbigc = formatDistance(r[41]);
  const pmarket = formatDistance(r[42]);
  const pfood = formatDistance(r[43]);

  if (i < 5 || i >= 55) {
    console.log(`[#${id}] ${name}`);
    console.log(`  Rent: ${rent} | Water: ${water} | Elec: ${electric} | Dep: ${deposit} | Lease: ${lease}`);
    console.log(`  Places: 7-11: ${p7}, Lotus: ${plotus}, BigC: ${pbigc}, Market: ${pmarket}, Food: ${pfood}`);
  }
}
