'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ChevronRight, Compass } from 'lucide-react';

export default function WelcomeScreen() {
  const [show, setShow] = useState<boolean>(false);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('hasVisited');
      if (hasSeen !== 'true') {
        setShow(true);
        setIsVisible(true);
      }
    }
  }, []);

  const handleEnter = useCallback(() => {
    setIsFading(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasVisited', 'true');
    }
    setTimeout(() => {
      setShow(false);
      setIsVisible(false);
    }, 450);
  }, []);

  // Keyboard Navigation: รองรับการกดปุ่ม Enter, Spacebar หรือปุ่มใดๆ บนคีย์บอร์ดเพื่อเข้าสู่หน้าหลัก
  useEffect(() => {
    if (!show || isFading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ข้ามปุ่ม Modifier ทั่วไป และปุ่ม Function ของเบราว์เซอร์ (เช่น F12, F5)
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }
      if (e.key.startsWith('F') && !isNaN(Number(e.key.slice(1)))) {
        return;
      }

      // ป้องกันผลข้างเคียงของ Spacebar (การเลื่อนหน้าจอ)
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
      }

      handleEnter();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, isFading, handleEnter]);

  if (!show) return null;

  return (
    <div
      onClick={handleEnter}
      role="button"
      tabIndex={0}
      aria-label="แตะที่ใดก็ได้ หรือกดปุ่มใดๆ บนคีย์บอร์ดเพื่อเริ่มต้นใช้งาน"
      className={`fixed inset-0 h-[100dvh] z-[9999] flex-col items-center justify-between bg-gradient-to-b from-[#08152e] via-[#0f2b5c] to-[#061024] cursor-pointer select-none transition-all duration-500 overflow-hidden outline-none ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      } ${isVisible ? 'flex' : 'hidden'}`}
      style={{ height: '100dvh', display: isVisible ? 'flex' : 'none' }}
    >
      {/* Ambient Lighting Background Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Tag */}
      <div className="pt-4 md:pt-6 lg:pt-8 px-4 z-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-amber-300 border border-amber-300/30 backdrop-blur-md text-xs sm:text-sm font-bold shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>ยินดีต้อนรับสู่ Dormie UBU • แอปค้นหาหอพัก ม.อุบลฯ</span>
        </div>
      </div>

      {/* Centerpiece Cover Image */}
      <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2 sm:p-4 md:p-6 z-10">
        <div className="relative w-full h-full max-h-[45dvh] md:max-h-[52dvh] lg:max-h-[60dvh] flex items-center justify-center">
          <img
            src="/cover.jpg"
            alt="Dormie UBU Cover"
            className="w-full h-full object-contain drop-shadow-2xl rounded-2xl sm:rounded-3xl hover:scale-[1.01] transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/Picture/default-dorm.jpg';
            }}
          />
        </div>
      </div>

      {/* Bottom Floating Hint Button: Two-Line Bilingual CTA */}
      <div className="pb-4 md:pb-6 lg:pb-10 px-4 z-10 text-center space-y-2.5 md:space-y-3">
        <div className="inline-flex flex-col items-center justify-center px-8 py-3.5 rounded-3xl bg-gradient-to-r from-blue-950/90 via-indigo-950/95 to-blue-950/90 border border-amber-400/50 text-white shadow-2xl backdrop-blur-xl animate-pulse hover:brightness-110 active:scale-95 transition">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-base sm:text-xl font-bold text-amber-300 tracking-wide">
              แตะที่ใดก็ได้เพื่อเริ่มต้นใช้งาน
            </span>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-xs sm:text-sm text-white/75 font-medium tracking-wider mt-0.5">
            Tap anywhere to start
          </span>
        </div>
        <p className="text-[11px] text-blue-200/70 font-medium">
          ระบบแผนที่เส้นทาง • หมุดจุดสังเกต • ค้นหาหอพักรอบมหาวิทยาลัยอุบลราชธานี
        </p>
      </div>
    </div>
  );
}
