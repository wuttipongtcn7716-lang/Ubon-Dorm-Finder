'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/utils/analytics';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track public pages, do not track admin pages as public page views
    if (pathname && !pathname.startsWith('/admin')) {
      if (lastTrackedPath.current !== pathname) {
        lastTrackedPath.current = pathname;
        trackPageView(pathname);
      }
    }
  }, [pathname]);

  return null;
}
