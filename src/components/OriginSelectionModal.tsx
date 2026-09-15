'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Search, MapPin, Building2, Navigation, 
  LocateFixed, School, BookOpen, Utensils, 
  Compass, Check, RotateCcw, Building
} from 'lucide-react';
import { landmarksData, LandmarkItem, getLandmarkMeta } from '@/data/landmarks';
import { Dormitory } from '@/types/dormitory';

export interface SelectedOrigin {
  name: string;
  lat: number;
  lng: number;
  type: 'gps' | 'gate' | 'landmark' | 'dorm' | 'custom';
}

export const POPULAR_CAMPUS_ORIGINS: SelectedOrigin[] = [
  { name: 'ประตู 1 ม.อุบลฯ (จุดหลักแนะนำ)', lat: 15.118464, lng: 104.899762, type: 'gate' },
  { name: 'อาคารเรียนรวม 3 (CLB3)', lat: 15.117810, lng: 104.907578, type: 'landmark' },
  { name: 'อาคารเรียนรวม 4 (CLB4)', lat: 15.120793, lng: 104.908469, type: 'landmark' },
  { name: 'อาคารเรียนรวม 5 (CLB5)', lat: 15.120244, lng: 104.909043, type: 'landmark' },
  { name: 'หอสมุดกลาง (ODL)', lat: 15.118783, lng: 104.907804, type: 'landmark' },
  { name: 'สำนักงานอธิการบดี', lat: 15.117253, lng: 104.903069, type: 'landmark' },
  { name: 'โรงพยาบาลมหาวิทยาลัยอุบลราชธานี', lat: 15.113859, lng: 104.903260, type: 'landmark' },
  { name: 'โรงอาหารกลาง ๑', lat: 15.119555, lng: 104.905864, type: 'landmark' },
  { name: 'ศูนย์อาหารหอใน (FOOD CENTER)', lat: 15.131921, lng: 104.908099, type: 'landmark' },
];

interface OriginSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOriginName?: string;
  onSelectOrigin: (origin: SelectedOrigin) => void;
  onUseGps?: () => void;
  onPickOnMap?: () => void;
  dorms?: Dormitory[];
  isLocatingGps?: boolean;
}

