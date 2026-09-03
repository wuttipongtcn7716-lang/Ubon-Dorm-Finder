'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, Phone, MessageCircle, ShieldCheck, 
  Wind, Wifi, Car, Key, Video, Users, 
  AlertTriangle, Navigation, ExternalLink, ChevronLeft,
  Clock, Compass, Bed, Tv, Refrigerator, Building,
  CheckCircle2, XCircle, DollarSign, FileText, Share2,
  Shield, Lock, Sparkles, Fan, Snowflake, Store, Heart,
  ChevronDown, Dog, Waves, ShieldAlert, BookOpen, Clock4, Loader2
} from 'lucide-react';
import { Dormitory, PriceStructure } from '@/types/dormitory';
import NavigationModal from '@/components/NavigationModal';
import { getNearbyLandmarks } from '@/data/landmarks';
import { useFavorites } from '@/hooks/useFavorites';

interface DormProfileViewProps {
  dorm: Dormitory;
}

export default function DormProfileView({ dorm }: DormProfileViewProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  // Default state: Collapsed (hidden) by default
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [isLaunchingNav, setIsLaunchingNav] = useState(false);

  const handleStartNavigation = () => {
    setIsLaunchingNav(true);
    setIsNavOpen(true);
    setTimeout(() => setIsLaunchingNav(false), 1000);
  };

  const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');

  // Structured price resolution
  const priceObj: PriceStructure | null = 
    dorm.prices || (typeof dorm.price === 'object' && dorm.price !== null ? (dorm.price as PriceStructure) : null);

  const fanPrice = priceObj?.fan ?? null;
  const airPrice = priceObj?.air ?? null;
  const hasBothPrices = fanPrice !== null && airPrice !== null && fanPrice !== airPrice;

  return (
    <div className="min-h-screen bg-slate-50 pb-36 sm:pb-40">
      {/* Top Header Action Bar (Glassmorphism Style) */}
      <div className="sticky top-0 z-40 bg-[#0a1931]/75 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 sm:py-3 text-white shadow-lg shadow-black/10 transition-all duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back Button: Glassmorphic Icon Button */}
          <Link
            href="/"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all duration-200 active:scale-95 flex-shrink-0 shadow-sm"
            title="ย้อนกลับหน้าหลัก"
            aria-label="ย้อนกลับ"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          {/* Right Action Group: Favorite & Share */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Favorite Toggle */}
            <button
              onClick={() => toggleFavorite(dorm.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border backdrop-blur-md shadow-sm active:scale-95 whitespace-nowrap ${
                isFavorite(dorm.id)
                  ? 'bg-rose-500/90 text-white border-rose-400/80 shadow-rose-500/25'
                  : 'bg-white/10 text-blue-100 hover:text-rose-300 hover:bg-white/20 border-white/15'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite(dorm.id) ? 'fill-white' : ''}`} />
              <span>{isFavorite(dorm.id) ? 'บันทึกแล้ว' : 'บันทึก'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all duration-200 active:scale-95 whitespace-nowrap shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'คัดลอกแล้ว!' : 'แชร์'}</span>
            </button>
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
            src={(dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg'} 
            alt={dorm.name}
            className={`w-full h-full object-cover transition-opacity duration-300 relative z-10 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = '/Picture/default-dorm.jpg';
              setIsImageLoaded(true);
            }}
          />

          {/* Minimalist White Dormitory Badge on Image */}
          {isWhite ? (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-blue-950/95 backdrop-blur-md text-amber-300 px-3.5 py-1.5 rounded-full shadow-lg text-xs sm:text-sm font-black border border-amber-400/40 z-20">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>หอพักสีขาว ม.อุบลฯ</span>
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium z-20">
              <span>ผลประเมิน: {dorm.status || dorm.evalResult || 'หอพักทั่วไป'}</span>
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
              <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>{dorm.zone || 'รอบ ม.อุบลฯ'}</span>
                {dorm.nearMainRoad && <span>• ติด{dorm.nearMainRoad}</span>}
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
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold ${
              isWhite ? 'bg-amber-50 text-amber-900 border-amber-200/80 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}>
              <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isWhite ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{isWhite ? 'ผ่านเกณฑ์หอพักสีขาว' : 'หอพักทั่วไป'}</span>
            </div>
          </div>
        </div>

        {/* White Dormitory Standards Accordion (เกณฑ์หอพักสีขาว ม.อุบลฯ - Collapsible) */}
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-blue-50/40 rounded-3xl border border-amber-200/80 shadow-sm overflow-hidden transition-all duration-300">
          {/* Header Bar with Golden Shield (Click to Toggle Accordion) */}
          <button
            onClick={() => setIsCriteriaOpen(!isCriteriaOpen)}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-amber-50/50 transition-colors active:scale-[0.99] select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 border border-amber-400/40 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 font-bold" />
              </div>
              <div>
                <h3 className="font-extrabold text-blue-950 text-base sm:text-lg">
                  เกณฑ์หอพักสีขาว ม.อุบลฯ
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  แตะเพื่อดูข้อกำหนดและมาตรฐานความปลอดภัยสำหรับนักศึกษา
                </p>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-300 flex-shrink-0 ${
              isCriteriaOpen ? 'rotate-180 bg-amber-100 text-amber-800' : ''
            }`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {/* Collapsible Content with Smooth Animation */}
          {isCriteriaOpen && (
            <div className="px-5 pb-6 sm:px-6 space-y-3 text-xs sm:text-sm text-slate-700 border-t border-amber-100/80 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Security & Substance Free */}
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200/60 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>ความปลอดภัย & ไร้อบายมุข</span>
                  </div>
                  <p className="text-slate-600 text-xs pl-6 leading-relaxed">
                    มีกล้องวงจรปิด/รปภ. ดูแล และไม่มีการพนัน สุรา หรือยาเสพติดในบริเวณหอพัก
                  </p>
                </div>

                {/* 2. Cleanliness & Hygiene */}
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200/60 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>สะอาด & ถูกสุขลักษณะ</span>
                  </div>
                  <p className="text-slate-600 text-xs pl-6 leading-relaxed">
                    ห้องพักและพื้นที่ส่วนรวมสะอาด ถูกสุขอนามัย มีระบบกำจัดขยะมิดชิด
                  </p>
                </div>

                {/* 3. Study Facilities & Wi-Fi */}
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200/60 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>สิ่งอำนวยความสะดวก</span>
                  </div>
                  <p className="text-slate-600 text-xs pl-6 leading-relaxed">
                    มีสถานที่ทบทวนตำรา อินเทอร์เน็ต (Wi-Fi) และระบบสาธารณูปโภคปลอดภัย
                  </p>
                </div>

                {/* 4. 24h Assistance */}
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200/60 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <Clock4 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>อุ่นใจ 24 ชั่วโมง</span>
                  </div>
                  <p className="text-slate-600 text-xs pl-6 leading-relaxed">
                    มีผู้ดูแลหรือช่องทางติดต่อเพื่อช่วยเหลือฉุกเฉินตลอด 24 ชม.
                  </p>
                </div>

                {/* 5. Building Standards & Fire Exit */}
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200/60 space-y-1 shadow-xs md:col-span-2">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <Building className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>มาตรฐานอาคาร</span>
                  </div>
                  <p className="text-slate-600 text-xs pl-6 leading-relaxed">
                    มีระเบียบประกาศชัดเจน มีอุปกรณ์ดับเพลิง และมีแผนผัง/ป้ายทางหนีไฟที่ได้มาตรฐาน
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-100/70 rounded-xl text-amber-950 text-[11px] font-semibold flex items-center gap-2 border border-amber-200/70">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  หอพักที่มีสัญลักษณ์ <strong>หอพักสีขาว</strong> ได้รับการตรวจสอบและประเมินผ่านเกณฑ์โดย ม.อุบลฯ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Landmarks & POIs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              <span>จุดสังเกตและสถานที่ใกล้เคียง</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">คำนวณจากพิกัดจริง</span>
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-extrabold text-blue-950 text-lg">ช่องทางติดต่อเจ้าของหอพัก</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={`tel:${dorm.phone || ''}`}
              className="flex items-center justify-center gap-2.5 p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-2xl font-bold text-sm transition border border-amber-200/80"
            >
              <Phone className="w-4 h-4 text-amber-600" />
              <span>{dorm.phone || 'โทรสอบถาม'}</span>
            </a>

            {dorm.lineId && (
              <div className="flex items-center justify-center gap-2.5 p-3.5 bg-green-50 text-green-900 rounded-2xl font-semibold text-sm border border-green-200/60">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="truncate">Line: {dorm.lineId}</span>
              </div>
            )}

            {dorm.facebook && (
              <div className="flex items-center justify-center gap-2.5 p-3.5 bg-blue-50 text-blue-900 rounded-2xl font-semibold text-sm border border-blue-200/60">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span className="truncate">{dorm.facebook}</span>
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
    </div>
  );
}
