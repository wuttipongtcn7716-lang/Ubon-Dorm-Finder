'use client';

import React from 'react';
import { Dormitory } from '@/types/dormitory';
import { GitCompare, X, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getDormName } from '@/utils/bilingualHelpers';

interface DormCompareBarProps {
  selectedDorms: Dormitory[];
  onOpenCompare: () => void;
  onRemoveDorm: (id: number) => void;
  onClearAll: () => void;
  limitWarning?: string | null;
  onDismissWarning?: () => void;
}

export default function DormCompareBar({
  selectedDorms,
  onOpenCompare,
  onRemoveDorm,
  onClearAll,
  limitWarning,
  onDismissWarning,
}: DormCompareBarProps) {
  const { t, isEn } = useLanguage();
  const count = selectedDorms.length;
  if (count === 0 && !limitWarning) return null;

  const canCompare = count >= 2;

  return (
    <>
      {/* Toast Alert for Max Limit (4 Dormitories) */}
      {limitWarning && (
        <div 
          role="alert"
          aria-live="assertive"
          className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-rose-950/95 text-rose-200 border border-rose-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <span>⚠️ {limitWarning}</span>
          {onDismissWarning && (
            <button
              type="button"
              onClick={onDismissWarning}
              className="p-1 hover:text-white rounded-lg transition"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Persistent Compare Floating Bar */}
      {count > 0 && (
        <aside
          aria-label={t('compare.barTitle')}
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 transform-gpu animate-in slide-in-from-bottom duration-300"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Left Side: Badge & Selected Dorms Thumbnails */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Title & Count Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-blue-950 font-black text-xs sm:text-sm">
                    <GitCompare className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="hidden xs:inline">{t('compare.barTitle')}</span>
                    <span className="xs:hidden">{isEn ? 'Compare' : 'เทียบ'}</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {count}/4
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
                    {canCompare ? (isEn ? 'Ready to compare' : 'พร้อมเปรียบเทียบข้อมูล') : (isEn ? 'Select 1 more dorm' : 'เลือกอีก 1 หอพัก')}
                  </span>
                </div>

                {/* Selected Dorm Pills List (Scrollable on small devices) */}
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none max-w-full"
                  role="list"
                  aria-label={isEn ? 'Selected dormitories' : 'รายชื่อหอพักที่เลือก'}
                >
                  {selectedDorms.map((dorm) => {
                    const displayName = getDormName(dorm, isEn);
                    return (
                      <div
                        key={dorm.id}
                        role="listitem"
                        className="group flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-xl px-2 py-1 flex-shrink-0 transition text-xs text-slate-800 shadow-2xs"
                      >
                        {dorm.image && (
                          <img
                            src={dorm.image}
                            alt=""
                            className="w-5 h-5 rounded-md object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="max-w-[70px] sm:max-w-[120px] md:max-w-[150px] truncate font-bold text-[11px] sm:text-xs">
                          {displayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveDorm(dorm.id)}
                          className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-100/80 transition flex-shrink-0"
                          title={isEn ? `Remove ${displayName} from comparison` : `เอาหอพัก ${displayName} ออกจากการเปรียบเทียบ`}
                          aria-label={isEn ? `Remove ${displayName} from comparison` : `เอาหอพัก ${displayName} ออกจากการเปรียบเทียบ`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Actions (Clear All + Compare Button) */}
              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                {/* Clear All Button */}
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-2.5 sm:px-3 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title={t('compare.clearAll')}
                  aria-label={t('compare.clearAll')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('compare.clearAll')}</span>
                </button>

                {/* Primary Compare Button */}
                <button
                  type="button"
                  disabled={!canCompare}
                  onClick={onOpenCompare}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all duration-200 active:scale-95 ${
                    canCompare
                      ? 'bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-amber-300 border border-amber-400/30 hover:shadow-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                  }`}
                  aria-label={
                    canCompare
                      ? (isEn ? `Open comparison modal for ${count} dormitories` : `เปิดหน้าต่างเปรียบเทียบ ${count} หอพัก`)
                      : (isEn ? 'Please select at least 2 dormitories to compare' : 'กรุณาเลือกหอพักอย่างน้อย 2 แห่งเพื่อเปรียบเทียบ')
                  }
                  title={
                    canCompare
                      ? (isEn ? `Compare ${count} dormitories` : `เปรียบเทียบ ${count} หอพัก`)
                      : (isEn ? 'Select at least 2 dormitories to compare' : 'เลือกอย่างน้อย 2 หอพักเพื่อเปรียบเทียบ')
                  }
                >
                  <GitCompare className="w-4 h-4" />
                  <span>{t('compare.compareBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
