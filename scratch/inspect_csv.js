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
      if (cur.trim().length > 0) {
        lines.push(cur);
      }
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
    // check if it's one of the 60 dorm rows
    const id = parseInt(r[0]);
    if (id >= 1 && id <= 60) {
      rows.push(r);
    }
  }
  return { header, rows };
}

const content = fs.readFileSync('scratch/latest_dorms_from_user.csv', 'utf8');
const { header, rows } = parseCSV(content);

console.log('Total valid rows (1-60):', rows.length);

const waterIdx = header.findIndex(h => h.includes('ค่าน้ำ'));
const electricIdx = header.findIndex(h => h.includes('ค่าไฟ'));
const depositIdx = header.findIndex(h => h.includes('ค่ามัดจำ'));
const leaseIdx = header.findIndex(h => h.includes('สัญญาขั้นต่ำ'));
const priceIdx = header.findIndex(h => h.includes('ราคาหอพัก'));

const sevenIdx = header.findIndex(h => h.includes('7-Eleven'));
const lotusIdx = header.findIndex(h => h.includes('Lotus'));
const bigcIdx = header.findIndex(h => h.includes('Big c'));
const marketIdx = header.findIndex(h => h.includes('ตลาดบังเอิญ'));
const foodIdx = header.findIndex(h => h.includes('มีเจริญ'));

console.log('Indices:', { waterIdx, electricIdx, depositIdx, leaseIdx, priceIdx, sevenIdx, lotusIdx, bigcIdx, marketIdx, foodIdx });

const waterVals = new Set(rows.map(r => r[waterIdx]));
const electricVals = new Set(rows.map(r => r[electricIdx]));
const leaseVals = new Set(rows.map(r => r[leaseIdx]));
const depositVals = new Set(rows.map(r => r[depositIdx]));
const priceVals = new Set(rows.map(r => r[priceIdx]));

console.log('\n--- RAW WATER VALUES ---');
console.log([...waterVals]);

console.log('\n--- RAW ELECTRIC VALUES ---');
console.log([...electricVals]);

console.log('\n--- RAW LEASE VALUES ---');
console.log([...leaseVals]);

console.log('\n--- SAMPLE NEARBY DISTANCE VALUES ---');
const distVals = new Set();
rows.forEach(r => {
  distVals.add(r[sevenIdx]);
  distVals.add(r[lotusIdx]);
  distVals.add(r[bigcIdx]);
  distVals.add(r[marketIdx]);
  distVals.add(r[foodIdx]);
});
console.log([...distVals]);
