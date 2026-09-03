'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, FilterState } from '@/types/dormitory';
import DormFilter from './DormFilter';
import DormCard from './DormCard';
import DormCardSkeleton from './DormCardSkeleton';
import DormEmptyState from './DormEmptyState';
import NavigationModal from './NavigationModal';
import { Sparkles, Compass, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface DormExplorerProps {
  initialDorms: Dormitory[];
}

export default function DormExplorer({ initialDorms }: DormExplorerProps) {
  const [navigatingDorm, setNavigatingDorm] = useState<Dormitory | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const { isFavorite, toggleFavorite, count: favoritesCount } = useFavorites();

  useEffect(() => {
    setIsClientLoaded(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('white') === 'true' || params.get('whiteOnly') === 'true') {
        setFilters((prev) => ({ ...prev, isWhiteDormOnly: true }));
      }
    }
  }, []);

  const [filters, setFilters] = useState<FilterState>({
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
  });

  const handleResetFilters = () => {
    setFilters({
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
    });
  };

  const uniqueZones = useMemo(() => {
    const set = new Set<string>();
    initialDorms.forEach((d) => {
      if (d.zone) set.add(d.zone);
    });
    return Array.from(set);
  }, [initialDorms]);

  const filteredDorms = useMemo(() => {
    return initialDorms.filter((d) => {
      if (filters.onlySavedOnly && !isFavorite(d.id)) {
        return false;
      }

      if (filters.searchTerm) {
        const query = filters.searchTerm.toLowerCase();
        const matchesName = (d.name || '').toLowerCase().includes(query);
        const matchesZone = (d.zone || '').toLowerCase().includes(query);
        const matchesPhone = (d.phone || '').includes(query);
        const matchesRemarks = (d.remarks || '').toLowerCase().includes(query);
        if (!matchesName && !matchesZone && !matchesPhone && !matchesRemarks) return false;
      }

      if (filters.zone !== 'all' && d.zone !== filters.zone) {
        return false;
      }

      const dormMinPrice = d.minPrice ?? 0;
      if (dormMinPrice > filters.maxPrice) {
        return false;
      }

      if (filters.genderType !== 'all') {
        const rawType = (d.genderType || '').trim();
        let mappedGender = 'mixed';
        if (rawType === 'หอหญิง' || rawType === 'หอพักหญิง' || rawType === 'female') {
          mappedGender = 'female';
        } else if (rawType === 'หอชาย' || rawType === 'หอพักชาย' || rawType === 'male') {
          mappedGender = 'male';
        } else if (rawType === 'หอพักรวม' || rawType === 'mixed') {
          mappedGender = 'mixed';
        }
        if (mappedGender !== filters.genderType) return false;
      }

      if (filters.roomType !== 'all') {
        const rType = d.roomType || d.type || '';
        if (filters.roomType === 'air' && !rType.includes('แอร์')) return false;
        if (filters.roomType === 'fan' && !rType.includes('พัดลม')) return false;
      }

      if (filters.onlyPetAllowed && !d.allowPet) return false;
      if (filters.requireParking && !d.parking) return false;
      if (filters.noFloodRiskOnly && d.floodRisk) return false;

      const isWhite = Boolean(d.isWhiteDorm || d.status === 'ผ่าน' || d.evalResult === 'ผ่าน');
      if (filters.isWhiteDormOnly && !isWhite) return false;

      return true;
    });
  }, [initialDorms, filters, isFavorite]);

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
          <span className="text-sm font-black text-slate-800">
            พบหอพักทั้งหมด {filteredDorms.length} แห่ง
          </span>
          {filters.onlySavedOnly && (
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
          onReset={handleResetFilters}
          searchTerm={filters.searchTerm}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in duration-200">
          {filteredDorms.map((dorm) => (
            <DormCard
              key={dorm.id}
              dorm={dorm}
              onNavigate={(d) => setNavigatingDorm(d)}
              isFavorite={isFavorite(dorm.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Navigation Map Modal */}
      {navigatingDorm && (
        <NavigationModal
          dorm={navigatingDorm}
          onClose={() => setNavigatingDorm(null)}
        />
      )}
    </div>
  );
}