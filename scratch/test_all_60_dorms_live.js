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
  console.log('======================================================');
  console.log('🚀 LIVE VERIFICATION TEST FOR ALL 60 DORMS');
  console.log('======================================================\n');

  let passed = 0;
  let failures = [];

  for (let id = 1; id <= 60; id++) {
    try {
      const res = await fetchDorm(id);
      if (res.statusCode !== 200) {
        failures.push(`Dorm ${id}: status code ${res.statusCode}`);
        continue;
      }

      const body = res.body;

      // Check required headings & labels
      if (!body.includes('ข้อมูลรายละเอียดหอพัก')) {
        failures.push(`Dorm ${id}: Missing heading "ข้อมูลรายละเอียดหอพัก"`);
      }
      if (!body.includes('ค่าใช้จ่ายหอพัก')) {
        failures.push(`Dorm ${id}: Missing "ค่าใช้จ่ายหอพัก"`);
      }
      if (!body.includes('สถานที่ใกล้เคียง')) {
        failures.push(`Dorm ${id}: Missing "สถานที่ใกล้เคียง"`);
      }

      // Check table column headers
      if (!body.includes('รายการ') || !body.includes('ข้อมูล')) {
        failures.push(`Dorm ${id}: Missing table thead "รายการ" / "ข้อมูล"`);
      }
      if (!body.includes('สถานที่') || !body.includes('ระยะทาง')) {
        failures.push(`Dorm ${id}: Missing table thead "สถานที่" / "ระยะทาง"`);
      }

      // Check units
      if (!body.includes('บาท/เดือน')) {
        failures.push(`Dorm ${id}: Missing "บาท/เดือน"`);
      }
      if (!body.includes('บาท/หน่วย')) {
        failures.push(`Dorm ${id}: Missing "บาท/หน่วย"`);
      }

      // Water unit check (eitherเหมาจ่าย or ต่อหน่วย)
      const hasWaterFormat = body.includes('บาท (เหมาจ่าย)') || body.includes('บาท/คน (เหมาจ่าย)') || body.includes('บาท/หน่วย');
      if (!hasWaterFormat) {
        failures.push(`Dorm ${id}: Missing valid water rate format`);
      }

      // Nearby places names
      const places = ['7-Eleven', 'Big C mini', 'ตลาดบังเอิญ', 'ร้านอาหารศูนย์อาหารมีเจริญ'];
      for (const p of places) {
        if (!body.includes(p)) {
          failures.push(`Dorm ${id}: Missing nearby place "${p}"`);
        }
      }

      // Note text
      const note = 'หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง กรุณาติดต่อหอพักเพื่อยืนยันราคาและเงื่อนไขก่อนทำสัญญา';
      if (!body.includes(note)) {
        failures.push(`Dorm ${id}: Missing strict note text`);
      }

      // Forbidden strings check
      if (body.includes('Dorm last.xlsx') || body.includes('(อ้างอิงล่าสุดจาก Dorm last.xlsx)')) {
        failures.push(`Dorm ${id}: Leaked "Dorm last.xlsx" string`);
      }

      // Removed sections check
      if (body.includes('จุดสังเกตและสถานที่ใกล้เคียง')) {
        failures.push(`Dorm ${id}: Contains removed section "จุดสังเกตและสถานที่ใกล้เคียง"`);
      }
      if (body.includes('สิ่งอำนวยความสะดวกและกฎระเบียบ')) {
        failures.push(`Dorm ${id}: Contains removed section "สิ่งอำนวยความสะดวกและกฎระเบียบ"`);
      }

      passed++;
    } catch (err) {
      failures.push(`Dorm ${id}: Fetch error ${err.message}`);
    }
  }

  console.log(`Summary: ${passed}/60 passed`);
  if (failures.length > 0) {
    console.error('❌ Failures:', failures.slice(0, 10));
    process.exit(1);
  } else {
    console.log('🎉 100% OF ALL 60 DORMS FULLY VERIFIED ON LIVE SERVER!');
  }
}

verifyAll60Dorms();
