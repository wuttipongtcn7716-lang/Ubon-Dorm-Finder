'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, Eye, Search, 
  TrendingUp, TrendingDown, Minus, 
  Calendar, RotateCcw, LogOut, ArrowRight,
  Sparkles, ExternalLink, ShieldCheck, AlertCircle,
  Lock, User, EyeOff, Loader2, BarChart2,
  Clock, ArrowLeft, History
} from 'lucide-react';
import { PeriodType, AnalyticsDashboardData, HistoricalPeriod } from '@/lib/analyticsDb';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import { getVisitorId, getSessionId, resetSessionId } from '@/utils/analytics';

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: 'วันนี้', value: 'today' },
  { label: '7 วัน', value: '7d' },
  { label: '30 วัน', value: '30d' },
  { label: '90 วัน', value: '90d' },
];

export default function AdminAnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // In-page login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Reset Display Statistics state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Historical Analytics View state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<HistoricalPeriod[]>([]);
  const [activeHistoricalPeriod, setActiveHistoricalPeriod] = useState<HistoricalPeriod | null>(null);
  const [isViewingHistorical, setIsViewingHistorical] = useState(false);

  // Fetch history list
  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const res = await fetch(`/api/admin/analytics/history?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'x-visitor-id': visitorId,
          'x-session-id': sessionId,
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.periods)) {
          setHistoryList(json.periods);
        }
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const res = await fetch('/api/admin/analytics/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'x-visitor-id': visitorId,
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          visitorId,
          sessionId,
          note: 'รีเซ็ตการแสดงผลสถิติ',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to reset analytics display');
      }

      // Mark client-side admin flags
      try {
        sessionStorage.setItem('dormie_admin_active', '1');
        document.cookie = 'dormie_role=admin; path=/; max-age=86400; SameSite=Lax';
      } catch (e) {}

      setIsResetModalOpen(false);
      setIsViewingHistorical(false);
      setActiveHistoricalPeriod(null);
      setResetSuccess('รีเซ็ตสถิติเรียบร้อยแล้ว เริ่มนับข้อมูลใหม่ตั้งแต่เวลานี้');
      await fetchData(selectedPeriod);
      await fetchHistory();
      setTimeout(() => {
        setResetSuccess(null);
      }, 6000);
    } catch (err: any) {
      setResetError(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตการแสดงผล');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectHistoricalPeriod = async (period: HistoricalPeriod) => {
    setIsHistoryModalOpen(false);
    setIsLoading(true);
    setIsViewingHistorical(true);
    setActiveHistoricalPeriod(period);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const res = await fetch(`/api/admin/analytics/history?periodId=${period.id}&_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'x-visitor-id': visitorId,
          'x-session-id': sessionId,
        }
      });
      if (!res.ok) throw new Error('Failed to load historical period');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load historical analytics:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLive = () => {
    setIsViewingHistorical(false);
    setActiveHistoricalPeriod(null);
    fetchData(selectedPeriod);
  };

  // Check auth and fetch data
  const fetchData = useCallback(async (period: PeriodType) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const res = await fetch(`/api/admin/analytics?period=${period}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'x-visitor-id': visitorId,
          'x-session-id': sessionId,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('dormie_admin_active', '1');
          document.cookie = 'dormie_role=admin; path=/; max-age=86400; SameSite=Lax';
        } catch (e) {}
      } else {
        throw new Error('Malformed response');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedPeriod);
    fetchHistory();
  }, [fetchData, selectedPeriod, fetchHistory]);

  const handleInPageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginUsername, 
          password: loginPassword,
          visitorId,
          sessionId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoginLoading(false);
        return;
      }

      try {
        sessionStorage.setItem('dormie_admin_active', '1');
      } catch (e) {}

      setIsAuthenticated(true);
      setLoginLoading(false);
      fetchData(selectedPeriod);
    } catch (err) {
      setLoginError('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      try {
        localStorage.removeItem('dormie_admin_active');
        localStorage.removeItem('dormie_is_admin');
        sessionStorage.removeItem('dormie_admin_active');
        sessionStorage.removeItem('dormie_is_admin');
        document.cookie = 'dormie_role=; path=/; max-age=0; SameSite=Lax';
        resetSessionId();
      } catch (e) {}
      setIsAuthenticated(false);
      setData(null);
    } catch (e) {
      try {
        localStorage.removeItem('dormie_admin_active');
        localStorage.removeItem('dormie_is_admin');
        sessionStorage.removeItem('dormie_admin_active');
        sessionStorage.removeItem('dormie_is_admin');
        document.cookie = 'dormie_role=; path=/; max-age=0; SameSite=Lax';
        resetSessionId();
      } catch (err) {}
      setIsAuthenticated(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label || '7 วัน';

  // State 1: Checking Authentication Loading Screen
  if (isAuthenticated === null && isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 flex items-center justify-center text-slate-950 shadow-md animate-pulse mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-600">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
      </div>
    );
  }

  // State 2: Unauthenticated — Render In-Place Admin Login
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 shadow-md shadow-amber-400/20 mb-1">
              <Building2 className="w-7 h-7 text-slate-950 font-black" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Dormie <span className="text-amber-500">Analytics</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              เข้าสู่ระบบผู้ดูแลระบบเพื่อดูสถิติการใช้งานจริง
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleInPageLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อผู้ดูแลระบบ (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="ระบุ username"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-sm shadow-md transition disabled:opacity-70 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>กำลังตรวจสอบสิทธิ์...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 transition"
            >
              <span>← กลับไปยังหน้าเว็บไซต์หลัก Dormie UBU</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCompletelyEmpty = 
    !isLoading && 
    (data?.summary.uniqueVisitors.value || 0) === 0 && 
    (data?.summary.pageViews.value || 0) === 0 &&
    (data?.summary.searchEvents.value || 0) === 0 &&
    (data?.summary.dormitoryViews.value || 0) === 0;

  // State 3: Authenticated — Render Full Dashboard
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0a1931]/95 backdrop-blur-md border-b border-blue-900/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 select-none cursor-default">
              <div 
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 flex items-center justify-center text-slate-950 shadow-sm"
                aria-hidden="true"
                role="presentation"
              >
                <Building2 className="w-5 h-5 text-slate-950 font-black pointer-events-none" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-white">
                    Dormie <span className="text-amber-400">Analytics</span>
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-900/90 text-amber-300 border border-amber-400/30 hidden sm:inline-block">
              ผู้ดูแลระบบ
            </span>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-blue-200 border border-blue-800/80 transition"
            >
              <span>ดูหน้าเว็บหลัก</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition cursor-pointer disabled:opacity-50"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Dashboard Title & Single Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ภาพรวมการใช้งานเว็บไซต์
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ข้อมูลสถิติผู้เข้าชม การค้นหา และความสนใจหอพักรอบ ม.อุบลฯ จากฐานข้อมูลจริง
            </p>
          </div>

          {/* Controls: Reset Button, History Button & Single Filter Dropdown */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Reset Display Button (Primary Prominent Action - Requirement 7) */}
            <button
              type="button"
              onClick={() => {
                setResetError(null);
                setIsResetModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              title="รีเซ็ตการแสดงผลสถิติบน Dashboard"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตการแสดงผล</span>
            </button>

            {/* View Reset History Button (Requirement 8) */}
            <button
              type="button"
              onClick={() => {
                fetchHistory();
                setIsHistoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/90 shadow-2xs transition cursor-pointer"
              title="ดูประวัติสถิติที่ผ่านมา"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>ประวัติสถิติ</span>
              {historyList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                  {historyList.length}
                </span>
              )}
            </button>

            {/* Single Filter Dropdown (Hidden/Disabled in Historical Mode) */}
            {isViewingHistorical ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>ช่วงในอดีต</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label htmlFor="period-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                  ช่วงเวลา:
                </label>
                <div className="relative">
                  <select
                    id="period-select"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
                    className="appearance-none bg-white text-slate-800 text-xs sm:text-sm font-bold pl-3 pr-8 py-2 rounded-xl border border-slate-300/90 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historical View Active Banner */}
        {isViewingHistorical && activeHistoricalPeriod && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300/60">
                    โหมดดูข้อมูลในอดีต
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {activeHistoricalPeriod.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  ช่วงเวลา: {activeHistoricalPeriod.startAt ? new Date(activeHistoricalPeriod.startAt).toLocaleString('th-TH') : 'เริ่มต้นบันทึกข้อมูล'} — {new Date(activeHistoricalPeriod.endAt).toLocaleString('th-TH')} (คำนวณจากฐานข้อมูลจริง)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBackToLive}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปดูสถิติปัจจุบัน</span>
            </button>
          </div>
        )}

        {/* Reset Success Notice */}
        {resetSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 transition animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Active Reset Info Banner (Shown only in live view when reset is active) */}
        {!isViewingHistorical && data?.displayResetAt && (
          <div className="px-4 py-2.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-blue-900 text-xs font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>โหมดเริ่มนับใหม่:</strong> ระบบกำลังแสดงผลสถิติที่เกิดขึ้นตั้งแต่{' '}
                <span className="font-bold underline decoration-blue-300">
                  {new Date(data.displayResetAt).toLocaleString('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>{' '}
                เป็นต้นมา (ข้อมูลเดิมยังคงถูกบันทึกไว้อย่างปลอดภัยในระบบ)
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <div>
              <h2 className="font-bold text-rose-900 text-base">ไม่สามารถโหลดข้อมูลสถิติได้ กรุณาลองอีกครั้ง</h2>
              <p className="text-xs sm:text-sm text-rose-700 mt-1">
                การดึงข้อมูลสถิติขัดข้อง โปรดตรวจสอบการเชื่อมต่อแล้วกดปุ่มลองใหม่อีกครั้ง
              </p>
            </div>
            <button
              onClick={() => fetchData(selectedPeriod)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ลองอีกครั้ง</span>
            </button>
          </div>
        )}

        {/* Empty State Banner (Requirement 20) */}
        {isCompletelyEmpty && !isError && (
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-1">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-amber-950 text-base">
              ยังไม่มีข้อมูลการใช้งาน
            </h2>
            <p className="text-xs sm:text-sm text-amber-800/80 max-w-md mx-auto">
              เริ่มมีข้อมูลเมื่อมีผู้ใช้ใช้งานเว็บไซต์
            </p>
          </div>
        )}

        {/* Section 1 — Summary (4 Cards) */}
        <section aria-label="สถิติภาพรวม">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Unique Visitors */}
            <SummaryCard
              title="ผู้ใช้งาน"
              subtitle="Unique Visitors"
              value={data?.summary.uniqueVisitors.value}
              changePercent={data?.summary.uniqueVisitors.changePercent}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              isLoading={isLoading}
            />

            {/* Card 2: Sessions */}
            <SummaryCard
              title="การเข้าใช้งาน"
              subtitle="Sessions"
              value={data?.summary.pageViews.value}
              changePercent={data?.summary.pageViews.changePercent}
              icon={<Eye className="w-5 h-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
              isLoading={isLoading}
            />

            {/* Card 3: Search Events */}
            <SummaryCard
              title="การค้นหา"
              subtitle="Search Events"
              value={data?.summary.searchEvents.value}
              changePercent={data?.summary.searchEvents.changePercent}
              icon={<Search className="w-5 h-5 text-amber-600" />}
              iconBg="bg-amber-50"
              isLoading={isLoading}
            />

            {/* Card 4: Dormitory Views */}
            <SummaryCard
              title="ดูหอพัก"
              subtitle="Dormitory Views"
              value={data?.summary.dormitoryViews.value}
              changePercent={data?.summary.dormitoryViews.changePercent}
              icon={<Building2 className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Section 2 — Main Chart (1 Graph) */}
        <section 
          aria-label="กราฟผู้ใช้งานตามช่วงเวลา"
          className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                ผู้ใช้งานตามช่วงเวลา
              </h2>
              <p className="text-xs text-slate-500">
                จำนวนผู้ใช้งานจริงแบบไม่ซ้ำ (Unique Visitors) ในช่วง {isViewingHistorical && activeHistoricalPeriod ? activeHistoricalPeriod.label : periodLabel}
              </p>
            </div>
            <div className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border self-start sm:self-auto ${
              isViewingHistorical 
                ? 'text-amber-800 bg-amber-50 border-amber-200' 
                : 'text-blue-700 bg-blue-50 border-blue-100'
            }`}>
              {isViewingHistorical ? 'ข้อมูลสถิติในอดีต (Historical Query)' : 'ฐานข้อมูลจริง (Live Query)'}
            </div>
          </div>

          <div className="pt-2">
            <AnalyticsChart data={data?.timeline || []} isLoading={isLoading} />
          </div>
        </section>

        {/* Section 3 — Insights (2 Cards: Top 5 Dorms & Top 5 Searches) */}
        <section aria-label="ข้อมูลที่น่าสนใจ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Card Left: หอพักยอดนิยม (Top 5) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs">
                      🏆
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      หอพักยอดนิยม
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Top 5</span>
                </div>

                <div className="pt-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : !data?.topDormitories || data.topDormitories.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                      ยังไม่มีข้อมูลการเข้าชมหอพักในช่วงเวลานี้
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.topDormitories.map((item, idx) => {
                        const maxCount = data.topDormitories[0]?.count || 1;
                        const percentage = Math.round((item.count / maxCount) * 100);

                        return (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                  idx === 0
                                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-800'
                                    : idx === 2
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/dorm/${item.id}`}
                                  target="_blank"
                                  className="text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-700 truncate block transition"
                                >
                                  {item.name}
                                </Link>
                                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                                {item.count.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1">ครั้ง</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Right: คำค้นหายอดนิยม (Top 5) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
                      🔍
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      คำค้นหายอดนิยม
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Top 5</span>
                </div>

                <div className="pt-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : !data?.topSearches || data.topSearches.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                      ยังไม่มีข้อมูลการค้นหาในช่วงเวลานี้
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.topSearches.map((item, idx) => {
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                  idx === 0
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : idx === 1
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                {item.keyword}
                              </span>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                                {item.count.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1">ครั้ง</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Confirmation Modal for Reset Display (Requirement 7) */}
      {isResetModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-1">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 id="reset-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                เริ่มนับสถิติใหม่ตั้งแต่ตอนนี้?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                ข้อมูลเดิมจะไม่ถูกลบ<br />และยังสามารถดูย้อนหลังได้
              </p>
            </div>

            {/* Error in modal if any */}
            {resetError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Action Buttons: [ยกเลิก] [รีเซ็ต] */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-70"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>กำลังรีเซ็ต...</span>
                  </>
                ) : (
                  <span>รีเซ็ต</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal for Past Reset Periods (Requirement 8 & 21) */}
      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
          <div className="max-w-lg w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <h3 id="history-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                  ประวัติสถิติ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {isHistoryLoading ? (
                <div className="py-10 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>กำลังโหลดประวัติสถิติ...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs sm:text-sm space-y-1">
                  <p className="font-semibold text-slate-600">ยังไม่มีประวัติสถิติ</p>
                  <p className="text-xs text-slate-400">เมื่อมีการกดรีเซ็ต ข้อมูลแต่ละช่วงจะถูกบันทึกที่นี่</p>
                </div>
              ) : (
                historyList.map((period, idx) => (
                  <div
                    key={period.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            ล่าสุด
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          {new Date(period.endAt).toLocaleString('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {period.startAt ? new Date(period.startAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'จุดเริ่มต้น'} — {new Date(period.endAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectHistoricalPeriod(period)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition cursor-pointer shrink-0"
                    >
                      <span>ดูข้อมูล</span>
                      <span>→</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer: Exactly 1 clean line (Requirement 21) */}
            <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
              ข้อมูลเดิมจะถูกเก็บไว้และสามารถดูย้อนหลังได้
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Helper Component: Clean Minimal Summary Card
// -------------------------------------------------------------

interface SummaryCardProps {
  title: string;
  subtitle: string;
  value?: number;
  changePercent?: number | null;
  icon: React.ReactNode;
  iconBg: string;
  isLoading?: boolean;
}

function SummaryCard({
  title,
  subtitle,
  value,
  changePercent,
  icon,
  iconBg,
  isLoading,
}: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-28" />
        <div className="h-4 bg-slate-100 rounded w-24" />
      </div>
    );
  }

  const hasChange = changePercent !== null && changePercent !== undefined;
  const isPositive = hasChange && changePercent > 0;
  const isNegative = hasChange && changePercent < 0;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-600">{title}</h3>
          <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>

      <div className="pt-1">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
          {value !== undefined ? value.toLocaleString() : '0'}
        </div>
      </div>

      <div className="pt-1 flex items-center gap-1.5 text-xs">
        {hasChange ? (
          <>
            {isPositive && (
              <span className="inline-flex items-center text-emerald-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{changePercent}%
              </span>
            )}
            {isNegative && (
              <span className="inline-flex items-center text-rose-600 font-bold">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {changePercent}%
              </span>
            )}
            {!isPositive && !isNegative && (
              <span className="inline-flex items-center text-slate-400 font-medium">
                <Minus className="w-3 h-3 mr-0.5" />
                0%
              </span>
            )}
            <span className="text-slate-400 text-[11px]">จากช่วงก่อนหน้า</span>
          </>
        ) : (
          <span className="text-slate-400 text-[11px]">—</span>
        )}
      </div>
    </div>
  );
}
