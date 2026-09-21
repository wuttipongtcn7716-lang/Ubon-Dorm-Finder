import { 
  createResetRecord, 
  getAnalyticsDashboardData, 
  getDisplayResetTimestamp, 
  getResetHistory, 
  getHistoricalPeriods,
  recordEvent,
  registerAdminIdentifier,
  isKnownAdminIdentifier
} from '../src/lib/analyticsDb';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runResetLogicVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 Running Comprehensive Admin Analytics Reset Logic Test Suite');
  console.log('================================================================\n');

  // Test 1: Reset Baseline
  console.log('--- Test Suite 1: Immediate Post-Reset State (Zero Baseline) ---');
  const resetRecord = createResetRecord('admin_test_user', 'Automated Reset Logic Test');
  assert(Boolean(resetRecord.id), 'Reset record created with valid ID');
  assert(Boolean(resetRecord.resetAt), 'Reset record created with valid resetAt');
  
  const currentResetAt = getDisplayResetTimestamp();
  assert(currentResetAt === resetRecord.resetAt, `getDisplayResetTimestamp returns latest resetAt (${currentResetAt})`);

  for (const period of ['today', '7d', '30d', '90d'] as const) {
    const data = getAnalyticsDashboardData(period);
    assert(data.summary.uniqueVisitors.value === 0, `[${period}] uniqueVisitors is strictly 0 immediately after reset`);
    assert(data.summary.pageViews.value === 0, `[${period}] pageViews is strictly 0 immediately after reset`);
    assert(data.summary.searchEvents.value === 0, `[${period}] searchEvents is strictly 0 immediately after reset`);
    assert(data.summary.dormitoryViews.value === 0, `[${period}] dormitoryViews is strictly 0 immediately after reset`);

    assert(data.summary.uniqueVisitors.changePercent === null, `[${period}] uniqueVisitors changePercent is null (renders —)`);
    assert(data.summary.pageViews.changePercent === null, `[${period}] pageViews changePercent is null (renders —)`);
    assert(data.summary.searchEvents.changePercent === null, `[${period}] searchEvents changePercent is null (renders —)`);
    assert(data.summary.dormitoryViews.changePercent === null, `[${period}] dormitoryViews changePercent is null (renders —)`);

    assert(data.topDormitories.length === 0, `[${period}] topDormitories is strictly empty [] immediately after reset`);
    assert(data.topSearches.length === 0, `[${period}] topSearches is strictly empty [] immediately after reset`);

    // Verify timeline points are all 0
    const totalTimelineVisitors = data.timeline.reduce((acc, p) => acc + p.visitors, 0);
    const totalTimelineViews = data.timeline.reduce((acc, p) => acc + p.views, 0);
    assert(totalTimelineVisitors === 0, `[${period}] timeline total visitors is 0`);
    assert(totalTimelineViews === 0, `[${period}] timeline total views is 0`);
  }

  // Test 2: Admin Activity After Reset
  console.log('\n--- Test Suite 2: Admin Activity Post-Reset (Must NOT be Counted) ---');
  const adminVis = `admin_vis_${Date.now()}`;
  const adminSes = `admin_ses_${Date.now()}`;
  registerAdminIdentifier('visitor_id', adminVis);
  registerAdminIdentifier('session_id', adminSes);

  assert(isKnownAdminIdentifier(adminVis, adminSes), 'Admin identifier registered successfully');

  // Attempt to record admin actions
  recordEvent({
    eventName: 'page_view',
    visitorId: adminVis,
    sessionId: adminSes,
    actorType: 'admin',
    page: '/admin/analytics',
  });
  recordEvent({
    eventName: 'search',
    visitorId: adminVis,
    sessionId: adminSes,
    actorType: 'admin',
    searchKeyword: 'หอพักใกล้ ม.อุบล',
  });
  recordEvent({
    eventName: 'dormitory_view',
    visitorId: adminVis,
    sessionId: adminSes,
    actorType: 'admin',
    dormitoryId: 1,
    dormitoryName: 'หอพักทดสอบ',
  });

  const postAdminData = getAnalyticsDashboardData('today');
  assert(postAdminData.summary.uniqueVisitors.value === 0, 'Unique visitors remains 0 after admin activity');
  assert(postAdminData.summary.pageViews.value === 0, 'Page views remains 0 after admin activity');
  assert(postAdminData.summary.searchEvents.value === 0, 'Search events remains 0 after admin activity');
  assert(postAdminData.summary.dormitoryViews.value === 0, 'Dormitory views remains 0 after admin activity');
  assert(postAdminData.topDormitories.length === 0, 'Top dormitories remains empty after admin activity');
  assert(postAdminData.topSearches.length === 0, 'Top searches remains empty after admin activity');

  // Test 3: Pre-login Admin Visitor Retroactive Exclusion
  console.log('\n--- Test Suite 3: Retroactive Admin Exclusion (Pre-login Traffic) ---');
  const preAdminVis = `pre_admin_vis_${Date.now()}`;
  const preAdminSes = `pre_admin_ses_${Date.now()}`;
  
  // Record as innocent 'user' traffic first
  recordEvent({
    eventName: 'page_view',
    visitorId: preAdminVis,
    sessionId: preAdminSes,
    actorType: 'user',
    page: '/',
  });
  recordEvent({
    eventName: 'dormitory_view',
    visitorId: preAdminVis,
    sessionId: preAdminSes,
    actorType: 'user',
    dormitoryId: 2,
    dormitoryName: 'หอพักก่อนล็อกอิน',
  });

  // Verify it momentarily showed 1
  const momentaryData = getAnalyticsDashboardData('today');
  assert(momentaryData.summary.uniqueVisitors.value === 1, 'Pre-login traffic is initially counted as 1 user');

  // Now user authenticates as Admin
  registerAdminIdentifier('visitor_id', preAdminVis);
  registerAdminIdentifier('session_id', preAdminSes);

  // Re-check dashboard: pre-login activity must be purged
  const purgedData = getAnalyticsDashboardData('today');
  assert(purgedData.summary.uniqueVisitors.value === 0, 'Pre-login traffic retroactively purged after admin registration');
  assert(purgedData.summary.dormitoryViews.value === 0, 'Pre-login dorm views retroactively purged');
  assert(purgedData.topDormitories.length === 0, 'Top dorms retroactively purged');

  // Test 4: Real User Activity Accurately Counted
  console.log('\n--- Test Suite 4: Real User Traffic Tracking After Reset ---');
  const realUserVis = `real_user_${Date.now()}`;
  const realUserSes = `real_user_sess_${Date.now()}`;

  recordEvent({
    eventName: 'page_view',
    visitorId: realUserVis,
    sessionId: realUserSes,
    actorType: 'user',
    page: '/',
  });
  recordEvent({
    eventName: 'page_view',
    visitorId: realUserVis,
    sessionId: realUserSes,
    actorType: 'user',
    page: '/search',
  });
  recordEvent({
    eventName: 'search',
    visitorId: realUserVis,
    sessionId: realUserSes,
    actorType: 'user',
    searchKeyword: 'หอพักหญิง ปลอดภัย',
  });
  recordEvent({
    eventName: 'dormitory_view',
    visitorId: realUserVis,
    sessionId: realUserSes,
    actorType: 'user',
    dormitoryId: 10,
    dormitoryName: 'หอพักร่มเย็น ม.อุบล',
  });

  const realUserData = getAnalyticsDashboardData('today');
  assert(realUserData.summary.uniqueVisitors.value === 1, 'Real user: uniqueVisitors is 1');
  assert(realUserData.summary.pageViews.value === 2, 'Real user: pageViews is 2');
  assert(realUserData.summary.searchEvents.value === 1, 'Real user: searchEvents is 1');
  assert(realUserData.summary.dormitoryViews.value === 1, 'Real user: dormitoryViews is 1');
  assert(realUserData.topDormitories.length === 1, 'Real user: topDormitories has 1 entry');
  assert(realUserData.topDormitories[0].name === 'หอพักร่มเย็น ม.อุบล', 'Real user: top dorm name matches');
  assert(realUserData.topSearches.length === 1, 'Real user: topSearches has 1 entry');
  assert(realUserData.topSearches[0].keyword === 'หอพักหญิง ปลอดภัย', 'Real user: top search keyword matches');

  // Test 5: Historical Integrity (Zero Data Loss)
  console.log('\n--- Test Suite 5: Historical Analytics Integrity ---');
  const history = getResetHistory();
  assert(history.length >= 1, `Reset history contains at least 1 record (found ${history.length})`);
  const periods = getHistoricalPeriods();
  assert(periods.length >= 1, `Historical periods contains at least 1 historical segment (found ${periods.length})`);

  console.log('\n================================================================');
  console.log('🎉 All Reset Logic Verification Tests Passed Successfully!');
  console.log('================================================================\n');
}

runResetLogicVerificationSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
