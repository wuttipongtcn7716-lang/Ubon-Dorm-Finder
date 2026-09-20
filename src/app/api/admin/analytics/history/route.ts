import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';
import { getHistoricalPeriods, getHistoricalAnalyticsData } from '@/lib/analyticsDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Server-side Authentication Guard: Admin Only
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงประวัติสถิติได้',
        authenticated: false 
      },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const periods = getHistoricalPeriods();

    // Case 1: Specific historical period requested by ID
    if (periodId) {
      const targetPeriod = periods.find((p) => p.id === periodId);
      if (!targetPeriod) {
        return NextResponse.json(
          { error: 'ไม่พบช่วงเวลาประวัติที่ระบุ' },
          { status: 404 }
        );
      }

      const data = getHistoricalAnalyticsData(targetPeriod.startAt, targetPeriod.endAt, {
        id: targetPeriod.id,
        label: targetPeriod.label,
      });

      return NextResponse.json({
        success: true,
        period: targetPeriod,
        data,
      });
    }

    // Case 2: Specific custom range requested by start & end ISO strings
    if (endParam) {
      const data = getHistoricalAnalyticsData(startParam || null, endParam, {
        id: 'custom_range',
        label: `ช่วง ${startParam || 'เริ่มต้น'} ถึง ${endParam}`,
      });

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // Case 3: List all historical reset segments
    return NextResponse.json({
      success: true,
      periods,
      totalPeriods: periods.length,
    });
  } catch (error) {
    console.error('Failed to load historical analytics:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดประวัติข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
