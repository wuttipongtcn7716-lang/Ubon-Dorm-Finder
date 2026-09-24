const http = require('http');

function fetchDorm(id) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000/dorm/${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', err => reject(err));
  });
}

async function verifyAll60Dorms() {
  console.log('Testing all 60 dorm pages for removed sections & preserved content...');
  let passed = 0;
  let failures = [];

  for (let id = 1; id <= 60; id++) {
    try {
      const res = await fetchDorm(id);
      if (res.statusCode !== 200) {
        failures.push(`Dorm ${id}: status ${res.statusCode}`);
        continue;
      }

      const body = res.body;

      // 1. MUST NOT CONTAIN Section 1: "จุดสังเกตและสถานที่ใกล้เคียง"
      if (body.includes('จุดสังเกตและสถานที่ใกล้เคียง')) {
        failures.push(`Dorm ${id}: Still contains "จุดสังเกตและสถานที่ใกล้เคียง"`);
      }
      if (body.includes('GOLDEN HOUR COFFEE') || body.includes('Blue Cabin Coffee') || body.includes('Lang Ban Camp')) {
        failures.push(`Dorm ${id}: Still contains landmark POI items`);
      }

      // 2. MUST NOT CONTAIN Section 2: "สิ่งอำนวยความสะดวกและกฎระเบียบ"
      if (body.includes('สิ่งอำนวยความสะดวกและกฎระเบียบ')) {
        failures.push(`Dorm ${id}: Still contains "สิ่งอำนวยความสะดวกและกฎระเบียบ"`);
      }

      // 3. MUST PRESERVE all detailed sections
      const requiredSections = [
        'ค่าใช้จ่ายหอพัก',
        'ประเภทห้องและผู้พัก',
        'สิ่งอำนวยความสะดวกภายในห้อง',
        'สิ่งอำนวยความสะดวกส่วนกลาง',
        'ความปลอดภัย',
        'กฎและเงื่อนไข',
        'ทำเลและสภาพแวดล้อม',
        'สถานที่ใกล้เคียง',
        'ช่องทางติดต่อเจ้าของหอพัก'
      ];

      for (const section of requiredSections) {
        if (!body.includes(section)) {
          failures.push(`Dorm ${id}: Missing required preserved section "${section}"`);
        }
      }

      passed++;
    } catch (err) {
      failures.push(`Dorm ${id}: Request error ${err.message}`);
    }
  }

  console.log(`\nResults: ${passed}/60 passed`);
  if (failures.length > 0) {
    console.error('FAILURES:', failures.slice(0, 10));
    process.exit(1);
  } else {
    console.log('🎉 100% OF ALL 60 DORMS VERIFIED: SECTIONS SUCCESSFULLY REMOVED & ALL REQUIRED CONTENT PRESERVED!');
  }
}

verifyAll60Dorms();
