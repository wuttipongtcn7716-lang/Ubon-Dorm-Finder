'use client';

import React from 'react';

interface DormDetailSkeletonProps {
  className?: string;
}

export default function DormDetailSkeleton({ className = '' }: DormDetailSkeletonProps) {
  return (
    <div 
      className={`w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse ${className}`}
      aria-label="กำลังโหลดข้อมูลรายละเอียดหอพัก..."
    >
      {/* 1. Top Navigation / Back Button Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-gray-200 rounded-xl" />
          <div className="h-9 w-9 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* 2. Main Image / Gallery Skeleton */}
      <div className="w-full h-64 sm:h-96 bg-gray-200 rounded-3xl relative overflow-hidden border border-gray-200/80">
        <div className="absolute top-4 left-4 h-7 w-32 bg-gray-300 rounded-full" />
        <div className="absolute bottom-4 right-4 h-6 w-24 bg-gray-300 rounded-md" />
      </div>

      {/* 3. Dormitory Title & Badges */}
      <div className="space-y-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="h-6 w-28 bg-emerald-100 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 w-3/4 sm:w-1/2 bg-gray-200 rounded-md" />
        <div className="h-4 w-1/3 bg-gray-200 rounded-md" />
      </div>

      {/* 4. Price & Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded-md" />
          <div className="h-8 w-32 bg-amber-100 rounded-md" />
          <div className="h-3 w-16 bg-gray-200 rounded-md" />
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded-md" />
          <div className="h-8 w-28 bg-blue-100 rounded-md" />
          <div className="h-3 w-20 bg-gray-200 rounded-md" />
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded-md" />
          <div className="h-8 w-24 bg-gray-200 rounded-md" />
          <div className="h-3 w-20 bg-gray-200 rounded-md" />
        </div>
      </div>

      {/* 5. Action Buttons Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="h-12 bg-blue-200/80 rounded-2xl" />
        <div className="h-12 bg-gray-200 rounded-2xl" />
      </div>

      {/* 6. Facilities & Standards Skeleton */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-14 bg-gray-100 border border-gray-200/60 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
