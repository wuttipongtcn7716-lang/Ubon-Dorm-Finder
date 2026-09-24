'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  X, Check, Minus, ShieldCheck, MapPin, 
  Trash2, Navigation, ExternalLink, GitCompare,
  Phone, MessageSquare, Facebook, AlertTriangle,
  Building2
} from 'lucide-react';
import { Dormitory, PriceStructure } from '@/types/dormitory';
import { useLanguage } from '@/context/LanguageContext';
import { translateZone, translateDormValue, translateDormExpense, getDormName } from '@/utils/bilingualHelpers';

interface DormCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDorms: Dormitory[];
  onRemoveDorm: (id: number) => void;
  onClearAll: () => void;
  onNavigate?: (dorm: Dormitory) => void;
}

export default function DormCompareModal({
  isOpen,
  onClose,
  selectedDorms,
  onRemoveDorm,
  onClearAll,
  onNavigate,
}: DormCompareModalProps) {
  const { t, isEn } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Helpers to resolve price and attributes
  const resolvePrice = (dorm: Dormitory) => {
    const priceObj: PriceStructure | null =
      dorm.prices ||
      (typeof dorm.price === 'object' && dorm.price !== null
        ? (dorm.price as PriceStructure)
        : null);

    const fanPrice = priceObj?.fan ?? null;
    const airPrice = priceObj?.air ?? null;
    const hasBoth = fanPrice !== null && airPrice !== null && fanPrice !== airPrice;
    const minVal = dorm.minPrice || (hasBoth ? Math.min(fanPrice, airPrice) : airPrice || fanPrice || 0);
    const maxVal = dorm.maxPrice || (hasBoth ? Math.max(fanPrice, airPrice) : minVal);

    return { fanPrice, airPrice, hasBoth, minVal, maxVal };
  };

  const pricesDiffer = (() => {
    if (selectedDorms.length < 2) return false;
    const firstMin = resolvePrice(selectedDorms[0]).minVal;
    return selectedDorms.some((d) => resolvePrice(d).minVal !== firstMin);
  })();

  const formatGender = (genderType?: string) => {
    if (!genderType) return isEn ? 'No info' : 'ไม่มีข้อมูล';
    const raw = genderType.trim().toLowerCase();
    if (raw === 'female' || raw.includes('หญิง')) return isEn ? 'Female Only' : 'หอพักหญิง';
    if (raw === 'male' || raw.includes('ชาย')) return isEn ? 'Male Only' : 'หอพักชาย';
    if (raw === 'mixed' || raw.includes('รวม')) return isEn ? 'Mixed-gender' : 'หอพักรวม';
    return isEn ? translateDormValue(genderType, isEn) : genderType;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <header className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#0a1931] via-[#102a5c] to-[#0a1931] text-white flex items-center justify-between gap-3 border-b border-blue-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
              <GitCompare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-base sm:text-lg font-black text-white truncate">
                {t('compare.modalTitle')}
              </h2>
              <p className="text-xs text-blue-200/80">
                {isEn ? `Comparing ${selectedDorms.length} of max 4 dormitories (Dormie UBU)` : `เลือกเปรียบเทียบ ${selectedDorms.length} จากสูงสุด 4 หอพัก (ข้อมูลจากระบบ Dormie UBU)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedDorms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title={t('compare.clearAll')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('compare.clearAll')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              title={isEn ? 'Close comparison modal' : 'ปิดหน้าต่างเปรียบเทียบ'}
              aria-label={isEn ? 'Close comparison modal' : 'ปิดหน้าต่างเปรียบเทียบ'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-slate-50/60">
          {selectedDorms.length < 2 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <GitCompare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                {isEn ? 'Please select at least 2 dormitories' : 'กรุณาเลือกหอพักอย่างน้อย 2 แห่ง'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isEn ? 'Click "Compare" on the dorm cards you are interested in to see them side-by-side.' : 'กดปุ่ม “เพิ่มเปรียบเทียบ” บนการ์ดหอพักที่ท่านสนใจ เพื่อนำข้อมูลมาวางเทียบกันแบบเคียงข้าง'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-blue-950 text-white font-bold text-xs shadow-md hover:bg-blue-900 transition cursor-pointer"
              >
                {isEn ? 'Back to select dorms' : 'กลับไปเลือกหอพัก'}
              </button>
            </div>
          ) : (
            /* Comparison Table Container with Local Horizontal Scroll for Mobile */
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs scrollbar-thin">
              <table className="w-full border-collapse text-left min-w-[620px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70">
                    <th scope="col" className="p-3 sm:p-4 w-36 sm:w-48 min-w-[130px] sm:min-w-[175px] break-words text-slate-600 font-extrabold uppercase tracking-wider text-[11px] sticky left-0 bg-slate-100/95 backdrop-blur-xs z-10 border-r border-slate-200">
                      {t('compare.featureName')}
                    </th>
                    {selectedDorms.map((dorm) => {
                      const displayName = getDormName(dorm, isEn);
                      return (
                        <th
                          key={dorm.id}
                          scope="col"
                          className="p-3 sm:p-4 w-[240px] max-w-[280px] font-bold text-slate-900 align-top border-r last:border-r-0 border-slate-200"
                        >
                          <div className="space-y-2.5">
                            {/* Image Thumbnail */}
                            <div className="relative h-28 sm:h-36 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                              {dorm.image ? (
                                <img
                                  src={dorm.image}
                                  alt={isEn ? `Photo of ${displayName}` : `รูปหอพัก ${displayName}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/Picture/default-dorm.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                                  <Building2 className="w-6 h-6" />
                                  <span className="text-[10px]">{isEn ? 'No photo' : 'ไม่มีรูปภาพ'}</span>
                                </div>
                              )}

                              {/* Remove from compare button */}
                              <button
                                type="button"
                                onClick={() => onRemoveDorm(dorm.id)}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-xs transition shadow-md cursor-pointer"
                                title={isEn ? `Remove ${displayName}` : `เอาหอพัก ${displayName} ออก`}
                                aria-label={isEn ? `Remove ${displayName} from comparison` : `เอาหอพัก ${displayName} ออกจากการเปรียบเทียบ`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Dorm Name & Detail Link */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-extrabold text-blue-950 text-sm sm:text-base leading-snug line-clamp-2">
                                  {displayName}
                                </h3>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                                <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="truncate">{translateZone(dorm.zone, isEn)}</span>
                              </div>
                            </div>

                            {/* Quick Action Links */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <Link
                                href={`/dorm/${dorm.id}`}
                                target="_blank"
                                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-950 font-bold text-[11px] text-center transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                                title={isEn ? `View details for ${displayName}` : `เปิดดูหน้ารายละเอียด ${displayName}`}
                              >
                                <span>{isEn ? 'Details' : 'รายละเอียด'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>

                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigate(dorm);
                                  }}
                                  className="py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-[11px] transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                                  title={isEn ? `Directions to ${displayName}` : `นำทางไปหอพัก ${displayName}`}
                                >
                                  <Navigation className="w-3 h-3" />
                                  <span className="hidden xs:inline">{isEn ? 'Directions' : 'นำทาง'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-150">
                  {/* Row: ราคาค่าเช่า */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {t('compare.rentPrice')}
                      {pricesDiffer && (
                        <span className="block text-[10px] font-normal text-amber-700">
                          {isEn ? '(Prices differ)' : '(ราคามีความแตกต่างกัน)'}
                        </span>
                      )}
                    </td>
                    {selectedDorms.map((dorm) => {
                      const p = resolvePrice(dorm);
                      return (
                        <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                          <div className="space-y-1">
                            <div className="text-base sm:text-lg font-black text-amber-600">
                              {p.minVal > 0 ? (
                                <>
                                  ฿{p.minVal.toLocaleString()}
                                  {p.hasBoth && ` - ${p.maxVal.toLocaleString()}`}
                                  <span className="text-xs font-normal text-slate-500"> /{isEn ? 'month' : 'เดือน'}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs font-medium">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                              )}
                            </div>
                            {p.hasBoth && (
                              <div className="text-[11px] text-slate-600 space-y-0.5">
                                {p.fanPrice !== null && <div>{isEn ? 'Fan:' : 'พัดลม:'} ฿{p.fanPrice.toLocaleString()}</div>}
                                {p.airPrice !== null && <div>{isEn ? 'Air:' : 'แอร์:'} ฿{p.airPrice.toLocaleString()}</div>}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: ประเภทห้องพัก */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Room Type' : 'ประเภทห้องพัก'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200 text-slate-800">
                        {dorm.roomType || dorm.type ? translateDormValue(dorm.roomType || dorm.type, isEn) : (isEn ? 'No info' : 'ไม่มีข้อมูล')}
                      </td>
                    ))}
                  </tr>

                  {/* Row: เพศผู้พัก */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Resident Gender' : 'เพศผู้พัก'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50 text-blue-950 font-bold text-xs">
                          {formatGender(dorm.genderType)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: มาตรฐานหอพักสีขาว */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'White Dorm Status' : 'สถานะเครือข่ายสีขาว'}
                    </td>
                    {selectedDorms.map((dorm) => {
                      const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');
                      return (
                        <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                          {isWhite ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-950 text-amber-300 font-extrabold text-xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isEn ? 'White Dorm' : 'หอพักสีขาว'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs">
                              {dorm.status || dorm.evalResult ? translateDormValue(dorm.status || dorm.evalResult, isEn) : (isEn ? 'General Dorm' : 'หอพักทั่วไป')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: ประวัติ/ความเสี่ยงน้ำท่วม */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Flood Risk' : 'ความเสี่ยงน้ำท่วม'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                        {dorm.floodRisk !== undefined ? (
                          dorm.floodRisk ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>{isEn ? 'Flood Risk History' : 'มีประวัติน้ำท่วม'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isEn ? 'Safe / No Flood History' : 'ปลอดภัย / ไม่ท่วม'}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: ที่จอดรถ */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Parking' : 'ที่จอดรถ'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                        {dorm.parking !== undefined ? (
                          dorm.parking ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="w-4 h-4 text-emerald-600" /> {isEn ? 'Available' : 'มีที่จอดรถ'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
                              <Minus className="w-4 h-4 text-slate-300" /> {isEn ? 'None' : 'ไม่มี'}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: เลี้ยงสัตว์ */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Pet Policy' : 'การเลี้ยงสัตว์'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                        {dorm.allowPet !== undefined ? (
                          dorm.allowPet ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="w-4 h-4 text-emerald-600" /> {isEn ? 'Allowed' : 'อนุญาตให้เลี้ยง'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
                              <Minus className="w-4 h-4 text-slate-300" /> {isEn ? 'Not Allowed' : 'ไม่อนุญาต'}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: ทำอาหาร */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Cooking' : 'การทำอาหาร'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                        {dorm.allowCooking !== undefined ? (
                          dorm.allowCooking ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="w-4 h-4 text-emerald-600" /> {isEn ? 'Allowed' : 'ทำอาหารได้'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
                              <Minus className="w-4 h-4 text-slate-300" /> {isEn ? 'Not Allowed' : 'ไม่อนุญาต'}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: ค่าน้ำ / ค่าไฟ */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Water / Electricity' : 'ค่าน้ำ / ค่าไฟ'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200 text-slate-800 space-y-1">
                        <div><span className="font-bold text-slate-500 text-xs">{isEn ? 'Water:' : 'น้ำ:'}</span> {translateDormExpense(dorm.waterRate, isEn) || (isEn ? 'No info' : 'ไม่มีข้อมูล')}</div>
                        <div><span className="font-bold text-slate-500 text-xs">{isEn ? 'Electricity:' : 'ไฟ:'}</span> {translateDormExpense(dorm.electricRate, isEn) || (isEn ? 'No info' : 'ไม่มีข้อมูล')}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: เงินประกัน / สัญญา */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Deposit / Lease' : 'เงินประกัน / สัญญา'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200 text-slate-800 space-y-1">
                        <div>
                          <span className="font-bold text-slate-500 text-xs">{isEn ? 'Deposit:' : 'ประกัน:'}</span>{' '}
                          {dorm.deposit ? `฿${dorm.deposit.toLocaleString()} ${isEn ? 'THB' : 'บาท'}` : (isEn ? 'No info' : 'ไม่มีข้อมูล')}
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-xs">{isEn ? 'Lease:' : 'สัญญา:'}</span>{' '}
                          {dorm.minLease ? translateDormExpense(dorm.minLease, isEn) : (isEn ? 'No info' : 'ไม่มีข้อมูล')}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: เวลาปิดประตูหอ */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Gate Closing Time' : 'เวลาปิดประตูหอ'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200 text-slate-800">
                        {dorm.gateClosingTime ? translateDormValue(dorm.gateClosingTime, isEn) : (isEn ? 'No info' : 'ไม่มีข้อมูล')}
                      </td>
                    ))}
                  </tr>

                  {/* Row: สิ่งอำนวยความสะดวก */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Amenities & Facilities' : 'สิ่งอำนวยความสะดวก'}
                    </td>
                    {selectedDorms.map((dorm) => {
                      const amenities = [
                        { label: 'Wi-Fi', has: dorm.wifi },
                        { label: isEn ? 'Water Heater' : 'เครื่องทำน้ำอุ่น', has: dorm.waterHeater },
                        { label: isEn ? 'Refrigerator' : 'ตู้เย็น', has: dorm.fridge },
                        { label: isEn ? 'Wardrobe' : 'ตู้เสื้อผ้า', has: dorm.wardrobe },
                        { label: isEn ? 'Bed' : 'เตียงนอน', has: dorm.bed },
                        { label: isEn ? 'Desk' : 'โต๊ะทำงาน', has: dorm.desk },
                        { label: isEn ? 'Elevator' : 'ลิฟต์', has: dorm.elevator },
                        { label: isEn ? 'Washing Machine' : 'เครื่องซักผ้า', has: dorm.washingMachine },
                        { label: 'CCTV', has: dorm.cctv },
                        { label: isEn ? 'Keycard' : 'คีย์การ์ด', has: dorm.keycard },
                        { label: isEn ? 'Security Guard' : 'รปภ.', has: dorm.securityGuard },
                        { label: isEn ? 'Common Area' : 'พื้นที่ส่วนกลาง', has: dorm.commonArea },
                      ].filter((a) => a.has);

                      return (
                        <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200">
                          {amenities.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {amenities.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                                >
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: ช่องทางติดต่อ */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 sm:p-4 font-bold text-slate-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-slate-200">
                      {isEn ? 'Contact' : 'ช่องทางติดต่อ'}
                    </td>
                    {selectedDorms.map((dorm) => (
                      <td key={dorm.id} className="p-3 sm:p-4 border-r last:border-r-0 border-slate-200 space-y-1 text-xs">
                        {dorm.phone ? (
                          <div className="flex items-center gap-1.5 text-blue-900 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`tel:${dorm.phone}`} className="hover:underline">
                              {dorm.phone}
                            </a>
                          </div>
                        ) : null}

                        {dorm.lineId ? (
                          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Line: {dorm.lineId}</span>
                          </div>
                        ) : null}

                        {dorm.facebook && dorm.facebook !== 'ไม่มีข้อมูล' && dorm.facebook !== '-' && dorm.facebook !== 'ไม่มี' ? (
                          <div className="flex items-center gap-1.5 text-blue-800 font-medium truncate max-w-[220px]">
                            <Facebook className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{dorm.facebook}</span>
                          </div>
                        ) : null}

                        {!dorm.phone && !dorm.lineId && (!dorm.facebook || dorm.facebook === 'ไม่มีข้อมูล' || dorm.facebook === '-' || dorm.facebook === 'ไม่มี') && (
                          <span className="text-slate-400">{isEn ? 'No info' : 'ไม่มีข้อมูล'}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <footer className="px-4 sm:px-6 py-3 bg-slate-100 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
          <p className="text-[11px] sm:text-xs">
            {isEn ? '💡 The table displays verified data for each dormitory so you can compare and make your own decision.' : '💡 ตารางแสดงข้อมูลตามจริงของแต่ละหอพัก เพื่อให้ท่านเปรียบเทียบและตัดสินใจด้วยตนเอง'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            {t('compare.closeBtn')}
          </button>
        </footer>
      </div>
    </div>
  );
}
