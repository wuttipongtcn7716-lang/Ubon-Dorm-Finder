'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Building2, Heart } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#0a1931]/95 backdrop-blur-md border-b border-blue-900/50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2.5 sm:py-3.5 flex items-center justify-between">
        {/* Brand Logo & Name (Click Disabled) */}
        <div className="flex items-center gap-2.5 select-none cursor-default">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-400/20">
            <Building2 className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg text-white tracking-tight">
                Dormie <span className="text-amber-400">UBU</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                ม.อุบลฯ
              </span>
            </div>
            <p className="text-[11px] text-blue-200/70 font-medium leading-none mt-0.5">
              ค้นหาหอพัก & แผนที่นำทาง
            </p>
          </div>
        </div>

        {/* Minimal Right Badges / Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-blue-900/80 text-amber-300 border border-amber-400/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] sm:text-xs">Dormie 2026</span>
          </div>

          <span className="hidden sm:inline-flex items-center text-xs font-bold text-blue-100 bg-blue-900/40 px-2.5 py-1 rounded-full border border-blue-800/60">
            60 หอพักรอบ ม.
          </span>
        </div>
      </div>
    </header>
  );
}
