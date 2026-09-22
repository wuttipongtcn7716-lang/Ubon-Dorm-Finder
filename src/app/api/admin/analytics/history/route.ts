import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated, parseCookies, verifyAdminSessionToken, SESSION_COOKIE_NAME } from '@/lib/adminAuth';
import { getHistoricalPeriods, getHistoricalAnalyticsData, logAdminAudit, registerAdminIdentifier } from '@/lib/analyticsDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  // Server-side Authentication Guard: Admin Only
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงประวัติสถิติได้',
        authenticated: false 
      },
      { 
        status: 401,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  // Register admin session if passed in request headers
  const reqSes = request.headers.get('x-session-id');
  if (reqSes) await registerAdminIdentifier('session_id', reqSes);

  try {
    let adminUsername = 'admin';
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const cookies = parseCookies(cookieHeader);
      const session = verifyAdminSessionToken(cookies[SESSION_COOKIE_NAME]);
      if (session?.username) adminUsername = session.username;
    } catch (e) {}

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Log admin audit action (Requirement 14)
    await logAdminAudit(adminUsername, 'VIEW_ANALYTICS_HISTORY', {
      periodId: periodId || null,
      customRange: endParam ? { start: startParam, end: endParam } : null,
    });

    const periods = await getHistoricalPeriods();

    // Case 1: Specific historical period requested by ID
    if (periodId) {
      const targetPeriod = periods.find((p) => p.id === periodId);
      if (!targetPeriod) {
        return NextResponse.json(
          { error: 'ไม่พบช่วงเวลาประวัติที่ระบุ' },
          { 
            status: 404,
            headers: NO_CACHE_HEADERS,
          }
        );
      }

      const data = await getHistoricalAnalyticsData(targetPeriod.startAt, targetPeriod.endAt, {
        id: targetPeriod.id,
        label: targetPeriod.label,
      });

      return NextResponse.json(
        {
          success: true,
          period: targetPeriod,
          data,
        },
        {
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // Case 2: Specific custom range requested by start & end ISO strings
    if (endParam) {
      const data = await getHistoricalAnalyticsData(startParam || null, endParam, {
        id: 'custom_range',
        label: `ช่วง ${startParam || 'เริ่มต้น'} ถึง ${endParam}`,
      });

      return NextResponse.json(
        {
          success: true,
          data,
        },
        {
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // Case 3: List all historical reset segments
    return NextResponse.json(
      {
        success: true,
        periods,
        totalPeriods: periods.length,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to load historical analytics:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดประวัติข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง' },
      { 
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
