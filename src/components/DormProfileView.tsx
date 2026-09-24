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
import { useFavorites } from '@/hooks/useFavorites';
import { parseThaiDateToIso, formatThaiDateFull } from '@/utils/dateUtils';
import { trackDormitoryView, trackMapClick } from '@/utils/analytics';
import DormLastDetailsSection from '@/components/DormLastDetailsSection';
import { getDormLatestDetails } from '@/data/dormDetailsLast';
import { useLanguage } from '@/context/LanguageContext';
import { translateZone, getDormName, translateDormValue } from '@/utils/bilingualHelpers';

interface DormProfileViewProps {
  dorm: Dormitory;
}

const getWhiteDormCriteria = (isEn: boolean) => [
  {
    id: 'security',
    number: 1,
    title: isEn ? 'Safety & Vice-Free Environment' : 'ความปลอดภัย & ไร้อบายมุข',
    icon: Shield,
    summary: isEn ? '24h CCTV/Security monitoring, strictly no gambling, alcohol, or drugs on premises.' : 'มีกล้องวงจรปิด/รปภ. ดูแล และไม่มีการพนัน สุรา หรือยาเสพติดในบริเวณหอพัก',
    details: isEn ? [
      '24-hour CCTV camera surveillance at entrance, exit, and hallway points',
      'Secure access control system, such as keycard entry or resident supervisor',
      'Strictly alcohol, gambling, and drug-free environment throughout the premises',
      'Adequate nighttime exterior and parking lot illumination',
    ] : [
      'ติดตั้งกล้องวงจรปิด (CCTV) บันทึกภาพตลอด 24 ชั่วโมงในจุดเข้า-ออกและโถงทางเดิน',
      'มีระบบควบคุมการเข้าออกที่ปลอดภัย เช่น ประตูคีย์การ์ด หรือผู้ดูแลประจำ',
      'ปลอดการพนัน เครื่องดื่มแอลกอฮอล์ และสิ่งเสพติดทุกชนิดในบริเวณหอพัก',
      'มีแสงสว่างรอบอาคารและบริเวณลานจอดรถเพียงพอในยามค่ำคืน',
    ],
    tags: isEn ? ['CCTV', 'Keycard', 'Vice-Free'] : ['กล้อง CCTV', 'คีย์การ์ด', 'ปลอดอบายมุข'],
  },
  {
    id: 'cleanliness',
    number: 2,
    title: isEn ? 'Cleanliness & Sanitation' : 'สะอาด & ถูกสุขลักษณะ',
    icon: CheckCircle2,
    summary: isEn ? 'Clean rooms and common areas, hygienic waste disposal system.' : 'ห้องพักและพื้นที่ส่วนรวมสะอาด ถูกสุขอนามัย มีระบบกำจัดขยะมิดชิด',
    details: isEn ? [
      'Clean living units and common spaces regularly cleaned and maintained',
      'Covered and segregated trash bins preventing pest harborage',
      'Standardized drainage and sewage preventing flooding or unpleasant odor',
      'Good natural ventilation and sufficient room lighting without dampness',
    ] : [
      'ห้องพักและพื้นที่ส่วนกลางสะอาด มีการทำความสะอาดและดูแลรักษาอย่างสม่ำเสมอ',
      'มีถังขยะและจุดคัดแยกขยะที่ถูกสุขอนามัย มีฝาปิดมิดชิดป้องกันสัตว์นำโรค',
      'ระบบระบายน้ำและสิ่งปฏิกูลได้มาตรฐาน ไม่มีน้ำท่วมขังหรือกลิ่นรบกวน',
      'การระบายอากาศและแสงสว่างในห้องพักถ่ายเทได้สะดวก ไม่อับชื้น',
    ],
    tags: isEn ? ['Hygienic', 'Covered Trash', 'Well-Ventilated'] : ['ถูกสุขอนามัย', 'จัดการขยะมิดชิด', 'ไม่อับชื้น'],
  },
  {
    id: 'facilities',
    number: 3,
    title: isEn ? 'Facilities & Study Space' : 'สิ่งอำนวยความสะดวก',
    icon: BookOpen,
    summary: isEn ? 'Study areas, stable high-speed Wi-Fi, and safe utility systems.' : 'มีสถานที่ทบทวนตำรา อินเทอร์เน็ต (Wi-Fi) และระบบสาธารณูปโภคปลอดภัย',
    details: isEn ? [
      'Stable high-speed Wi-Fi coverage across all rooms',
      'Quiet study desks, chairs, or designated reading areas for assignments',
      'Reliable tap water and electric systems with safety circuit breakers',
      'Essential amenities like parking, coin laundry, or drinking water dispenser',
    ] : [
      'มีสัญญาณอินเทอร์เน็ตความเร็วสูง (Wi-Fi) เสถียรและครอบคลุมทุกห้องพัก',
      'มีโต๊ะ เก้าอี้ หรือพื้นที่สงบสำหรับอ่านหนังสือและทำงานค้นคว้า',
      'ระบบน้ำประปาและไฟฟ้ามีความเสถียร มีเบรกเกอร์ตัดไฟปลอดภัย',
      'สิ่งอำนวยความสะดวกพื้นฐาน เช่น ที่จอดรถ เครื่องซักผ้าหยอดเหรียญ หรือตู้น้ำดื่ม',
    ],
    tags: isEn ? ['High-Speed Wi-Fi', 'Study Desk', 'Electrical Safety'] : ['Wi-Fi ความเร็วสูง', 'โต๊ะอ่านหนังสือ', 'ระบบไฟปลอดภัย'],
  },
  {
    id: 'care24h',
    number: 4,
    title: isEn ? '24/7 Emergency Care' : 'อุ่นใจดูแลฉุกเฉิน 24 ชม.',
    icon: Clock4,
    summary: isEn ? 'Caretaker or contact channel available 24/7 for urgent assistance.' : 'มีผู้ดูแลหรือช่องทางติดต่อเพื่อช่วยเหลือฉุกเฉินตลอด 24 ชม.',
    details: isEn ? [
      'Resident caretaker or 24-hour emergency phone line',
      'First-aid kit and household medications ready for basic emergencies',
      'Emergency protocols and direct transport channels to UBU Hospital',
    ] : [
      'มีผู้ดูแลหอพักประจำ หรือมีช่องทางโทรศัพท์ติดต่อฉุกเฉินได้ตลอด 24 ชั่วโมง',
      'มีตู้ยาสามัญประจำบ้านและชุดปฐมพยาบาลเบื้องต้น',
      'มีแนวทางและช่องทางติดต่อส่งต่อนักศึกษาที่เจ็บป่วยฉุกเฉินไปยังโรงพยาบาล ม.อุบลฯ ทันที',
    ],
    tags: isEn ? ['24/7 Contact', 'First-Aid Kit', 'Hospital Transfer'] : ['ติดต่อได้ 24 ชม.', 'ปฐมพยาบาล', 'ส่งต่อ รพ.'],
  },
  {
    id: 'building',
    number: 5,
    title: isEn ? 'Building & Fire Safety Standards' : 'มาตรฐานอาคาร & อัคคีภัย',
    icon: Building,
    summary: isEn ? 'Clear regulations, fire extinguishers on every floor, and standard evacuation routes.' : 'มีระเบียบประกาศชัดเจน มีอุปกรณ์ดับเพลิง และมีแผนผัง/ป้ายทางหนีไฟที่ได้มาตรฐาน',
    details: isEn ? [
      'Chemical fire extinguishers installed on every floor, clearly marked and operational',
      'Prominently displayed fire exit signs and emergency evacuation floor plans',
      'Structurally sound building inspected for student occupancy safety',
      'Clearly posted dormitory rules and conduct guidelines for peaceful living',
    ] : [
      'มีถังดับเพลิงเคมีติดตั้งในตำแหน่งที่เห็นเด่นชัดทุกชั้น พร้อมใช้งาน',
      'มีป้ายบอกทางหนีไฟและแผนผังอพยพกรณีเกิดเหตุฉุกเฉินชัดเจน',
      'โครงสร้างอาคารมั่นคง แข็งแรง ผ่านการตรวจสอบความปลอดภัย',
      'มีระเบียบข้อบังคับและข้อปฏิบัติของหอพักติดประกาศชัดเจนเพื่อความสงบเรียบร้อย',
    ],
    tags: isEn ? ['Extinguishers on Every Floor', 'Fire Exit Signs', 'Clear Policies'] : ['ถังดับเพลิงทุกชั้น', 'ป้ายทางหนีไฟ', 'ระเบียบชัดเจน'],
  },
];

