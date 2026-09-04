'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, Navigation, Car, Bike,
  AlertCircle, Loader2, ShieldCheck,
  MapPin, Info, RotateCcw, Lock
} from 'lucide-react';
import { Dormitory } from '@/types/dormitory';
import { MapComponentProps } from './MapComponent';
import GpsPermissionModal from './GpsPermissionModal';
import MapSkeleton from './MapSkeleton';

// Dynamically Import Leaflet Map to ensure 100% SSR safety with realistic MapSkeleton
const MapComponent = dynamic<MapComponentProps>(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => <MapSkeleton message="กำลังเตรียมแผนที่นำทาง..." className="w-full h-full min-h-[350px]" />,
  }
);

interface NavigationModalProps {
  dorm: Dormitory;
  onClose: () => void;
}

export default function NavigationModal({ dorm, onClose }: NavigationModalProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingGPS, setIsLoadingGPS] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'acquired' | 'error'>('requesting');
  const [gpsErrorCode, setGpsErrorCode] = useState<'denied' | 'timeout' | 'unavailable' | 'unsupported' | null>(null);
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<Date | null>(null);
  const [dismissError, setDismissError] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'motorcycle'>('driving');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [baseDurationSeconds, setBaseDurationSeconds] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Strict GPS Tracking with 8s Timeout, Specific Error Traps & No-Spoofing Policy
  const requestGPS = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsLoadingGPS(true);
    setGpsStatus('requesting');
    setGpsErrorCode(null);
    setGpsErrorMessage(null);
    setDismissError(false);

    if (!navigator.geolocation) {
      setIsLoadingGPS(false);
      setGpsStatus('error');
      setGpsErrorCode('unsupported');
      setGpsErrorMessage('เบราว์เซอร์หรืออุปกรณ์ของคุณไม่รองรับการระบุตำแหน่ง GPS');
      setUserLocation(null);
      return;
    }

    let hasResolved = false;

    // Strict 8-second Timeout Timer
    fallbackTimerRef.current = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        setIsLoadingGPS(false);
        setGpsStatus('error');
        setGpsErrorCode('timeout');
        setGpsErrorMessage('ค้นหาตำแหน่ง GPS เกินเวลาที่กำหนด (Timeout 8 วินาที) กรุณากดปุ่มลองใหม่');
        setUserLocation(null);
      }
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!hasResolved) {
          hasResolved = true;
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsTimestamp(new Date());
          setGpsStatus('acquired');
          setIsLoadingGPS(false);
          setGpsErrorMessage(null);
        }
      },
      (err) => {
        if (!hasResolved) {
          hasResolved = true;
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          setIsLoadingGPS(false);
          setGpsStatus('error');
          setUserLocation(null); // NEVER pretend default center is real user position

          if (err.code === err.PERMISSION_DENIED) {
            setGpsErrorCode('denied');
            setGpsErrorMessage('คุณปิดกั้นการเข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์การใช้งาน Location ที่การตั้งค่าเบราว์เซอร์ (ไอคอนรูปแม่กุญแจบนแถบ URL)');
            setIsPermissionModalOpen(true);
          } else if (err.code === err.TIMEOUT) {
            setGpsErrorCode('timeout');
            setGpsErrorMessage('การค้นหาพิกัด GPS ใช้เวลานานเกินกำหนด (Timeout 8 วินาที) กรุณากดปุ่มลองใหม่อีกครั้ง');
          } else {
            setGpsErrorCode('unavailable');
            setGpsErrorMessage('ไม่สามารถระบุตำแหน่ง GPS ได้ กรุณาเปิดบริการระบุตำแหน่ง (Location Services) หรือตรวจสอบการเชื่อมต่อ');
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );

    // Background Watch Position for real-time live movements
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
          setGpsTimestamp(new Date());
          setGpsStatus('acquired');
          setGpsErrorMessage(null);
        },
        () => {},
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 1000,
        }
      );
      watchIdRef.current = watchId;
    } catch (e) {}
  }, []);

  useEffect(() => {
    requestGPS();

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestGPS]);

  // Handle ESC (Escape) key press to close modal with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPermissionModalOpen) {
          setIsPermissionModalOpen(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isPermissionModalOpen]);

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
      <div className="bg-white w-full h-[92dvh] md:h-[100dvh] md:w-screen md:max-w-none rounded-t-3xl md:rounded-none flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-none">
        
        {/* Header */}
        <div 
          className="w-full box-border px-4 pb-3 sm:px-6 border-b border-blue-900/50 flex justify-between items-start bg-[#0a1931] text-white z-20 flex-shrink-0 shadow-md"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
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
              
              {/* GPS Live Status Indicator & Timestamp */}
              {gpsStatus === 'acquired' && gpsTimestamp && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="truncate">GPS สด • {gpsTimestamp.toLocaleTimeString('th-TH')} น.</span>
                  <button 
                    onClick={requestGPS}
                    title="รีเฟรชพิกัด GPS ล่าสุด"
                    className="p-0.5 hover:bg-white/10 rounded transition text-blue-200 hover:text-white ml-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}

              {gpsStatus === 'requesting' && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium mt-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400 flex-shrink-0" />
                  <span className="truncate">กำลังขอพิกัด GPS... (8s)</span>
                </div>
              )}

              {gpsStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-300 font-medium mt-0.5">
                  <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                  <span className="truncate">{gpsErrorCode === 'denied' ? 'ปฏิเสธสิทธิ์ GPS' : 'ไม่พบสัญญาณ GPS'}</span>
                  <button 
                    onClick={requestGPS}
                    className="underline hover:text-white ml-1 font-bold cursor-pointer"
                  >
                    ลองใหม่
                  </button>
                </div>
              )}
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
        {userLocation ? (
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
          </div>
        ) : (
          <div className="sm:hidden bg-amber-50/90 px-4 py-2 border-b border-amber-200 flex items-center justify-between gap-2 text-xs flex-shrink-0">
            <div className="flex items-center gap-1.5 text-amber-900 font-medium truncate">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">{gpsErrorMessage || 'ยังไม่ได้รับพิกัด GPS เพื่อคำนวณเส้นทาง'}</span>
            </div>
            <button
              onClick={requestGPS}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ลองใหม่</span>
            </button>
          </div>
        )}

        {/* Fullscreen Map Viewport */}
        <div className="relative flex-1 w-full h-full md:h-full bg-slate-100 flex flex-col justify-between overflow-hidden">

          {/* GPS Error Alert Card with Retry Button & Guidance */}
          {gpsStatus === 'error' && !dismissError && (
            <div className="absolute top-4 inset-x-4 sm:inset-x-auto sm:left-4 sm:w-96 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200 p-4 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {gpsErrorCode === 'denied' ? <Lock className="w-4 h-4 text-rose-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {gpsErrorCode === 'denied' ? 'คุณปิดกั้นการเข้าถึงตำแหน่ง' : 'ไม่สามารถระบุตำแหน่ง GPS ได้'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-1">
                    {gpsErrorMessage}
                  </p>
                </div>
              </div>

              {gpsErrorCode === 'denied' && (
                <button
                  onClick={() => setIsPermissionModalOpen(true)}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>ดูวิธีเปิดสิทธิ์ที่ไอคอนแม่กุญแจ 🔒</span>
                </button>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={requestGPS}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ลองใหม่ (Retry)</span>
                </button>
                <button
                  onClick={() => setDismissError(true)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  ดูแผนที่หอพัก
                </button>
              </div>
            </div>
          )}

          {/* Dedicated GPS Permission Guidance Modal */}
          <GpsPermissionModal
            isOpen={isPermissionModalOpen}
            onClose={() => setIsPermissionModalOpen(false)}
            onRetry={requestGPS}
          />

          {/* Toast Notification for GPS Feedback */}
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
