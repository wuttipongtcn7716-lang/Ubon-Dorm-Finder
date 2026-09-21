'use client';

/**
 * Dormie UBU Lightweight & Privacy-First Client Analytics
 * PDPA Compliant: ไม่เก็บ IP, ไม่เก็บรหัสผ่าน, ไม่เก็บข้อมูลส่วนบุคคล
 * Asynchronous & Non-blocking: ไม่ทำให้ UI หน่วงหรือแอปขัดข้องหาก API ล้มเหลว
 */

export type TrackableEvent = 
  | 'page_view' 
  | 'search' 
  | 'dormitory_view' 
  | 'map_click' 
  | 'navigation_click';

export interface EventPayload {
  page?: string;
  dormitoryId?: number;
  dormitoryName?: string;
  searchKeyword?: string;
  metadata?: Record<string, any>;
}

const VISITOR_STORAGE_KEY = 'dormie_visitor_id';
const SESSION_STORAGE_KEY = 'dormie_session_id';

/**
 * Generate a random UUID-like anonymous string without crypto dependency
 */
function generateAnonymousId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Get or create persistent Anonymous Visitor ID (stored in localStorage)
 * Used to calculate Unique Visitors accurately without tracking personal identity.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  try {
    let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid = generateAnonymousId('v');
      localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch (e) {
    return generateAnonymousId('v_temp');
  }
}

/**
 * Get or create Anonymous Session ID (stored in sessionStorage)
 * Used to identify single browsing sessions.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = generateAnonymousId('s');
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch (e) {
    return generateAnonymousId('s_temp');
  }
}

/**
 * Reset Anonymous Session ID (e.g. upon Admin logout)
 * Generates a brand new session ID and persists it in sessionStorage.
 */
export function resetSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    const newSid = generateAnonymousId('s');
    sessionStorage.setItem(SESSION_STORAGE_KEY, newSid);
    return newSid;
  } catch (e) {
    return generateAnonymousId('s_temp');
  }
}

/**
 * Check if current user is an authenticated Admin.
 * Admin sessions are strictly excluded from all user analytics tracking (Requirement 11, 12, 13).
 */
export function isAdminUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Any page inside /admin path
    if (window.location.pathname.startsWith('/admin')) {
      return true;
    }
    // 2. Client cookies check
    const cookie = document.cookie || '';
    if (
      cookie.split(';').some((c) => {
        const trimmed = c.trim();
        return (
          trimmed.startsWith('dormie_role=admin') ||
          trimmed.startsWith('admin_session=')
        );
      })
    ) {
      return true;
    }
    // 3. Client-side admin session flag
    if (
      sessionStorage.getItem('dormie_admin_active') === '1' ||
      sessionStorage.getItem('dormie_is_admin') === 'true'
    ) {
      return true;
    }
  } catch (e) {}
  return false;
}

/**
 * Main reusable tracking function.
 * Completely asynchronous and fail-safe (never crashes caller).
 * Strictly excludes administrative users.
 */
export function trackEvent(eventName: TrackableEvent, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;

  // Strict Admin Exclusion (Requirement 11, 12, 13)
  // Admin actions (browsing, searching, viewing dorms) are NEVER recorded into user analytics
  if (isAdminUser()) {
    return;
  }

  try {
    const data = {
      eventName,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      actorType: 'anonymous',
      userId: null,
      page: payload.page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      dormitoryId: payload.dormitoryId || null,
      dormitoryName: payload.dormitoryName || null,
      searchKeyword: payload.searchKeyword ? payload.searchKeyword.trim() : null,
      metadata: payload.metadata || null,
      createdAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data);

    // Send event asynchronously with keepalive and credentials
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: jsonString,
      keepalive: true,
    }).catch(() => {
      // Fallback to sendBeacon if fetch fails during unload
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([jsonString], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics/track', blob);
        }
      } catch {}
    });
  } catch (err) {
    // Silent fail-safe: never crash UI
  }
}

// -------------------------------------------------------------
// Specialized Helper Functions
// -------------------------------------------------------------

/**
 * Track Page View event
 */
export function trackPageView(pagePath?: string): void {
  trackEvent('page_view', {
    page: pagePath || (typeof window !== 'undefined' ? window.location.pathname : '/'),
  });
}

/**
 * Track Confirmed Search Event.
 * Strictly called ONLY when the user explicitly submits a search (e.g. presses Enter or clicks the Search button).
 * Keystrokes, debounced typing, and empty queries are strictly prohibited from tracking.
 * Includes deduplication to prevent duplicate events on rapid Enter / Search clicks (2s window).
 */
let lastTrackedSearch: { keyword: string; timestamp: number } = { keyword: '', timestamp: 0 };

export function trackConfirmedSearch(keyword: string): void {
  const trimmed = (keyword || '').trim();
  if (!trimmed) return;

  const now = Date.now();
  // Prevent duplicate submissions within 2 seconds for identical keyword
  if (
    trimmed.toLowerCase() === lastTrackedSearch.keyword.toLowerCase() &&
    now - lastTrackedSearch.timestamp < 2000
  ) {
    return;
  }

  lastTrackedSearch = { keyword: trimmed, timestamp: now };
  trackEvent('search', {
    searchKeyword: trimmed,
  });
}

/**
 * Backward compatibility alias for trackSearch -> forwards directly to trackConfirmedSearch
 */
export function trackSearch(keyword: string): void {
  trackConfirmedSearch(keyword);
}

/**
 * Track Dormitory View event (when user opens dormitory details)
 */
export function trackDormitoryView(dormitoryId: number, dormitoryName: string): void {
  trackEvent('dormitory_view', {
    dormitoryId,
    dormitoryName,
    page: `/dorm/${dormitoryId}`,
  });
}

/**
 * Track Map Click event (when user opens map or clicks a pin)
 */
export function trackMapClick(dormitoryId?: number, dormitoryName?: string): void {
  trackEvent('map_click', {
    dormitoryId,
    dormitoryName,
  });
}

/**
 * Track Navigation Click event (when user starts GPS navigation)
 */
export function trackNavigationClick(dormitoryId?: number, dormitoryName?: string): void {
  trackEvent('navigation_click', {
    dormitoryId,
    dormitoryName,
  });
}
