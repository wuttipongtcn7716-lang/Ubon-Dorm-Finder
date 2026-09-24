'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Building2, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-[#0a1931]/95 backdrop-blur-md border-b border-blue-900/50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2.5 sm:py-3.5 flex items-center justify-between">
        {/* Brand Logo & Name (Pure Static Branding - No navigation/action on click/tap) */}
        <div 
          className="flex items-center gap-2 sm:gap-2.5 select-none cursor-default min-w-0 pr-2"
          aria-label="Dormie UBU"
        >
          {/* Static Graphic Icon */}
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-400/20 flex-shrink-0"
            aria-hidden="true"
            role="presentation"
          >
            <Building2 className="w-5 h-5 text-slate-950 font-black pointer-events-none" />
          </div>

          {/* Static Brand Title & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-base sm:text-lg text-white tracking-tight whitespace-nowrap">
                Dormie <span className="text-amber-400">UBU</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 flex-shrink-0">
                {t('common.universityName')}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-200/70 font-medium leading-tight mt-0.5 truncate max-w-[150px] xs:max-w-none">
              {t('navbar.tagline')}
            </p>
          </div>
        </div>

        {/* Minimal Right Badges, Language Switcher & Admin Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Language Switcher TH | EN */}
          <div 
            className="flex items-center bg-blue-950/90 p-0.5 rounded-full border border-blue-800/80 shadow-inner text-xs"
            role="group"
            aria-label={t('navbar.langSwitch')}
          >
            <button
              type="button"
              onClick={() => setLanguage('th')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                language === 'th'
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                  : 'text-blue-300/80 hover:text-white'
              }`}
              aria-pressed={language === 'th'}
              aria-label="เปลี่ยนเป็นภาษาไทย (TH)"
            >
              TH
            </button>
            <span className="text-blue-700/80 select-none text-[10px] px-0.5">|</span>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                  : 'text-blue-300/80 hover:text-white'
              }`}
              aria-pressed={language === 'en'}
              aria-label="Switch to English (EN)"
            >
              EN
            </button>
          </div>

          <div className="hidden xs:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-blue-900/80 text-amber-300 border border-amber-400/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] sm:text-xs">Dormie 2026</span>
          </div>

          <span className="hidden md:inline-flex items-center text-xs font-bold text-blue-100 bg-blue-900/40 px-2.5 py-1 rounded-full border border-blue-800/60">
            {t('navbar.dormCount')}
          </span>

          <Link
            href="/admin/analytics"
            className="p-1.5 rounded-xl text-blue-300/60 hover:text-amber-400 hover:bg-blue-900/40 transition focus:outline-none focus:ring-1 focus:ring-amber-400"
            title={t('common.adminAnalytics')}
            aria-label={t('common.adminAnalytics')}
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
