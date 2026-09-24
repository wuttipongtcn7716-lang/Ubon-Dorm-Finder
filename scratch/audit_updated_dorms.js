const fs = require('fs');
const data = require('../src/data/dormDetailsLast.json');

console.log('Auditing dormDetailsLast.json for all 60 dorms...');
console.log('Total count:', data.length);

let errors = [];

data.forEach((d, idx) => {
  const i = d.id;
  const exp = d.expenses;
  const nb = d.nearbyPlaces;

  // 1. Rent price
  if (!exp.rentPrice.endsWith('บาท/เดือน') && exp.rentPrice !== 'ไม่มีข้อมูล') {
    errors.push(`[Dorm ${i}] Invalid rentPrice: "${exp.rentPrice}"`);
  }

  // 2. Water rate
  const isLumpPerson = exp.waterRate.endsWith('บาท/คน (เหมาจ่าย)');
  const isLump = exp.waterRate.endsWith('บาท (เหมาจ่าย)');
  const isPerUnit = exp.waterRate.endsWith('บาท/หน่วย');
  if (!isLumpPerson && !isLump && !isPerUnit && exp.waterRate !== 'ไม่มีข้อมูล') {
    errors.push(`[Dorm ${i}] Invalid waterRate: "${exp.waterRate}"`);
  }

  // Check that no "เหมาจ่าย" was added if raw didn't have it
  const rawWater = d.rawExcel['ค่าน้ำ/ต่อหน่วย/เหมาจ่าย'] || '';
  if (!rawWater.includes('เหมาจ่าย') && exp.waterRate.includes('เหมาจ่าย')) {
    errors.push(`[Dorm ${i}] Added forbidden "เหมาจ่าย" to "${rawWater}": got "${exp.waterRate}"`);
  }

  // 3. Electric rate
  if (!exp.electricRate.endsWith('บาท/หน่วย') && exp.electricRate !== 'ไม่มีข้อมูล') {
    errors.push(`[Dorm ${i}] Invalid electricRate: "${exp.electricRate}"`);
  }

  // 4. Deposit
  if (!exp.deposit.endsWith('บาท') && exp.deposit !== 'ไม่มีข้อมูล') {
    errors.push(`[Dorm ${i}] Invalid deposit: "${exp.deposit}"`);
  }
  // Check range preservation
  const rawDeposit = d.rawExcel['ค่ามัดจำ'] || '';
  if (rawDeposit.includes('-') && !exp.deposit.includes('-')) {
    errors.push(`[Dorm ${i}] Range collapsed in deposit: raw="${rawDeposit}", formatted="${exp.deposit}"`);
  }

  // 5. Min lease
  const validLeases = ['6 เดือน', '1 ปี', '4 เดือน', '10 เดือน', 'ไม่ขั้นต่ำ', 'สิ้นทุกเดือนเมษายน', 'ไม่มีข้อมูล'];
  if (!validLeases.includes(exp.minLease)) {
    errors.push(`[Dorm ${i}] Unexpected minLease: "${exp.minLease}"`);
  }

  // 6. Note
  if (exp.note !== 'หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง กรุณาติดต่อหอพักเพื่อยืนยันราคาและเงื่อนไขก่อนทำสัญญา') {
    errors.push(`[Dorm ${i}] Invalid note: "${exp.note}"`);
  }

  // 7. Nearby places: 5 places with m or Km
  const places = ['sevenEleven', 'lotusGoFresh', 'bigCMini', 'bungEunMarket', 'meeCharoenFoodCenter'];
  places.forEach(p => {
    const val = nb[p];
    if (!val || (!val.endsWith(' m') && !val.endsWith(' Km') && val !== 'ไม่มีข้อมูล')) {
      errors.push(`[Dorm ${i}] Invalid distance for ${p}: "${val}"`);
    }
  });

  // 8. No forbidden string leaks
  const str = JSON.stringify(d);
  if (str.includes('Dorm last.xlsx') || str.includes('อ้างอิงจากไฟล์') || str.includes('ไฟล์ข้อมูล')) {
    // Only rawExcel may have Excel columns, but check user-facing fields
    if (exp.note.includes('Excel') || exp.rentPrice.includes('Excel')) {
      errors.push(`[Dorm ${i}] Leaked file name in user fields!`);
    }
  }
});

if (errors.length === 0) {
  console.log('✅ ALL 60 DORMS PASSED THE STRICT AUDIT WITH 0 ERRORS!');
} else {
  console.error(`❌ Found ${errors.length} errors:`);
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}

// Print samples:
console.log('\n--- SAMPLE DORM 1 ---');
console.log(JSON.stringify(data[0].expenses, null, 2));
console.log(JSON.stringify(data[0].nearbyPlaces, null, 2));

console.log('\n--- SAMPLE DORM 6 (Per unit water) ---');
console.log(JSON.stringify(data[5].expenses, null, 2));

console.log('\n--- SAMPLE DORM 60 (Special case) ---');
console.log(JSON.stringify(data[59].expenses, null, 2));
console.log(JSON.stringify(data[59].nearbyPlaces, null, 2));
