import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';
import { registerAdminIdentifier } from '@/lib/analyticsDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  const authenticated = isRequestAdminAuthenticated(request);
  if (authenticated) {
    const reqSes = request.headers.get('x-session-id');
    if (reqSes) await registerAdminIdentifier('session_id', reqSes);
  }
  return NextResponse.json(
    { authenticated },
    {
      headers: NO_CACHE_HEADERS,
    }
  );
}