export default function OriginSelectionModal({
  isOpen,
  onClose,
  currentOriginName = '',
  onSelectOrigin,
  onUseGps,
  onPickOnMap,
  dorms = [],
  isLocatingGps = false,
}: OriginSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'campus' | 'food' | 'dorm'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered lists based on search term
  const filteredPopular = useMemo(() => {
    if (!searchTerm) return POPULAR_CAMPUS_ORIGINS;
    const q = searchTerm.toLowerCase();
    return POPULAR_CAMPUS_ORIGINS.filter((item) => 
      item.name.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const filteredLandmarks = useMemo(() => {
    if (selectedCategory === 'dorm') return [];
    let list = landmarksData;
    if (selectedCategory === 'campus') {
      list = landmarksData.filter((lm) => lm.category === 'building' || lm.category === 'landmark' || lm.category === 'faculty');
    } else if (selectedCategory === 'food') {
      list = landmarksData.filter((lm) => lm.category === 'food' || lm.category === 'cafe' || lm.category === 'streetfood');
    }

    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((item) => 
      item.name.toLowerCase().includes(q) || (item.category && item.category.toLowerCase().includes(q))
    );
  }, [searchTerm, selectedCategory]);

  const filteredDorms = useMemo(() => {
    if (selectedCategory !== 'all' && selectedCategory !== 'dorm') return [];
    if (!searchTerm && selectedCategory !== 'dorm') return [];
    const q = searchTerm.toLowerCase();
    return dorms.filter((d) => 
      d.name.toLowerCase().includes(q) || (d.zone && d.zone.toLowerCase().includes(q))
    );
  }, [dorms, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="origin-selection-title"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0a1931] text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm flex-shrink-0">
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 id="origin-selection-title" className="text-base sm:text-lg font-black text-white leading-tight">
                เลือกจุดเริ่มต้น (Starting Point)
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                เลือกหรือค้นหาสถานที่รอบ ม.อุบลฯ เพื่อใช้นำทาง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95 flex-shrink-0 cursor-pointer"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่างเลือกจุดเริ่มต้น"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Quick Actions Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200/80 space-y-2.5 flex-shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <label htmlFor="originSearchInput" className="sr-only">
              ค้นหาจุดเริ่มต้น เช่น ชื่อคณะ, อาคารเรียน หรือจุดสังเกต
            </label>
            <input
              id="originSearchInput"
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="พิมพ์ชื่อคณะ, อาคารเรียน, ประตู ม. หรือหอพัก..."
              aria-label="ค้นหาจุดเริ่มต้น เช่น ชื่อคณะ, อาคารเรียน หรือจุดสังเกต"
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 shadow-xs transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Alternative Methods (GPS & Map Click) */}
          <div className="flex items-center gap-2">
            {onUseGps && (
              <button
                type="button"
                onClick={() => {
                  onUseGps();
                  onClose();
                }}
                disabled={isLocatingGps}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-900 border border-blue-200/80 rounded-xl text-xs font-bold transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <LocateFixed className={`w-3.5 h-3.5 text-blue-700 ${isLocatingGps ? 'animate-spin' : ''}`} />
                <span>ใช้ GPS ปัจจุบัน</span>
              </button>
            )}

            {onPickOnMap && (
              <button
                type="button"
                onClick={() => {
                  onPickOnMap();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition active:scale-98 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                <span>คลิกปักหมุดบนแผนที่</span>
              </button>
            )}
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('campus')}
              className={`px-3 py-1.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
                selectedCategory === 'campus'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              🏛️ อาคาร & คณะ
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('food')}
              className={`px-3 py-1.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
                selectedCategory === 'food'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              🍲 ร้านอาหาร
            </button>
            {dorms.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('dorm')}
                className={`px-3 py-1.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
                  selectedCategory === 'dorm'
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                🏠 หอพัก ({dorms.length})
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* 1. Quick Picks Popular Locations (shown when no search or matches search) */}
          {selectedCategory === 'all' && filteredPopular.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>⭐</span>
                <span>จุดเริ่มต้นยอดนิยมใน ม.อุบลฯ</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredPopular.map((item) => {
                  const isCurrent = currentOriginName === item.name || currentOriginName.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        onSelectOrigin(item);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border text-left transition cursor-pointer active:scale-[0.98] ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-400 text-blue-950 ring-2 ring-blue-400/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                          isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.type === 'gate' ? '🏛️' : '🏫'}
                        </div>
                        <span className="text-xs font-bold truncate">
                          {item.name}
                        </span>
                      </div>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Campus Landmarks & Faculties */}
          {filteredLandmarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>🏛️</span>
                <span>สถานที่รอบ ม.อุบลฯ ({filteredLandmarks.length})</span>
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                {filteredLandmarks.slice(0, 30).map((lm) => {
                  const meta = getLandmarkMeta(lm.category, lm.name);
                  const isCurrent = currentOriginName === lm.name;
                  return (
                    <button
                      key={lm.name}
                      type="button"
                      onClick={() => {
                        onSelectOrigin({
                          name: lm.name,
                          lat: lm.routingLat ?? lm.lat,
                          lng: lm.routingLng ?? lm.lng,
                          type: 'landmark',
                        });
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 text-left transition cursor-pointer active:scale-[0.99] ${
                        isCurrent ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-base flex-shrink-0">{meta.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold truncate">
                            {lm.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {meta.label}
                          </div>
                        </div>
                      </div>
                      {isCurrent ? (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <span className="text-[11px] text-blue-600 font-bold opacity-0 group-hover:opacity-100">เลือก</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Dormitories (when searched or in dorm filter) */}
          {filteredDorms.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>🏠</span>
                <span>หอพัก ({filteredDorms.length})</span>
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                {filteredDorms.slice(0, 20).map((d) => {
                  const dLat = Number(d.lat ?? d.latitude);
                  const dLng = Number(d.lng ?? d.longitude);
                  const isCurrent = currentOriginName === d.name;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onSelectOrigin({
                          name: d.name,
                          lat: dLat,
                          lng: dLng,
                          type: 'dorm',
                        });
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 text-left transition cursor-pointer active:scale-[0.99] ${
                        isCurrent ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-base flex-shrink-0">🏠</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold truncate">
                            {d.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            โซน: {d.zone || 'รอบ ม.อุบลฯ'}
                          </div>
                        </div>
                      </div>
                      {isCurrent ? (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <span className="text-[11px] text-blue-600 font-bold">เลือก</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Search State */}
          {filteredPopular.length === 0 && filteredLandmarks.length === 0 && filteredDorms.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">ไม่พบสถานที่ที่ตรงกับ "{searchTerm}"</p>
                <p className="text-xs text-slate-500">
                  ลองค้นหาด้วยคำสั้นๆ เช่น "CLB", "วิศวะ", "ประตู", "ODL" หรือเลือกจากจุดแนะนำด้านบน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>แสดงสถานที่ทั้งหมด</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="text-slate-500 font-medium truncate pr-2">
            จุดเริ่มต้นปัจจุบัน: <span className="font-bold text-slate-800">{currentOriginName || 'ประตู 1 ม.อุบลฯ'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
