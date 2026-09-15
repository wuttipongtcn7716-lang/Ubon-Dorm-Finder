import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Home, Search, Building2, Compass, 
  ShieldCheck, ArrowLeft, MapPin 
} from 'lucide-react';

export const metadata: Metadata = {
  title: '404 ไม่พบหน้าที่คุณค้นหา | Dormie UBU',
  description: 'ไม่พบหน้าที่คุณกำลังค้นหาในระบบค้นหาหอพัก มหาวิทยาลัยอุบลราชธานี (Dormie UBU)',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main 
      role="main"
      className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50/30"
    >
      <div className="w-full max-w-xl mx-auto text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Visual Graphic & 404 Badge */}
        <div className="relative inline-block mx-auto">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-blue-600/15 rounded-full blur-2xl transform scale-125 pointer-events-none" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#0a1931] via-blue-900 to-indigo-950 text-amber-300 mx-auto flex items-center justify-center shadow-xl shadow-blue-950/15 border border-amber-400/30">
            <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 animate-pulse" />
          </div>

          <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-full shadow-md border-2 border-white uppercase tracking-wider">
            404 Error
          </span>
        </div>

        {/* Text Content */}
        <div className="space-y-2 sm:space-y-3 max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ไม่พบหน้าที่คุณกำลังค้นหา
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย เปลี่ยนชื่อ หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง 
            คุณสามารถกลับสู่หน้าหลักเพื่อค้นหาหอพักรอบ ม.อุบลฯ ได้ทันที
          </p>
        </div>

        {/* Primary & Secondary Call to Action Buttons */}
        <nav aria-label="ตัวเลือกการนำทางเมื่อไม่พบหน้า" className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {/* Primary CTA: กลับหน้าหลัก */}
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0a1931] hover:bg-blue-900 active:scale-95 text-amber-300 font-black text-sm sm:text-base shadow-lg shadow-blue-950/20 transition-all border border-amber-400/30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>กลับหน้าหลัก (Home)</span>
          </Link>

          {/* Secondary CTA: ค้นหาหอพัก */}
          <Link
            href="/?search="
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-extrabold text-sm sm:text-base border border-slate-200 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
          >
            <Search className="w-4 h-4 text-blue-900" />
            <span>กลับไปค้นหาหอพัก</span>
          </Link>
        </nav>

        {/* Quick Suggestions Cards */}
        <div className="pt-4 sm:pt-6 border-t border-slate-200/80 max-w-md mx-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            หรือเลือกดูข้อมูลที่น่าสนใจ:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Link
              href="/?whiteDormOnly=true"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold hover:bg-emerald-100 transition active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>หอพักสีขาว ม.อุบลฯ</span>
            </Link>

            <Link
              href="/?zone=ประตู 1"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 font-bold hover:bg-blue-100 transition active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>โซนประตู 1 ม.อุบลฯ</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50 transition active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>หอพักทั้งหมด (60 แห่ง)</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
