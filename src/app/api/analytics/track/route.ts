import { NextResponse } from 'next/server';
import { recordEvent, AnalyticsEventType } from '@/lib/analyticsDb';

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

    const { 
      eventName, 
      sessionId, 
      visitorId, 
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

    recordEvent({
      eventName,
      sessionId: String(sessionId).slice(0, 64),
      visitorId: String(visitorId).slice(0, 64),
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
