import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';
import { getAdminAuditLogs } from '@/lib/analyticsDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Server-side Authentication Guard: Admin Only
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถดูบันทึก Audit Logs ได้' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const logs = getAdminAuditLogs(Math.min(limit, 200));

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve admin audit logs' },
      { status: 500 }
    );
  }
}
