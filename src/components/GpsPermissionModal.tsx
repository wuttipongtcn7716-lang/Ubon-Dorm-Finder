'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Lock, RotateCcw, RefreshCw, 
  Laptop, Smartphone, 
  AlertTriangle
} from 'lucide-react';

interface GpsPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function GpsPermissionModal({
  isOpen,
  onClose,
  onRetry,
}: GpsPermissionModalProps) {
  const [activeTab, setActiveTab] = useState<'desktop' | 'ios' | 'android'>('desktop');

  // Detect OS/Device type on initial load to highlight the appropriate tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setActiveTab('ios');
    } else if (/Android/.test(ua)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, []);

  // Listen to live permission state changes: auto-retry if user unlocks permission in browser
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !navigator.permissions?.query) return;

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        permissionStatus = status;
        const handlePermissionChange = () => {
          if (status.state === 'granted') {
            onRetry();
            onClose();
          }
        };
        status.addEventListener('change', handlePermissionChange);
      })
      .catch(() => {});

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', () => {});
      }
    };
  }, [isOpen, onRetry, onClose]);

  // Handle ESC (Escape) key press to close modal with proper cleanup
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gps-denied-title"
      >
        {/* Header with Warning Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 p-5 text-white flex items-start justify-between flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full inline-block">
                Permission Denied
              </span>
              <h3 id="gps-denied-title" className="text-base sm:text-lg font-black leading-snug mt-0.5">
                คุณปิดกั้นการเข้าถึงตำแหน่ง GPS
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95 flex-shrink-0 cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Instruction Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Key Clarification Alert */}
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200/90 text-rose-950 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              คุณปิดกั้นการเข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์การใช้งาน Location ที่การตั้งค่าเบราว์เซอร์ 
              <span className="font-bold text-rose-900 block mt-0.5">
                (ไอคอนรูปแม่กุญแจ 🔒 บนแถบ URL ด้านบน)
              </span>
            </p>
          </div>

          {/* Platform Selector Tabs */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              เลือกอุปกรณ์ของคุณเพื่อดูวิธีเปิดสิทธิ์:
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">คอมพิวเตอร์ / PC</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">iPhone / iPad</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Android</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            {activeTab === 'desktop' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-blue-950 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-600" />
                  <span>วิธีเปิดสิทธิ์บนเบราว์เซอร์ Chrome / Edge / Firefox</span>
                </h4>
                <ol className="space-y-2 text-slate-600 list-decimal list-inside leading-relaxed text-xs">
                  <li>
                    มองขึ้นไปที่ <strong>แถบกรอกที่อยู่เว็บไซต์ (URL Bar)</strong> ด้านบนสุด
                  </li>
                  <li>
                    คลิกที่ <strong>ไอคอนรูปแม่กุญแจ 🔒</strong> หรือปุ่ม <strong>Site Settings</strong> ทางซ้ายมือของชื่อเว็บ
                  </li>
                  <li>
                    ตรงหัวข้อ <strong>Location (ตำแหน่ง)</strong> ให้เปลี่ยนสถานะจาก <em>&quot;บล็อก (Block)&quot;</em> เป็น <strong className="text-emerald-700">&quot;อนุญาต (Allow)&quot;</strong> หรือกด <em>&quot;รีเซ็ตสิทธิ์ (Reset permission)&quot;</em>
                  </li>
                  <li>
                    กดปุ่ม <strong>&quot;ลองใหม่อีกครั้ง&quot;</strong> หรือรีโหลดหน้าเว็บเพื่อเริ่มใช้งาน
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-blue-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>วิธีเปิดสิทธิ์บน iPhone / iPad (Safari)</span>
                </h4>
                <ol className="space-y-2 text-slate-600 list-decimal list-inside leading-relaxed text-xs">
                  <li>
                    แตะที่ไอคอน <strong>aA</strong> ทางด้านซ้ายของแถบ URL ด้านล่าง/บน
                  </li>
                  <li>
                    เลือกเมนู <strong>&quot;การตั้งค่าเว็บไซต์ (Website Settings)&quot;</strong>
                  </li>
                  <li>
                    ตรงหัวข้อ <strong>&quot;ตำแหน่งที่ตั้ง (Location)&quot;</strong> ให้เปลี่ยนเป็น <strong className="text-emerald-700">&quot;อนุญาต (Allow)&quot;</strong> หรือ <strong>&quot;ถาม (Ask)&quot;</strong>
                  </li>
                  <li>
                    กลับมาที่หน้าเว็บแล้วกดปุ่ม <strong>&quot;ลองใหม่อีกครั้ง&quot;</strong>
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'android' && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-blue-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>วิธีเปิดสิทธิ์บนมือถือ Android (Chrome)</span>
                </h4>
                <ol className="space-y-2 text-slate-600 list-decimal list-inside leading-relaxed text-xs">
                  <li>
                    แตะที่ <strong>ไอคอนรูปแม่กุญแจ 🔒</strong> ด้านซ้ายของแถบ URL (หรือจุด 3 จุด ที่มุมขวาบน)
                  </li>
                  <li>
                    เลือก <strong>&quot;สิทธิ์ (Permissions)&quot;</strong> แล้วแตะที่ <strong>&quot;ตำแหน่ง (Location)&quot;</strong>
                  </li>
                  <li>
                    เลือกเปิดเป็น <strong className="text-emerald-700">&quot;อนุญาต (Allow)&quot;</strong>
                  </li>
                  <li>
                    กลับมาที่หน้าเว็บแล้วกดปุ่ม <strong>&quot;ลองใหม่อีกครั้ง&quot;</strong>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 flex-shrink-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีโหลดหน้าเว็บ (Reload)</span>
          </button>

          <button
            onClick={() => {
              onRetry();
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ลองใหม่อีกครั้ง (Retry)</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer text-center"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
