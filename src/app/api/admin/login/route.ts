import { NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSessionToken, SESSION_COOKIE_NAME } from '@/lib/adminAuth';
import { logAdminAudit, registerAdminIdentifier } from '@/lib/analyticsDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, visitorId, sessionId } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    // 1. Verify Credentials
    const isValid = verifyAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // 2. Generate cryptographically signed Admin Session Token
    const token = createAdminSessionToken(username);
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: { username, role: 'admin' },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set client-readable indicator cookie for immediate client-side tracking exclusion
    response.cookies.set({
      name: 'dormie_role',
      value: 'admin',
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    // 3. Best-effort side-effects: Admin exclusion registration & Audit logging
    // Isolated in non-blocking try-catch so telemetry issues NEVER prevent admin login
    try {
      if (sessionId && typeof sessionId === 'string') {
        await registerAdminIdentifier('session_id', sessionId);
      }
      await logAdminAudit(username, 'LOGIN', {
        userAgent: request.headers.get('user-agent') || 'unknown',
        visitorId: visitorId || null,
        sessionId: sessionId || null,
      });
    } catch (telemetryErr) {
      console.warn('[Admin Login] Non-blocking telemetry warning:', telemetryErr);
    }

    return response;
  } catch (error) {
    console.error('[Admin Login Route Error]:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
