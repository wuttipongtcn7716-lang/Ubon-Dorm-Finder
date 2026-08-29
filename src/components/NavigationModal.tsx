'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, Navigation, Car, Bike,
  AlertCircle, Loader2, ShieldCheck,
  MapPin, Info
} from 'lucide-react';
import { Dormitory } from '@/types/dormitory';
import { MapComponentProps } from './MapComponent';

// Dynamically // Import Leaflet Map to ensure 100% SSR safety
const MapComponent = dynamic<MapComponentProps>(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
        <p className="text-xs font-bold text-slate-700">กำลังเตรียมแผนที่นำทาง...</p>
      </div>
    ),
  }
);

interface NavigationModalProps {
  dorm: Dormitory;
  onClose: () => void;
}

export default function NavigationModal({ dorm, onClose }: NavigationModalProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingGPS, setIsLoadingGPS] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'motorcycle'>('driving');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [baseDurationSeconds, setBaseDurationSeconds] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');

  // Default Campus Coordinates: Main UBU Entrance
  const defaultCenter = { lat: 15.118944, lng: 104.902778 };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Robust GPS Tracking with 8s Timeout & Instant Fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let hasResolved = false;

    const resolveWithFallback = (reasonText?: string) => {
      if (hasResolved) return;
      hasResolved = true;
      setUserLocation(defaultCenter);
      setIsLoadingGPS(false);
      showToast(reasonText || 'ไม่สามารถดึงตำแหน่งปัจจุบันได้ กำลังใช้พิกัดเริ่มต้น (ม.อุบลฯ)');
    };

    if (!navigator.geolocation) {
      resolveWithFallback('เบราว์เซอร์ไม่รองรับ GPS กำลังใช้พิกัดเริ่มต้น ม.อุบลฯ');
      return;
    }

    // Explicit 8-second Fallback Timer in JS
    fallbackTimerRef.current = setTimeout(() => {
      if (!hasResolved) {
        resolveWithFallback('ค้นหาตำแหน่ง GPS เกิน 8 วินาที กำลังใช้พิกัดเริ่มต้น (ม.อุบลฯ)');
      }
    }, 8000);

    // 1. Get Current Position with 8s Timeout & maximumAge: 0
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!hasResolved) {
          hasResolved = true;
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsLoadingGPS(false);
        }
      },
      (err) => {
        if (!hasResolved) {
          resolveWithFallback('ไม่สามารถเข้าถึงตำแหน่ง GPS ได้ กำลังใช้พิกัดเริ่มต้น (ม.อุบลฯ)');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );

    // 2. Background Watch Position for real-time live movements
    try {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!hasResolved) {
            hasResolved = true;
            if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
            setIsLoadingGPS(false);
          }
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {},
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 1000,
        }
      );
      watchIdRef.current = watchId;
    } catch (e) {}

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [showToast]);

  // Callback from MapComponent with real road calculated metrics
  const handleRouteCalculated = useCallback((meters: number, durationSeconds: number) => {
    setDistanceMeters(meters);
    const km = parseFloat((meters / 1000).toFixed(1));
    setDistanceKm(km);
    setBaseDurationSeconds(durationSeconds);
  }, []);

  // Time Modifier Logic: Car = 100%, Motorcycle = 85% (reduces duration by 15%)
  const estimatedMins = useMemo(() => {
    if (baseDurationSeconds !== null && baseDurationSeconds > 0) {
      const rawMins = Math.max(1, Math.round(baseDurationSeconds / 60));
      if (travelMode === 'motorcycle') {
        return Math.max(1, Math.round(rawMins * 0.85));
      }
      return rawMins;
    }
    if (distanceKm !== null && distanceKm > 0) {
      const rawMins = Math.max(1, Math.round((distanceKm / 28) * 60) + 1);
      if (travelMode === 'motorcycle') {
        return Math.max(1, Math.round(rawMins * 0.85));
      }
      return rawMins;
    }
    return null;
  }, [baseDurationSeconds, distanceKm, travelMode]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-center bg-black/70 backdrop-blur-sm p-0 md:p-0 animate-in fade-in duration-200">
      {/* Fullscreen Responsive Modal Container (Full Width & Height on iPad / PC) */}
      <div className="bg-white w-full h-[92vh] md:h-screen md:w-screen md:max-w-none rounded-t-3xl md:rounded-none flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-none">
        
        {/* Header */}
        <div className="w-full box-border px-4 py-3 sm:px-6 border-b border-blue-900/50 flex justify-between items-start bg-[#0a1931] text-white z-20 flex-shrink-0 shadow-md">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 shadow-sm font-black flex-shrink-0 mt-0.5">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 max-w-full">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate text-white">
                  {dorm.name}
                </h3>
                {isWhite && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-blue-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3 text-amber-400" /> หอพักสีขาว
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200/70 truncate mt-0.5">
                โซน: {dorm.zone || 'รอบ ม.อุบลฯ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Close Button (Touch target size >= 44x44px) */}
            <button 
              onClick={onClose}
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition active:scale-95"
              title="ปิดหน้าต่างแผนที่"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time Road Routing Stats Bar on Mobile */}
        <div className="sm:hidden bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-baseline gap-1.5 truncate">
            {distanceKm !== null ? (
              <span className="font-extrabold text-blue-950 truncate">
                ห่าง {distanceKm < 1 && distanceMeters ? `${distanceMeters} ม.` : `${distanceKm} กม.`} (~{estimatedMins} น.)
              </span>
            ) : (
              <span className="text-slate-500 font-medium text-[11px]">กำลังคำนวณเส้นทาง...</span>
            )}
          </div>

          <div className="flex items-center bg-slate-200 p-0.5 rounded-lg gap-0.5 text-[11px] flex-shrink-0">
            <button
              onClick={() => setTravelMode('driving')}
              className={`px-2 py-0.5 rounded font-bold ${
                travelMode === 'driving' ? 'bg-blue-950 text-amber-300' : 'text-slate-600'
              }`}
            >
              รถยนต์
            </button>
            <button
              onClick={() => setTravelMode('motorcycle')}
              className={`px-2 py-0.5 rounded font-bold ${
                travelMode === 'motorcycle' ? 'bg-blue-950 text-amber-300' : 'text-slate-600'
              }`}
            >
              มอเตอร์ไซค์
            </button>
          </div>
        </div>

        {/* Fullscreen Map Viewport */}
        <div className="relative flex-1 w-full h-full md:h-full bg-slate-100 flex flex-col justify-between overflow-hidden">
          {/* Loading Indicator while Connecting GPS */}
          {isLoadingGPS && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm gap-2 animate-in fade-in duration-150">
              <Loader2 className="w-9 h-9 text-blue-900 animate-spin" />
              <p className="text-xs font-bold text-blue-950">กำลังค้นหาตำแหน่ง GPS ของคุณ (Timeout 8s)...</p>
              <p className="text-[11px] text-slate-500">หากนานเกินระบบจะสลับใช้พิกัดเริ่มต้น ม.อุบลฯ ทันที</p>
            </div>
          )}

          {/* Toast Notification for GPS Fallback */}
          {toastMessage && (
            <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-[1100] bg-slate-900/95 border border-amber-400/50 text-white px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 min-w-0">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate font-medium text-amber-100">{toastMessage}</span>
              </div>
              <button 
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Full-width and Full-height Interactive Leaflet Map with Google Maps Routing Box */}
          <MapComponent
            dorms={[dorm]}
            selectedDorm={dorm}
            userLocation={userLocation}
            showRoute={true}
            showLandmarks={false}
            travelMode={travelMode}
            onRouteCalculated={handleRouteCalculated}
            className="w-full h-full flex-1"
            initialZoom={15}
          />
        </div>
      </div>
    </div>
  );
}
