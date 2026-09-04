'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FilterState } from '@/types/dormitory';

export const DEFAULT_FILTERS: FilterState = {
  searchTerm: '',
  zone: 'all',
  maxPrice: 10000,
  genderType: 'all',
  roomType: 'all',
  onlyPetAllowed: false,
  requireParking: false,
  noFloodRiskOnly: false,
  isWhiteDormOnly: false,
  onlySavedOnly: false,
};

/**
 * ตรวจสอบความเท่ากันของ FilterState 2 อ็อบเจกต์ (ป้องกัน Infinite Loop จาก URL string mismatch)
 */
export function areFiltersEqual(a: FilterState, b: FilterState): boolean {
  if (!a || !b) return false;
  return (
    (a.searchTerm || '').trim() === (b.searchTerm || '').trim() &&
    a.zone === b.zone &&
    a.maxPrice === b.maxPrice &&
    a.genderType === b.genderType &&
    a.roomType === b.roomType &&
    Boolean(a.onlyPetAllowed) === Boolean(b.onlyPetAllowed) &&
    Boolean(a.requireParking) === Boolean(b.requireParking) &&
    Boolean(a.noFloodRiskOnly) === Boolean(b.noFloodRiskOnly) &&
    Boolean(a.isWhiteDormOnly) === Boolean(b.isWhiteDormOnly) &&
    Boolean(a.onlySavedOnly) === Boolean(b.onlySavedOnly)
  );
}

/**
 * แปลง URL Search Parameters ให้เป็น FilterState อย่างปลอดภัย (ไม่เกิด runtime error)
 */
export function parseFiltersFromParams(
  params: URLSearchParams | { get: (key: string) => string | null } | null
): FilterState {
  if (!params) return { ...DEFAULT_FILTERS };

  try {
    const searchTerm = params.get('search') || params.get('searchTerm') || params.get('q') || '';
    const zone = params.get('zone') || 'all';

    const rawGender = params.get('gender') || params.get('genderType') || 'all';
    const genderType = ['female', 'male', 'mixed'].includes(rawGender) ? rawGender : 'all';

    const rawRoom = params.get('roomType') || 'all';
    const roomType = ['air', 'fan'].includes(rawRoom) ? rawRoom : 'all';

    const maxPriceParam = params.get('maxPrice');
    let maxPrice = 10000;
    if (maxPriceParam) {
      const parsed = parseInt(maxPriceParam, 10);
      if (!isNaN(parsed) && parsed >= 1500 && parsed <= 10000) {
        maxPrice = parsed;
      }
    }

    const onlyPetAllowed = params.get('pet') === 'true' || params.get('onlyPetAllowed') === 'true';
    const requireParking = params.get('parking') === 'true' || params.get('requireParking') === 'true';
    const noFloodRiskOnly = params.get('noFlood') === 'true' || params.get('noFloodRiskOnly') === 'true';
    const isWhiteDormOnly =
      params.get('white') === 'true' ||
      params.get('whiteOnly') === 'true' ||
      params.get('isWhiteDormOnly') === 'true';
    const onlySavedOnly = params.get('saved') === 'true' || params.get('onlySavedOnly') === 'true';

    return {
      searchTerm,
      zone,
      maxPrice,
      genderType,
      roomType,
      onlyPetAllowed,
      requireParking,
      noFloodRiskOnly,
      isWhiteDormOnly,
      onlySavedOnly,
    };
  } catch (err) {
    console.warn('Error parsing filters from params:', err);
    return { ...DEFAULT_FILTERS };
  }
}

/**
 * สร้าง Query String จาก FilterState โดยละเว้นค่าเริ่มต้นเพื่อความสะอาดของ URL
 */
