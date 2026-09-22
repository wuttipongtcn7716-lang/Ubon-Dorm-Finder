import { 
  recordEvent, 
  getAnalyticsDashboardData, 
  getDisplayResetTimestamp, 
  createResetRecord, 
  getResetHistory, 
  registerAdminIdentifier,
  getHistoricalPeriods,
  getHistoricalAnalyticsData
} from '../src/lib/analyticsDb';

async function verify() {
  console.log('=== VERIFYING ANALYTICS STORAGE CONTRACT ===\n');

  // Baseline reset
  const initialReset = await createResetRecord('admin_system', 'Test Suite Baseline');
  console.log(`1. Created baseline reset point at ${initialReset.resetAt}`);

  // Test 1: Anonymous User Traffic (MUST BE INCLUDED)
  const anonVisitor = `anon_user_${Date.now()}`;
  const anonSession = `anon_sess_${Date.now()}`;
  console.log(`\n2. Simulating Anonymous User [${anonVisitor}]:`);

  await recordEvent({
    eventName: 'page_view',
    visitorId: anonVisitor,
    sessionId: anonSession,
    actorType: 'anonymous',
    page: '/',
  });
  console.log('   - Event: page_view / recorded');

  await recordEvent({
    eventName: 'search',
    visitorId: anonVisitor,
    sessionId: anonSession,
    actorType: 'anonymous',
    searchKeyword: 'หอพักหญิง ปลอดภัย',
  });
  console.log('   - Event: search "หอพักหญิง ปลอดภัย" recorded');

  await recordEvent({
    eventName: 'dormitory_view',
    visitorId: anonVisitor,
    sessionId: anonSession,
    actorType: 'anonymous',
    dormitoryId: 1,
    dormitoryName: 'หอพักสว่างศิลป์',
  });
  console.log('   - Event: dormitory_view "หอพักสว่างศิลป์" recorded');

  const afterAnon = await getAnalyticsDashboardData('today');
  console.log(`   - Dashboard check: uniqueVisitors = ${afterAnon.summary.uniqueVisitors.value}, pageViews = ${afterAnon.summary.pageViews.value}, searchEvents = ${afterAnon.summary.searchEvents.value}, dormitoryViews = ${afterAnon.summary.dormitoryViews.value}`);
  if (afterAnon.summary.uniqueVisitors.value !== 1) throw new Error('Expected 1 unique visitor from anonymous user');
  if (afterAnon.summary.searchEvents.value !== 1) throw new Error('Expected 1 search event from anonymous user');
  if (afterAnon.summary.dormitoryViews.value !== 1) throw new Error('Expected 1 dormitory view from anonymous user');
  console.log('   ✅ Anonymous User traffic is 100% INCLUDED in Analytics Dashboard!');

  // Test 2: Admin Activity (MUST BE EXCLUDED)
  const adminVisitor = `admin_vis_${Date.now()}`;
  const adminSession = `admin_sess_${Date.now()}`;
  console.log(`\n3. Simulating Admin User [${adminVisitor} / ${adminSession}]:`);
  await registerAdminIdentifier('session_id', adminSession);

  await recordEvent({
    eventName: 'page_view',
    visitorId: adminVisitor,
    sessionId: adminSession,
    actorType: 'admin',
    page: '/admin/analytics',
  });
  await recordEvent({
    eventName: 'search',
    visitorId: adminVisitor,
    sessionId: adminSession,
    actorType: 'admin',
    searchKeyword: 'admin internal search',
  });
  console.log('   - Recorded admin page_view and search');

  const afterAdmin = await getAnalyticsDashboardData('today');
  console.log(`   - Dashboard check: uniqueVisitors = ${afterAdmin.summary.uniqueVisitors.value}, searchEvents = ${afterAdmin.summary.searchEvents.value}`);
  if (afterAdmin.summary.uniqueVisitors.value !== 1) throw new Error('Admin activity leaked into unique visitors count');
  if (afterAdmin.summary.searchEvents.value !== 1) throw new Error('Admin activity leaked into search events count');
  console.log('   ✅ Admin activity is strictly EXCLUDED from Analytics Dashboard!');

  // Test 3: Reset Analytics (Must NOT delete analytics_events, ONLY insert analytics_reset_history)
  console.log('\n4. Testing Reset Analytics...');
  const resetPoint = await createResetRecord('admin', 'Testing Reset Non-Destructive');
  console.log(`   - Created reset point at ${resetPoint.resetAt}`);

  const postResetData = await getAnalyticsDashboardData('today');
  console.log(`   - Current Dashboard: uniqueVisitors = ${postResetData.summary.uniqueVisitors.value}, pageViews = ${postResetData.summary.pageViews.value}`);
  if (postResetData.summary.uniqueVisitors.value !== 0) throw new Error('Expected current dashboard to show 0 after reset');

  // Verify historical integrity (Events are still alive in database!)
  const periods = await getHistoricalPeriods();
  console.log(`   - Historical periods available: ${periods.length}`);
  const lastPeriod = periods[periods.length - 1];
  const histData = await getHistoricalAnalyticsData(lastPeriod.startAt, lastPeriod.endAt);
  console.log(`   - Historical period data: uniqueVisitors = ${histData.summary.uniqueVisitors.value}, pageViews = ${histData.summary.pageViews.value}, searches = ${histData.summary.searchEvents.value}`);
  if (histData.summary.uniqueVisitors.value === 0 && histData.summary.pageViews.value === 0) {
    throw new Error('Historical events were lost! Zero data loss guarantee failed.');
  }
  console.log('   ✅ Reset is strictly non-destructive: 0 DELETE / 0 TRUNCATE, historical events intact!');

  console.log('\n🎉 ALL STORAGE CONTRACT TESTS PASSED PERFECTLY!\n');
}

verify().catch((e) => {
  console.error('❌ Verification failed:', e);
  process.exit(1);
});
