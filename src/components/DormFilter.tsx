'use client';

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, 
  Wind, X, Dog, Car, Waves, Fan, Users, Heart, RotateCcw
} from 'lucide-react';
import { FilterState } from '@/types/dormitory';

interface DormFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  zones: string[];
  totalResults: number;
  favoritesCount?: number;
}

export default function DormFilter({
  filters,
  onFilterChange,
  zones,
  totalResults,
  favoritesCount = 0,
}: DormFilterProps) {
  const [isOpenAdvanced, setIsOpenAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFilterChange({
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

  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.zone !== 'all' ||
    filters.onlySavedOnly ||
    filters.roomType !== 'all' ||
    filters.genderType !== 'all' ||
    filters.onlyPetAllowed ||
    filters.requireParking ||
    filters.noFloodRiskOnly ||
    filters.maxPrice < 10000;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3.5">
      {/* Top Search Bar & Zone Select */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search input with Accessibility M-01 Standards */}
        <div className="relative flex-1">
          <label htmlFor="dorm-search-input" className="sr-only">
            ค้นหาชื่อหอพัก โซน หรือทำเลใกล้เคียง
          </label>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="dorm-search-input"
            name="searchTerm"
            type="text"
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            placeholder="ค้นหาชื่อหอพัก, โซน หรือทำเลใกล้เคียง..."
            aria-label="ค้นหาชื่อหอพัก โซน หรือทำเลใกล้เคียง"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
          />
          {filters.searchTerm && (
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

        {/* Zone Dropdown with Accessibility M-01 Standards */}
        <div className="w-full sm:w-52">
          <label htmlFor="dorm-zone-select" className="sr-only">
            เลือกโซน
          </label>
          <select
            id="dorm-zone-select"
            name="zone"
            value={filters.zone}
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

        {/* Advanced Filter Toggle Button */}
        <button
          onClick={() => setIsOpenAdvanced(!isOpenAdvanced)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition flex-shrink-0 active:scale-95 ${
            isOpenAdvanced || hasActiveFilters
              ? 'bg-blue-950 border-blue-950 text-amber-300 shadow-md'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>ตัวกรองละเอียด</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
          )}
        </button>
      </div>

      {/* Quick Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        {/* Saved Favorites Filter Chip */}
        <button
          onClick={() => updateFilter('onlySavedOnly', !filters.onlySavedOnly)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition flex-shrink-0 active:scale-95 ${
            filters.onlySavedOnly
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${filters.onlySavedOnly ? 'fill-white' : 'fill-rose-500'}`} />
          <span>หอพักที่บันทึกไว้ {favoritesCount > 0 ? `(${favoritesCount})` : ''}</span>
        </button>

        {/* Room Type: Air */}
        <button
          onClick={() => updateFilter('roomType', filters.roomType === 'air' ? 'all' : 'air')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 ${
            filters.roomType === 'air'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-blue-500" />
          <span>ห้องแอร์</span>
        </button>

        {/* Room Type: Fan */}
        <button
          onClick={() => updateFilter('roomType', filters.roomType === 'fan' ? 'all' : 'fan')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 ${
            filters.roomType === 'fan'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          <Fan className="w-3.5 h-3.5 text-amber-500" />
          <span>ห้องพัดลม</span>
        </button>

        {/* Pet Allowed */}
        <button
          onClick={() => updateFilter('onlyPetAllowed', !filters.onlyPetAllowed)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 ${
            filters.onlyPetAllowed
              ? 'bg-blue-950 text-amber-300 shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          <Dog className="w-3.5 h-3.5 text-amber-500" />
          <span>เลี้ยงสัตว์ได้</span>
        </button>

        {/* Parking */}
        <button
          onClick={() => updateFilter('requireParking', !filters.requireParking)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 ${
            filters.requireParking
              ? 'bg-blue-950 text-amber-300 shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-blue-500" />
          <span>ที่จอดรถ</span>
        </button>

        {/* No Flood */}
        <button
          onClick={() => updateFilter('noFloodRiskOnly', !filters.noFloodRiskOnly)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition flex-shrink-0 active:scale-95 ${
            filters.noFloodRiskOnly
              ? 'bg-cyan-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-cyan-600" />
          <span>ไม่เสี่ยงน้ำท่วม</span>
        </button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-rose-600 hover:bg-rose-50 transition flex-shrink-0 active:scale-95 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Collapsible Section */}
      {isOpenAdvanced && (
        <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
          {/* Price Range Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-700 font-bold">
              <span>งบประมาณสูงสุด / เดือน:</span>
              <span className="text-amber-600 font-black text-sm">
                {filters.maxPrice >= 10000 ? 'ไม่จำกัด' : `฿${filters.maxPrice.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min="1500"
              max="10000"
              step="200"
              value={filters.maxPrice}
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
              value={filters.genderType}
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
          <div className="flex items-center justify-between sm:justify-end sm:col-span-1 md:col-span-1 pt-2 sm:pt-0">
            <div className="p-3 bg-blue-50/80 border border-blue-200/70 rounded-2xl text-center w-full">
              <span className="text-[11px] text-blue-900 font-semibold block">พบหอพักที่ตรงเงื่อนไข</span>
              <span className="text-xl font-black text-amber-600">{totalResults}</span>
              <span className="text-[11px] text-blue-900 font-semibold"> แห่ง</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
