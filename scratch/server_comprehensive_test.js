const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', err => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runServerTest() {
  console.log('=============================================');
  console.log('🚀 RUNNING COMPREHENSIVE SERVER TEST (PORT 3000)');
  console.log('=============================================\n');

  let results = [];

  // Test 1: Homepage
  try {
    const t0 = Date.now();
    const res = await request({ host: 'localhost', port: 3000, path: '/', method: 'GET' });
    const dur = Date.now() - t0;
    const ok = res.statusCode === 200 && res.body.includes('Dormie UBU');
    results.push({ name: 'GET / (Homepage)', status: res.statusCode, duration: `${dur}ms`, ok });
  } catch (err) {
    results.push({ name: 'GET / (Homepage)', error: err.message, ok: false });
  }

  // Test 2: API Dorms
  try {
    const t0 = Date.now();
    const res = await request({ host: 'localhost', port: 3000, path: '/api/dorms', method: 'GET' });
    const dur = Date.now() - t0;
    let count = 0;
    try { 
      const parsed = JSON.parse(res.body);
      count = parsed.total || (parsed.data && parsed.data.length);
    } catch(e){}
    const ok = res.statusCode === 200 && count === 60;
    results.push({ name: `GET /api/dorms (60 dorms returned, count: ${count})`, status: res.statusCode, duration: `${dur}ms`, ok });
  } catch (err) {
    results.push({ name: 'GET /api/dorms', error: err.message, ok: false });
  }

  // Test 3: Analytics Track API
  try {
    const t0 = Date.now();
    const payload = JSON.stringify({
      eventName: 'page_view',
      sessionId: 'test-session-' + Date.now(),
      visitorId: 'test-visitor-' + Date.now(),
      page: '/dorm/1',
      metadata: { referrer: 'test' }
    });
    const res = await request({
      host: 'localhost',
      port: 3000,
      path: '/api/analytics/track',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);
    const dur = Date.now() - t0;
    const ok = res.statusCode === 200 || res.statusCode === 201;
    results.push({ name: 'POST /api/analytics/track', status: res.statusCode, duration: `${dur}ms`, ok });
  } catch (err) {
    results.push({ name: 'POST /api/analytics/track', error: err.message, ok: false });
  }

  // Test 4: Detail pages test (sample + edge cases)
  const dormTestIds = [1, 2, 41, 59, 60];
  for (const id of dormTestIds) {
    try {
      const t0 = Date.now();
      const res = await request({ host: 'localhost', port: 3000, path: `/dorm/${id}`, method: 'GET' });
      const dur = Date.now() - t0;
      const b = res.body;

      const hasHeading = b.includes('ข้อมูลรายละเอียดหอพัก');
      const noLeak = !b.includes('Dorm last.xlsx');
      const hasExpenses = b.includes('ค่าใช้จ่ายหอพัก') && b.includes('บาท/เดือน') && b.includes('บาท/หน่วย');
      const hasNote = b.includes('หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง กรุณาติดต่อหอพักเพื่อยืนยันราคาและเงื่อนไขก่อนทำสัญญา');
      const hasPlaces = b.includes('7-Eleven') && b.includes('ตลาดบังเอิญ');

      const ok = res.statusCode === 200 && hasHeading && noLeak && hasExpenses && hasNote && hasPlaces;
      results.push({
        name: `GET /dorm/${id} (Detail + Units + No Leak)`,
        status: res.statusCode,
        duration: `${dur}ms`,
        ok
      });
    } catch (err) {
      results.push({ name: `GET /dorm/${id}`, error: err.message, ok: false });
    }
  }

  // Test 5: Admin Login
  try {
    const t0 = Date.now();
    const res = await request({ host: 'localhost', port: 3000, path: '/admin/login', method: 'GET' });
    const dur = Date.now() - t0;
    const ok = res.statusCode === 200;
    results.push({ name: 'GET /admin/login', status: res.statusCode, duration: `${dur}ms`, ok });
  } catch (err) {
    results.push({ name: 'GET /admin/login', error: err.message, ok: false });
  }

  // Print Summary
  console.log('RESULTS:');
  let allOk = true;
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} [${r.status || 'ERR'}] ${r.name} - ${r.duration || r.error}`);
    if (!r.ok) allOk = false;
  });

  console.log('\n=============================================');
  if (allOk) {
    console.log('🎉 ALL SERVER TESTS PASSED PERFECTLY!');
  } else {
    console.log('⚠️ SOME SERVER TESTS FAILED');
  }
  console.log('=============================================\n');
}

runServerTest();
