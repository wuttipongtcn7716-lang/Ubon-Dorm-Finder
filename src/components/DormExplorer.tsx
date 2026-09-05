'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dormitory, FilterState } from '@/types/dormitory';
import DormFilter from './DormFilter';
import DormCard from './DormCard';
import DormCardSkeleton from './DormCardSkeleton';
import DormEmptyState from './DormEmptyState';
import NavigationModal from './NavigationModal';
import { Sparkles, Compass, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useDormFiltersSync } from '@/hooks/useDormFiltersSync';

interface DormExplorerProps {
  initialDorms: Dormitory[];
}

export default function DormExplorer({ initialDorms }: DormExplorerProps) {
  const { filters, setFilters, resetFilters } = useDormFiltersSync();
  const [navigatingDorm, setNavigatingDorm] = useState<Dormitory | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const { isFavorite, toggleFavorite, count: favoritesCount } = useFavorites();
  const [isSaved, setIsSaved] = useState<boolean | null>(null);

  const [showOnlySaved, setShowOnlySaved] = useState<boolean>(false);

  const handleToggleFavorite = (dormId: number) => {
    const isNowSaved = !isFavorite(dormId);
    toggleFavorite(dormId);
    setIsSaved(isNowSaved);
  };

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const uniqueZones = useMemo(() => {
    const set = new Set<string>();
    initialDorms.forEach((d) => {
      if (d.zone) set.add(d.zone);
    });
    return Array.from(set);
  }, [initialDorms]);

  const filteredDorms = useMemo(() => {
    if (!initialDorms || !Array.isArray(initialDorms)) return [];
    const f = filters || {
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

    return initialDorms.filter((d) => {
      if (!d) return false;
      // Item 5: showOnlySaved ทำงานอิสระจากการรีเซ็ตตัวกรองหลัก
      if ((showOnlySaved || f.onlySavedOnly) && !isFavorite(d.id)) {
        return false;
      }

      if (f.searchTerm) {
        const query = f.searchTerm.toLowerCase();
        const matchesName = (d.name || '').toLowerCase().includes(query);
        const matchesZone = (d.zone || '').toLowerCase().includes(query);
        const matchesPhone = (d.phone || '').includes(query);
        const matchesRemarks = (d.remarks || '').toLowerCase().includes(query);
        if (!matchesName && !matchesZone && !matchesPhone && !matchesRemarks) return false;
      }

      if (f.zone !== 'all' && d.zone !== f.zone) {
        return false;
      }

      const dormMinPrice = d.minPrice ?? 0;
      if (dormMinPrice > (f.maxPrice ?? 10000)) {
        return false;
      }

      if (f.genderType !== 'all') {
        const rawType = (d.genderType || '').trim();
        let mappedGender = 'mixed';
        if (rawType === 'หอหญิง' || rawType === 'หอพักหญิง' || rawType === 'female') {
          mappedGender = 'female';
        } else if (rawType === 'หอชาย' || rawType === 'หอพักชาย' || rawType === 'male') {
          mappedGender = 'male';
        } else if (rawType === 'หอพักรวม' || rawType === 'mixed') {
          mappedGender = 'mixed';
        }
        if (mappedGender !== f.genderType) return false;
      }

      if (f.roomType !== 'all') {
        const rType = d.roomType || d.type || '';
        if (f.roomType === 'air' && !rType.includes('แอร์')) return false;
        if (f.roomType === 'fan' && !rType.includes('พัดลม')) return false;
      }

      if (f.onlyPetAllowed && !d.allowPet) return false;
      if (f.requireParking && !d.parking) return false;
      if (f.noFloodRiskOnly && d.floodRisk) return false;

      const isWhite = Boolean(d.isWhiteDorm || d.status === 'ผ่าน' || d.evalResult === 'ผ่าน');
      if (f.isWhiteDormOnly && !isWhite) return false;

      return true;
    });
  }, [initialDorms, filters, isFavorite, showOnlySaved]);

  const isFirstRender = useRef(true);
  const hasRestoredScroll = useRef(false);

  const [visibleCount, setVisibleCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('dorm_last_viewed_id');
      if (savedId) {
        const idNum = parseInt(savedId, 10);
        const idx = initialDorms.findIndex((d) => d.id === idNum);
        if (idx >= 0) {
          return Math.min(initialDorms.length, Math.max(12, Math.ceil((idx + 1) / 12) * 12));
        }
      }
    }
    return 12;
  });

  // รีเซ็ตการแบ่งหน้าเมื่อผู้ใช้เปลี่ยนเงื่อนไขตัวกรอง (ข้ามรอบแรกเพื่อคงค่า visibleCount สำหรับ scroll restoration)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVisibleCount(12);
  }, [filters]);

  // ระบบ Scroll Restoration: เลื่อนกลับมาตำแหน่งเดิมของการ์ดหอพักที่เพิ่งกดดูเมื่อย้อนกลับมาหน้าหลัก
  useEffect(() => {
    if (!isClientLoaded || hasRestoredScroll.current) return;

    const savedId = typeof window !== 'undefined' ? sessionStorage.getItem('dorm_last_viewed_id') : null;
    const savedScroll = typeof window !== 'undefined' ? sessionStorage.getItem('dorm_home_scroll_pos') : null;

    if (!savedId && !savedScroll) {
      hasRestoredScroll.current = true;
      return;
    }

    // ป้องกันการเด้งไปบนสุดทันทีด้วย instant scroll หากมีตำแหน่งเดิมบันทึกไว้
    if (savedScroll && window.scrollY === 0) {
      const top = parseInt(savedScroll, 10);
      if (!isNaN(top)) {
        window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
      }
    }

    // ตรวจสอบว่าการ์ดที่เพิ่งดูอยู่ใน filteredDorms หรือไม่ และขยาย visibleCount ให้ครอบคลุมการ์ดนั้น
    if (savedId) {
      const idNum = parseInt(savedId, 10);
      const dormIdx = filteredDorms.findIndex((d) => d.id === idNum);
      if (dormIdx >= 0 && dormIdx >= visibleCount) {
        const needed = Math.min(filteredDorms.length, Math.ceil((dormIdx + 1) / 12) * 12);
        setVisibleCount(needed);
        // รอให้ state visibleCount ปรับและเรนเดอร์การ์ดลง DOM ในรอบถัดไปก่อนเลื่อน
        return;
      }
    }

    // เมื่อการ์ดถูกเรนเดอร์ลงใน DOM แน่นอนแล้ว ให้เลื่อนตำแหน่งไปยังการ์ดดังกล่าวทันที (ใช้ auto เพื่อไม่ให้กระตุกหรือลื่นหลุดบน Tablet/iPad)
    const timer = setTimeout(() => {
      let scrolled = false;

      if (savedId) {
        const targetElement = document.getElementById(`dorm-card-${savedId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
          targetElement.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2', 'transition-all', 'duration-300');
          setTimeout(() => {
            targetElement.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2');
          }, 1500);
          scrolled = true;
        }
      }

      if (!scrolled && savedScroll) {
        const top = parseInt(savedScroll, 10);
        if (!isNaN(top)) {
          window.scrollTo({ top, behavior: 'auto' });
        }
      }

      hasRestoredScroll.current = true;
      sessionStorage.removeItem('dorm_last_viewed_id');
      sessionStorage.removeItem('dorm_home_scroll_pos');
    }, 80);

    return () => clearTimeout(timer);
  }, [isClientLoaded, filteredDorms, visibleCount]);

  const displayedDorms = useMemo(() => {
    return filteredDorms.slice(0, visibleCount);
  }, [filteredDorms, visibleCount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Search & Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a1931] via-[#102a5c] to-[#0a1931] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-900/50">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl md:max-w-3xl lg:max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/80 text-amber-300 text-xs font-bold border border-amber-400/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>มาตรฐานหอพักสีขาว มหาวิทยาลัยอุบลราชธานี ปี 2569</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            ค้นหาหอพัก ม.อุบลฯ
            <span className="text-amber-400 block sm:inline sm:ml-2">พร้อมระบบนำทาง</span>
          </h1>

          <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
            สำรวจหอพัก 60 แห่งรอบรั้วมหาวิทยาลัย พร้อมเปรียบเทียบระยะทางไปยังสถานที่สำคัญ และเส้นทางนำทางแบบ<span className="whitespace-nowrap">เรียลไทม์</span>
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <DormFilter
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        showOnlySaved={showOnlySaved}
        onToggleShowSaved={() => setShowOnlySaved((prev) => !prev)}
        zones={uniqueZones}
        totalResults={filteredDorms.length}
        favoritesCount={favoritesCount}
      />

      {/* Disclaimer Banner */}
      <div 
        className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-2xs font-sans"
        style={{ animation: 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      >
        <span className="text-lg flex-shrink-0 mt-0.5">📌</span>
        <div className="text-xs sm:text-sm text-blue-950 font-bold leading-relaxed">
          <span className="font-extrabold text-blue-900">หมายเหตุ: </span>
          แพลตฟอร์มนี้จัดทำขึ้นเพื่อรวบรวมข้อมูลหอพักเครือข่ายมหาวิทยาลัยอุบลราชธานี จำนวน 60 แห่ง โดยให้บริการข้อมูลพื้นฐานและแนะนำเส้นทาง ทั้งนี้ ระบบไม่ครอบคลุมถึงการเช็คสถานะห้องว่างแบบเรียลไทม์ หรือการจัดการค่าน้ำ-ค่าไฟ
        </div>
      </div>

      {/* Result Count Status Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-800">
            พบหอพักทั้งหมด {filteredDorms.length} แห่ง
          </h2>
          {(showOnlySaved || filters.onlySavedOnly) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              <Heart className="w-3 h-3 fill-rose-600 text-rose-600" /> ที่บันทึกไว้
            </span>
          )}
        </div>
      </div>

      {/* Dormitory Card Grid */}
      {!isClientLoaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <DormCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredDorms.length === 0 ? (
        <DormEmptyState
          onReset={resetFilters}
          searchTerm={filters.searchTerm}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in duration-200">
            {displayedDorms.map((dorm) => (
              <DormCard
                key={dorm.id}
                dorm={dorm}
                onNavigate={(d) => setNavigatingDorm(d)}
                isFavorite={isFavorite(dorm.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* ปุ่มโหลดเพิ่มเติมเพื่อลดภาระ Network Request ภาพพร้อมกัน 60 แห่ง */}
          {filteredDorms.length > visibleCount && (
            <div className="flex flex-col items-center justify-center pt-4 pb-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredDorms.length))}
                className="px-6 py-3 rounded-2xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 border border-blue-800/60 active:scale-95 cursor-pointer"
              >
                <span>แสดงหอพักเพิ่มเติม (เหลืออีก {filteredDorms.length - visibleCount} แห่ง)</span>
              </button>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                กำลังแสดง {displayedDorms.length} จากทั้งหมด {filteredDorms.length} แห่ง
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Map Modal */}
      {navigatingDorm && (
        <NavigationModal
          dorm={navigatingDorm}
          onClose={() => setNavigatingDorm(null)}
        />
      )}

      {/* Screen Reader Announcement Region for Accessibility M-01 */}
      <div aria-live="polite" className="sr-only">
        {isSaved ? 'บันทึกการ์ดเรียบร้อยแล้ว' : 'ยกเลิกการบันทึกการ์ดแล้ว'}
      </div>
    </div>
  );
}