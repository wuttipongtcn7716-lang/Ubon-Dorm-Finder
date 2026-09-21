const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  if (passed) {
    console.log(`✅ [PASS] ${name}${details ? ` (${details})` : ''}`);
  } else {
    console.error(`❌ [FAIL] ${name}${details ? ` (${details})` : ''}`);
  }
}

async function runLiveServerTests() {
  console.log('================================================================');
  console.log(`🌐 LIVE HTTP SERVER ENDPOINT TESTING [${BASE_URL}]`);
  console.log('================================================================\n');

  // Test 1: Frontend root page
  try {
    const res = await fetch(`${BASE_URL}/`);
    record('GET / (Home Page)', res.status === 200, `status: ${res.status}`);
  } catch (err: any) {
    record('GET / (Home Page)', false, err.message);
  }

  // Test 2: Admin Analytics page
  try {
    const res = await fetch(`${BASE_URL}/admin/analytics`);
    record('GET /admin/analytics (Admin Dashboard Page)', res.status === 200, `status: ${res.status}`);
  } catch (err: any) {
    record('GET /admin/analytics (Admin Dashboard Page)', false, err.message);
  }

  // Test 3: Unauthorized Admin Analytics API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?period=today`);
    const json = await res.json();
    record(
      'GET /api/admin/analytics without Auth Guard',
      res.status === 401 && json.authenticated === false,
      `status: ${res.status}, error: "${json.error}"`
    );
  } catch (err: any) {
    record('GET /api/admin/analytics without Auth Guard', false, err.message);
  }

  // Test 4: Admin Login API
  let cookieHeader = '';
  const adminVisitorId = `admin_live_vis_${Date.now()}`;
  const adminSessionId = `admin_live_ses_${Date.now()}`;

  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'dormie_admin_2026',
        visitorId: adminVisitorId,
        sessionId: adminSessionId,
      }),
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Extract cookies
      const parts = setCookie.split(',').map(c => c.split(';')[0].trim());
      cookieHeader = parts.join('; ');
    }

    const json = await res.json();
    record(
      'POST /api/admin/login (Valid Credentials)',
      res.status === 200 && json.success === true,
      `status: ${res.status}, success: ${json.success}`
    );
  } catch (err: any) {
    record('POST /api/admin/login (Valid Credentials)', false, err.message);
  }

  // Test 5: Verify Session API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/verify`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const json = await res.json();
    const cacheControl = res.headers.get('cache-control');
    record(
      'GET /api/admin/verify (Authenticated Session)',
      res.status === 200 && json.authenticated === true,
      `auth: ${json.authenticated}, Cache-Control: "${cacheControl}"`
    );
  } catch (err: any) {
    record('GET /api/admin/verify (Authenticated Session)', false, err.message);
  }

  // Test 6: Reset Analytics API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
      body: JSON.stringify({
        visitorId: adminVisitorId,
        sessionId: adminSessionId,
        note: 'Live Server Test Reset',
      }),
    });
    const json = await res.json();
    const cacheControl = res.headers.get('cache-control');
    record(
      'POST /api/admin/analytics/reset',
      res.status === 200 && json.success === true && Boolean(json.resetAt),
      `resetAt: ${json.resetAt}, Cache-Control: "${cacheControl}"`
    );
  } catch (err: any) {
    record('POST /api/admin/analytics/reset', false, err.message);
  }

  // Test 7: GET /api/admin/analytics?period=today immediately after reset
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?period=today&_t=${Date.now()}`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const json = await res.json();
    const cacheControl = res.headers.get('cache-control');
    const s = json.data?.summary;
    const isZero = s?.uniqueVisitors?.value === 0 &&
                   s?.pageViews?.value === 0 &&
                   s?.searchEvents?.value === 0 &&
                   s?.dormitoryViews?.value === 0;
    const isNullChange = s?.uniqueVisitors?.changePercent === null &&
                         s?.pageViews?.changePercent === null &&
                         s?.searchEvents?.changePercent === null &&
                         s?.dormitoryViews?.changePercent === null;
    const isListsEmpty = json.data?.topDormitories?.length === 0 &&
                         json.data?.topSearches?.length === 0;

    record(
      'GET /api/admin/analytics (today) Zero State Post-Reset',
      res.status === 200 && isZero && isNullChange && isListsEmpty,
      `visitors: ${s?.uniqueVisitors?.value}, views: ${s?.pageViews?.value}, changePercent: ${s?.uniqueVisitors?.changePercent}, Cache-Control: "${cacheControl}"`
    );
  } catch (err: any) {
    record('GET /api/admin/analytics (today) Zero State Post-Reset', false, err.message);
  }

  // Test 8: GET /api/admin/analytics?period=7d immediately after reset
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?period=7d&_t=${Date.now()}`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const json = await res.json();
    const s = json.data?.summary;
    const isZero = s?.uniqueVisitors?.value === 0 &&
                   s?.pageViews?.value === 0 &&
                   s?.searchEvents?.value === 0 &&
                   s?.dormitoryViews?.value === 0;
    const isNullChange = s?.uniqueVisitors?.changePercent === null &&
                         s?.pageViews?.changePercent === null;
    const isListsEmpty = json.data?.topDormitories?.length === 0 &&
                         json.data?.topSearches?.length === 0;

    record(
      'GET /api/admin/analytics (7d) Zero State Post-Reset',
      res.status === 200 && isZero && isNullChange && isListsEmpty,
      `visitors: ${s?.uniqueVisitors?.value}, views: ${s?.pageViews?.value}, topDorms: ${json.data?.topDormitories?.length}`
    );
  } catch (err: any) {
    record('GET /api/admin/analytics (7d) Zero State Post-Reset', false, err.message);
  }

  // Test 9: Admin activity tracking exclusion
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookieHeader,
      },
      body: JSON.stringify({
        eventName: 'page_view',
        sessionId: adminSessionId,
        visitorId: adminVisitorId,
        page: '/',
      }),
    });
    const json = await res.json();
    record(
      'POST /api/analytics/track (Admin Request Skipped)',
      res.status === 200 && json.skipped === 'admin',
      `skipped: ${json.skipped}`
    );
  } catch (err: any) {
    record('POST /api/analytics/track (Admin Request Skipped)', false, err.message);
  }

  // Test 10: Verify dashboard remains strictly 0 after Admin activity
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?period=7d&_t=${Date.now()}`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const json = await res.json();
    const s = json.data?.summary;
    const isZero = s?.uniqueVisitors?.value === 0 && s?.pageViews?.value === 0;
    record(
      'Dashboard Isolation (Remains 0 After Admin Activity)',
      res.status === 200 && isZero,
      `visitors: ${s?.uniqueVisitors?.value}, views: ${s?.pageViews?.value}`
    );
  } catch (err: any) {
    record('Dashboard Isolation (Remains 0 After Admin Activity)', false, err.message);
  }

  // Test 11: Real user traffic tracked accurately
  const realUserVis = `real_live_user_${Date.now()}`;
  const realUserSes = `real_live_sess_${Date.now()}`;

  try {
    // 1. Page view
    await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        sessionId: realUserSes,
        visitorId: realUserVis,
        page: '/',
      }),
    });

    // 2. Search
    await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'search',
        sessionId: realUserSes,
        visitorId: realUserVis,
        searchKeyword: 'หอพักหน้ามหาวิทยาลัย',
      }),
    });

    // 3. Dormitory view
    await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'dormitory_view',
        sessionId: realUserSes,
        visitorId: realUserVis,
        dormitoryId: 10,
        dormitoryName: 'หอพักร่มเย็น ม.อุบล',
      }),
    });

    // Verify on Dashboard
    const res = await fetch(`${BASE_URL}/api/admin/analytics?period=7d&_t=${Date.now()}`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const json = await res.json();
    const s = json.data?.summary;
    const matches = s?.uniqueVisitors?.value === 1 &&
                    s?.pageViews?.value === 1 &&
                    s?.searchEvents?.value === 1 &&
                    s?.dormitoryViews?.value === 1 &&
                    json.data?.topDormitories?.length === 1 &&
                    json.data?.topSearches?.length === 1;

    record(
      'Real User Traffic Tracking (1 User, 1 View, 1 Search, 1 Dorm)',
      res.status === 200 && matches,
      `visitors: ${s?.uniqueVisitors?.value}, views: ${s?.pageViews?.value}, search: ${s?.searchEvents?.value}, dorm: ${s?.dormitoryViews?.value}`
    );
  } catch (err: any) {
    record('Real User Traffic Tracking', false, err.message);
  }

  // Test 12: Historical Analytics API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics/history?_t=${Date.now()}`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const json = await res.json();
    const cacheControl = res.headers.get('cache-control');
    record(
      'GET /api/admin/analytics/history (Historical Periods Preserved)',
      res.status === 200 && json.success === true && Array.isArray(json.periods) && json.periods.length > 0,
      `totalPeriods: ${json.periods?.length}, Cache-Control: "${cacheControl}"`
    );
  } catch (err: any) {
    record('GET /api/admin/analytics/history', false, err.message);
  }

  // Test 13: Final Clean Reset
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
      body: JSON.stringify({
        visitorId: adminVisitorId,
        sessionId: adminSessionId,
        note: 'Final clean reset after server test',
      }),
    });
    const json = await res.json();
    
    // Verify 0 state immediately
    const checkRes = await fetch(`${BASE_URL}/api/admin/analytics?period=today&_t=${Date.now()}`, {
      headers: {
        'cookie': cookieHeader,
        'x-visitor-id': adminVisitorId,
        'x-session-id': adminSessionId,
      },
    });
    const checkJson = await checkRes.json();
    const s = checkJson.data?.summary;
    const isCleanZero = s?.uniqueVisitors?.value === 0 &&
                        s?.pageViews?.value === 0 &&
                        s?.searchEvents?.value === 0 &&
                        s?.dormitoryViews?.value === 0;

    record(
      'Final Clean Reset (System Ready with Clean 0 Baseline)',
      res.status === 200 && json.success === true && isCleanZero,
      `status: ${res.status}, cleanZero: ${isCleanZero}`
    );
  } catch (err: any) {
    record('Final Clean Reset', false, err.message);
  }

  console.log('\n================================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`📊 Result: ${passedCount}/${results.length} tests passed successfully!`);
  console.log('================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runLiveServerTests().catch((err) => {
  console.error('Fatal live server test error:', err);
  process.exit(1);
});
