'use client';

import React from 'react';
import { Navigation } from 'lucide-react';

interface MapSkeletonProps {
  message?: string;
  className?: string;
}

export default function MapSkeleton({
  message = 'กำลังเตรียมแผนที่ ม.อุบลฯ...',
  className = 'w-full h-full min-h-[400px]',
}: MapSkeletonProps) {
  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 select-none flex items-center justify-center ${className}`}
      aria-label="กำลังโหลดแผนที่..."
    >
      {/* 1. Abstract Map Grid & Roads SVG Simulation */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="skeleton-map-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#skeleton-map-grid)" />

        <path
          d="M -50 180 Q 200 160 450 320 T 900 420 T 1400 560"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="12"
          strokeLinecap="round"
          className="animate-pulse"
        />
        <path
          d="M 120 -50 Q 220 200 280 500 T 400 900"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 500 -50 Q 420 250 560 600 T 650 1000"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <path
          d="M 300 -100 Q 550 200 700 450 T 1200 800"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>

      {/* 2. Shimmering Skeleton Pins on the map */}
      <div className="absolute top-[28%] left-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse">
        <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center ring-4 ring-blue-400/20 shadow-md">
          <div className="w-3.5 h-3.5 bg-blue-600 rounded-full" />
        </div>
        <div className="w-10 h-2 bg-slate-300 rounded-full mt-1.5 opacity-60" />
      </div>

      <div className="absolute top-[42%] left-[68%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse delay-150">
        <div className="w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center ring-4 ring-amber-400/20 shadow-md">
          <div className="w-3.5 h-3.5 bg-amber-600 rounded-full" />
        </div>
        <div className="w-12 h-2 bg-slate-300 rounded-full mt-1.5 opacity-60" />
      </div>

      <div className="absolute top-[65%] left-[38%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse delay-300">
        <div className="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center ring-4 ring-emerald-400/20 shadow-md">
          <div className="w-3 h-3 bg-emerald-600 rounded-full" />
        </div>
        <div className="w-10 h-2 bg-slate-300 rounded-full mt-1.5 opacity-60" />
      </div>

      {/* 3. Skeleton UI Overlays */}
      <div className="absolute top-4 left-4 w-48 sm:w-64 p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md space-y-2 hidden sm:block animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-300 flex-shrink-0" />
          <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <div className="w-4 h-4 rounded-full bg-amber-300 flex-shrink-0" />
          <div className="h-3 bg-slate-200 rounded-md w-1/2" />
        </div>
      </div>

      <div className="absolute top-4 right-4 h-9 w-28 sm:w-36 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md animate-pulse flex items-center px-3 gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-300" />
        <div className="h-3 bg-slate-200 rounded w-16" />
      </div>

      <div className="absolute bottom-6 right-4 flex flex-col items-end gap-2.5">
        <div className="w-10 sm:w-36 h-10 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md animate-pulse flex items-center justify-center gap-2 px-3">
          <div className="w-4 h-4 rounded-full bg-blue-300" />
          <div className="h-3 bg-slate-200 rounded w-20 hidden sm:block" />
        </div>
        <div className="w-10 h-20 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md animate-pulse hidden sm:flex flex-col items-center justify-around py-1">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="w-6 h-px bg-slate-200" />
          <div className="w-4 h-4 bg-slate-200 rounded" />
        </div>
      </div>

      {/* 4. Centerpiece Informative Loading Badge */}
      <div className="relative z-10 max-w-xs mx-4 bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-100 p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center space-y-3 animate-in zoom-in-95 duration-200">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-ping" />
        </div>

        <div>
          <h4 className="text-sm sm:text-base font-black text-[#0a1931]">
            {message}
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            กำลังโหลดพิกัดหอพัก 60 แห่งและคำนวณเส้นทาง...
          </p>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative ring-1 ring-slate-200/60">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full animate-progress-loading will-change-transform shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        </div>
      </div>
    </div>
  );
}
