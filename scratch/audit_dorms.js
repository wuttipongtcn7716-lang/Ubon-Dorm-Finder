const d = require('../src/data/dormDetailsLast.json');
console.log('Total dorms in JSON:', d.length);

let issues = [];

d.forEach(item => {
  const exp = item.expenses;
  const nb = item.nearbyPlaces;

  // Rent price
  if (!exp.rentPrice.endsWith('บาท/เดือน') && exp.rentPrice !== 'ไม่มีข้อมูล') {
    issues.push(`Dorm ${item.id} rentPrice invalid: ${exp.rentPrice}`);
  }

  // Water rate
  const validWater = exp.waterRate.includes('บาท/คน') || 
                     exp.waterRate.includes('บาท/หน่วย') || 
                     exp.waterRate.includes('บาท (ไม่ระบุหน่วย)') || 
                     exp.waterRate === 'ไม่มีข้อมูล';
  if (!validWater) {
    issues.push(`Dorm ${item.id} waterRate invalid: ${exp.waterRate}`);
  }

  // Electric rate
  if (!exp.electricRate.endsWith('บาท/หน่วย') && exp.electricRate !== 'ไม่มีข้อมูล') {
    issues.push(`Dorm ${item.id} electricRate invalid: ${exp.electricRate}`);
  }

  // Deposit
  if (!exp.deposit.endsWith('บาท') && exp.deposit !== 'ไม่มีข้อมูล') {
    issues.push(`Dorm ${item.id} deposit invalid: ${exp.deposit}`);
  }

  // Min lease
  const validLease = exp.minLease.endsWith('เดือน') || exp.minLease.endsWith('ปี') || exp.minLease === 'ไม่มีข้อมูล';
  if (!validLease) {
    issues.push(`Dorm ${item.id} minLease invalid: ${exp.minLease}`);
  }

  // Note
  if (exp.note !== 'หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง กรุณาติดต่อหอพักเพื่อยืนยันราคาและเงื่อนไขก่อนทำสัญญา') {
    issues.push(`Dorm ${item.id} note mismatch: ${exp.note}`);
  }

  // Nearby places
  for (const [k, v] of Object.entries(nb)) {
    if (!v.endsWith(' m') && !v.endsWith(' Km') && v !== 'ไม่มีข้อมูล') {
      issues.push(`Dorm ${item.id} ${k} invalid: ${v}`);
    }
  }

  // Check deposit range preservation
  const rawDeposit = item.rawExcel ? (item.rawExcel['ค่ามัดจำ'] || '') : '';
  if (rawDeposit.includes('-') && !exp.deposit.includes('-')) {
    issues.push(`Dorm ${item.id} deposit range lost: raw='${rawDeposit}' vs formatted='${exp.deposit}'`);
  }
});

if (issues.length === 0) {
  console.log('SUCCESS: ALL 60 DORMS PASSED STRICT DATA AUDIT!');
} else {
  console.log('Issues found:', issues.length);
  issues.forEach(i => console.log(' - ' + i));
}
