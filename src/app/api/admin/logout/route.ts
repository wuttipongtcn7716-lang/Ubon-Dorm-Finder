import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, parseCookies, verifyAdminSessionToken } from '@/lib/adminAuth';
import { logAdminAudit } from '@/lib/analyticsDb';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies[SESSION_COOKIE_NAME];
    const session = verifyAdminSessionToken(sessionToken);
    const adminUsername = session?.username || 'admin';

    // Log admin audit action (Requirement 14)
    logAdminAudit(adminUsername, 'LOGOUT');
  } catch (e) {}

  const response = NextResponse.json({
    success: true,
    message: 'ออกจากระบบเรียบร้อยแล้ว',
  });

  // Clear HTTP-only session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // Clear client role cookie
  response.cookies.set({
    name: 'dormie_role',
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
