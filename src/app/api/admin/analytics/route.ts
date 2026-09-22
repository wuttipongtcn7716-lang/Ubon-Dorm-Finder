import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';
import { getAnalyticsDashboardData, PeriodType, registerAdminIdentifier } from '@/lib/analyticsDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  // Server-side Authentication Guard
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงข้อมูล Analytics ได้',
        authenticated: false 
      },
      { 
        status: 401,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  // Auto-register admin session identifier from request headers
  const reqSes = request.headers.get('x-session-id');
  if (reqSes) await registerAdminIdentifier('session_id', reqSes);

  try {
    const { searchParams } = new URL(request.url);
    const rawPeriod = searchParams.get('period') || '7d';
    
    // Validate period parameter
    const validPeriods: PeriodType[] = ['today', '7d', '30d', '90d'];
    const period: PeriodType = validPeriods.includes(rawPeriod as PeriodType) 
      ? (rawPeriod as PeriodType) 
      : '7d';

    const data = await getAnalyticsDashboardData(period);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to load analytics dashboard data:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง' },
      { 
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