export function buildQueryStringFromFilters(f: FilterState): string {
  if (!f) return '';

  try {
    const params = new URLSearchParams();

    if (f.searchTerm && f.searchTerm.trim()) {
      params.set('search', f.searchTerm.trim());
    }
    if (f.zone && f.zone !== 'all') {
      params.set('zone', f.zone);
    }
    if (f.genderType && f.genderType !== 'all') {
      params.set('gender', f.genderType);
    }
    if (f.roomType && f.roomType !== 'all') {
      params.set('roomType', f.roomType);
    }
    if (f.maxPrice && f.maxPrice < 10000) {
      params.set('maxPrice', f.maxPrice.toString());
    }
    if (f.onlyPetAllowed) {
      params.set('pet', 'true');
    }
    if (f.requireParking) {
      params.set('parking', 'true');
    }
    if (f.noFloodRiskOnly) {
      params.set('noFlood', 'true');
    }
    if (f.isWhiteDormOnly) {
      params.set('white', 'true');
    }
    if (f.onlySavedOnly) {
      params.set('saved', 'true');
    }

    return params.toString();
  } catch (err) {
    console.warn('Error building query string from filters:', err);
    return '';
  }
}

/**
 * Custom Hook สำหรับเชื่อมโยง FilterState เข้ากับ URL Query Parameters
 * - ป้องกัน Infinite Loop ด้วย areFiltersEqual
 * - ป้องกันค่า null/undefined จาก useSearchParams และ usePathname
 * - ป้องกัน Error จาก router.replace ด้วย try-catch
 */
export function useDormFiltersSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ป้องกันค่าเริ่มต้นกรณี searchParams หรือ SSR ยังไม่พร้อม
  const getInitialFilters = (): FilterState => {
    if (searchParams) {
      return parseFiltersFromParams(searchParams);
    }
    if (typeof window !== 'undefined' && window.location.search) {
      return parseFiltersFromParams(new URLSearchParams(window.location.search));
    }
    return { ...DEFAULT_FILTERS };
  };

  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  const lastSyncedFilters = useRef<FilterState>(filters);
  const isFirstRender = useRef(true);

  // ดักจับกรณี Client Mount ครั้งแรก หาก SSR ยังไม่ได้อ่าน search
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const urlFilters = parseFiltersFromParams(new URLSearchParams(window.location.search));
      if (!areFiltersEqual(urlFilters, filters)) {
        setFilters(urlFilters);
        lastSyncedFilters.current = urlFilters;
      }
    }
  }, []);

  // ซิงค์จาก URL กลับมายัง filters เมื่อผู้ใช้กด Back / Forward
  useEffect(() => {
    if (!searchParams) return;
    const urlFilters = parseFiltersFromParams(searchParams);
    // ตรวจสอบความเท่ากันของ FilterState แทนการเทียบ string ป้องกัน false positive & infinite loop
    if (!isFirstRender.current && !areFiltersEqual(urlFilters, lastSyncedFilters.current)) {
      lastSyncedFilters.current = urlFilters;
      setFilters(urlFilters);
    }
  }, [searchParams]);

  // ซิงค์จาก filters ไปยัง URL Query Parameters แบบ Debounce (200ms)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // ถ้าค่า filters ไม่ได้เปลี่ยนจริง ไม่ต้องเรียก router.replace
    if (areFiltersEqual(filters, lastSyncedFilters.current)) {
      return;
    }

    const timer = setTimeout(() => {
      lastSyncedFilters.current = filters;
      const newQuery = buildQueryStringFromFilters(filters);
      const targetPath = pathname || '/';
      const newUrl = newQuery ? `${targetPath}?${newQuery}` : targetPath;

      try {
        router.replace(newUrl, { scroll: false });
      } catch (err) {
        console.warn('router.replace navigation error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [filters, pathname, router]);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    lastSyncedFilters.current = { ...DEFAULT_FILTERS };
    const targetPath = pathname || '/';
    try {
      router.replace(targetPath, { scroll: false });
    } catch (err) {
      console.warn('router.replace reset error:', err);
    }
  }, [pathname, router]);

  return {
    filters,
    setFilters,
    resetFilters,
  };
}
