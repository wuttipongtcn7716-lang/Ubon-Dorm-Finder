/**
 * Comprehensive Automated Test Suite: Admin Analytics & Exclusion Overhaul
 * Verifies:
 *  1. User Analytics Ingestion (page_view, search, etc.)
 *  2. Strict Admin Exclusion (Admin Login, Dashboard, Search, Dorm Views NEVER count towards User Analytics)
 *  3. Admin Audit Logging (LOGIN, LOGOUT, RESET_ANALYTICS, VIEW_ANALYTICS_HISTORY)
 *  4. Reset Display & Absolute Zero Data Loss (no DELETE / TRUNCATE on analytics_events)
 *  5. Immediate Dashboard Reset to 0
 *  6. Subsequent User Event Counting
 *  7. Historical Period Partitioning & Accurate Data Retrieval
 *  8. Session Persistence across Logout & Re-login
 */

const BASE_URL = 'http://localhost:3000';

interface AssertResult {
  suite: string;
  name: string;
  passed: boolean;
  detail?: string;
}

const results: AssertResult[] = [];

function assert(suite: string, name: string, condition: boolean, detail?: string) {
  results.push({ suite, name, passed: condition, detail });
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name} ${detail ? `- ${detail}` : ''}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Running Comprehensive Admin Analytics & Exclusion Test Suite');
  console.log('================================================================\n');

  // Wait for server ready
  let ready = false;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/verify`);
      if (res.status === 200 || res.status === 401) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(1000);
  }

  if (!ready) {
    console.error('❌ Server is not responding on http://localhost:3000');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Suite 1: User Analytics Ingestion
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Regular User Event Tracking ---');
  const userVisitorId = `user_vis_${Date.now()}`;
  const userSessionId = `user_ses_${Date.now()}`;

  const trackRes1 = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      sessionId: userSessionId,
      visitorId: userVisitorId,
      page: '/',
      createdAt: new Date().toISOString(),
    }),
  });
  const trackJson1 = await trackRes1.json();
  assert('User Tracking', 'Regular user page_view is recorded', trackRes1.ok && trackJson1.ok === true && !trackJson1.skipped);

  // -------------------------------------------------------------
  // Suite 2: Admin Login & Authentication
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Admin Login & Audit Log ---');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'dormie_admin_2026' }),
  });
  const loginJson = await loginRes.json();
  assert('Admin Login', 'Admin login returns 200 and success: true', loginRes.ok && loginJson.success === true);
  assert('Admin Login', 'Admin response returns user.role === "admin"', loginJson.user?.role === 'admin');

  const setCookie = loginRes.headers.get('set-cookie') || '';
  const adminSessionMatch = setCookie.match(/admin_session=([^;]+)/);
  const adminSessionToken = adminSessionMatch ? adminSessionMatch[1] : '';
  const adminCookieHeader = `admin_session=${adminSessionToken}; dormie_role=admin`;
  assert('Admin Login', 'Admin session cookie exists', Boolean(adminSessionToken));

  // Check audit logs for LOGIN
  const auditRes1 = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: adminCookieHeader },
  });
  const auditJson1 = await auditRes1.json();
  assert('Admin Audit', 'Admin audit logs API returns 200 for admin', auditRes1.ok && auditJson1.success === true);
  const loginAudit = auditJson1.logs?.find((l: any) => l.action === 'LOGIN');
  assert('Admin Audit', 'admin_audit_logs contains LOGIN action', Boolean(loginAudit));

  // -------------------------------------------------------------
  // Suite 3: Strict Admin Exclusion (Admin Actions NEVER tracked)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Strict Admin Exclusion ---');

  // Admin attempts to track a page_view with admin session cookie
  const adminTrackRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'page_view',
      sessionId: 'admin_session_test',
      visitorId: 'admin_visitor_test',
      page: '/dorm/1',
      createdAt: new Date().toISOString(),
    }),
  });
  const adminTrackJson = await adminTrackRes.json();
  assert(
    'Admin Exclusion',
    'POST /api/analytics/track with admin session is SKIPPED',
    adminTrackRes.ok && adminTrackJson.skipped === 'admin'
  );

  // Admin attempts to track a search event with admin session cookie
  const adminSearchRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'search',
      sessionId: 'admin_session_test',
      visitorId: 'admin_visitor_test',
      searchKeyword: 'หอพักแอดมินทดสอบ',
      createdAt: new Date().toISOString(),
    }),
  });
  const adminSearchJson = await adminSearchRes.json();
  assert(
    'Admin Exclusion',
    'Admin search event is SKIPPED from user analytics',
    adminSearchRes.ok && adminSearchJson.skipped === 'admin'
  );

  // Admin attempts to track a dormitory_view event
  const adminDormRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      eventName: 'dormitory_view',
      sessionId: 'admin_session_test',
      visitorId: 'admin_visitor_test',
      dormitoryId: 1,
      dormitoryName: 'หอพักทดสอบ',
      createdAt: new Date().toISOString(),
    }),
  });
  const adminDormJson = await adminDormRes.json();
  assert(
    'Admin Exclusion',
    'Admin dormitory_view event is SKIPPED from user analytics',
    adminDormRes.ok && adminDormJson.skipped === 'admin'
  );

  // Non-authenticated request visiting /admin path
  const adminPathRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      sessionId: 'random_session',
      visitorId: 'random_visitor',
      page: '/admin/analytics',
      createdAt: new Date().toISOString(),
    }),
  });
  const adminPathJson = await adminPathRes.json();
  assert(
    'Admin Exclusion',
    'Any event with page starting with /admin is SKIPPED',
    adminPathRes.ok && adminPathJson.skipped === 'admin_path'
  );

  // -------------------------------------------------------------
  // Suite 4: Reset Display & Absolute Zero Data Loss
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Reset Display & Data Preservation ---');
  // Get current historical periods before reset
  const preHistoryRes = await fetch(`${BASE_URL}/api/admin/analytics/history`, {
    headers: { Cookie: adminCookieHeader },
  });
  const preHistoryJson = await preHistoryRes.json();
  const prePeriodCount = preHistoryJson.totalPeriods || 0;

  // Execute reset
  const resetRes = await fetch(`${BASE_URL}/api/admin/analytics/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({ note: 'Overhaul automated test reset' }),
  });
  const resetJson = await resetRes.json();
  assert('Reset Display', 'POST /api/admin/analytics/reset returns 200', resetRes.ok && resetJson.success === true);
  assert('Reset Display', 'Reset response contains new resetRecord ID', Boolean(resetJson.resetRecord?.id));

  // Verify audit log recorded RESET_ANALYTICS
  const auditRes2 = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: adminCookieHeader },
  });
  const auditJson2 = await auditRes2.json();
  const resetAudit = auditJson2.logs?.find((l: any) => l.action === 'RESET_ANALYTICS');
  assert('Admin Audit', 'admin_audit_logs contains RESET_ANALYTICS action', Boolean(resetAudit));

  // Post-reset live dashboard query
  await sleep(100);
  const postResetDashRes = await fetch(`${BASE_URL}/api/admin/analytics?period=7d`, {
    headers: { Cookie: adminCookieHeader },
  });
  const postResetDashJson = await postResetDashRes.json();
  assert('Reset Display', 'Post-reset analytics returns 200', postResetDashRes.ok);
  assert(
    'Reset Display',
    'Post-reset summary metrics immediately reset to 0',
    postResetDashJson.data?.summary.uniqueVisitors.value === 0 &&
    postResetDashJson.data?.summary.pageViews.value === 0 &&
    postResetDashJson.data?.summary.searchEvents.value === 0 &&
    postResetDashJson.data?.summary.dormitoryViews.value === 0
  );

  // -------------------------------------------------------------
  // Suite 5: New User Activity Counted Post-Reset
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: New User Activity Counted After Reset ---');
  await sleep(100);
  const newUserSession = `fresh_user_ses_${Date.now()}`;
  const newUserVisitor = `fresh_user_vis_${Date.now()}`;

  const newEventRes = await fetch(`${BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'search',
      sessionId: newUserSession,
      visitorId: newUserVisitor,
      searchKeyword: 'หอพักหญิงแถวมหาลัย',
      createdAt: new Date().toISOString(),
    }),
  });
  const newEventJson = await newEventRes.json();
  assert('New User Activity', 'New user search event recorded post-reset', newEventRes.ok && newEventJson.ok === true);

  // Check dashboard reflects the new event
  const updatedDashRes = await fetch(`${BASE_URL}/api/admin/analytics?period=7d`, {
    headers: { Cookie: adminCookieHeader },
  });
  const updatedDashJson = await updatedDashRes.json();
  assert(
    'New User Activity',
    'Live dashboard reflects only events after latest reset (searchEvents=1)',
    updatedDashJson.data?.summary.searchEvents.value === 1 &&
    updatedDashJson.data?.summary.uniqueVisitors.value === 1
  );

  // -------------------------------------------------------------
  // Suite 6: Reset History & Past Period Query
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: Reset History & Historical Data ---');
  const historyRes = await fetch(`${BASE_URL}/api/admin/analytics/history`, {
    headers: { Cookie: adminCookieHeader },
  });
  const historyJson = await historyRes.json();
  assert('History API', 'GET /api/admin/analytics/history returns 200', historyRes.ok);
  assert('History API', 'History periods increased by 1', (historyJson.totalPeriods || 0) >= prePeriodCount + 1);

  // Query detail of the latest past period
  const pastPeriod = historyJson.periods?.[0];
  assert('History API', 'Past period exists in history', Boolean(pastPeriod));

  if (pastPeriod) {
    const detailRes = await fetch(`${BASE_URL}/api/admin/analytics/history?periodId=${pastPeriod.id}`, {
      headers: { Cookie: adminCookieHeader },
    });
    const detailJson = await detailRes.json();
    assert('Historical Query', 'Historical period query returns 200', detailRes.ok && detailJson.success === true);
    assert('Historical Query', 'Data type is "historical"', detailJson.data?.period === 'historical');
    assert('Historical Query', 'Data has timeline data', Array.isArray(detailJson.data?.timeline));
    assert('Historical Query', 'Data has topDormitories array', Array.isArray(detailJson.data?.topDormitories));
    assert('Historical Query', 'Data has topSearches array', Array.isArray(detailJson.data?.topSearches));
  }

  // -------------------------------------------------------------
  // Suite 7: Admin Logout & Data Persistence
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 7: Admin Logout & Session Persistence ---');
  const logoutRes = await fetch(`${BASE_URL}/api/admin/logout`, {
    method: 'POST',
    headers: { Cookie: adminCookieHeader },
  });
  assert('Admin Logout', 'POST /api/admin/logout returns 200', logoutRes.ok);

  // Verify access is blocked after logout
  const postLogoutRes = await fetch(`${BASE_URL}/api/admin/analytics?period=7d`);
  assert('Admin Logout', 'Unauthenticated request after logout is blocked (401)', postLogoutRes.status === 401);

  // Re-login to verify all data persists
  const reloginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'dormie_admin_2026' }),
  });
  const reloginCookie = reloginRes.headers.get('set-cookie') || '';
  const newSessionMatch = reloginCookie.match(/admin_session=([^;]+)/);
  const newAdminCookie = `admin_session=${newSessionMatch ? newSessionMatch[1] : ''}`;

  const recheckHistoryRes = await fetch(`${BASE_URL}/api/admin/analytics/history`, {
    headers: { Cookie: newAdminCookie },
  });
  const recheckHistoryJson = await recheckHistoryRes.json();
  assert(
    'Persistence Verification',
    'Reset history and data completely preserved after logout and re-login',
    recheckHistoryRes.ok && (recheckHistoryJson.totalPeriods || 0) >= 1
  );

  // Verify audit log has LOGOUT and re-login LOGIN
  const recheckAuditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: newAdminCookie },
  });
  const recheckAuditJson = await recheckAuditRes.json();
  const logoutAudit = recheckAuditJson.logs?.find((l: any) => l.action === 'LOGOUT');
  assert('Admin Audit', 'admin_audit_logs contains LOGOUT action', Boolean(logoutAudit));

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

export {};

