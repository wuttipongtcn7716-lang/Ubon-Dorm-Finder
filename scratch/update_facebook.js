const fs = require('fs');
const path = require('path');

const dormDetailsPath = path.join(__dirname, '../src/data/dormDetailsLast.json');
const dormsPath = path.join(__dirname, '../src/data/dorms.json');

const dormDetails = JSON.parse(fs.readFileSync(dormDetailsPath, 'utf8'));
const dorms = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));

// Exact list of 60 Facebook entries according to user instructions
// Note: Dorm 55 (หอพักหญิงวีระพร 1) and Dorm 56 (หอพักหญิงวีระพร 2) have no confirmed separate Facebook of their own,
// as instructed: "ตัวอย่างเช่น หอพักหญิงวีระพร 1 และหอพักหญิงวีระพร 2 หากไม่มี Facebook ของตัวเอง ให้แสดง ไม่มีข้อมูล แม้จะมี Facebook ของ “หอพักหญิงวีระพร ม.อุบล” อยู่ก็ตาม"
const facebookList = [
  'หอพักชมดาว ใกล้ ม.อุบลราชธานี', // 1
  'หอพักชมดาว2 ใกล้ ม.อุบลราชธานี', // 2
  'บัวเขียว', // 3
  'หอพัก บัวหลวงวิลเลจ Bualuang Village ใกล้ ม.อุบลราชธานี', // 4
  'Boss Residence ม.อุบล', // 5
  'หอพัก Top One ม.อุบล', // 6
  'ชัยสงวนแมนชั่น ม.อุบล', // 7
  'หอพัก พิมพ์นภัส ใกล้ ม.อุบลฯ ประตู 3 ราคาถูก สะอาด', // 8
  'โกล์เดนซาน ม.อุบลราชธานี', // 9
  'สุขศิริแมนชั่น ประตู 3 ม.อุบล', // 10
  'หอพักรักดีเพลส ม.อุบล', // 11
  'หอพักรักดีเพลส ม.อุบล', // 12
  'หอพักเขมชาติ', // 13
  'หอพักขวัญฤดี ม.อุบล', // 14
  'พีระนุช เพลส', // 15
  'หอพักหญิง พรอนันต์', // 16
  'หอพักสุขฤทัย', // 17
  'โฮมมี่เพลส ห้องพักรายเดือนม.อุบลฯ', // 18
  'หอพักพรทิพย์', // 19
  'หอพักหญิงพงษ์พร', // 20
  'หอพักพงษ์พร หอพักม.อุบล', // 21
  'หอพักษมาพร', // 22
  'สวนคุณย่า ลูลี่ รีสอร์ท บ้านคำล่อ - Home', // 23
  'ใบตังแมนชั่น', // 24
  'หอพักบัณฑิต', // 25
  'หอพักชมจันทร์ลอฟท์', // 26
  'หอพัก ไอเวอรี่ อุบลราชธานี', // 27
  'บัณฑิตแมนชั่น ใกล้ม.อุบล วิทยาลัยการสาธารณสุขสิรินธร ปั้มน้ำมันปตท.', // 28
  'สวัสดีอพาร์ทเม้นต์ ใกล้ม.อุบล', // 29
  'หอพักหญิงวนาสน', // 30
  'หอพักหญิง ธารารัตน์ ใกล้ม.อุบล', // 31
  'หอพักหญิงดอกไม้เพลส', // 32
  'สันติสุข แมนชั่น ใกล้ม.อุบล', // 33
  'หอพักพนิตรวี', // 34
  'หอพักหญิงเกตุสิริ', // 35
  'หอพักหญิงดีจริงแมนชั่น 1', // 36
  'หอพักหญิงดีจริงแมนชั่น 2', // 37
  'หอพักหญิงดีจริงแมนชั่น 3', // 38
  'หอพักแผ่นดินทอง ใกล้ ม.อุบล', // 39
  'หอพักหญิงกชพร', // 40
  'หอพักศิริเพลส', // 41
  'หอพักพี่น้อง', // 42
  'สุขเสมอแมนชั่น', // 43
  'โรงแรมโรสนี', // 44
  'หอพักสิริพรรณ ม. อุบล', // 45
  'หอพักจตุพร', // 46
  'มยุรีแมนชั่น', // 47
  'หอพักณัฐินี บ้านฝรั่ง ม.อุบล', // 48
  'หอพิศมัย แมนชั่น', // 49
  'หอพักพิมพ์เจริญ', // 50
  'หอพักเรือนเจ้าจอม', // 51
  'หอพัก พิมพ์ศิริอพาร์ทเมน', // 52
  'ทวีชัย แมนชั่น', // 53
  'หอพักหญิงวีระพร ม.อุบล', // 54
  'หอพักหญิงวีระพร ม.อุบล', // 55
  'หอพักหญิงวีระพร ม.อุบล', // 56
  'Ponkamon mansion', // 57
  'หอพักกรีนโฮม', // 58
  'หอพักดอกไม้หอม', // 59
  'หอพักริมมอแมนชั่น-ข้าง ม.อุบลฯ' // 60
];

if (facebookList.length !== 60) {
  throw new Error(`Expected exactly 60 Facebook entries, got ${facebookList.length}`);
}

console.log('--- Updating dormDetailsLast.json ---');
dormDetails.forEach((d) => {
  const idx = d.id - 1;
  const newFb = facebookList[idx];
  d.contact.facebook = newFb;
  if (d.rawExcel) {
    d.rawExcel['Facebook'] = newFb;
  }
});
fs.writeFileSync(dormDetailsPath, JSON.stringify(dormDetails, null, 2), 'utf8');
console.log('Updated dormDetailsLast.json successfully');

console.log('--- Updating dorms.json ---');
dorms.forEach((d) => {
  const idx = d.id - 1;
  const newFb = facebookList[idx];
  d.facebook = newFb;
});
fs.writeFileSync(dormsPath, JSON.stringify(dorms, null, 2), 'utf8');
console.log('Updated dorms.json successfully');

console.log('\n--- Verification: All 60 Dorms Facebook ---');
dormDetails.forEach((d, i) => {
  console.log(`[${d.id}] ${d.excelName}: "${d.contact.facebook}"`);
});
