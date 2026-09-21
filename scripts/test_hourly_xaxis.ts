import { getTimelineData, getHistoricalAnalyticsData } from '../src/lib/analyticsDb';

async function testHourlyXAxis() {
  console.log('================================================================');
  console.log('🧪 Testing Admin Analytics Hourly X-Axis & Timeline Buckets');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // Test 1: getTimelineData('today')
  console.log('\n--- Test 1: getTimelineData("today") ---');
  const todayTimeline = getTimelineData('today');
  assert(todayTimeline.length === 24, `Timeline for "today" has exactly 24 points (got ${todayTimeline.length})`);
  
  const expectedLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const actualLabels = todayTimeline.map(p => p.label);
  const labelsMatch = JSON.stringify(expectedLabels) === JSON.stringify(actualLabels);
  assert(labelsMatch, `All 24 hours 00:00 through 23:00 exist in chronological order without skipping`);

  const hasFullDate = todayTimeline.every(p => p.fullDateLabel && p.fullDateLabel.includes('256'));
  assert(hasFullDate, `All hourly points have full Thai Buddhist date label`);

  const hasTimeRange = todayTimeline.every(p => p.timeRangeLabel && p.timeRangeLabel.startsWith('เวลา ') && p.timeRangeLabel.includes('–'));
  assert(hasTimeRange, `All hourly points have time range label (e.g. เวลา 21:00–21:59)`);

  const allZeroOrPositive = todayTimeline.every(p => typeof p.visitors === 'number' && p.visitors >= 0);
  assert(allZeroOrPositive, `Hours with 0 visitors are retained with visitors: 0`);

  // Test 2: getTimelineData('7d')
  console.log('\n--- Test 2: getTimelineData("7d") ---');
  const weekTimeline = getTimelineData('7d');
  assert(weekTimeline.length === 7, `Timeline for "7d" has exactly 7 daily points (got ${weekTimeline.length})`);
  assert(weekTimeline.every(p => p.timeRangeLabel === 'ตลอดทั้งวัน (00:00–23:59)'), `Daily points have "ตลอดทั้งวัน (00:00–23:59)" label`);

  // Test 3: getHistoricalAnalyticsData (< 24h across midnight)
  console.log('\n--- Test 3: Historical Data (< 24h across midnight) ---');
  // Day 1 20:30 Bangkok to Day 2 02:30 Bangkok (6 hours span across midnight)
  const BANGKOK_OFFSET_MS = 7 * 3600 * 1000;
  const tStartUtc = Date.UTC(2026, 8, 22, 13, 30, 0); // 20:30 Bangkok (13:30 UTC)
  const tEndUtc = Date.UTC(2026, 8, 22, 19, 30, 0);   // 02:30 Bangkok (+1 day in BKK: 23 Sep 02:30)
  
  const histData = getHistoricalAnalyticsData(new Date(tStartUtc).toISOString(), new Date(tEndUtc).toISOString());
  assert(histData.timeline.length > 0, `Historical timeline returned points`);
  
  // Check that labels cross midnight in order: 20:00, 21:00, 22:00, 23:00, 00:00, 01:00, 02:00
  const histLabels = histData.timeline.map(p => p.label);
  console.log(`Historical labels across midnight: ${histLabels.join(' -> ')}`);
  assert(histLabels.includes('23:00') && histLabels.includes('00:00'), `Crosses midnight smoothly with 23:00 followed by 00:00`);
  
  // Verify timestamps are strictly strictly monotonic
  const timestamps = histData.timeline.map(p => new Date(p.date).getTime());
  let monotonic = true;
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i] <= timestamps[i - 1]) monotonic = false;
  }
  assert(monotonic, `Historical hourly timestamps are strictly monotonic across midnight`);

  // Test 4: Check API payload from server
  console.log('\n--- Test 4: Live Server API Response ---');
  try {
    // Admin login to get session
    const loginRes = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'dormie_admin_2026' })
    });
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const tokenMatch = setCookie.match(/admin_session=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';
    const cookie = `admin_session=${token}; dormie_role=admin`;
    
    const apiRes = await fetch('http://localhost:3000/api/admin/analytics?period=today', {
      headers: { Cookie: cookie }
    });
    assert(apiRes.status === 200, `GET /api/admin/analytics?period=today returned 200`);
    const json = await apiRes.json();
    const timeline = json.data?.timeline;
    assert(Array.isArray(timeline), `API returned timeline array`);
    assert(timeline.length === 24, `API timeline has 24 hourly points`);
    assert(timeline[0].label === '00:00', `First point is 00:00`);
    assert(timeline[23].label === '23:00', `Last point is 23:00`);
    assert(timeline[12].timeRangeLabel === 'เวลา 12:00–12:59', `Point has formatted timeRangeLabel`);
  } catch (err: any) {
    console.error('API test error:', err);
    assert(false, `API call succeeded: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

testHourlyXAxis();
