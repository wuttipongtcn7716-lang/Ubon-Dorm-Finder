import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';
import { getAnalyticsDashboardData, PeriodType } from '@/lib/analyticsDb';

export async function GET(request: Request) {
  // Server-side Authentication Guard
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงข้อมูล Analytics ได้',
        authenticated: false 
      },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPeriod = searchParams.get('period') || '7d';
    
    // Validate period parameter
    const validPeriods: PeriodType[] = ['today', '7d', '30d', '90d'];
    const period: PeriodType = validPeriods.includes(rawPeriod as PeriodType) 
      ? (rawPeriod as PeriodType) 
      : '7d';

    const data = getAnalyticsDashboardData(period);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to load analytics dashboard data:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
