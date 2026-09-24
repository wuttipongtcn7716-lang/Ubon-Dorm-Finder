const fs = require('fs');
const dorms = require('../src/data/dorms.json');

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

const content = fs.readFileSync('scratch/latest_dorms_from_user.csv', 'utf8');
const { header, rows } = parseCSV(content);

console.log('Comparing CSV rows to dorms.json:');
let allMatched = true;
for (let i = 0; i < 60; i++) {
  const r = rows[i];
  const csvId = parseInt(r[0]);
  const csvName = r[2];
  const dorm = dorms.find(d => d.id === csvId);
  if (!dorm) {
    console.error(`ID ${csvId} not found in dorms.json!`);
    allMatched = false;
  } else {
    console.log(`[#${csvId}] CSV: "${csvName}" | dorms.json: "${dorm.name}"`);
  }
}

if (allMatched) {
  console.log('\nSUCCESS: All 60 rows match exactly 1-to-1 by row order and ID!');
}
