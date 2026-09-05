'use client';

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, 
  Wind, X, Dog, Car, Waves, Fan, Users, Heart, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { FilterState } from '@/types/dormitory';

interface DormFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters?: () => void;
  showOnlySaved?: boolean;
  onToggleShowSaved?: () => void;
  zones: string[];
  totalResults: number;
  favoritesCount?: number;
}

export default function DormFilter({
  filters,
  onFilterChange,
  onResetFilters,
  showOnlySaved = false,
  onToggleShowSaved,
  zones = [],
  totalResults = 0,
  favoritesCount = 0,
}: DormFilterProps) {
  const safeFilters = filters || {
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

  const hasActiveQuickFilters = 
    (safeFilters.roomType || 'all') !== 'all' ||
    Boolean(safeFilters.onlyPetAllowed) ||
    Boolean(safeFilters.requireParking) ||
    Boolean(safeFilters.noFloodRiskOnly);

  const hasAdvancedFilters = 
    (safeFilters.maxPrice ?? 10000) < 10000 || 
    (safeFilters.genderType || 'all') !== 'all';

  const hasActiveFilters = 
    (safeFilters.searchTerm || '') !== '' ||
    (safeFilters.zone || 'all') !== 'all' ||
    hasActiveQuickFilters ||
    hasAdvancedFilters;

  // Collapsible state: Hidden by default as requested in Item 1
  const [isOpenFilters, setIsOpenFilters] = useState(hasActiveQuickFilters || hasAdvancedFilters);

  // Auto-expand if active filters arrive (e.g. from URL search params)
  React.useEffect(() => {
    if (hasActiveQuickFilters || hasAdvancedFilters) {
      setIsOpenFilters(true);
    }
  }, [hasActiveQuickFilters, hasAdvancedFilters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange?.({
      ...safeFilters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onFilterChange?.({
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
    }
  };

  // Active filter count for badge display on the toggle button
  const activeCount = [
    (safeFilters.roomType || 'all') !== 'all',
    Boolean(safeFilters.onlyPetAllowed),
    Boolean(safeFilters.requireParking),
    Boolean(safeFilters.noFloodRiskOnly),
    (safeFilters.maxPrice ?? 10000) < 10000,
    (safeFilters.genderType || 'all') !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3.5">
      {/* Top Search Bar & Main Action Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search input with Accessibility M-01 Standards */}
        <div className="relative flex-1 min-w-0">
          <label htmlFor="dorm-search-input" className="sr-only">
            ค้นหาชื่อหอพัก โซน หรือทำเลใกล้เคียง
          </label>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="dorm-search-input"
            name="searchTerm"
            type="text"
            value={safeFilters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            placeholder="ค้นหาชื่อหอพัก, โซน หรือทำเลใกล้เคียง..."
            aria-label="ค้นหาชื่อหอพัก โซน หรือทำเลใกล้เคียง"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
          />
          {safeFilters.searchTerm && (
            <button
              type="button"
              onClick={() => updateFilter('searchTerm', '')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Zone Dropdown */}
        <div className="w-full sm:w-48 flex-shrink-0">
          <label htmlFor="dorm-zone-select" className="sr-only">
            เลือกโซน
          </label>
          <select
            id="dorm-zone-select"
            name="zone"
            value={safeFilters.zone}
            onChange={(e) => updateFilter('zone', e.target.value)}
            aria-label="เลือกโซน"
            className="w-full px-3.5 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-blue-950 transition"
          >
            <option value="all">📍 ทุกโซนรอบ ม.อุบลฯ</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Item 5: แยกปุ่ม "หอพักที่บันทึกไว้" ออกจากตัวกรองอย่างอิสระ */}
          {onToggleShowSaved && (
            <button
              type="button"
              onClick={onToggleShowSaved}
              aria-pressed={showOnlySaved}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex-shrink-0 active:scale-95 border cursor-pointer ${
                showOnlySaved
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-rose-50/80 border-rose-200/80 text-rose-700 hover:bg-rose-100/90'
              }`}
              title="แสดงเฉพาะหอพักที่บันทึกไว้ (ทำงานอิสระจากตัวกรองหลัก)"
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${showOnlySaved ? 'fill-white' : 'fill-rose-500'}`} />
              <span>ที่บันทึกไว้</span>
              {favoritesCount > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${showOnlySaved ? 'bg-white text-rose-600' : 'bg-rose-200 text-rose-800'}`}>
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Item 1: ปุ่มเปิด/พับเก็บตัวกรอง (Collapsible Toggle Button) */}
          <button
            type="button"
            onClick={() => setIsOpenFilters(!isOpenFilters)}
            aria-expanded={isOpenFilters}
            className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition flex-shrink-0 active:scale-95 cursor-pointer ${
              isOpenFilters || activeCount > 0
                ? 'bg-[#0a1931] border-[#0a1931] text-amber-300 shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>ตัวกรอง</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-blue-950 text-[10px] font-black flex items-center justify-center">
                {activeCount}
              </span>
            )}
            {isOpenFilters ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Item 1: แผงพับเก็บตัวกรองด่วนและตัวกรองละเอียด (Collapsible Filter Panel) */}
      {isOpenFilters && (
        <div className="pt-3 border-t border-slate-100 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 1.1 แท็กตัวกรองด่วน (Quick Filter Chips) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">ตัวกรองด่วน:</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              {/* Room Type: Air */}
              <button
                type="button"
                onClick={() => updateFilter('roomType', safeFilters.roomType === 'air' ? 'all' : 'air')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 cursor-pointer ${
                  safeFilters.roomType === 'air'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Wind className="w-3.5 h-3.5 text-blue-500" />
                <span>ห้องแอร์</span>
              </button>

              {/* Room Type: Fan */}
              <button
                type="button"
                onClick={() => updateFilter('roomType', safeFilters.roomType === 'fan' ? 'all' : 'fan')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 cursor-pointer ${
                  safeFilters.roomType === 'fan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Fan className="w-3.5 h-3.5 text-amber-500" />
                <span>ห้องพัดลม</span>
              </button>

              {/* Pet Allowed */}
              <button
                type="button"
                onClick={() => updateFilter('onlyPetAllowed', !safeFilters.onlyPetAllowed)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 cursor-pointer ${
                  safeFilters.onlyPetAllowed
                    ? 'bg-blue-950 text-amber-300 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Dog className="w-3.5 h-3.5 text-amber-500" />
                <span>เลี้ยงสัตว์ได้</span>
              </button>

              {/* Parking */}
              <button
                type="button"
                onClick={() => updateFilter('requireParking', !safeFilters.requireParking)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 cursor-pointer ${
                  safeFilters.requireParking
                    ? 'bg-blue-950 text-amber-300 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-blue-500" />
                <span>ที่จอดรถ</span>
              </button>

              {/* No Flood */}
              <button
                type="button"
                onClick={() => updateFilter('noFloodRiskOnly', !safeFilters.noFloodRiskOnly)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 cursor-pointer ${
                  safeFilters.noFloodRiskOnly
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-cyan-600" />
                <span>ไม่เสี่ยงน้ำท่วม</span>
              </button>
            </div>
          </div>

          {/* 1.2 ตัวกรองราคาและประเภทผู้พักอาศัย */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            {/* Price Range Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>งบประมาณสูงสุด / เดือน:</span>
                <span className="text-amber-600 font-black text-sm">
                  {(safeFilters.maxPrice ?? 10000) >= 10000 ? 'ไม่จำกัด' : `฿${(safeFilters.maxPrice ?? 10000).toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="10000"
                step="200"
                value={safeFilters.maxPrice ?? 10000}
                onChange={(e) => updateFilter('maxPrice', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>฿1,500</span>
                <span>฿5,000</span>
                <span>ไม่จำกัด</span>
              </div>
            </div>

            {/* Gender Filter */}
            <div className="space-y-1.5">
              <label htmlFor="genderFilter" className="text-slate-700 font-bold flex items-center gap-1 cursor-pointer">
                <Users className="w-3.5 h-3.5 text-blue-900" />
                <span>ประเภทผู้พักอาศัย:</span>
              </label>
              <select
                id="genderFilter"
                name="genderType"
                aria-label="ประเภทผู้พักอาศัย"
                value={safeFilters.genderType || 'all'}
                onChange={(e) => updateFilter('genderType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold text-slate-800"
              >
                <option value="all">ทั้งหมด</option>
                <option value="female">หอพักหญิง</option>
                <option value="male">หอพักชาย</option>
                <option value="mixed">หอพักรวม</option>
              </select>
            </div>

            {/* Total Matching Badge */}
            <div className="flex items-center justify-between sm:justify-end sm:col-span-1 md:col-span-1 pt-1 sm:pt-0">
              <div className="p-2.5 bg-blue-50/80 border border-blue-200/70 rounded-2xl text-center w-full">
                <span className="text-[11px] text-blue-900 font-semibold block">พบหอพักที่ตรงเงื่อนไข</span>
                <span className="text-lg font-black text-amber-600">{totalResults}</span>
                <span className="text-[11px] text-blue-900 font-semibold"> แห่ง</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

