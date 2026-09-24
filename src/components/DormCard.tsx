'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, MapPin, Wind, Wifi, Car, Key, 
  Video, Navigation, Store, Fan, Snowflake, 
  Compass, Building2, Heart, GitCompare
} from 'lucide-react';
import { Dormitory, PriceStructure } from '@/types/dormitory';
import { landmarksData, getLandmarkMeta } from '@/data/landmarks';
import { trackMapClick } from '@/utils/analytics';
import { useLanguage } from '@/context/LanguageContext';
import { translateZone, getDormName, translateNearbyPlaceName } from '@/utils/bilingualHelpers';

interface DormCardProps {
  dorm: Dormitory;
  onNavigate?: (dorm: Dormitory) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (dormId: number) => void;
  isCompared?: boolean;
  onToggleCompare?: (dormId: number) => void;
}

export default function DormCard({ 
  dorm, 
  onNavigate,
  isFavorite = false,
  onToggleFavorite,
  isCompared = false,
  onToggleCompare
}: DormCardProps) {
  const initialRawImage = (dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg';
  const initialCoverImage = encodeURI(initialRawImage);

  const [currentImgSrc, setCurrentImgSrc] = useState(initialCoverImage);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageHasError, setImageHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // ตรวจสอบสถานะการโหลดและแก้ไข Race Condition กรณีภาพถูกแคชแล้ว
  useEffect(() => {
    const targetSrc = encodeURI((dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg');
    setCurrentImgSrc(targetSrc);
    setImageHasError(false);

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsImageLoaded(true);
    } else {
      setIsImageLoaded(false);
    }

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
    setIsImageLoaded(true);
  }, [imageHasError]);

  const { t, isEn } = useLanguage();
  const displayName = getDormName(dorm, isEn);
  const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');
  
  // Structured price resolution
  const priceObj: PriceStructure | null = 
    dorm.prices || (typeof dorm.price === 'object' && dorm.price !== null ? (dorm.price as PriceStructure) : null);

  const fanPrice = priceObj?.fan ?? null;
  const airPrice = priceObj?.air ?? null;

  const hasBothPrices = fanPrice !== null && airPrice !== null && fanPrice !== airPrice;
  const minPriceVal = dorm.minPrice || (hasBothPrices ? Math.min(fanPrice, airPrice) : (airPrice || fanPrice || 0));
  const maxPriceVal = dorm.maxPrice || (hasBothPrices ? Math.max(fanPrice, airPrice) : minPriceVal);

  const isFemale = dorm.genderType === 'female' || dorm.genderType === 'หอพักหญิง';
  const isMale = dorm.genderType === 'male' || dorm.genderType === 'หอพักชาย';
  const genderLabel = isFemale
    ? (isEn ? 'Female Only' : 'หอพักหญิง')
    : isMale
    ? (isEn ? 'Male Only' : 'หอพักชาย')
    : (isEn ? 'Mixed-gender' : 'หอพักรวม');
  const statusLabel = dorm.status || dorm.evalResult || (isEn ? 'Standard' : 'หอพักทั่วไป');

  // Distance highlight for fast decision making (Dynamic Nearest POI)
  const nearestPoi = useMemo(() => {
    if (!dorm.lat || !dorm.lng) return null;
    
    // Priority categories: store, market, food, shabu, streetfood, cafe
    const priorityCategories = ['store', 'market', 'food', 'shabu', 'streetfood', 'cafe'];
    
    const candidatePois = landmarksData.filter(item => 
      priorityCategories.includes(item.category)
    );
    
    if (candidatePois.length === 0) return null;
    
    let closestItem = null;
    let minDistance = Infinity;
    
    for (const item of candidatePois) {
      const R = 6371; // km
      const dLat = (item.lat - dorm.lat) * Math.PI / 180;
      const dLon = (item.lng - dorm.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(dorm.lat * Math.PI / 180) * Math.cos(item.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      
      if (dist < minDistance) {
        minDistance = dist;
        closestItem = item;
      }
    }
    
    if (!closestItem) return null;
    
    let distStr = '';
    if (minDistance < 1) {
      const meters = Math.round(minDistance * 1000 / 10) * 10;
      distStr = `${meters} ${isEn ? 'm' : 'ม.'}`;
    } else {
      distStr = `${minDistance.toFixed(1)} ${isEn ? 'km' : 'กม.'}`;
    }
    
    const meta = getLandmarkMeta(closestItem.category, closestItem.name);
    
    return {
      name: closestItem.name,
      distanceStr: distStr,
      icon: meta.icon,
    };
  }, [dorm.lat, dorm.lng, isEn]);

  // Build natural landmark description text (Dynamic Top 3 Nearest POIs)
  const landmarkSummary = useMemo(() => {
    const defaultText = isEn ? 'Near UBU Campus' : 'ใกล้ ม.อุบลราชธานี';
    if (!dorm.lat || !dorm.lng) return defaultText;
    
    const sorted = landmarksData.map(item => {
      const R = 6371;
      const dLat = (item.lat - dorm.lat) * Math.PI / 180;
      const dLon = (item.lng - dorm.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(dorm.lat * Math.PI / 180) * Math.cos(item.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...item, dist: R * c };
    })
    .sort((a, b) => a.dist - b.dist);
    
    const top3 = sorted.slice(0, 3);
    if (top3.length === 0) return defaultText;
    
    return top3.map(item => {
      let distStr = '';
      if (item.dist < 1) {
        const meters = Math.round(item.dist * 1000 / 10) * 10;
        distStr = `${meters} ${isEn ? 'm' : 'ม.'}`;
      } else {
        distStr = `${item.dist.toFixed(1)} ${isEn ? 'km' : 'กม.'}`;
      }
      return `${translateNearbyPlaceName(item.name, isEn)} ${distStr}`;
    }).join(' • ');
  }, [dorm.lat, dorm.lng, isEn]);

  return (
    <article
      id={`dorm-card-${dorm.id}`}
      className={`scroll-mt-24 group bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between relative transform-gpu hover:-translate-y-1 active:scale-[0.99] cursor-pointer focus-within:ring-2 focus-within:ring-amber-400/40 focus-within:border-amber-400 ${
        isCompared
          ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
          : 'border-slate-200/90 hover:border-amber-400 hover:shadow-xl hover:shadow-blue-950/5'
      }`}
    >
      <div>
        {/* Top Image Preview with Loading Skeleton & Badges */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {/* Loading Placeholder Skeleton */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex flex-col items-center justify-center text-slate-400 gap-1.5 z-0">
              <Building2 className="w-8 h-8 text-slate-300 animate-bounce" />
              <span className="text-[10px] font-medium text-slate-400">
                {isEn ? 'Loading image...' : 'กำลังโหลดรูป...'}
              </span>
            </div>
          )}

          <img 
            ref={imgRef}
            src={currentImgSrc} 
            alt={imageHasError ? (isEn ? `Photo preview of ${displayName}` : `รูปภาพตัวอย่างหอพัก ${displayName}`) : (isEn ? `Building photo of ${displayName}` : `ภาพถ่ายอาคารหอพัก ${displayName}`)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 relative z-10 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* White Dormitory Badge */}
          {isWhite ? (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-blue-950/90 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-md border border-amber-400/30 z-20">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'White Dorm' : 'หอพักสีขาว'}</span>
            </div>
          ) : (
            <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md text-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-medium z-20">
              <span>{statusLabel}</span>
            </div>
          )}

          {/* Favorite Bookmark Button with Accessibility M-01 Standards */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(dorm.id);
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition shadow-md z-20 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
              }`}
              aria-label={isFavorite ? (isEn ? `Remove ${displayName} from saved` : `ยกเลิกบันทึกหอพัก ${displayName}`) : (isEn ? `Save ${displayName}` : `บันทึกหอพัก ${displayName}`)}
              aria-pressed={isFavorite}
              title={isFavorite ? (isEn ? `Remove ${displayName} from saved` : `ยกเลิกบันทึกหอพัก ${displayName}`) : (isEn ? `Save ${displayName}` : `บันทึกหอพัก ${displayName}`)}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} aria-hidden="true" />
            </button>
          )}

          {/* Distance Tag Overlay */}
          {nearestPoi && (
            <div className="absolute bottom-3 left-3 max-w-[calc(100%-6.5rem)] xs:max-w-[calc(100%-7.5rem)] min-w-0 bg-white/95 backdrop-blur-md text-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1 z-20 border border-slate-200/80">
              <span className="text-amber-600 font-normal flex-shrink-0">{nearestPoi.icon}</span>
              <span className="truncate">{translateNearbyPlaceName(nearestPoi.name, isEn)} {nearestPoi.distanceStr}</span>
            </div>
          )}

          {/* Gender Badge */}
          <div className="absolute bottom-3 right-3 flex-shrink-0 bg-blue-950/80 backdrop-blur-md text-amber-200 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold z-20">
            {genderLabel}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 space-y-3">
          <div>
            <div className="flex items-center text-slate-400 text-xs mb-1">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                <span className="truncate">{translateZone(dorm.zone, isEn)}</span>
              </div>
            </div>
            <h3 className="font-extrabold text-blue-950 text-base group-hover:text-amber-600 transition line-clamp-2 leading-snug break-words">
              <Link
                href={`/dorm/${dorm.id}`}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('dorm_home_scroll_pos', window.scrollY.toString());
                    sessionStorage.setItem('dorm_last_viewed_id', dorm.id.toString());
                  }
                }}
                className="focus:outline-none after:absolute after:inset-0 after:z-10 focus-visible:underline"
              >
                {displayName}
              </Link>
            </h3>
          </div>

          {/* Natural Landmark Summary Block */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
            <Compass className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate font-medium">{landmarkSummary}</span>
          </div>

          {/* Compact Pricing Section */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-600">
                  ฿{minPriceVal.toLocaleString()}
                </span>
                {hasBothPrices && (
                  <span className="text-sm font-bold text-slate-600">
                    - {maxPriceVal.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-normal"> /{isEn ? 'month' : 'เดือน'}</span>
              </div>
            </div>

            {/* Sub-label for Dual Pricing (พัดลม / แอร์) */}
            {hasBothPrices && (
              <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-600 font-medium">
                <span className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                  <Fan className="w-3 h-3 text-amber-700" /> {isEn ? 'Fan' : 'พัดลม'} ฿{fanPrice?.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-0.5 text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                  <Snowflake className="w-3 h-3 text-blue-700" /> {isEn ? 'Air' : 'แอร์'} ฿{airPrice?.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Amenities Badges Row */}
          <div className="flex items-center gap-1.5 pt-1 text-slate-600 text-xs border-t border-slate-100 overflow-x-auto scrollbar-none">
            {airPrice !== null && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 font-bold text-[11px] flex items-center gap-1 whitespace-nowrap">
                <Wind className="w-3 h-3 text-blue-600" /> {isEn ? 'Air-conditioned' : 'แอร์'}
              </span>
            )}
            {fanPrice !== null && airPrice === null && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-bold text-[11px] flex items-center gap-1 whitespace-nowrap">
                <Fan className="w-3 h-3 text-amber-600" /> {isEn ? 'Fan' : 'พัดลม'}
              </span>
            )}
            {dorm.wifi && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1 whitespace-nowrap">
                <Wifi className="w-3 h-3 text-slate-500" /> {isEn ? 'Free Wi-Fi' : 'Wi-Fi'}
              </span>
            )}
            {dorm.parking && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1 whitespace-nowrap">
                <Car className="w-3 h-3 text-slate-500" /> {isEn ? 'Parking available' : 'ที่จอดรถ'}
              </span>
            )}
            {dorm.cctv && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1 whitespace-nowrap">
                <Video className="w-3 h-3 text-slate-500" /> CCTV
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Footer: Direct Navigation & Compare Buttons */}
      {(onNavigate || onToggleCompare) && (
        <div className="p-4 sm:p-5 pt-0 relative z-20 flex items-center gap-2">
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCompare(dorm.id);
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              aria-pressed={isCompared}
              aria-label={isCompared ? (isEn ? `Remove ${displayName} from comparison` : `ยกเลิกการเปรียบเทียบหอพัก ${displayName}`) : (isEn ? `Add ${displayName} to compare` : `เพิ่มหอพัก ${displayName} เพื่อเปรียบเทียบ`)}
              title={isCompared ? (isEn ? `Remove ${displayName} from comparison` : `ยกเลิกการเปรียบเทียบหอพัก ${displayName}`) : (isEn ? `Add ${displayName} to compare` : `เพิ่มหอพัก ${displayName} เพื่อเปรียบเทียบ`)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer border ${
                isCompared
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-blue-500/20'
                  : 'bg-white hover:bg-blue-50 text-blue-900 border-slate-200 hover:border-blue-300'
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95`}
            >
              <GitCompare className={`w-3.5 h-3.5 ${isCompared ? 'text-white' : 'text-blue-600'}`} />
              <span>{isCompared ? (isEn ? 'Compared' : 'เปรียบเทียบแล้ว') : (isEn ? 'Compare' : 'เปรียบเทียบ')}</span>
            </button>
          )}

          {onNavigate && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackMapClick(dorm.id, dorm.name);
                onNavigate(dorm);
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              aria-label={isEn ? `Directions to ${displayName}` : `นำทางไปหอพัก ${displayName}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-amber-300 text-xs font-extrabold rounded-2xl transition shadow-md active:scale-95 border border-amber-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'Directions' : 'นำทางไปหอนี้'}</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}
