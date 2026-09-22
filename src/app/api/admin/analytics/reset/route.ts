import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated, parseCookies, verifyAdminSessionToken, SESSION_COOKIE_NAME } from '@/lib/adminAuth';
import { createResetRecord, getDisplayResetTimestamp, getResetHistory, logAdminAudit, registerAdminIdentifier } from '@/lib/analyticsDb';

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
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงได้',
        authenticated: false 
      },
      { 
        status: 401,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  // Register admin session if passed in headers
  const reqSes = request.headers.get('x-session-id');
  if (reqSes) await registerAdminIdentifier('session_id', reqSes);

  const resetAt = await getDisplayResetTimestamp();
  const history = await getResetHistory();
  return NextResponse.json(
    {
      success: true,
      resetAt,
      totalResets: history.length,
      latestReset: history.length > 0 ? history[0] : null,
    },
    {
      headers: NO_CACHE_HEADERS,
    }
  );
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
      { 
        status: 401,
        headers: NO_CACHE_HEADERS,
      }
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
    let visitorId: string | undefined;
    let sessionId: string | undefined;

    // Check request headers
    const hVis = request.headers.get('x-visitor-id');
    const hSes = request.headers.get('x-session-id');
    if (hVis) visitorId = hVis;
    if (hSes) sessionId = hSes;

    try {
      const body = await request.json();
      if (body?.note && typeof body.note === 'string') {
        note = body.note.trim();
      }
      if (body?.visitorId && typeof body.visitorId === 'string') {
        visitorId = body.visitorId;
      }
      if (body?.sessionId && typeof body.sessionId === 'string') {
        sessionId = body.sessionId;
      }
    } catch (e) {}

    // Immediately register Admin session identifier
    if (sessionId) await registerAdminIdentifier('session_id', sessionId);

    const newRecord = await createResetRecord(createdBy, note || 'รีเซ็ตการแสดงผลสถิติ');

    // Log admin audit action (Requirement 14)
    await logAdminAudit(createdBy, 'RESET_ANALYTICS', {
      resetRecordId: newRecord.id,
      resetAt: newRecord.resetAt,
    });

    return NextResponse.json(
      {
        success: true,
        resetRecord: newRecord,
        resetAt: newRecord.resetAt,
        message: 'รีเซ็ตการแสดงผลสถิติสำเร็จ (ข้อมูลเดิมในฐานข้อมูลยังคงอยู่ครบถ้วนและดูย้อนหลังได้)',
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to reset analytics display:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถรีเซ็ตการแสดงผลสถิติได้ กรุณาลองใหม่อีกครั้ง' },
      { 
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
