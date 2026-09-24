'use client';

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, 
  Wind, X, Dog, Car, Waves, Fan, Users, Heart, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { FilterState } from '@/types/dormitory';
import { trackConfirmedSearch } from '@/utils/analytics';
import { useLanguage } from '@/context/LanguageContext';
import { translateZone } from '@/utils/bilingualHelpers';

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
  const { t, isEn } = useLanguage();

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

  // Collapsible state: Strictly hidden by default as requested in Item 1
  const [isOpenFilters, setIsOpenFilters] = useState(false);

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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const trimmed = (safeFilters.searchTerm || '').trim();
    if (!trimmed) return;
    trackConfirmedSearch(trimmed);
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
      <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-2.5">
        {/* Search input with Accessibility M-01 Standards & Confirmed Search Action */}
        <form 
          onSubmit={handleSearchSubmit}
          className="relative flex-1 min-w-0 sm:min-w-[200px]"
          role="search"
          aria-label={t('filter.searchPlaceholder')}
        >
          <label htmlFor="dorm-search-input" className="sr-only">
            {t('filter.searchPlaceholder')}
          </label>
          
          {/* Interactive Search Submit Button */}
          <button
            type="submit"
            title={isEn ? "Search" : "กดเพื่อค้นหา"}
            aria-label={isEn ? "Search" : "ค้นหา"}
            className="w-8 h-8 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50/80 rounded-xl active:scale-95 transition cursor-pointer z-10 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>

          <input
            id="dorm-search-input"
            name="searchTerm"
            type="search"
            value={safeFilters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            aria-label={t('filter.searchPlaceholder')}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
          />
          {safeFilters.searchTerm && (
            <button
              type="button"
              onClick={() => updateFilter('searchTerm', '')}
              aria-label={isEn ? "Clear search" : "ล้างคำค้นหา"}
              title={isEn ? "Clear search" : "ล้างคำค้นหา"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 z-10 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </form>

        {/* Zone Dropdown - with ample width for English zone labels without clipping */}
        <div className="w-full sm:w-auto sm:min-w-[210px] md:min-w-[250px] flex-shrink-0">
          <label htmlFor="dorm-zone-select" className="sr-only">
            {t('filter.zoneLabel')}
          </label>
          <select
            id="dorm-zone-select"
            name="zone"
            value={safeFilters.zone}
            onChange={(e) => updateFilter('zone', e.target.value)}
            aria-label={t('filter.zoneLabel')}
            className="w-full px-3.5 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-blue-950 transition truncate"
          >
            <option value="all">📍 {t('filter.allZones')}</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {translateZone(z, isEn)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          {/* Saved Dormitories Toggle */}
          {onToggleShowSaved && (
            <button
              type="button"
              onClick={onToggleShowSaved}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              aria-pressed={showOnlySaved}
              aria-label={t('filter.savedOnly')}
              title={t('filter.savedOnly')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex-shrink-0 active:scale-95 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                showOnlySaved
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-rose-50/80 border-rose-200/80 text-rose-700 hover:bg-rose-100/90'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${showOnlySaved ? 'fill-white' : 'fill-rose-500'}`} aria-hidden="true" />
              <span aria-hidden="true">{t('filter.savedOnly')}</span>
              {favoritesCount > 0 && (
                <span aria-hidden="true" className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${showOnlySaved ? 'bg-white text-rose-600' : 'bg-rose-200 text-rose-800'}`}>
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Collapsible Filter Panel Toggle */}
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
            <span>{isEn ? 'Filters' : 'ตัวกรอง'}</span>
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

      {/* Collapsible Filter Panel */}
      {isOpenFilters && (
        <div className="pt-3 border-t border-slate-100 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Filter Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                {isEn ? 'Quick Filters:' : 'ตัวกรองด่วน:'}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('filter.resetFilters')}</span>
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
                <span>{t('filter.airRoom')}</span>
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
                <span>{t('filter.fanRoom')}</span>
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
                <span>{t('filter.petFriendly')}</span>
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
                <span>{t('filter.parking')}</span>
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
                <span>{t('filter.noFloodRisk')}</span>
              </button>
            </div>
          </div>

          {/* Price Range & Tenants Filters */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            {/* Price Range Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>{isEn ? 'Max Budget / month:' : 'งบประมาณสูงสุด / เดือน:'}</span>
                <span className="text-amber-600 font-black text-sm">
                  {(safeFilters.maxPrice ?? 10000) >= 10000 ? (isEn ? 'Unlimited' : 'ไม่จำกัด') : `฿${(safeFilters.maxPrice ?? 10000).toLocaleString()}`}
                </span>
              </div>
              <label htmlFor="priceRangeFilter" className="sr-only">
                {t('filter.priceLabel')}
              </label>
              <input
                id="priceRangeFilter"
                aria-label={t('filter.priceLabel')}
                aria-valuemin={1500}
                aria-valuemax={10000}
                aria-valuenow={safeFilters.maxPrice ?? 10000}
                aria-valuetext={(safeFilters.maxPrice ?? 10000) >= 10000 ? (isEn ? 'Unlimited budget' : 'ไม่จำกัดงบประมาณ') : `${(safeFilters.maxPrice ?? 10000).toLocaleString()} ${isEn ? 'THB/month' : 'บาทต่อเดือน'}`}
                type="range"
                min="1500"
                max="10000"
                step="200"
                value={safeFilters.maxPrice ?? 10000}
                onChange={(e) => updateFilter('maxPrice', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>฿1,500</span>
                <span>฿5,000</span>
                <span>{isEn ? 'Unlimited' : 'ไม่จำกัด'}</span>
              </div>
            </div>

            {/* Gender Filter */}
            <div className="space-y-1.5">
              <label htmlFor="genderFilter" className="text-slate-700 font-bold flex items-center gap-1 cursor-pointer">
                <Users className="w-3.5 h-3.5 text-blue-900" />
                <span>{t('filter.genderLabel')}:</span>
              </label>
              <select
                id="genderFilter"
                name="genderType"
                aria-label={t('filter.genderLabel')}
                value={safeFilters.genderType || 'all'}
                onChange={(e) => updateFilter('genderType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold text-slate-800"
              >
                <option value="all">{t('filter.allGenders')}</option>
                <option value="female">{t('filter.femaleDorm')}</option>
                <option value="male">{t('filter.maleDorm')}</option>
                <option value="mixed">{t('filter.mixedDorm')}</option>
              </select>
            </div>

            {/* Total Matching Badge */}
            <div className="flex items-center justify-between sm:justify-end sm:col-span-1 md:col-span-1 pt-1 sm:pt-0">
              <div className="p-2.5 bg-blue-50/80 border border-blue-200/70 rounded-2xl text-center w-full">
                <span className="text-[11px] text-blue-900 font-semibold block">
                  {isEn ? 'Matching Dormitories' : 'พบหอพักที่ตรงเงื่อนไข'}
                </span>
                <span className="text-lg font-black text-amber-600">{totalResults}</span>
                <span className="text-[11px] text-blue-900 font-semibold">
                  {isEn ? ' dorms' : ' แห่ง'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
