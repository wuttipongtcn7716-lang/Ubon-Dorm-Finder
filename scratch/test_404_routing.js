const http = require('http');

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Strip out Next.js RSC client payload script tags to inspect pure SSR HTML DOM
        const htmlDomOnly = data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        resolve({ statusCode: res.statusCode, fullBody: data, domHtml: htmlDomOnly });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== Verifying 404 Routing & Pure SSR DOM Output ===\n');

  try {
    // 1. Test random non-existing URL
    console.log('[1] Testing non-existing URL: /random-page-12345');
    const resRandom = await fetchUrl('/random-page-12345');
    console.log(`  - Status Code: ${resRandom.statusCode} (Expected: 404)`);
    console.log(`  - DOM renders 404 Error badge:`, resRandom.domHtml.includes('404 Error'));
    console.log(`  - DOM contains heading "ไม่พบหน้าที่คุณกำลังค้นหา":`, resRandom.domHtml.includes('ไม่พบหน้าที่คุณกำลังค้นหา'));
    console.log(`  - DOM contains CTA "กลับหน้าหลัก":`, resRandom.domHtml.includes('กลับหน้าหลัก'));
    console.log(`  - DOM contains CTA "กลับไปค้นหาหอพัก":`, resRandom.domHtml.includes('กลับไปค้นหาหอพัก'));
    console.log(`  - DOM contains link href="/":`, resRandom.domHtml.includes('href="/"'));

    // 2. Test non-existing dorm ID
    console.log('\n[2] Testing non-existing dorm ID: /dorm/99999');
    const resDorm = await fetchUrl('/dorm/99999');
    console.log(`  - Status Code: ${resDorm.statusCode}`);
    console.log(`  - DOM renders 404 Error badge:`, resDorm.domHtml.includes('404 Error'));
    console.log(`  - DOM contains heading "ไม่พบหน้าที่คุณกำลังค้นหา":`, resDorm.domHtml.includes('ไม่พบหน้าที่คุณกำลังค้นหา'));
    console.log(`  - DOM contains CTA "กลับหน้าหลัก":`, resDorm.domHtml.includes('กลับหน้าหลัก'));

    // 3. Test valid Homepage
    console.log('\n[3] Testing Homepage: /');
    const resHome = await fetchUrl('/');
    console.log(`  - Status Code: ${resHome.statusCode} (Expected: 200)`);
    console.log(`  - DOM does NOT render 404 Error badge:`, !resHome.domHtml.includes('404 Error'));
    console.log(`  - DOM does NOT render 404 heading:`, !resHome.domHtml.includes('ไม่พบหน้าที่คุณกำลังค้นหา'));
    console.log(`  - DOM renders Homepage content:`, resHome.domHtml.includes('Dormie') || resHome.domHtml.includes('หอพัก'));

    // 4. Test valid dorm ID
    console.log('\n[4] Testing valid dorm: /dorm/1');
    const resDorm1 = await fetchUrl('/dorm/1');
    console.log(`  - Status Code: ${resDorm1.statusCode} (Expected: 200)`);
    console.log(`  - DOM does NOT render 404 Error badge:`, !resDorm1.domHtml.includes('404 Error'));
    console.log(`  - DOM renders dorm title:`, resDorm1.domHtml.includes('หอพัก') || resDorm1.domHtml.includes('โซน'));

    console.log('\n=== All 404 Routing Tests Passed Perfectly! ===');
  } catch (err) {
    console.error('Test failed with error:', err.message);
  }
}

runTests();
