import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated, parseCookies, verifyAdminSessionToken, SESSION_COOKIE_NAME } from '@/lib/adminAuth';
import { createResetRecord, getDisplayResetTimestamp, getResetHistory, logAdminAudit } from '@/lib/analyticsDb';

export async function GET(request: Request) {
  // Server-side Authentication Guard
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงได้',
        authenticated: false 
      },
      { status: 401 }
    );
  }

  const resetAt = getDisplayResetTimestamp();
  const history = getResetHistory();
  return NextResponse.json({
    success: true,
    resetAt,
    totalResets: history.length,
    latestReset: history.length > 0 ? history[0] : null,
  });
}

export async function POST(request: Request) {
  // Server-side Authentication Guard
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถรีเซ็ตการแสดงผลได้',
        authenticated: false 
      },
      { status: 401 }
    );
  }

  try {
    let createdBy = 'admin';
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const cookies = parseCookies(cookieHeader);
      const payload = verifyAdminSessionToken(cookies[SESSION_COOKIE_NAME]);
      if (payload?.username) {
        createdBy = payload.username;
      }
    } catch (e) {}

    let note: string | undefined;
    try {
      const body = await request.json();
      if (body?.note && typeof body.note === 'string') {
        note = body.note.trim();
      }
    } catch (e) {}

    const newRecord = createResetRecord(createdBy, note || 'รีเซ็ตการแสดงผลสถิติ');

    // Log admin audit action (Requirement 14)
    logAdminAudit(createdBy, 'RESET_ANALYTICS', {
      resetRecordId: newRecord.id,
      resetAt: newRecord.resetAt,
    });

    return NextResponse.json({
      success: true,
      resetRecord: newRecord,
      resetAt: newRecord.resetAt,
      message: 'รีเซ็ตการแสดงผลสถิติสำเร็จ (ข้อมูลเดิมในฐานข้อมูลยังคงอยู่ครบถ้วนและดูย้อนหลังได้)',
    });
  } catch (error) {
    console.error('Failed to reset analytics display:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถรีเซ็ตการแสดงผลสถิติได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
