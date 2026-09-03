'use client';

import React from 'react';
import { 
  AlertTriangle, RotateCcw, RefreshCw 
} from 'lucide-react';

interface MapErrorStateProps {
  error?: Error | null;
  errorMessage?: string;
  onRetry: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function MapErrorState({
  error,
  errorMessage = 'เกิดข้อผิดพลาดในการโหลดแผนที่ หรือการเชื่อมต่อเซิร์ฟเวอร์แผนที่ไม่ตอบสนอง',
  onRetry,
  onDismiss,
  className = 'w-full h-full min-h-[400px]',
}: MapErrorStateProps) {
  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-rose-50/70 via-slate-50 to-amber-50/50 z-20 select-none ${className}`}
      role="alert"
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-rose-200/90 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            ไม่สามารถโหลดแผนที่ได้
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {error?.message || errorMessage}
          </p>
          <p className="text-[11px] text-slate-400">
            กรุณาตรวจสอบสัญญาณอินเทอร์เน็ต แล้วกดปุ่มลองใหม่อีกครั้ง
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ลองใหม่อีกครั้ง (Retry)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>รีโหลดหน้า</span>
          </button>
        </div>

        {onDismiss && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onDismiss}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition cursor-pointer"
            >
              ข้ามและดูข้อมูลหอพัก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
