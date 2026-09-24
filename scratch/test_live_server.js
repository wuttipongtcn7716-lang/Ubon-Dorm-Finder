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

async function runTests() {
  console.log('Testing live server http://localhost:3000/dorm/[1-60]...');
  let passed = 0;
  let failures = [];

  // Test sample and edge cases: dorm 1, dorm 2, dorm 41, dorm 59, dorm 60
  const sampleIds = [1, 2, 5, 10, 20, 30, 41, 50, 59, 60];

  for (const id of sampleIds) {
    try {
      const res = await fetchDorm(id);
      if (res.statusCode !== 200) {
        failures.push(`Dorm ${id} returned status ${res.statusCode}`);
        continue;
      }

      const body = res.body;

      // 1. Must NOT contain "Dorm last" or "xlsx" in visible content
      if (body.includes('Dorm last.xlsx') || body.includes('(อ้างอิงล่าสุดจาก Dorm last.xlsx)')) {
        failures.push(`Dorm ${id} contains forbidden "Dorm last.xlsx" string!`);
      }

      // 2. Must contain heading "ข้อมูลรายละเอียดหอพัก"
      if (!body.includes('ข้อมูลรายละเอียดหอพัก')) {
        failures.push(`Dorm ${id} missing heading "ข้อมูลรายละเอียดหอพัก"`);
      }

      // 3. Must contain "ค่าใช้จ่ายหอพัก"
      if (!body.includes('ค่าใช้จ่ายหอพัก')) {
        failures.push(`Dorm ${id} missing "ค่าใช้จ่ายหอพัก"`);
      }

      // 4. Must contain "บาท/เดือน"
      if (!body.includes('บาท/เดือน')) {
        failures.push(`Dorm ${id} missing "บาท/เดือน"`);
      }

      // 5. Must contain "บาท/หน่วย"
      if (!body.includes('บาท/หน่วย')) {
        failures.push(`Dorm ${id} missing "บาท/หน่วย"`);
      }

      // 6. Must contain the strict note
      if (!body.includes('หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง กรุณาติดต่อหอพักเพื่อยืนยันราคาและเงื่อนไขก่อนทำสัญญา')) {
        failures.push(`Dorm ${id} missing correct note`);
      }

      // 7. Must contain places
      if (!body.includes('7-Eleven') || !body.includes('Lotus&#x27;s go fresh') && !body.includes("Lotus's go fresh")) {
        failures.push(`Dorm ${id} missing nearby place names`);
      }

      passed++;
      console.log(`✓ Dorm ${id} OK`);
    } catch (err) {
      failures.push(`Dorm ${id} fetch error: ${err.message}`);
    }
  }

  console.log(`\nSummary: Passed ${passed}/${sampleIds.length}`);
  if (failures.length > 0) {
    console.error('Failures:', failures);
    process.exit(1);
  } else {
    console.log('ALL LIVE SERVER TESTS PASSED SUCCESSFULLY!');
  }
}

runTests();
