'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { th } from '@/locales/th';
import { en } from '@/locales/en';

export type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isEn: boolean;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'th',
  setLanguage: () => {},
  isEn: false,
  t: (path: string) => path,
});

export const STORAGE_KEY = 'dormie_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always initialize with 'th' as default
  const [language, setLanguageState] = useState<Language>('th');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'th') {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = 'th';
      }
    } catch {
      // Fallback for private browsing or SSR
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const dict = language === 'en' ? en : th;
      const fallbackDict = th;

      const keys = path.split('.');
      let current: any = dict;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }

      // Fallback to Thai dictionary if missing in English
      if (current === undefined) {
        let fallbackCur: any = fallbackDict;
        for (const k of keys) {
          if (fallbackCur && typeof fallbackCur === 'object' && k in fallbackCur) {
            fallbackCur = fallbackCur[k];
          } else {
            fallbackCur = undefined;
            break;
          }
        }
        current = fallbackCur !== undefined ? fallbackCur : path;
      }

      if (typeof current !== 'string') {
        return path;
      }

      if (params) {
        let result = current;
        for (const [pKey, pVal] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        }
        return result;
      }

      return current;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isEn: language === 'en',
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
