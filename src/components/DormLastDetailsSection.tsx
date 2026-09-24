'use client';

import React from 'react';
import { 
  DollarSign, Users, Bed, Building, Shield, 
  FileText, Compass, MapPin, Phone, MessageSquare, 
  Facebook, CheckCircle2, XCircle, AlertCircle, Info,
  ExternalLink, Sparkles, Waves, Volume2, Store
} from 'lucide-react';
import { DormLatestDetail } from '@/data/dormDetailsLast';
import { useLanguage } from '@/context/LanguageContext';
import { translateDormExpense, translateDormValue, translateNearbyPlaceName } from '@/utils/bilingualHelpers';

interface DormLastDetailsSectionProps {
  details: DormLatestDetail;
}

export default function DormLastDetailsSection({ details }: DormLastDetailsSectionProps) {
  const { t, isEn } = useLanguage();
  if (!details) return null;

  // Helper to render clean status / text with appropriate badge styling
  const renderBadgeValue = (val: string, type: 'boolean' | 'text' = 'text') => {
    if (!val || val === 'ไม่มีข้อมูล') {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400 italic font-medium text-xs">
          <span>{isEn ? 'No information' : 'ไม่มีข้อมูล'}</span>
        </span>
      );
    }

    const translated = translateDormValue(val, isEn);

    if (val === 'มี' || val === 'ได้' || val === 'ผ่าน' || val === 'ไม่เสี่ยง' || val === 'ไม่่เสี่ยง' || val === 'ไม่เสี่ี่ยง') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{translated}</span>
        </span>
      );
    }

    if (val === 'ไม่มี' || val === 'ไม่ได้' || val === 'เสี่ยง') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          <span>{translated}</span>
        </span>
      );
    }

    if (val === 'เสี่ยงปานกลาง' || val === 'ปานกลาง' || val === 'ไม่ไกลมาก' || val === 'ใกล้ปานกลาง') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <span>{translated}</span>
        </span>
      );
    }

    // Default text representation
    return (
      <span className="font-bold text-slate-800 text-xs sm:text-sm">
        {translated}
      </span>
    );
  };

  return (
    <section 
      aria-label={t('lastDetails.sectionTitle')} 
      className="space-y-6 pt-2"
    >
      <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
        <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <h2 className="text-lg sm:text-xl font-black text-blue-950">
          {t('lastDetails.sectionTitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. ค่าใช้จ่ายหอพัก */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <span>{t('lastDetails.expensesTitle')}</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold">
                    <th className="py-1.5 pr-2 font-semibold">{t('lastDetails.thItem')}</th>
                    <th className="py-1.5 pl-2 text-right font-semibold">{t('lastDetails.thDetails')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2 font-medium text-slate-500 w-1/2">{t('lastDetails.rentPrice')}</td>
                    <td className="py-2.5 pl-2 text-right font-black text-amber-600 sm:text-base break-words leading-snug">
                      {details.expenses.rentPrice !== 'ไม่มีข้อมูล' ? (
                        translateDormExpense(details.expenses.rentPrice, isEn)
                      ) : (
                        <span className="text-slate-400 italic font-normal text-xs">{isEn ? 'No information' : 'ไม่มีข้อมูล'}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2 font-medium text-slate-500">{t('lastDetails.waterRate')}</td>
                    <td className="py-2.5 pl-2 text-right break-words leading-snug">
                      {renderBadgeValue(translateDormExpense(details.expenses.waterRate, isEn))}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2 font-medium text-slate-500">{t('lastDetails.electricRate')}</td>
                    <td className="py-2.5 pl-2 text-right break-words leading-snug">
                      {renderBadgeValue(translateDormExpense(details.expenses.electricRate, isEn))}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2 font-bold text-slate-700">{t('lastDetails.deposit')}</td>
                    <td className="py-2.5 pl-2 text-right font-extrabold text-blue-900 break-words leading-snug">
                      {renderBadgeValue(translateDormExpense(details.expenses.deposit, isEn))}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2 font-medium text-slate-500">{t('lastDetails.minLease')}</td>
                    <td className="py-2.5 pl-2 text-right break-words leading-snug">
                      {renderBadgeValue(translateDormExpense(details.expenses.minLease, isEn))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] sm:text-xs text-amber-900 flex items-start gap-2 mt-2 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{translateDormExpense(details.expenses.note, isEn)}</span>
          </div>
        </div>

        {/* 2. ประเภทห้องและผู้พัก */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.roomAndTenantTitle')}</span>
          </h3>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-slate-600">{t('lastDetails.tenantType')}</span>
              <span className="text-xs sm:text-sm font-bold text-blue-950">
                {renderBadgeValue(details.roomAndTenant.genderType)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-slate-600">{t('lastDetails.roomType')}</span>
              <span className="text-xs sm:text-sm font-bold text-blue-950">
                {renderBadgeValue(details.roomAndTenant.roomType)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. สิ่งอำนวยความสะดวกภายในห้อง */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <Bed className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.roomAmenitiesTitle')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.waterHeater')}</span>
              <div>{renderBadgeValue(details.roomAmenities.waterHeater)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.refrigerator')}</span>
              <div>{renderBadgeValue(details.roomAmenities.refrigerator)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.wardrobe')}</span>
              <div>{renderBadgeValue(details.roomAmenities.wardrobe)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.bed')}</span>
              <div>{renderBadgeValue(details.roomAmenities.bed)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.desk')}</span>
              <div>{renderBadgeValue(details.roomAmenities.desk)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.freeWifi')}</span>
              <div>{renderBadgeValue(details.roomAmenities.wifi)}</div>
            </div>
          </div>
        </div>

        {/* 4. ส่วนกลางและสิ่งอำนวยความสะดวกของหอพัก */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.commonFacilitiesTitle')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.elevator')}</span>
              <div>{renderBadgeValue(details.commonFacilities.elevator)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.commonArea')}</span>
              <div>{renderBadgeValue(details.commonFacilities.commonArea)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.washingMachine')}</span>
              <div>{renderBadgeValue(details.commonFacilities.washingMachine)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.parking')}</span>
              <div>{renderBadgeValue(details.commonFacilities.parking)}</div>
            </div>
          </div>
        </div>

        {/* 5. ระบบความปลอดภัย */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.securityTitle')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between sm:flex-col sm:items-start gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.keycard')}</span>
              <div>{renderBadgeValue(details.security.keycard)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between sm:flex-col sm:items-start gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.cctv')}</span>
              <div>{renderBadgeValue(details.security.cctv)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between sm:flex-col sm:items-start gap-1">
              <span className="text-slate-500 text-[11px] sm:text-xs">{t('lastDetails.guard')}</span>
              <div>{renderBadgeValue(details.security.guard)}</div>
            </div>
          </div>
        </div>

        {/* 6. กฎและเงื่อนไขการพักอาศัย */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.rulesTitle')}</span>
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
              <span className="text-slate-600 font-medium">{t('lastDetails.petPolicy')}</span>
              <div>{renderBadgeValue(details.rules.pet)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
              <span className="text-slate-600 font-medium">{t('lastDetails.cookingPolicy')}</span>
              <div>{renderBadgeValue(details.rules.cooking)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
              <span className="text-slate-600 font-medium">{t('lastDetails.gateClosing')}</span>
              <div className="font-bold text-slate-800">{renderBadgeValue(details.rules.gateClosingTime)}</div>
            </div>
          </div>
        </div>

        {/* 7. ทำเลและสภาพแวดล้อม */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.environmentTitle')}</span>
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
              <span className="text-slate-600 font-medium">{t('lastDetails.nearMainRoad')}</span>
              <div className="font-bold text-slate-800 text-right">{renderBadgeValue(details.environment.nearMainRoad)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
              <span className="text-slate-600 font-medium">{t('lastDetails.nearPub')}</span>
              <div className="font-bold text-slate-800 text-right">{renderBadgeValue(details.environment.nearPub)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
              <span className="text-slate-600 font-medium">{t('lastDetails.noiseLevel')}</span>
              <div>{renderBadgeValue(details.environment.noiseLevel)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
              <span className="text-slate-600 font-medium flex-1">{t('lastDetails.floodRisk')}</span>
              <div className="flex-shrink-0">{renderBadgeValue(details.environment.floodRisk)}</div>
            </div>
          </div>
        </div>

        {/* 8. สถานที่ใกล้เคียง (ระยะทางตาม Excel ต้นฉบับ) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <span>{t('lastDetails.nearbyPlacesTitle')}</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold">
                  <th className="py-1.5 pr-2 font-semibold">{t('lastDetails.thPlace')}</th>
                  <th className="py-1.5 pl-2 text-right font-semibold">{t('lastDetails.thDistance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 pr-2 font-medium text-slate-600">7-Eleven</td>
                  <td className="py-2.5 pl-2 text-right font-black text-amber-700">
                    {renderBadgeValue(details.nearbyPlaces.sevenEleven)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 pr-2 font-medium text-slate-600">Lotus's go fresh</td>
                  <td className="py-2.5 pl-2 text-right font-black text-amber-700">
                    {renderBadgeValue(details.nearbyPlaces.lotusGoFresh)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 pr-2 font-medium text-slate-600">Big C mini</td>
                  <td className="py-2.5 pl-2 text-right font-black text-amber-700">
                    {renderBadgeValue(details.nearbyPlaces.bigCMini)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 pr-2 font-medium text-slate-600">
                    {translateNearbyPlaceName('ตลาดบังเอิญ', isEn)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-black text-amber-700">
                    {renderBadgeValue(details.nearbyPlaces.bungEunMarket)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 pr-2 font-medium text-slate-600">
                    {translateNearbyPlaceName('ร้านอาหารศูนย์อาหารมีเจริญ', isEn)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-black text-amber-700">
                    {renderBadgeValue(details.nearbyPlaces.meeCharoenFoodCenter)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 9. ข้อมูลติดต่อ (จุดเดียวในหน้า Detail) */}
      <div id="contact-section" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 scroll-mt-24">
        <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
          <Phone className="w-5 h-5 text-amber-500" />
          <span>{t('lastDetails.contactTitle')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Phone */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex flex-col justify-between gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>{t('lastDetails.phoneNumber')}</span>
            </span>
            <div className="pt-1 min-w-0">
              {details.contact.phone && details.contact.phone !== 'ไม่มีข้อมูล' && details.contact.phone !== '-' && details.contact.phone !== 'ไม่มี' ? (
                (() => {
                  const phoneList = details.contact.phone
                    .split(/[,/]|และ/)
                    .map((p) => p.trim())
                    .filter(Boolean);

                  return (
                    <div className="flex flex-col gap-1 min-w-0">
                      {phoneList.map((p, idx) => (
                        <a
                          key={idx}
                          href={`tel:${p.replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-1.5 font-black text-amber-950 text-xs sm:text-sm hover:underline hover:text-amber-700 min-w-0 max-w-full"
                          title={isEn ? `Call ${p}` : `โทรหา ${p}`}
                        >
                          <Phone className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          <span className="truncate">{p}</span>
                        </a>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <span className="text-slate-400 italic text-xs">{isEn ? 'No information' : 'ไม่มีข้อมูล'}</span>
              )}
            </div>
          </div>

          {/* Line ID */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex flex-col justify-between gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{t('lastDetails.lineId')}</span>
            </span>
            <div className="pt-1 min-w-0">
              {details.contact.lineId && details.contact.lineId !== 'ไม่มีข้อมูล' && details.contact.lineId !== '-' && details.contact.lineId !== 'ไม่มี' && details.contact.lineId !== 'ไม่ระบุ' ? (
                (() => {
                  const lineRaw = details.contact.lineId.trim();
                  const lineHref = lineRaw.startsWith('http')
                    ? lineRaw
                    : `https://line.me/ti/p/~${lineRaw}`;

                  return (
                    <a
                      href={lineHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-black text-emerald-950 text-xs sm:text-sm hover:underline hover:text-emerald-700 min-w-0 max-w-full"
                      title={`Line ID: ${lineRaw}`}
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate select-all">{lineRaw}</span>
                    </a>
                  );
                })()
              ) : (
                <span className="text-slate-400 italic text-xs">{isEn ? 'No information' : 'ไม่มีข้อมูล'}</span>
              )}
            </div>
          </div>

          {/* Facebook */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex flex-col justify-between gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Facebook className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>{t('lastDetails.facebook')}</span>
            </span>
            <div className="pt-1 min-w-0">
              {details.contact.facebook && details.contact.facebook !== 'ไม่มีข้อมูล' && details.contact.facebook !== '-' && details.contact.facebook !== 'ไม่มี' && details.contact.facebook !== 'ไม่ระบุ' ? (
                (() => {
                  const fbRaw = details.contact.facebook.trim();
                  const fbHref = fbRaw.startsWith('http')
                    ? fbRaw
                    : `https://www.facebook.com/search/top?q=${encodeURIComponent(fbRaw)}`;

                  return (
                    <a
                      href={fbHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-black text-blue-950 text-xs sm:text-sm hover:underline hover:text-blue-700 min-w-0 max-w-full"
                      title={`Facebook: ${fbRaw}`}
                    >
                      <Facebook className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      <span className="truncate select-all flex-1 min-w-0">{fbRaw}</span>
                      <ExternalLink className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    </a>
                  );
                })()
              ) : (
                <span className="text-slate-400 italic text-xs">{isEn ? 'No information' : 'ไม่มีข้อมูล'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
