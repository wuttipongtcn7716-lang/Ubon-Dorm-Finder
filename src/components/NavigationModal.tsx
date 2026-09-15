'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, Navigation, Car, Bike,
  AlertCircle, Loader2, ShieldCheck,
  MapPin, Info, RotateCcw, Lock
} from 'lucide-react';
import { Dormitory } from '@/types/dormitory';
import { MapComponentProps, OriginPointData } from './MapComponent';
import GpsPermissionModal from './GpsPermissionModal';
import OriginSelectionModal, { SelectedOrigin } from './OriginSelectionModal';
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
  const [currentOrigin, setCurrentOrigin] = useState<SelectedOrigin | null>(null);
  const [isOriginModalOpen, setIsOriginModalOpen] = useState(false);
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

  // Strict GPS Tracking with 8s Timeout, Specific Error Traps & Instant Graceful Fallback
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
      setGpsErrorMessage('เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับ GPS — กรุณาเลือกจุดเริ่มต้นด้วยตนเอง');
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
        setGpsErrorMessage('ค้นหาสัญญาณ GPS นานเกินไป (Timeout 8 วินาที) — กรุณาเลือกจุดเริ่มต้นด้วยตนเอง หรือลองใหม่อีกครั้ง');
        setUserLocation(null);
      }
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!hasResolved) {
          hasResolved = true;
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserLocation({ lat: uLat, lng: uLng });
          // Set origin to GPS if no origin selected yet (null) or if already using GPS
          setCurrentOrigin((prev) => {
            if (prev === null || prev.type === 'gps') {
              return {
                name: 'ตำแหน่ง GPS ของคุณ',
                lat: uLat,
                lng: uLng,
                type: 'gps',
              };
            }
            return prev; // Don't overwrite manual/gate/dorm selection
          });
          setGpsTimestamp(new Date());
          setGpsStatus('acquired');
          setIsLoadingGPS(false);
          setGpsErrorMessage(null);
          showToast('📍 เชื่อมต่อพิกัด GPS สำเร็จ คำนวณเส้นทางสดเรียบร้อย');
        }
      },
      (err) => {
        if (!hasResolved) {
          hasResolved = true;
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          setIsLoadingGPS(false);
          setGpsStatus('error');
          setUserLocation(null); // Keep default / chosen origin active

          // Fix Dangling Watcher: Clear background watch immediately if GPS is denied
          if (watchIdRef.current !== null && navigator.geolocation) {
             navigator.geolocation.clearWatch(watchIdRef.current);
             watchIdRef.current = null;
          }

          if (err.code === err.PERMISSION_DENIED) {
            setGpsErrorCode('denied');
            setGpsErrorMessage('ไม่ได้รับสิทธิ์เข้าถึง GPS — กรุณาเลือกจุดเริ่มต้นด้วยตนเอง หรือเปิดสิทธิ์ GPS แล้วลองใหม่');
            // Do NOT auto-open blocking modal; keep map usable and accessible
          } else if (err.code === err.TIMEOUT) {
            setGpsErrorCode('timeout');
            setGpsErrorMessage('ค้นหาสัญญาณ GPS นานเกินไป (Timeout 8 วินาที) — กรุณาเลือกจุดเริ่มต้นด้วยตนเอง หรือลองใหม่อีกครั้ง');
          } else {
            setGpsErrorCode('unavailable');
            setGpsErrorMessage('ไม่พบสัญญาณพิกัด GPS จากอุปกรณ์ — กรุณาเลือกจุดเริ่มต้นด้วยตนเอง');
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
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserLocation({ lat: uLat, lng: uLng });
          setCurrentOrigin((prev) => {
            if (prev === null || prev.type === 'gps') {
              return {
                name: 'ตำแหน่ง GPS ของคุณ',
                lat: uLat,
                lng: uLng,
                type: 'gps',
              };
            }
            return prev; // Don't overwrite manual selection
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
  }, [showToast]);

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

  // Memoize customOrigin prop to prevent creating new object reference on every render
  // Returns null when no origin has been selected yet (GPS denied, user hasn't picked)
  const memoizedCustomOrigin = useMemo((): OriginPointData | null => {
    if (!currentOrigin) return null;
    return {
      mode: currentOrigin.type === 'gps' ? 'gps' : currentOrigin.type === 'dorm' ? 'dorm' : currentOrigin.type === 'gate' ? 'gate' : 'custom',
      lat: currentOrigin.lat,
      lng: currentOrigin.lng,
      label: currentOrigin.name,
    };
  }, [currentOrigin?.type, currentOrigin?.lat, currentOrigin?.lng, currentOrigin?.name]);

  // Stable callback for MapComponent origin changes (manual pick on map, gate selection inside map)
  // Only updates NavigationModal's state when the origin actually differs
  const handleOriginChangeFromMap = useCallback((orig: OriginPointData | null) => {
    if (!orig) return;
    setCurrentOrigin((prev) => {
      if (prev && prev.lat === orig.lat && prev.lng === orig.lng && prev.name === orig.label) {
        return prev; // No change - prevent unnecessary re-render
      }
      return {
        name: orig.label,
        lat: orig.lat,
        lng: orig.lng,
        type: orig.mode === 'gps' ? 'gps' : orig.mode === 'dorm' ? 'dorm' : orig.mode === 'gate' ? 'gate' : 'custom',
      };
    });
  }, []);

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

  // Responsive GPS Error Alert Card: Reusable for both Mobile flow and Desktop overlay stack
  const gpsAlertCard = (gpsStatus === 'error' && !dismissError) ? (
    <div className="pointer-events-auto w-full z-[1200] bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/90 p-3.5 sm:p-4 shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              {gpsErrorCode === 'denied'
                ? 'ไม่ได้รับสิทธิ์เข้าถึง GPS'
                : gpsErrorCode === 'timeout'
                ? 'ค้นหาสัญญาณ GPS นานเกินไป'
                : 'ใช้จุดเริ่มต้นทางเลือก (GPS ไม่พร้อมใช้งาน)'}
            </h4>
            <button
              type="button"
              onClick={() => setDismissError(true)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
              title="ปิดการแจ้งเตือน"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-1">
            {gpsErrorMessage}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsOriginModalOpen(true)}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0a1931] hover:bg-blue-900 active:scale-95 text-amber-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>เลือกจุดเริ่มต้นอื่น</span>
        </button>

        <button
          type="button"
          onClick={requestGPS}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          title="ลองค้นหา GPS ใหม่อีกครั้ง"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>ลองใหม่</span>
        </button>

        {gpsErrorCode === 'denied' && (
          <button
            type="button"
            onClick={() => setIsPermissionModalOpen(true)}
            className="flex items-center justify-center gap-1 py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-[11px] font-bold transition cursor-pointer"
            title="ดูวิธีเปิดสิทธิ์ GPS บนเบราว์เซอร์"
          >
            <Lock className="w-3 h-3 text-amber-700" />
            <span>วิธีเปิด GPS</span>
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end md:items-stretch justify-center bg-black/70 backdrop-blur-sm p-0 md:p-0 animate-in fade-in duration-200">
      {/* Fullscreen Responsive Modal Container (Full Width & Height on iPad / PC) */}
      <div className="bg-white w-full h-[100dvh] md:h-[100dvh] md:w-screen md:max-w-none rounded-none flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-none">
        
        {/* Header - ซ่อนบนหน้าจอมือถือเพื่อคืนพื้นที่แผนที่ให้กว้างเต็มตาตามคำขอ */}
        <div 
          className="hidden md:flex w-full box-border px-4 pb-3 sm:px-6 border-b border-blue-900/50 justify-between items-start bg-[#0a1931] text-white z-20 flex-shrink-0 shadow-md"
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
              
              {/* Origin Display & Switcher on Desktop */}
              <div className="flex items-center gap-2 mt-1 text-xs">
                <div className="flex items-center gap-1.5 text-blue-100 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                  <span className="text-amber-400 font-bold">จาก:</span>
                  <span className="font-bold text-white max-w-[200px] truncate">{currentOrigin ? currentOrigin.name : 'ยังไม่ได้เลือกจุดเริ่มต้น'}</span>
                  <button
                    type="button"
                    onClick={() => setIsOriginModalOpen(true)}
                    className="ml-1 text-[11px] text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
                  >
                    {currentOrigin ? 'เปลี่ยน' : 'เลือกจุดเริ่มต้น'}
                  </button>
                </div>

                {/* GPS Live Status Indicator & Timestamp */}
                {gpsStatus === 'acquired' && gpsTimestamp && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="truncate">GPS สด • {gpsTimestamp.toLocaleTimeString('th-TH')} น.</span>
                    <button 
                      type="button"
                      onClick={requestGPS}
                      title="รีเฟรชพิกัด GPS ล่าสุด"
                      aria-label="รีเฟรชพิกัด GPS ล่าสุด"
                      className="ml-1 text-emerald-300 hover:text-emerald-100 cursor-pointer p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {gpsStatus === 'requesting' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-500/30">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400 flex-shrink-0" />
                    <span className="truncate">กำลังขอพิกัด GPS... (8s)</span>
                  </div>
                )}

                {gpsStatus === 'error' && (
                  <button 
                    type="button"
                    onClick={requestGPS}
                    className="flex items-center gap-1.5 text-[11px] text-rose-300 font-medium bg-rose-950/60 hover:bg-rose-900/80 px-2.5 py-1 rounded-xl border border-rose-500/30 transition cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                    title="กดเพื่อลองค้นหา GPS ใหม่อีกครั้ง"
                    aria-label="ลองค้นหา GPS ใหม่อีกครั้ง"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" aria-hidden="true" />
                    <span className="truncate">{gpsErrorCode === 'denied' ? 'ปฏิเสธ GPS (ลองใหม่)' : 'ไม่พบ GPS (ลองใหม่)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Close Button (Touch target size >= 44x44px) */}
            <button 
              type="button"
              onClick={onClose}
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              title="ปิดหน้าต่างแผนที่"
              aria-label="ปิดหน้าต่างแผนที่นำทาง"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Fullscreen Map Viewport */}
        <div className="relative flex-1 w-full h-full md:h-full bg-slate-100 flex flex-col justify-between overflow-hidden">
          {/* Mobile Floating Overlay Column (Occupied area layout: Stacks Top Card & GPS Alert without overlap) */}
          <div className="md:hidden absolute left-3 right-3 mobile-safe-top flex flex-col gap-2 z-[1400] pointer-events-none">
            {/* Floating Unified Mobile Top Card (Close Button + Route Info Card) */}
            <div 
              className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-xl shadow-lg border border-slate-200/90 rounded-2xl py-1 px-2 pr-3 max-w-[calc(100vw-6rem)] animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Integrated Close Button (X) */}
              <button 
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-950 flex items-center justify-center active:scale-95 transition cursor-pointer flex-shrink-0"
                title="ปิดหน้าต่างแผนที่"
                aria-label="ปิดหน้าต่างแผนที่"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>

              {/* Target Dormitory & Real-Time Calculated Route Distance / Time */}
              <div className="flex flex-col min-w-0 pr-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#0a1931] truncate max-w-[130px] xs:max-w-[160px]">
                    {dorm.name}
                  </span>
                  {isWhite && (
                    <span className="text-[10px] text-amber-500 font-bold flex-shrink-0" title="หอพักสีขาว">
                      🛡️
                    </span>
                  )}
                </div>

                {/* Origin indicator with direct change button */}
                <button
                  type="button"
                  onClick={() => setIsOriginModalOpen(true)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-900 transition text-left cursor-pointer truncate max-w-[190px] focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-900 rounded"
                  title="แตะเพื่อเปลี่ยนจุดเริ่มต้น"
                  aria-label={currentOrigin ? `จุดเริ่มต้นปัจจุบัน: ${currentOrigin.name} แตะเพื่อเปลี่ยนจุดเริ่มต้น` : 'ยังไม่ได้เลือกจุดเริ่มต้น แตะเพื่อเลือก'}
                >
                  <span className="text-blue-700 font-bold">จาก:</span>
                  <span className="truncate text-slate-700 font-bold underline decoration-dotted">{currentOrigin ? currentOrigin.name : 'ยังไม่ได้เลือก'}</span>
                  <span className="text-[9px] text-blue-600 font-black ml-0.5" aria-hidden="true">✏️</span>
                </button>

                {currentOrigin && distanceKm !== null ? (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 truncate mt-0.5">
                    <span className="text-blue-900 font-extrabold flex items-center gap-0.5">
                      <span>{travelMode === 'motorcycle' ? '🚲' : '🚗'}</span>
                      <span>{distanceKm < 1 && distanceMeters ? `${distanceMeters} ม.` : `${distanceKm} กม.`}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-black">
                      ~{estimatedMins} นาที
                    </span>
                  </div>
                ) : currentOrigin ? (
                  <span className="text-[10px] text-slate-400 font-medium animate-pulse">
                    กำลังคำนวณเส้นทาง...
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-medium">
                    แตะเพื่อเลือกจุดเริ่มต้น
                  </span>
                )}
              </div>
            </div>

            {/* Mobile GPS Alert Card: Stacked safely below Mobile Top Card */}
            {gpsAlertCard}
          </div>

          {/* Dedicated GPS Permission Guidance Modal */}
          <GpsPermissionModal
            isOpen={isPermissionModalOpen}
            onClose={() => setIsPermissionModalOpen(false)}
            onRetry={requestGPS}
            onChooseManualOrigin={() => setIsOriginModalOpen(true)}
          />

          {/* Dedicated Origin Selection Modal */}
          <OriginSelectionModal
            isOpen={isOriginModalOpen}
            onClose={() => setIsOriginModalOpen(false)}
            currentOriginName={currentOrigin?.name || ''}
            onSelectOrigin={(selected) => {
              setCurrentOrigin(selected);
              showToast(`📍 เปลี่ยนจุดเริ่มต้นเป็น: ${selected.name}`);
            }}
            onUseGps={requestGPS}
            isLocatingGps={isLoadingGPS && gpsStatus === 'requesting'}
            dorms={[dorm]}
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
            customOrigin={memoizedCustomOrigin}
            onOriginChange={handleOriginChangeFromMap}
            showRoute={true}
            showLandmarks={false}
            travelMode={travelMode}
            onRouteCalculated={handleRouteCalculated}
            gpsAlertNode={gpsAlertCard}
            className="w-full h-full flex-1"
            initialZoom={15}
          />
        </div>
      </div>
    </div>
  );
}