// Helper: แปลงรูปแบบวันที่ตัดเครื่องหมายขีด - ออกทั้งหมด เช่น "5-พ.ค.-69" เป็น "5 พ.ค. 69"
const formatThaiEvalDate = (rawDate?: string | null) => {
  if (!rawDate) return '';
  return rawDate.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
};

export default function DormProfileView({ dorm }: DormProfileViewProps) {
  const router = useRouter();
  const { t, isEn } = useLanguage();
  const displayName = getDormName(dorm, isEn);
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
      setSaveStatusMessage(isEn ? `Saved: Added ${displayName} to favorites` : `บันทึกแล้ว: บันทึกหอพัก ${displayName} ลงในรายการโปรดเรียบร้อยแล้ว`);
    } else {
      setSaveStatusMessage(isEn ? `Removed: Removed ${displayName} from favorites` : `ยกเลิกแล้ว: ยกเลิกการบันทึกหอพัก ${displayName}`);
    }
  };

  const lastTrackedDormId = useRef<number | null>(null);

  // Track dormitory detail view on mount (exactly once per dorm)
  useEffect(() => {
    if (lastTrackedDormId.current !== dorm.id) {
      lastTrackedDormId.current = dorm.id;
      trackDormitoryView(dorm.id, dorm.name);
    }
  }, [dorm.id, dorm.name]);

  const [isLaunchingNav, setIsLaunchingNav] = useState(false);

  const handleStartNavigation = () => {
    trackMapClick(dorm.id, dorm.name);
    setIsLaunchingNav(true);
    setIsNavOpen(true);
    setTimeout(() => setIsLaunchingNav(false), 1000);
  };

  const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');
  const evaluationDate = formatThaiEvalDate(dorm.evaluationDate || dorm.evalDate);
  const evaluationDateFull = formatThaiDateFull(dorm.evaluationDate || dorm.evalDate);
  const isoDate = parseThaiDateToIso(dorm.evaluationDate || dorm.evalDate);
  const latestDetails = getDormLatestDetails(dorm.id);

  // Structured price resolution
  const priceObj: PriceStructure | null = 
    dorm.prices || (typeof dorm.price === 'object' && dorm.price !== null ? (dorm.price as PriceStructure) : null);

  const fanPrice = priceObj?.fan ?? null;
  const airPrice = priceObj?.air ?? null;
  const hasBothPrices = fanPrice !== null && airPrice !== null && fanPrice !== airPrice;

  // Room type availability check without duplicating prices
  const excelRoomType = latestDetails?.roomAndTenant.roomType || '';
  const dormRoomType = dorm.roomType || dorm.type || '';
  const combinedRoomType = `${excelRoomType} ${dormRoomType}`;

  const hasFanRoom = 
    fanPrice !== null || 
    combinedRoomType.includes('พัดลม') || 
    combinedRoomType.includes('ทั้งสอง');

  const hasAirRoom = 
    airPrice !== null || 
    combinedRoomType.includes('แอร์') || 
    combinedRoomType.includes('ทั้งสอง');

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
            title={t('details.back')}
            aria-label={t('details.back')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Action Group: Favorite & Share */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Favorite / Bookmark Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              aria-pressed={isFavorite(dorm.id)}
              aria-label={isFavorite(dorm.id) ? (isEn ? `Remove ${displayName} from saved` : `ยกเลิกบันทึกหอพัก ${displayName}`) : (isEn ? `Save ${displayName}` : `บันทึกหอพัก ${displayName}`)}
              title={isFavorite(dorm.id) ? (isEn ? `Remove ${displayName} from saved` : `ยกเลิกบันทึกหอพัก ${displayName}`) : (isEn ? `Save ${displayName}` : `บันทึกหอพัก ${displayName}`)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border backdrop-blur-md shadow-sm active:scale-95 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 cursor-pointer ${
                isFavorite(dorm.id)
                  ? 'bg-rose-500/90 text-white border-rose-400/80 shadow-rose-500/25'
                  : 'bg-white/10 text-blue-100 hover:text-rose-300 hover:bg-white/20 border-white/15'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite(dorm.id) ? 'fill-white' : ''}`} aria-hidden="true" />
              <span>{isFavorite(dorm.id) ? t('details.saved') : t('details.save')}</span>
            </button>

            {/* Share Button with Full Accessibility M-06 Standards */}
            <ShareButton
              title={displayName}
              dormName={displayName}
              text={isEn ? `View dormitory details and map for ${displayName} (${translateZone(dorm.zone, isEn)}) at Ubon Ratchathani University` : `ดูข้อมูลและแผนที่หอพัก ${dorm.name} (${dorm.zone}) มหาวิทยาลัยอุบลราชธานี`}
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
              <span className="text-xs font-semibold text-slate-500">
                {isEn ? 'Loading dormitory image...' : 'กำลังโหลดรูปภาพหอพัก...'}
              </span>
            </div>
          )}

          <img 
            ref={imgRef}
            src={currentImgSrc} 
            alt={imageHasError ? (isEn ? `Photo preview of ${displayName}` : `รูปภาพตัวอย่างหอพัก ${displayName}`) : (isEn ? `Building photo of ${displayName}` : `ภาพถ่ายอาคารหอพัก ${displayName}`)}
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
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-blue-950/95 backdrop-blur-md text-amber-300 px-3.5 py-1.5 rounded-full shadow-lg text-xs sm:text-sm font-black border border-amber-400/40 z-20">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{t('details.whiteBadge')}</span>
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium z-20 flex items-center gap-1.5">
              <span>{isEn ? `Evaluation: ${dorm.status || dorm.evalResult || 'Standard'}` : `ผลประเมิน: ${dorm.status || dorm.evalResult || 'หอพักทั่วไป'}`}</span>
            </div>
          )}

          <div className="absolute bottom-4 right-4 bg-blue-950/80 backdrop-blur-md text-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold z-20">
            {dorm.genderType === 'female' || dorm.genderType === 'หอพักหญิง'
              ? (isEn ? 'Female Only' : 'หอพักหญิง')
              : dorm.genderType === 'male' || dorm.genderType === 'หอพักชาย'
              ? (isEn ? 'Male Only' : 'หอพักชาย')
              : (isEn ? 'Mixed-gender' : 'หอพักรวม')}
          </div>
        </div>

        {/* Title & Pricing Card with Dual Room Prices Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight break-words leading-tight">
                {displayName}
              </h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{translateZone(dorm.zone, isEn)}</span>
                </span>
                {dorm.nearMainRoad && <span>• {translateDormValue(dorm.nearMainRoad, isEn)}</span>}
              </div>
            </div>

            <div className="text-amber-600 sm:text-right flex-shrink-0">
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
              <span className="text-xs text-slate-400 font-normal"> /{isEn ? 'month' : 'เดือน'}</span>
            </div>
          </div>

          {/* Room Type Cards (ห้องพัดลม vs ห้องแอร์) - แสดงเฉพาะประเภทห้องโดยไม่มีราคาซ้ำ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Fan Room Card */}
            <div className={`p-4 rounded-2xl border transition flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 ${
              hasFanRoom 
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' 
                : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasFanRoom ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-200 text-slate-400'}`}>
                  <Fan className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{t('details.fanRoomTitle')}</h4>
                  <p className="text-xs text-slate-500 truncate">
                    {hasFanRoom ? t('details.fanRoomDesc') : t('details.notAvailable')}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {hasFanRoom ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{t('details.available')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">
                    <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{isEn ? 'None' : 'ไม่มี'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Air Conditioned Room Card */}
            <div className={`p-4 rounded-2xl border transition flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 ${
              hasAirRoom 
                ? 'bg-blue-50/80 border-blue-200/80 text-blue-950' 
                : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-60'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasAirRoom ? 'bg-blue-200/70 text-blue-900' : 'bg-slate-200 text-slate-400'}`}>
                  <Snowflake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{t('details.airRoomTitle')}</h4>
                  <p className="text-xs text-slate-500 truncate">
                    {hasAirRoom ? t('details.airRoomDesc') : t('details.notAvailable')}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {hasAirRoom ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{t('details.available')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">
                    <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{isEn ? 'None' : 'ไม่มี'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 italic mt-4">
            {t('details.priceNotice')}
          </p>

          {/* Last-Updated Information Bar from Real Evaluation Data */}
          {evaluationDate && (
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>
                {t('details.evalUpdated')}:{' '}
                <time dateTime={isoDate} className="font-bold text-slate-700">
                  {evaluationDateFull || evaluationDate}
                </time>{' '}
                ({t('details.evalStandard')})
              </span>
            </div>
          )}
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
                    {t('details.whiteCriteriaTitle')}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                    {t('details.white5Standards')}
                  </span>
                  {evaluationDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      {isEn ? 'Evaluated' : 'ตรวจประเมิน'}: <time dateTime={isoDate}>{evaluationDate}</time>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {t('details.whiteCriteriaSubtitle')}
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
                {getWhiteDormCriteria(isEn).map((criterion) => {
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
                        className="w-full px-3 py-3 sm:p-4 flex items-center justify-between text-left gap-2 sm:gap-3 select-none cursor-pointer transition-colors"
                        aria-expanded={isItemExpanded}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isItemExpanded
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-amber-100/80 text-amber-700'
                          }`}>
                            <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap">
                                {isEn ? `Standard ${criterion.number}` : `ด้านที่ ${criterion.number}`}
                              </span>
                              <h4 className="font-bold text-blue-950 text-xs sm:text-sm leading-snug break-words">
                                {criterion.title}
                              </h4>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {criterion.summary}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-300 flex-shrink-0 ${
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
                          <span className="text-[10px] font-semibold text-slate-400">
                            {isEn ? 'Highlights:' : 'จุดเด่น:'}
                          </span>
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
                      {isEn ? (
                        <>Dormitories with the <strong>UBU White Dorm</strong> symbol have been inspected and certified by Ubon Ratchathani University.</>
                      ) : (
                        <>หอพักที่มีสัญลักษณ์ <strong>หอพักสีขาว</strong> ได้รับการตรวจสอบและประเมินผ่านเกณฑ์โดยมหาวิทยาลัยอุบลราชธานี</>
                      )}
                    </span>
                  </div>
                  <a
                    href="https://www.ubu.ac.th/web/student/news/27385/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-950 hover:text-blue-700 font-bold underline underline-offset-4 flex-shrink-0 text-xs transition"
                    title={t('details.whiteCriteriaLink')}
                  >
                    <span>{t('details.whiteCriteriaLink')}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Detailed Information Sections from Dorm last.xlsx */}
        {latestDetails && (
          <DormLastDetailsSection details={latestDetails} />
        )}
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
                <span>{isEn ? 'Locating & connecting GPS...' : 'กำลังค้นหาตำแหน่ง & เชื่อมต่อ GPS...'}</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>{isEn ? 'Start Navigation' : 'เริ่มนำทาง (Start Navigation)'}</span>
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
        {saveStatusMessage || (isSaved ? (isEn ? 'Dormitory saved to favorites' : 'บันทึกหอพักเรียบร้อยแล้ว') : (isEn ? 'Removed from favorites' : 'ยกเลิกการบันทึกหอพักแล้ว'))}
      </div>
    </div>
  );
}
