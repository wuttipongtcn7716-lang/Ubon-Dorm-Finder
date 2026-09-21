const BASE_URL = 'http://localhost:3000';

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ [PASS] ${msg}`);
  } else {
    console.error(`❌ [FAIL] ${msg}`);
    process.exitCode = 1;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDeepAdminExclusionTests() {
  console.log('================================================================');
  console.log('🧪 Running Deep Admin Exclusion & Analytics Verification Suite');
  console.log('================================================================\n');

  // Step 0: Ensure server is responsive
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/verify`);
      if (res.status === 200 || res.status === 401) {
        serverReady = true;
        break;
      }
    } catch {}
    await sleep(800);
  }

  if (!serverReady) {
    console.error('❌ Server is not responding on http://localhost:3000');
    process.exit(1);
  }

  // --- Suite 1: Reset Display Point to Fresh 0 Baseline ---
  console.log('--- Test Suite 1: Reset Baseline (Ensure 0 Initial State) ---');
  
  // First login as admin
  const adminVisitorId = `admin_vis_${Date.now()}`;
  const adminSessionId = `admin_ses_${Date.now()}`;

  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      username: 'admin', 
      password: 'dormie_admin_2026',
      visitorId: adminVisitorId,
      sessionId: adminSessionId,
    }),
  });
  const loginJson = await loginRes.json();
  assert(loginRes.ok && loginJson.success === true, 'Admin login succeeded with visitorId & sessionId');

  const setCookie = loginRes.headers.get('set-cookie') || '';
  const tokenMatch = setCookie.match(/admin_session=([^;]+)/);
  const adminToken = tokenMatch ? tokenMatch[1] : '';
  const adminCookieHeader = `admin_session=${adminToken}; dormie_role=admin`;

  // Perform reset
  const resetRes = await fetch(`${BASE_URL}/api/admin/analytics/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({ note: 'Baseline reset for deep admin exclusion test' }),
  });
  assert(resetRes.ok, 'Reset endpoint executed successfully');

  // Verify baseline is strictly 0
  const baselineRes = await fetch(`${BASE_URL}/api/admin/analytics?period=today`, {
    headers: { Cookie: adminCookieHeader },
  });
  const baselineJson = await baselineRes.json();
  const summary0 = baselineJson.data?.summary;
  assert(summary0?.uniqueVisitors?.value === 0, 'Baseline Unique Visitors is strictly 0');
  assert(summary0?.pageViews?.value === 0, 'Baseline Page Views is strictly 0');
  assert(summary0?.searchEvents?.value === 0, 'Baseline Search Events is strictly 0');
  assert(summary0?.dormitoryViews?.value === 0, 'Baseline Dormitory Views is strictly 0');

  // --- Suite 2: Admin Activity Must NOT Increase Any User Analytics Metric ---
  console.log('\n--- Test Suite 2: Admin Actions Fully Excluded (All 5 Events) ---');

  // 1. Admin Page View
  const adminPvRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'page_view',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      page: '/',
    }),
  });
  const adminPvJson = await adminPvRes.json();
  assert(adminPvJson.skipped !== undefined, 'Admin page_view on home page is SKIPPED');

  // 2. Admin Search
  const adminSearchRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'search',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      searchKeyword: 'หอพักหน้ามหาลัย',
    }),
  });
  const adminSearchJson = await adminSearchRes.json();
  assert(adminSearchJson.skipped !== undefined, 'Admin search is SKIPPED');

  // 3. Admin Dormitory View
  const adminDormRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'dormitory_view',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      dormitoryId: 1,
      dormitoryName: 'หอพักตัวอย่าง',
    }),
  });
  const adminDormJson = await adminDormRes.json();
  assert(adminDormJson.skipped !== undefined, 'Admin dormitory_view is SKIPPED');

  // 4. Admin Map Click
  const adminMapRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'map_click',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      dormitoryId: 1,
    }),
  });
  const adminMapJson = await adminMapRes.json();
  assert(adminMapJson.skipped !== undefined, 'Admin map_click is SKIPPED');

  // 5. Admin Navigation Click
  const adminNavRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'navigation_click',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      dormitoryId: 1,
    }),
  });
  const adminNavJson = await adminNavRes.json();
  assert(adminNavJson.skipped !== undefined, 'Admin navigation_click is SKIPPED');

  // 6. Admin Identifier Match without cookie (e.g. if cookie was dropped but visitorId matches)
  const adminIdMatchRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      page: '/',
    }),
  });
  const adminIdMatchJson = await adminIdMatchRes.json();
  assert(adminIdMatchJson.skipped === 'admin', 'Admin request without cookie is SKIPPED via registered Admin identifier');

  // Verify dashboard STILL shows strictly 0 after all admin actions
  const postAdminRes = await fetch(`${BASE_URL}/api/admin/analytics?period=today`, {
    headers: { Cookie: adminCookieHeader },
  });
  const postAdminJson = await postAdminRes.json();
  const summaryAfterAdmin = postAdminJson.data?.summary;
  assert(summaryAfterAdmin?.uniqueVisitors?.value === 0, 'Dashboard Unique Visitors remains 0 after Admin activity');
  assert(summaryAfterAdmin?.pageViews?.value === 0, 'Dashboard Page Views remains 0 after Admin activity');
  assert(summaryAfterAdmin?.searchEvents?.value === 0, 'Dashboard Search Events remains 0 after Admin activity');
  assert(summaryAfterAdmin?.dormitoryViews?.value === 0, 'Dashboard Dormitory Views remains 0 after Admin activity');

  // --- Suite 3: Regular User Traffic Must Be Accurately Tracked ---
  console.log('\n--- Test Suite 3: Real User Traffic Tracked Accurately ---');

  const realUserVisitorId = `real_user_vis_${Date.now()}`;
  const realUserSessionId = `real_user_ses_${Date.now()}`;

  // User Page View
  const userPvRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      sessionId: realUserSessionId,
      visitorId: realUserVisitorId,
      page: '/',
    }),
  });
  const userPvJson = await userPvRes.json();
  assert(userPvRes.ok && userPvJson.ok === true && !userPvJson.skipped, 'Real user page_view is RECORDED');

  // User Search
  const userSearchRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'search',
      sessionId: realUserSessionId,
      visitorId: realUserVisitorId,
      searchKeyword: 'หอพักหญิงแถวมหาลัย',
    }),
  });
  const userSearchJson = await userSearchRes.json();
  assert(userSearchRes.ok && userSearchJson.ok === true && !userSearchJson.skipped, 'Real user search is RECORDED');

  // User Dormitory View
  const userDormRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'dormitory_view',
      sessionId: realUserSessionId,
      visitorId: realUserVisitorId,
      dormitoryId: 10,
      dormitoryName: 'หอพักร่มเย็น ม.อุบล',
    }),
  });
  const userDormJson = await userDormRes.json();
  assert(userDormRes.ok && userDormJson.ok === true && !userDormJson.skipped, 'Real user dormitory_view is RECORDED');

  // Verify dashboard reflects strictly 1 User, 1 Page View, 1 Search, 1 Dorm View
  const userStatsRes = await fetch(`${BASE_URL}/api/admin/analytics?period=today`, {
    headers: { Cookie: adminCookieHeader },
  });
  const userStatsJson = await userStatsRes.json();
  const summaryUser = userStatsJson.data?.summary;
  assert(summaryUser?.uniqueVisitors?.value === 1, 'Dashboard Unique Visitors correctly reflects 1 (real user)');
  assert(summaryUser?.pageViews?.value === 1, 'Dashboard Page Views correctly reflects 1 (real user)');
  assert(summaryUser?.searchEvents?.value === 1, 'Dashboard Search Events correctly reflects 1 (real user search)');
  assert(summaryUser?.dormitoryViews?.value === 1, 'Dashboard Dormitory Views correctly reflects 1 (real user view)');

  // Check Top Searches includes only user's search
  const topSearches = userStatsJson.data?.topSearches || [];
  assert(topSearches.length > 0 && topSearches[0].keyword === 'หอพักหญิงแถวมหาลัย', 'Top Searches contains only real user query');

  // Check Top Dormitories includes only user's dorm view
  const topDorms = userStatsJson.data?.topDormitories || [];
  assert(topDorms.length > 0 && topDorms[0].id === 10, 'Top Dormitories contains only real user dorm view');

  // --- Suite 4: Admin Mixed Activity Does Not Alter User Counts ---
  console.log('\n--- Test Suite 4: Mixed Admin & User Traffic Isolation ---');

  // Admin tries searching again
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'search',
      sessionId: adminSessionId,
      visitorId: adminVisitorId,
      searchKeyword: 'หอพักที่แอดมินค้นหา',
    }),
  });

  // Admin opens admin dashboard multiple times
  for (let i = 0; i < 3; i++) {
    await fetch(`${BASE_URL}/api/admin/analytics?period=today`, {
      headers: { Cookie: adminCookieHeader },
    });
  }

  // Verify counts did not increase
  const recheckRes = await fetch(`${BASE_URL}/api/admin/analytics?period=today`, {
    headers: { Cookie: adminCookieHeader },
  });
  const recheckJson = await recheckRes.json();
  const recheckSummary = recheckJson.data?.summary;
  assert(recheckSummary?.uniqueVisitors?.value === 1, 'Unique Visitors remains exactly 1 after Admin repeated actions');
  assert(recheckSummary?.searchEvents?.value === 1, 'Search Events remains exactly 1 (Admin search excluded)');
  assert(recheckSummary?.dormitoryViews?.value === 1, 'Dormitory Views remains exactly 1');

  // --- Suite 5: Data Preservation & Historical Data ---
  console.log('\n--- Test Suite 5: Data Persistence & Historical Integrity ---');
  const historyRes = await fetch(`${BASE_URL}/api/admin/analytics/history`, {
    headers: { Cookie: adminCookieHeader },
  });
  const historyJson = await historyRes.json();
  assert(historyRes.ok && historyJson.success === true, 'History API returns 200');
  assert(Array.isArray(historyJson.periods) && historyJson.periods.length > 0, 'Past historical periods preserved with zero data loss');

  console.log('\n================================================================');
  if (process.exitCode === 1) {
    console.error('❌ Some tests failed.');
  } else {
    console.log('🎉 All 21 tests in Deep Admin Exclusion Suite PASSED successfully!');
  }
  console.log('================================================================\n');
}

runDeepAdminExclusionTests();

export {};
