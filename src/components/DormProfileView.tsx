'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Phone, MessageCircle, ShieldCheck, 
  Wind, Wifi, Car, Key, Video, Users, 
  AlertTriangle, Navigation, ExternalLink, ChevronLeft,
  Clock, Compass, Bed, Tv, Refrigerator, Building,
  CheckCircle2, XCircle, DollarSign, FileText, Share2,
  Shield, Lock, Sparkles, Fan, Snowflake, Store, Heart,
  ChevronDown, Dog, Waves, ShieldAlert, BookOpen, Clock4, Loader2,
  Calendar
} from 'lucide-react';
import { Dormitory, PriceStructure } from '@/types/dormitory';
import NavigationModal from '@/components/NavigationModal';
import ShareButton from '@/components/ShareButton';
import { getNearbyLandmarks } from '@/data/landmarks';
import { useFavorites } from '@/hooks/useFavorites';

interface DormProfileViewProps {
  dorm: Dormitory;
}

const WHITE_DORM_CRITERIA = [
  {
    id: 'security',
    number: 1,
    title: 'ความปลอดภัย & ไร้อบายมุข',
    icon: Shield,
    summary: 'มีกล้องวงจรปิด/รปภ. ดูแล และไม่มีการพนัน สุรา หรือยาเสพติดในบริเวณหอพัก',
    details: [
      'ติดตั้งกล้องวงจรปิด (CCTV) บันทึกภาพตลอด 24 ชั่วโมงในจุดเข้า-ออกและโถงทางเดิน',
      'มีระบบควบคุมการเข้าออกที่ปลอดภัย เช่น ประตูคีย์การ์ด หรือผู้ดูแลประจำ',
      'ปลอดการพนัน เครื่องดื่มแอลกอฮอล์ และสิ่งเสพติดทุกชนิดในบริเวณหอพัก',
      'มีแสงสว่างรอบอาคารและบริเวณลานจอดรถเพียงพอในยามค่ำคืน',
    ],
    tags: ['กล้อง CCTV', 'คีย์การ์ด', 'ปลอดอบายมุข'],
  },
  {
    id: 'cleanliness',
    number: 2,
    title: 'สะอาด & ถูกสุขลักษณะ',
    icon: CheckCircle2,
    summary: 'ห้องพักและพื้นที่ส่วนรวมสะอาด ถูกสุขอนามัย มีระบบกำจัดขยะมิดชิด',
    details: [
      'ห้องพักและพื้นที่ส่วนกลางสะอาด มีการทำความสะอาดและดูแลรักษาอย่างสม่ำเสมอ',
      'มีถังขยะและจุดคัดแยกขยะที่ถูกสุขอนามัย มีฝาปิดมิดชิดป้องกันสัตว์นำโรค',
      'ระบบระบายน้ำและสิ่งปฏิกูลได้มาตรฐาน ไม่มีน้ำท่วมขังหรือกลิ่นรบกวน',
      'การระบายอากาศและแสงสว่างในห้องพักถ่ายเทได้สะดวก ไม่อับชื้น',
    ],
    tags: ['ถูกสุขอนามัย', 'จัดการขยะมิดชิด', 'ไม่อับชื้น'],
  },
  {
    id: 'facilities',
    number: 3,
    title: 'สิ่งอำนวยความสะดวก & การเรียนรู้',
    icon: BookOpen,
    summary: 'มีสถานที่ทบทวนตำรา อินเทอร์เน็ต (Wi-Fi) และระบบสาธารณูปโภคปลอดภัย',
    details: [
      'มีสัญญาณอินเทอร์เน็ตความเร็วสูง (Wi-Fi) เสถียรและครอบคลุมทุกห้องพัก',
      'มีโต๊ะ เก้าอี้ หรือพื้นที่สงบสำหรับอ่านหนังสือและทำงานค้นคว้า',
      'ระบบน้ำประปาและไฟฟ้ามีความเสถียร มีเบรกเกอร์ตัดไฟปลอดภัย',
      'สิ่งอำนวยความสะดวกพื้นฐาน เช่น ที่จอดรถ เครื่องซักผ้าหยอดเหรียญ หรือตู้น้ำดื่ม',
    ],
    tags: ['Wi-Fi ความเร็วสูง', 'โต๊ะอ่านหนังสือ', 'ระบบไฟปลอดภัย'],
  },
  {
    id: 'care24h',
    number: 4,
    title: 'อุ่นใจ 24 ชั่วโมง & ช่วยเหลือฉุกเฉิน',
    icon: Clock4,
    summary: 'มีผู้ดูแลหรือช่องทางติดต่อเพื่อช่วยเหลือฉุกเฉินตลอด 24 ชม.',
    details: [
      'มีผู้ดูแลหอพักประจำ หรือมีช่องทางโทรศัพท์ติดต่อฉุกเฉินได้ตลอด 24 ชั่วโมง',
      'มีตู้ยาสามัญประจำบ้านและชุดปฐมพยาบาลเบื้องต้น',
      'มีแนวทางและช่องทางติดต่อส่งต่อนักศึกษาที่เจ็บป่วยฉุกเฉินไปยังโรงพยาบาล ม.อุบลฯ ทันที',
    ],
    tags: ['ติดต่อได้ 24 ชม.', 'ปฐมพยาบาล', 'ส่งต่อ รพ.'],
  },
  {
    id: 'building',
    number: 5,
    title: 'มาตรฐานอาคาร & ป้องกันอัคคีภัย',
    icon: Building,
    summary: 'มีระเบียบประกาศชัดเจน มีอุปกรณ์ดับเพลิง และมีแผนผัง/ป้ายทางหนีไฟที่ได้มาตรฐาน',
    details: [
      'มีถังดับเพลิงเคมีติดตั้งในตำแหน่งที่เห็นเด่นชัดทุกชั้น พร้อมใช้งาน',
      'มีป้ายบอกทางหนีไฟและแผนผังอพยพกรณีเกิดเหตุฉุกเฉินชัดเจน',
      'โครงสร้างอาคารมั่นคง แข็งแรง ผ่านการตรวจสอบความปลอดภัย',
      'มีระเบียบข้อบังคับและข้อปฏิบัติของหอพักติดประกาศชัดเจนเพื่อความสงบเรียบร้อย',
    ],
    tags: ['ถังดับเพลิงทุกชั้น', 'ป้ายทางหนีไฟ', 'ระเบียบชัดเจน'],
  },
];

