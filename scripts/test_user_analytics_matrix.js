const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING DORMIE UBU ANALYTICS VERIFICATION TEST MATRIX ===\n');

  // Helper to log in as admin
  async function adminLogin(customSessionId) {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'dormie_admin_2026',
        visitorId: 'vis_tester_admin',
        sessionId: customSessionId || 'ses_admin_auth_' + Date.now(),
      }),
    });
    const json = await res.json();
    assert.strictEqual(res.status, 200, 'Admin login failed: ' + JSON.stringify(json));
    const setCookie = res.headers.get('set-cookie') || '';
    // Extract cookies
    const cookie = setCookie
      .split(',')
      .map(c => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
    return cookie;
  }

  // Helper to fetch admin analytics
  async function getAdminAnalytics(cookie) {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?period=today&_t=${Date.now()}`, {
      headers: {
        'Cookie': cookie,
        'x-session-id': 'ses_admin_viewer_' + Date.now(),
      },
    });
    const json = await res.json();
    assert.strictEqual(res.status, 200, 'Failed to fetch analytics: ' + JSON.stringify(json));
    return json.data;
  }

  // Step 0: Admin Login and Reset Dashboard to clean baseline
  console.log('Step 0: Admin login and reset display to obtain clean baseline at T0...');
  let adminCookie = await adminLogin('ses_admin_setup_' + Date.now());
  const resetRes = await fetch(`${BASE_URL}/api/admin/analytics/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie,
      'x-session-id': 'ses_admin_reset_' + Date.now(),
    },
    body: JSON.stringify({ note: 'Verification Test Matrix Baseline' }),
  });
  const resetJson = await resetRes.json();
  assert.strictEqual(resetJson.success, true, 'Reset failed');
  console.log('Reset point recorded at:', resetJson.resetRecord.resetAt);

  // Check baseline metrics immediately after reset
  let data = await getAdminAnalytics(adminCookie);
  console.log('Baseline metrics immediately after reset:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
    searchEvents: data.summary.searchEvents.value,
    dormitoryViews: data.summary.dormitoryViews.value,
  });
  assert.strictEqual(data.summary.uniqueVisitors.value, 0, 'Unique visitors should be 0 immediately after reset');
  assert.strictEqual(data.summary.pageViews.value, 0, 'Page views should be 0 immediately after reset');
  assert.strictEqual(data.summary.searchEvents.value, 0, 'Search events should be 0 immediately after reset');
  assert.strictEqual(data.summary.dormitoryViews.value, 0, 'Dorm views should be 0 immediately after reset');
  console.log('✓ Baseline: 0 across all metrics\n');

  // -------------------------------------------------------------
  // Test 1: Anonymous User (No login) -> MUST BE INCLUDED
  // -------------------------------------------------------------
  console.log('Test 1: Anonymous User (No login, actor_type=anonymous)...');
  const anonVis1 = 'anon_vis_' + Date.now() + '_1';
  const anonSes1 = 'anon_ses_' + Date.now() + '_1';

  // 1.1 Page view
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: anonVis1,
      sessionId: anonSes1,
      actorType: 'anonymous',
      page: '/dorms',
    }),
  });

  // 1.2 Search
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'search',
      visitorId: anonVis1,
      sessionId: anonSes1,
      actorType: 'anonymous',
      searchKeyword: 'หอพักใกล้ ม.อุบล',
      page: '/dorms',
    }),
  });

  // 1.3 Dormitory view
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'dormitory_view',
      visitorId: anonVis1,
      sessionId: anonSes1,
      actorType: 'anonymous',
      dormitoryId: 1,
      dormitoryName: 'หอพักบ้านสุขใจ',
      page: '/dorm/1',
    }),
  });

  data = await getAdminAnalytics(adminCookie);
  console.log('Metrics after Anonymous User actions:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
    searchEvents: data.summary.searchEvents.value,
    dormitoryViews: data.summary.dormitoryViews.value,
  });
  assert.strictEqual(data.summary.uniqueVisitors.value, 1, 'Anonymous user must be counted in uniqueVisitors');
  assert.strictEqual(data.summary.pageViews.value, 1, 'Anonymous page_view must be counted');
  assert.strictEqual(data.summary.searchEvents.value, 1, 'Anonymous search must be counted');
  assert.strictEqual(data.summary.dormitoryViews.value, 1, 'Anonymous dorm view must be counted');
  assert.strictEqual(data.topSearches[0]?.keyword, 'หอพักใกล้ ม.อุบล');
  assert.strictEqual(data.topDormitories[0]?.id, 1);
  console.log('✓ Test 1 Passed: Anonymous user traffic is counted correctly!\n');

  // -------------------------------------------------------------
  // Test 2: Normal User (actor_type=user) -> MUST BE INCLUDED
  // -------------------------------------------------------------
  console.log('Test 2: Normal User (with userId, actor_type=user)...');
  const userVis2 = 'user_vis_' + Date.now() + '_2';
  const userSes2 = 'user_ses_' + Date.now() + '_2';

  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: userVis2,
      sessionId: userSes2,
      actorType: 'user',
      userId: 'student_999',
      page: '/',
    }),
  });

  data = await getAdminAnalytics(adminCookie);
  console.log('Metrics after Normal User actions:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
  });
  assert.strictEqual(data.summary.uniqueVisitors.value, 2, 'Total unique visitors should now be 2 (1 anon + 1 user)');
  assert.strictEqual(data.summary.pageViews.value, 2, 'Total page views should now be 2');
  console.log('✓ Test 2 Passed: Normal user is counted properly!\n');

  // -------------------------------------------------------------
  // Test 3: Admin Activity -> MUST BE EXCLUDED
  // -------------------------------------------------------------
  console.log('Test 3: Admin Activity (with admin cookie)...');
  const adminVis3 = 'admin_vis_' + Date.now() + '_3';
  const adminSes3 = 'admin_ses_' + Date.now() + '_3';

  // Admin tries sending page_view, search, dorm_view while holding admin cookie
  const adminTrackRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie,
    },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: adminVis3,
      sessionId: adminSes3,
      page: '/dorms',
    }),
  });
  const adminTrackJson = await adminTrackRes.json();
  console.log('Admin track response:', adminTrackJson);
  assert.strictEqual(adminTrackJson.skipped, 'admin', 'Admin event should be skipped');

  data = await getAdminAnalytics(adminCookie);
  console.log('Metrics after Admin activity:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
  });
  assert.strictEqual(data.summary.uniqueVisitors.value, 2, 'Admin actions must NOT increase uniqueVisitors');
  assert.strictEqual(data.summary.pageViews.value, 2, 'Admin actions must NOT increase pageViews');
  console.log('✓ Test 3 Passed: Admin activity is strictly excluded!\n');

  // -------------------------------------------------------------
  // Test 4: Anonymous -> Admin Login (Retroactive session conversion)
  // -------------------------------------------------------------
  console.log('Test 4: Anonymous User logs into Admin (Session conversion)...');
  const preAdminVis = 'pre_admin_vis_' + Date.now();
  const preAdminSes = 'pre_admin_ses_' + Date.now();

  // Anonymous user browses
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: preAdminVis,
      sessionId: preAdminSes,
      actorType: 'anonymous',
      page: '/dorms',
    }),
  });

  // Temporarily, that pre-admin session counted (total visitors = 3)
  data = await getAdminAnalytics(adminCookie);
  console.log('Before login, pre-admin event was counted: uniqueVisitors =', data.summary.uniqueVisitors.value);
  assert.strictEqual(data.summary.uniqueVisitors.value, 3);

  // Now, user logs in as Admin with preAdminSes!
  console.log('User logs in as Admin with sessionId =', preAdminSes);
  const newAdminCookie = await adminLogin(preAdminSes);

  // Re-check dashboard: The preAdminSes must now be retroactively excluded!
  data = await getAdminAnalytics(newAdminCookie);
  console.log('After Admin login, pre-admin session converted to admin: uniqueVisitors =', data.summary.uniqueVisitors.value);
  assert.strictEqual(data.summary.uniqueVisitors.value, 2, 'Pre-admin session events must be converted/excluded from User Analytics!');
  console.log('✓ Test 4 Passed: Pre-login anonymous events converted cleanly on admin login!\n');

  // -------------------------------------------------------------
  // Test 5: Admin Logout -> New Session -> Tracked as User
  // -------------------------------------------------------------
  console.log('Test 5: Admin Logout -> New Session (must NOT blacklist browser)...');
  const logoutRes = await fetch(`${BASE_URL}/api/admin/logout`, {
    method: 'POST',
    headers: { 'Cookie': newAdminCookie },
  });
  assert.strictEqual(logoutRes.status, 200);

  // User starts new session in same browser (same visitorId or new visitorId)
  const postLogoutSes = 'post_logout_ses_' + Date.now();
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: preAdminVis, // same browser visitorId!
      sessionId: postLogoutSes, // new session after logout
      actorType: 'anonymous',
      page: '/dorms',
    }),
  });

  // Admin logs in to view dashboard
  const adminViewerCookie = await adminLogin('ses_viewer_' + Date.now());
  data = await getAdminAnalytics(adminViewerCookie);
  console.log('Metrics after Post-Logout session activity:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
  });
  // Since preAdminVis is now active in postLogoutSes, uniqueVisitors should be 3
  assert.strictEqual(data.summary.uniqueVisitors.value, 3, 'Post-logout session should be counted as user!');
  console.log('✓ Test 5 Passed: Device/browser is NOT blacklisted; post-logout session tracked normally!\n');

  // -------------------------------------------------------------
  // Test 6: User Page Refresh (Same session deduplication)
  // -------------------------------------------------------------
  console.log('Test 6: User Page Refresh (Deduplication)...');
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: anonVis1, // same user from Test 1
      sessionId: anonSes1, // same session
      actorType: 'anonymous',
      page: '/dorms',
    }),
  });

  data = await getAdminAnalytics(adminViewerCookie);
  console.log('Metrics after page refresh:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
  });
  assert.strictEqual(data.summary.uniqueVisitors.value, 3, 'Unique visitors must remain 3 (no duplication for same visitor)');
  console.log('✓ Test 6 Passed: Unique visitors properly deduplicated on page refresh!\n');

  // -------------------------------------------------------------
  // Test 7: User Activity After Reset
  // -------------------------------------------------------------
  console.log('Test 7: User Activity After Reset...');
  const resetRes2 = await fetch(`${BASE_URL}/api/admin/analytics/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminViewerCookie,
      'x-session-id': 'ses_admin_reset2_' + Date.now(),
    },
    body: JSON.stringify({ note: 'Post Verification Reset' }),
  });
  const resetJson2 = await resetRes2.json();
  assert.strictEqual(resetJson2.success, true);
  console.log('New Reset point at:', resetJson2.resetRecord.resetAt);

  // Immediately after reset: 0
  data = await getAdminAnalytics(adminViewerCookie);
  assert.strictEqual(data.summary.uniqueVisitors.value, 0, 'Must be 0 immediately after reset');
  assert.strictEqual(data.summary.pageViews.value, 0, 'Must be 0 immediately after reset');

  // Anonymous user browses after reset
  const freshVis = 'fresh_vis_' + Date.now();
  const freshSes = 'fresh_ses_' + Date.now();
  await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      visitorId: freshVis,
      sessionId: freshSes,
      actorType: 'anonymous',
      page: '/dorms',
    }),
  });

  data = await getAdminAnalytics(adminViewerCookie);
  console.log('Metrics after new activity following reset:');
  console.log({
    uniqueVisitors: data.summary.uniqueVisitors.value,
    pageViews: data.summary.pageViews.value,
  });
  assert.strictEqual(data.summary.uniqueVisitors.value, 1, 'New anonymous user after reset must be counted immediately');
  assert.strictEqual(data.summary.pageViews.value, 1, 'New page view after reset must be counted immediately');
  console.log('✓ Test 7 Passed: Reset logic and post-reset tracking work perfectly!\n');

  console.log('=============================================================');
  console.log('🎉 ALL 7 TEST MATRIX VERIFICATIONS PASSED WITH 100% SUCCESS!');
  console.log('=============================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
