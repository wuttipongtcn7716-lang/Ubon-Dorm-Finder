import http from 'node:http';

const BASE_URL = 'http://localhost:3000';

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${BASE_URL}${path}`;
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOptions);
  let json: any = null;
  let text = '';
  try {
    text = await res.text();
    json = JSON.parse(text);
  } catch (e) {
    // text only
  }
  return {
    status: res.status,
    headers: res.headers,
    json,
    text,
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Running Comprehensive Analytics & Reset History Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // --- Test 1: Public Stats Removal ---
  console.log('--- Test Suite 1: User-Side Public Stats Removed ---');
  const homeRes = await request('/');
  assert(homeRes.status === 200, 'Home page returns 200');
  assert(!homeRes.text.includes('สถิติการใช้งานเว็บไซต์'), 'Home page does NOT contain "สถิติการใช้งานเว็บไซต์"');
  assert(!homeRes.text.includes('คำค้นหายอดนิยม (Top 5)'), 'Home page does NOT contain "คำค้นหายอดนิยม (Top 5)"');

  const statsRes = await request('/api/stats');
  assert(statsRes.status === 404, 'Legacy /api/stats returns 404 (removed)');

  const publicStatsRes = await request('/api/analytics/public');
  assert(publicStatsRes.status === 404, 'Public analytics /api/analytics/public returns 404 (removed)');

  // --- Test 2: Analytics Event Tracking Intact ---
  console.log('\n--- Test Suite 2: Event Tracking Active ---');
  const trackRes = await request('/api/analytics/track', {
    method: 'POST',
    body: {
      eventName: 'page_view',
      path: '/dorm/test-suite',
      visitorId: 'test_user_suite_1',
      sessionId: 'session_suite_1',
    },
  });
  assert(trackRes.status === 200 && trackRes.json?.ok === true, 'POST /api/analytics/track successfully records event');

  // --- Test 3: Security & Auth Guards ---
  console.log('\n--- Test Suite 3: Admin Endpoint Security & Auth Guards ---');
  const unauthHistoryRes = await request('/api/admin/analytics/history');
  assert(unauthHistoryRes.status === 401, 'Unauthenticated GET /api/admin/analytics/history returns 401');

  const unauthResetRes = await request('/api/admin/analytics/reset', { method: 'POST' });
  assert(unauthResetRes.status === 401, 'Unauthenticated POST /api/admin/analytics/reset returns 401');

  // Login as admin
  console.log('\n--- Test Suite 4: Admin Authentication & Live Dashboard ---');
  const loginRes = await request('/api/admin/login', {
    method: 'POST',
    body: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'dormie_admin_2026',
    },
  });
  assert(loginRes.status === 200 && loginRes.json?.success === true, 'Admin login succeeded');
  const setCookie = loginRes.headers.get('set-cookie');
  assert(!!setCookie, 'Admin session cookie returned');

  const authHeaders = {
    Cookie: setCookie ? setCookie.split(';')[0] : '',
  };

  // Live admin analytics
  const adminLiveRes = await request('/api/admin/analytics?period=7d', { headers: authHeaders });
  assert(adminLiveRes.status === 200 && adminLiveRes.json?.success === true, 'Admin GET /api/admin/analytics returns 200');

  // --- Test 5: Reset Display (Zero Data Loss) ---
  console.log('\n--- Test Suite 5: Reset Display & Data Integrity ---');
  // First do a reset
  const resetRes = await request('/api/admin/analytics/reset', {
    method: 'POST',
    headers: authHeaders,
  });
  assert(resetRes.status === 200 && resetRes.json?.success === true, 'Admin reset returns 200 success');
  assert(!!resetRes.json?.resetRecord?.id, 'Reset response returns resetRecord ID');

  // Dashboard immediately after reset
  const postResetLiveRes = await request('/api/admin/analytics?period=7d', { headers: authHeaders });
  assert(postResetLiveRes.status === 200, 'Post-reset admin analytics returns 200');
  const summaryAfterReset = postResetLiveRes.json?.data?.summary;
  const isAllZero = (
    summaryAfterReset?.uniqueVisitors?.value === 0 &&
    summaryAfterReset?.pageViews?.value === 0 &&
    summaryAfterReset?.dormitoryViews?.value === 0 &&
    summaryAfterReset?.searchEvents?.value === 0
  );
  assert(
    isAllZero,
    'Dashboard summary metrics immediately reset to 0',
    `Received: ${JSON.stringify(summaryAfterReset)}`
  );

  // Send new event AFTER reset
  const postResetTrackRes = await request('/api/analytics/track', {
    method: 'POST',
    body: {
      eventName: 'search',
      searchKeyword: 'หอพักหน้ามอ',
      visitorId: 'test_user_after_reset',
      sessionId: 'session_after_reset',
    },
  });
  assert(postResetTrackRes.status === 200 && postResetTrackRes.json?.ok === true, 'New event recorded after reset');

  // Check that current dashboard increments to 1
  const updatedLiveRes = await request('/api/admin/analytics?period=7d', { headers: authHeaders });
  const updatedSummary = updatedLiveRes.json?.data?.summary;
  assert(
    updatedSummary?.searchEvents?.value >= 1,
    `Current dashboard reflects new events after reset (searchEvents=${updatedSummary?.searchEvents?.value})`
  );

  // --- Test 6: Historical Periods & Real Past Data Retrieval ---
  console.log('\n--- Test Suite 6: Reset History & Past Period Data Retrieval ---');
  const historyListRes = await request('/api/admin/analytics/history', { headers: authHeaders });
  assert(historyListRes.status === 200 && historyListRes.json?.success === true, 'GET /api/admin/analytics/history returns 200');
  const periods = historyListRes.json?.periods;
  assert(Array.isArray(periods) && periods.length > 0, `History returned ${periods?.length} past period(s)`);

  if (periods && periods.length > 0) {
    const firstPeriod = periods[0];
    console.log(`Testing past period: ${firstPeriod.id} (${firstPeriod.label})`);
    const periodDetailRes = await request(`/api/admin/analytics/history?periodId=${firstPeriod.id}`, { headers: authHeaders });
    assert(periodDetailRes.status === 200 && periodDetailRes.json?.success === true, 'GET past period detail returns 200');
    assert(periodDetailRes.json?.data?.period === 'historical', 'Period type is "historical"');
    assert(Array.isArray(periodDetailRes.json?.data?.timeline), 'Past period has timeline data');
    assert(Array.isArray(periodDetailRes.json?.data?.topDormitories), 'Past period has topDormitories array');
    assert(Array.isArray(periodDetailRes.json?.data?.topSearches), 'Past period has topSearches array');
    console.log('Past Period Summary:', periodDetailRes.json?.data?.summary);
  }

  console.log('\n================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
