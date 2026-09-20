import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';

export async function GET(request: Request) {
  const authenticated = isRequestAdminAuthenticated(request);
  return NextResponse.json({ authenticated });
}
