'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Share2, Check, CheckCircle2 } from 'lucide-react';

export interface ShareButtonProps {
  /** ชื่อของสถานที่หรือหอพักสำหรับนำไปใช้ในการแชร์และอ่าน Screen Reader */
  title: string;
  /** ข้อความคำอธิบายเพิ่มเติมสำหรับการแชร์ */
  text?: string;
  /** URL ที่ต้องการแชร์ (หากไม่ระบุจะใช้ window.location.href) */
  url?: string;
  /** ชื่อเฉพาะของหอพัก (alias สำหรับ title) */
  dormName?: string;
  /** รูปแบบสไตล์ของปุ่ม เช่น 'glass' สำหรับแถบ Glassmorphic หรือ 'default' */
  variant?: 'glass' | 'default' | 'card';
  /** คลาส CSS เพิ่มเติม */
  className?: string;
  /** แสดงข้อความตัวอักษรข้างไอคอนหรือไม่ */
  showLabel?: boolean;
}

/**
 * คอมโพเนนต์ปุ่มแชร์ (Share Button) ตามมาตรฐาน Accessibility (ข้อกำหนด M-06)
 * - มี aria-label แสดงเจตนาและสถานะอย่างชัดเจน
 * - มี aria-live ประกาศสถานะการแชร์/คัดลอกให้ Screen Reader ทราบทันที
 * - มีข้อความแจ้งเตือน Toast / Visual Feedback รองรับผู้ใช้งานทุกกลุ่ม
 * - รองรับทั้ง Web Share API (มือถือ) และ Clipboard API (คอมพิวเตอร์) พร้อม Fallback
 */
export default function ShareButton({
  title,
  text,
  url,
  dormName,
  variant = 'glass',
  className = '',
  showLabel = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayName = dormName || title || 'หอพัก';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = `${displayName} | Dormie UBU`;
    const shareText = text || `ดูข้อมูลและเส้นทางไปหอพัก ${displayName} มหาวิทยาลัยอุบลราชธานี`;

    // 1. ตรวจสอบว่าเบราว์เซอร์รองรับ Web Share API หรือไม่ (สำหรับ Mobile Safari / Android Chrome)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        const msg = `แชร์ข้อมูลหอพัก ${displayName} สำเร็จแล้ว`;
        setLiveAnnouncement(msg);
        return;
      } catch (err: any) {
        // หากผู้ใช้กดยกเลิกหน้าต่าง Share Sheet (AbortError) ไม่ต้อง fallback ไป copy
        if (err?.name === 'AbortError') {
          return;
        }
        // หากเกิดข้อผิดพลาดอื่น ให้ fallback ไปใช้วิธีคัดลอกลง Clipboard
      }
    }

    // 2. Fallback: คัดลอกลิงก์ลง Clipboard
    let copySuccess = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copySuccess = true;
      } catch {
        copySuccess = false;
      }
    }

    // 3. Fallback เพิ่มเติมกรณี Clipboard API ไม่ได้รับอนุญาต
    if (!copySuccess && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copySuccess = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        copySuccess = false;
      }
    }

    // อัปเดตสถานะและแจ้งเตือนทั้งทางสายตาและ Screen Reader (A11y M-06)
    setCopied(true);
    setShowToast(true);
    const announcementText = `คัดลอกลิงก์สำหรับแชร์หอพัก ${displayName} เรียบร้อยแล้ว พร้อมส่งต่อได้ทันที`;
    setLiveAnnouncement(announcementText);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      setShowToast(false);
    }, 2800);
  }, [displayName, text, url]);

  // กำหนดสไตล์ตาม variant
  const getButtonStyles = () => {
    if (variant === 'glass') {
      return copied
        ? 'bg-emerald-600/90 text-white border-emerald-400/80 shadow-emerald-500/25 ring-2 ring-emerald-400/40'
        : 'text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 border-white/15';
    }
    if (variant === 'card') {
      return copied
        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
        : 'text-slate-600 hover:text-blue-950 bg-slate-100 hover:bg-slate-200/80 border-slate-200/80';
    }
    // Default
    return copied
      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
      : 'text-slate-700 hover:text-blue-950 bg-white hover:bg-slate-50 border-slate-200';
  };

  const ariaLabelText = copied
    ? `คัดลอกลิงก์สำหรับแชร์หอพัก ${displayName} เรียบร้อยแล้ว`
    : `แชร์ข้อมูลหอพัก ${displayName}`;

  return (
    <>
      {/* Screen Reader Announcement Region for Accessibility M-06 */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only" 
        role="status"
        id={`share-announcer-${displayName.replace(/[^a-zA-Z0-9ก-๙]/g, '-')}`}
      >
        {liveAnnouncement}
      </div>

      {/* Share Button Component */}
      <button
        type="button"
        onClick={handleShare}
        aria-label={ariaLabelText}
        title={ariaLabelText}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border backdrop-blur-md shadow-sm active:scale-95 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${getButtonStyles()} ${className}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-50 duration-200 flex-shrink-0" aria-hidden="true" />
        ) : (
          <Share2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        )}
        {showLabel && (
          <span>{copied ? 'คัดลอกแล้ว!' : 'แชร์'}</span>
        )}
      </button>

      {/* Toast / Visual Feedback Notification for all users */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none max-w-[90vw]"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-bold text-white">
              คัดลอกลิงก์สำเร็จแล้ว!
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300">
              ลิงก์หอพัก {displayName} พร้อมสำหรับแชร์ให้เพื่อน
            </span>
          </div>
        </div>
      )}
    </>
  );
}
