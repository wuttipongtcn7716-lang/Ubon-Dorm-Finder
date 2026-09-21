import { NextResponse } from 'next/server';
import { recordEvent, AnalyticsEventType, isKnownAdminIdentifier, registerAdminIdentifier } from '@/lib/analyticsDb';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_EVENTS: Set<AnalyticsEventType> = new Set<AnalyticsEventType>([
  'page_view',
  'search',
  'dormitory_view',
  'map_click',
  'navigation_click'
]);

export async function POST(request: Request) {
  try {
    let body: any = null;
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      try {
        body = await request.json();
      } catch {}
    }

    // 1. Strict Admin Exclusion via Session Token or Admin Cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const isAdminAuth = isRequestAdminAuthenticated(request);
    const hasAdminCookie = cookieHeader.includes('dormie_role=admin') || cookieHeader.includes('admin_session=');

    if (isAdminAuth || hasAdminCookie) {
      if (body?.sessionId) registerAdminIdentifier('session_id', body.sessionId);
      return NextResponse.json({ ok: true, skipped: 'admin' });
    }

    // 2. Exclude if body explicitly flags admin / system actor
    if (body?.actorType === 'admin' || body?.actorType === 'system' || body?.role === 'admin' || body?.isAdmin) {
      return NextResponse.json({ ok: true, skipped: 'admin' });
    }

    // 3. Exclude any events targeting admin paths (e.g. /admin, /admin/analytics, /admin/login)
    const targetPage = body?.page ? String(body.page) : '';
    if (targetPage.startsWith('/admin')) {
      return NextResponse.json({ ok: true, skipped: 'admin_path' });
    }

    // 4. Exclude if sessionId is a registered Admin session
    if (isKnownAdminIdentifier(undefined, body?.sessionId)) {
      return NextResponse.json({ ok: true, skipped: 'admin' });
    }

    const { 
      eventName, 
      sessionId, 
      visitorId, 
      actorType,
      userId, 
      page, 
      dormitoryId, 
      dormitoryName, 
      searchKeyword, 
      metadata,
      createdAt
    } = body || {};

    if (!eventName || !sessionId || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required tracking fields: eventName, sessionId, visitorId' },
        { status: 400 }
      );
    }

    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json(
        { error: 'Invalid eventName' },
        { status: 400 }
      );
    }

    if (eventName === 'search') {
      const trimmedKw = searchKeyword ? String(searchKeyword).trim() : '';
      if (!trimmedKw) {
        return NextResponse.json(
          { error: 'searchKeyword cannot be empty' },
          { status: 400 }
        );
      }
    }

    const effectiveActorType = actorType || (userId ? 'user' : 'anonymous');

    recordEvent({
      eventName,
      sessionId: String(sessionId).slice(0, 64),
      visitorId: String(visitorId).slice(0, 64),
      actorType: effectiveActorType,
      userId: userId ? String(userId).slice(0, 64) : null,
      page: page ? String(page).slice(0, 255) : null,
      dormitoryId: typeof dormitoryId === 'number' ? dormitoryId : null,
      dormitoryName: dormitoryName ? String(dormitoryName).slice(0, 150) : null,
      searchKeyword: searchKeyword ? String(searchKeyword).trim().slice(0, 255) : null,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : null,
      createdAt: createdAt || new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-blocking error response
    return NextResponse.json({ ok: false, error: 'Failed to record event' }, { status: 500 });
  }
}