export default function DormProfileView({ dorm }: DormProfileViewProps) {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  
  // จัดการ State โหลดรูปภาพอย่างปลอดภัย ป้องกันปัญหาค้างถาวร
  const initialImageSrc = encodeURI((dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg');
  const [currentImgSrc, setCurrentImgSrc] = useState(initialImageSrc);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageHasError, setImageHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // ตรวจสอบสถานะการโหลดและแก้ไข Race Condition กรณีที่เบราว์เซอร์แคชรูปภาพไว้แล้วก่อน React Mount
  useEffect(() => {
    const targetSrc = encodeURI((dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg');
    setCurrentImgSrc(targetSrc);
    setImageHasError(false);

    // 1. ตรวจสอบว่าภาพถูกโหลดเสร็จจาก Cache ของเบราว์เซอร์ไปก่อนหน้านี้แล้วหรือไม่ (img.complete)
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsImageLoaded(true);
    } else {
      setIsImageLoaded(false);
    }

    // 2. Failsafe Timeout: หากผ่านไป 3.5 วินาทีแล้วไม่มี Event ตอบสนอง ให้ปลดล็อกแสดงผลอัตโนมัติ ไม่ค้างจอโหลด
    const failsafeTimer = setTimeout(() => {
      setIsImageLoaded(true);
    }, 3500);

    return () => clearTimeout(failsafeTimer);
  }, [dorm.id, dorm.image, dorm.images]);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    if (!imageHasError) {
      setImageHasError(true);
      setCurrentImgSrc('/Picture/default-dorm.jpg');
    }
    // ปลดล็อกการโหลดเสมอแม้รูปจะเสีย เพื่อให้แสดงภาพ Default แทนการค้าง Skeleton
    setIsImageLoaded(true);
  }, [imageHasError]);

  // Default state: Collapsed (hidden) by default
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isSaved = isFavorite(dorm.id);
  const [saveStatusMessage, setSaveStatusMessage] = useState('');

  const handleToggleFavorite = () => {
    const willBeSaved = !isFavorite(dorm.id);
    toggleFavorite(dorm.id);
    if (willBeSaved) {
      setSaveStatusMessage(`บันทึกแล้ว: บันทึก ${dorm.name} ลงในรายการโปรดเรียบร้อยแล้ว`);
    } else {
      setSaveStatusMessage(`ยกเลิกแล้ว: ยกเลิกการบันทึก ${dorm.name}`);
    }
  };

  const [isLaunchingNav, setIsLaunchingNav] = useState(false);

  const handleStartNavigation = () => {
    setIsLaunchingNav(true);
    setIsNavOpen(true);
    setTimeout(() => setIsLaunchingNav(false), 1000);
  };

  const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');
  const evaluationDate = dorm.evaluationDate || dorm.evalDate;

  // Structured price resolution
  const priceObj: PriceStructure | null = 
    dorm.prices || (typeof dorm.price === 'object' && dorm.price !== null ? (dorm.price as PriceStructure) : null);

  const fanPrice = priceObj?.fan ?? null;
  const airPrice = priceObj?.air ?? null;
  const hasBothPrices = fanPrice !== null && airPrice !== null && fanPrice !== airPrice;

  // External website / facebook link resolution
  const hasExternalLink = Boolean(
    dorm.facebook && 
    dorm.facebook.trim() !== '' && 
    dorm.facebook.trim() !== '-' && 
    dorm.facebook.trim() !== 'ไม่มี'
  );

  const externalName = hasExternalLink ? dorm.facebook : (dorm.name || 'เพจหอพัก');

  const externalHref = hasExternalLink
    ? (dorm.facebook.startsWith('http') 
        ? dorm.facebook 
        : `https://www.facebook.com/search/top?q=${encodeURIComponent(dorm.facebook)}`)
    : undefined;

  // Multiple phone numbers resolution
  const hasPhone = Boolean(
    dorm.phone && 
    dorm.phone.trim() !== '' && 
    dorm.phone.trim() !== '-' && 
    dorm.phone.trim() !== 'ไม่มี'
  );

  const phoneList = hasPhone
    ? (dorm.phone || '')
        .split(/[,/]|และ/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // LINE ID resolution & Clickable link formatting
  const rawLine = (dorm.lineId || '').trim();
  const hasValidLine = Boolean(
    rawLine &&
    rawLine !== '-' &&
    rawLine !== 'ไม่มี' &&
    rawLine !== 'ไม่ระบุ' &&
    rawLine !== 'ไม่ทราบ'
  );

  let lineHref: string | undefined = undefined;
  let displayLineId = rawLine;

  if (hasValidLine) {
    if (rawLine.startsWith('http://') || rawLine.startsWith('https://')) {
      lineHref = rawLine;
      const match = rawLine.match(/line\.me\/ti\/p\/~?(.+)/i);
      if (match && match[1]) {
        displayLineId = match[1];
      }
    } else {
      lineHref = `https://line.me/ti/p/~${rawLine}`;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-36 sm:pb-40">
      {/* Accessibility M-01 Screen Reader Live Status Announcer */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only" 
        id="save-status-announcer"
      >
        {saveStatusMessage}
      </div>

      {/* Top Header Action Bar (Glassmorphism Style) - Positioned below Navbar to avoid collision */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 bg-[#0a1931]/90 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 sm:py-3 text-white shadow-lg shadow-black/10 transition-all duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back Button: Glassmorphic Icon Button */}
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all duration-200 active:scale-95 flex-shrink-0 shadow-sm cursor-pointer"
            title="ย้อนกลับหน้าหลัก"
            aria-label="ย้อนกลับ"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Action Group: Favorite & Share */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Favorite / Bookmark Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-pressed={isFavorite(dorm.id)}
              aria-label={isFavorite(dorm.id) ? `ยกเลิกบันทึกหอพัก ${dorm.name}` : `บันทึกหอพัก ${dorm.name}`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border backdrop-blur-md shadow-sm active:scale-95 whitespace-nowrap ${
                isFavorite(dorm.id)
                  ? 'bg-rose-500/90 text-white border-rose-400/80 shadow-rose-500/25'
                  : 'bg-white/10 text-blue-100 hover:text-rose-300 hover:bg-white/20 border-white/15'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite(dorm.id) ? 'fill-white' : ''}`} aria-hidden="true" />
              <span>{isFavorite(dorm.id) ? 'บันทึกแล้ว' : 'บันทึก'}</span>
            </button>

            {/* Share Button with Full Accessibility M-06 Standards */}
            <ShareButton
              title={dorm.name}
              dormName={dorm.name}
              text={`ดูข้อมูลและแผนที่หอพัก ${dorm.name} (${dorm.zone}) มหาวิทยาลัยอุบลราชธานี`}
              variant="glass"
            />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Image Showcase */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-200 h-64 sm:h-96 shadow-md border border-slate-200/80">
          {/* Shimmer Loading Skeleton */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex flex-col items-center justify-center text-slate-400 gap-2 z-0">
              <Building className="w-12 h-12 text-slate-300 animate-bounce" />
              <span className="text-xs font-semibold text-slate-500">กำลังโหลดรูปภาพหอพัก...</span>
            </div>
          )}

          <img 
            ref={imgRef}
            src={currentImgSrc} 
            alt={dorm.name}
            fetchPriority="high"
            decoding="async"
            className={`w-full h-full object-cover transition-opacity duration-300 relative z-10 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Minimalist White Dormitory Badge on Image */}
          {isWhite ? (
            <div className="absolute top-4 left-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 bg-blue-950/95 backdrop-blur-md text-amber-300 px-3.5 py-1.5 rounded-2xl sm:rounded-full shadow-lg text-xs sm:text-sm font-black border border-amber-400/40 z-20">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>หอพักสีขาว ม.อุบลฯ</span>
              </div>
              {evaluationDate && (
                <span className="text-[11px] text-amber-200/90 font-medium sm:border-l sm:border-amber-400/30 sm:pl-2">
                  ตรวจเมื่อ: {evaluationDate}
                </span>
              )}
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium z-20 flex items-center gap-1.5">
              <span>ผลประเมิน: {dorm.status || dorm.evalResult || 'หอพักทั่วไป'}</span>
              {evaluationDate && <span className="text-slate-300">({evaluationDate})</span>}
            </div>
          )}

          <div className="absolute bottom-4 right-4 bg-blue-950/80 backdrop-blur-md text-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold z-20">
            {dorm.genderType === 'female' || dorm.genderType === 'หอพักหญิง'
              ? 'หอพักหญิง'
              : dorm.genderType === 'male' || dorm.genderType === 'หอพักชาย'
              ? 'หอพักชาย'
              : 'หอพักรวม'}
          </div>
        </div>

        {/* Title & Pricing Card with Dual Room Prices Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
                {dorm.name}
              </h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{dorm.zone || 'รอบ ม.อุบลฯ'}</span>
                </span>
                {dorm.nearMainRoad && <span>• {dorm.nearMainRoad}</span>}
                {evaluationDate && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>วันที่ประเมิน: {evaluationDate}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-amber-600 sm:text-right">
              {hasBothPrices ? (
                <>
                  <span className="text-3xl sm:text-4xl font-black text-amber-600">
                    ฿{Math.min(fanPrice!, airPrice!).toLocaleString()}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-700">
                    {' '}- {Math.max(fanPrice!, airPrice!).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-amber-600">
                  ฿{(airPrice || fanPrice || dorm.minPrice || 0).toLocaleString()}
                </span>
              )}
              <span className="text-xs text-slate-400 font-normal"> / เดือน</span>
            </div>
          </div>

          {/* Room Type Pricing Breakdown (ห้องพัดลม vs ห้องแอร์) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Fan Room Card */}
            <div className={`p-4 rounded-2xl border transition flex items-center justify-between ${
              fanPrice !== null 
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' 
                : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fanPrice !== null ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-200 text-slate-400'}`}>
                  <Fan className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">ห้องพัดลม</h4>
                  {fanPrice === null && (
                    <p className="text-xs text-slate-400">ไม่มีห้องประเภทนี้</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {fanPrice !== null ? (
                  <div>
                    <span className="text-lg font-black text-amber-700">฿{fanPrice.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 font-normal"> /ด.</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">-</span>
                )}
              </div>
            </div>

            {/* Air Conditioned Room Card */}
            <div className={`p-4 rounded-2xl border transition flex items-center justify-between ${
              airPrice !== null 
                ? 'bg-blue-50/80 border-blue-200/80 text-blue-950' 
                : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${airPrice !== null ? 'bg-blue-200/70 text-blue-900' : 'bg-slate-200 text-slate-400'}`}>
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">ห้องปรับอากาศ (แอร์)</h4>
                  {airPrice === null && (
                    <p className="text-xs text-slate-400">ไม่มีห้องประเภทนี้</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {airPrice !== null ? (
                  <div>
                    <span className="text-lg font-black text-blue-800">฿{airPrice.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 font-normal"> /ด.</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">-</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 italic mt-4">
            หมายเหตุ: ข้อมูลนี้เป็นข้อมูลพื้นฐานเพื่อประกอบการตัดสินใจ โปรดติดต่อสอบถามสถานะห้องว่างและราคาปัจจุบันกับทางหอพักโดยตรง
          </p>
        </div>

        {/* Amenities Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>สิ่งอำนวยความสะดวกและกฎระเบียบ</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            {/* Air Condition */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              airPrice !== null ? 'bg-blue-50/80 text-blue-900 border-blue-200/60' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
            }`}>
              <Wind className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{airPrice !== null ? 'เครื่องปรับอากาศ' : 'ไม่มีแอร์'}</span>
            </div>

            {/* Fan */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              fanPrice !== null ? 'bg-amber-50/80 text-amber-900 border-amber-200/60' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
            }`}>
              <Fan className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{fanPrice !== null ? 'พัดลม' : 'ไม่มีพัดลม'}</span>
            </div>

            {/* Wi-Fi */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              dorm.wifi ? 'bg-emerald-50 text-emerald-900 border-emerald-200/60' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
            }`}>
              <Wifi className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{dorm.wifi ? 'ฟรีอินเทอร์เน็ต Wi-Fi' : 'ไม่มี Wi-Fi'}</span>
            </div>

            {/* Parking */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              dorm.parking ? 'bg-blue-50 text-blue-900 border-blue-200/60' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
            }`}>
              <Car className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{dorm.parking ? 'มีที่จอดรถยนต์/มอเตอร์ไซค์' : 'ไม่มีที่จอดรถ'}</span>
            </div>

            {/* CCTV */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              dorm.cctv ? 'bg-indigo-50 text-indigo-900 border-indigo-200/60' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
            }`}>
              <Video className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{dorm.cctv ? 'กล้องวงจรปิด CCTV' : 'ไม่มี CCTV'}</span>
            </div>

            {/* Pet Policy: 100% Opacity with Distinct Rule Styling */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              dorm.allowPet 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80 shadow-xs' 
                : 'bg-rose-50 text-rose-900 border-rose-200/80 shadow-xs'
            }`}>
              <Dog className={`w-4 h-4 flex-shrink-0 ${dorm.allowPet ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{dorm.allowPet ? 'เลี้ยงสัตว์ได้ 🐶' : 'ห้ามเลี้ยงสัตว์ 🚫'}</span>
            </div>

            {/* Flood Risk */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              !dorm.floodRisk ? 'bg-cyan-50 text-cyan-900 border-cyan-200/60' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
            }`}>
              <Waves className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span>{!dorm.floodRisk ? 'พื้นที่ไม่เสี่ยงน้ำท่วม' : 'พื้นที่เสี่ยงน้ำท่วม'}</span>
            </div>

            {/* White Dorm Status */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between font-bold ${
              isWhite ? 'bg-amber-50 text-amber-900 border-amber-200/80 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isWhite ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{isWhite ? 'ผ่านเกณฑ์หอพักสีขาว' : 'หอพักทั่วไป'}</span>
              </div>
              {evaluationDate && (
                <span className="text-[10px] font-normal text-amber-900/80 bg-amber-100/80 border border-amber-300/60 px-2 py-0.5 rounded-lg shadow-2xs">
                  {evaluationDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* White Dormitory Standards Accordion (เกณฑ์หอพักสีขาว ม.อุบลฯ - Collapsible) */}
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-blue-50/40 rounded-3xl border border-amber-200/80 shadow-sm overflow-hidden transition-all duration-300">
          {/* Header Bar with Golden Shield (Click to Toggle Accordion) */}
          <button
            onClick={() => setIsCriteriaOpen(!isCriteriaOpen)}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-amber-50/50 transition-colors active:scale-[0.99] select-none cursor-pointer"
            aria-expanded={isCriteriaOpen}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 border border-amber-400/40 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 font-bold" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-blue-950 text-base sm:text-lg">
                    เกณฑ์หอพักสีขาว ม.อุบลฯ
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                    5 ด้านมาตรฐาน
                  </span>
                  {evaluationDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      ตรวจประเมิน: {evaluationDate}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  แตะเพื่อดูข้อกำหนด 5 ด้าน และมาตรฐานความปลอดภัยสำหรับนักศึกษา
                </p>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-300 flex-shrink-0 ${
              isCriteriaOpen ? 'rotate-180 bg-amber-100 text-amber-800' : ''
            }`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {/* Collapsible Content with Smooth CSS Transition */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCriteriaOpen ? 'max-h-[2200px] opacity-100 border-t border-amber-100/80' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-4 sm:p-6 space-y-3">
              {/* 5 Topic Sub-Accordions (Single Active State prevents overlapping) */}
              <div className="space-y-2.5">
                {WHITE_DORM_CRITERIA.map((criterion) => {
                  const IconComponent = criterion.icon;
                  const isItemExpanded = activeCriterionId === criterion.id;

                  return (
                    <div
                      key={criterion.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isItemExpanded
                          ? 'bg-amber-50/40 border-amber-300/80 shadow-sm ring-1 ring-amber-300/40'
                          : 'bg-white/90 border-slate-200/80 hover:border-amber-200 hover:bg-amber-50/20'
                      }`}
                    >
                      {/* Topic Trigger Button */}
                      <button
                        onClick={() => setActiveCriterionId(isItemExpanded ? null : criterion.id)}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left gap-3 select-none cursor-pointer transition-colors"
                        aria-expanded={isItemExpanded}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isItemExpanded
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-amber-100/80 text-amber-700'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                                ด้านที่ {criterion.number}
                              </span>
                              <h4 className="font-bold text-blue-950 text-xs sm:text-sm truncate">
                                {criterion.title}
                              </h4>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {criterion.summary}
                            </p>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                          isItemExpanded ? 'rotate-180 text-amber-700 bg-amber-100' : ''
                        }`}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* Smooth Expanding Details */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden px-4 sm:px-5 ${
                          isItemExpanded
                            ? 'max-h-96 opacity-100 pb-4 pt-2 border-t border-amber-200/50'
                            : 'max-h-0 opacity-0 pb-0 pt-0'
                        }`}
                      >
                        <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                          {criterion.details.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-amber-100">
                          <span className="text-[10px] font-semibold text-slate-400">จุดเด่น:</span>
                          {criterion.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-medium bg-white text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg shadow-2xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Note with Official University Announcement Reference */}
              <div className="pt-2">
                <div className="p-3.5 bg-amber-100/70 rounded-2xl text-amber-950 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-200/80">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      หอพักที่มีสัญลักษณ์ <strong>หอพักสีขาว</strong> ได้รับการตรวจสอบและประเมินผ่านเกณฑ์โดยมหาวิทยาลัยอุบลราชธานี
                    </span>
                  </div>
                  <a
                    href="https://www.ubu.ac.th/web/student/news/27385/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-950 hover:text-blue-700 font-bold underline underline-offset-4 flex-shrink-0 text-xs transition"
                    title="เปิดหน้าประกาศเกณฑ์หอพักสีขาว มหาวิทยาลัยอุบลราชธานี ในแท็บใหม่"
                  >
                    <span>อ้างอิงประกาศเกณฑ์หอพักสีขาว ม.อุบลฯ</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Landmarks & POIs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              <span>จุดสังเกตและสถานที่ใกล้เคียง</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {getNearbyLandmarks(dorm.lat ?? dorm.latitude, dorm.lng ?? dorm.longitude, 6).map((lm, idx) => (
              <div 
                key={`poi-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/90 border border-slate-100 hover:border-amber-200 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-lg flex-shrink-0">{lm.meta.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{lm.name}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{lm.meta.label}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0 border border-amber-200/50">
                  {lm.distFormatted}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info Card */}
        <div id="contact-section" className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 scroll-mt-24">
          <h3 className="font-extrabold text-blue-950 text-lg">ช่องทางติดต่อเจ้าของหอพัก</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Phone Button(s) */}
            {hasPhone ? (
              phoneList.length > 1 ? (
                <div className="flex flex-col justify-center gap-1.5 p-2 bg-amber-50 rounded-2xl border border-amber-200/80">
                  {phoneList.map((p, idx) => (
                    <a
                      key={idx}
                      href={`tel:${p.replace(/[^\d+]/g, '')}`}
                      className="flex items-center justify-center gap-2 py-1 px-2.5 bg-white/90 hover:bg-amber-100/90 text-amber-950 rounded-xl font-bold text-xs sm:text-sm transition border border-amber-200/60 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="truncate">{p}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  href={`tel:${(phoneList[0] || dorm.phone || '').replace(/[^\d+]/g, '')}`}
                  className="flex items-center justify-center gap-2.5 p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-2xl font-bold text-sm transition border border-amber-200/80"
                >
                  <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="truncate">{dorm.phone || 'โทรสอบถาม'}</span>
                </a>
              )
            ) : (
              <div className="flex items-center justify-center gap-2.5 p-3.5 bg-slate-50 text-slate-400 rounded-2xl text-sm border border-slate-200/60">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate text-slate-500">
                  โทร: <span className="italic text-gray-400 font-normal">ไม่มีข้อมูล</span>
                </span>
              </div>
            )}

            {/* 2. LINE Button */}
            {hasValidLine ? (
              <a
                href={lineHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 p-3.5 bg-green-50 hover:bg-green-100 text-green-900 rounded-2xl font-semibold text-sm border border-green-200/60 transition cursor-pointer"
                title={`เพิ่มเพื่อนใน LINE: ${displayLineId}`}
              >
                <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="truncate">Line: {displayLineId}</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2.5 p-3.5 bg-slate-50 text-slate-400 rounded-2xl text-sm border border-slate-200/60">
                <MessageCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate text-slate-500">
                  Line: <span className="italic text-gray-400 font-normal">ไม่มีข้อมูล</span>
                </span>
              </div>
            )}

            {/* 3. External / Facebook / Website Button */}
            {hasExternalLink ? (
              <a
                href={externalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl font-semibold text-sm border border-blue-200/60 transition cursor-pointer"
                title={externalName}
              >
                <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">{externalName}</span>
              </a>
            ) : (
              <div
                className="flex items-center justify-center gap-2.5 p-3.5 bg-blue-50 text-blue-900 rounded-2xl font-semibold text-sm border border-blue-200/60"
                title={externalName}
              >
                <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">{externalName}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Main Call to Action: เริ่มนำทาง (Start Navigation) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button 
            onClick={handleStartNavigation}
            disabled={isLaunchingNav}
            className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 hover:from-blue-900 hover:to-indigo-900 text-amber-300 font-black py-4 px-6 rounded-2xl shadow-xl shadow-blue-950/20 active:scale-[0.98] transition text-base sm:text-lg border border-amber-400/30 disabled:opacity-80"
          >
            {isLaunchingNav ? (
              <>
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                <span>กำลังค้นหาตำแหน่ง & เชื่อมต่อ GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>เริ่มนำทาง (Start Navigation)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Modal */}
      {isNavOpen && (
        <NavigationModal 
          dorm={dorm}
          onClose={() => setIsNavOpen(false)}
        />
      )}

      {/* Screen Reader Announcement for Accessibility Test Case M-01 */}
      <div aria-live="polite" className="sr-only">
        {isSaved ? 'บันทึกการ์ดเรียบร้อยแล้ว' : 'ยกเลิกการบันทึกการ์ดแล้ว'}
      </div>
    </div>
  );
}
