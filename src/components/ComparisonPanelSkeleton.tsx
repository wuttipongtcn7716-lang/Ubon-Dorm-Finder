'use client';

import React from 'react';

interface ComparisonPanelSkeletonProps {
  className?: string;
}

export default function ComparisonPanelSkeleton({ className = '' }: ComparisonPanelSkeletonProps) {
  return (
    <div 
      className={`bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col font-sans animate-pulse ${className}`}
      aria-label="กำลังโหลดข้อมูลเปรียบเทียบเส้นทาง..."
    >
      {/* 1. Header Skeleton */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-300 rounded-full" />
          <div className="h-4 w-28 bg-gray-200 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-14 bg-gray-200 rounded-full" />
          <div className="h-6 w-14 bg-gray-200 rounded-full" />
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* 2. Origin Input Skeleton (Point A) */}
      <div className="mb-2">
        <div className="flex items-center justify-between border border-blue-100 bg-blue-50/60 rounded-xl p-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex-shrink-0" />
            <div className="h-4 w-3/5 bg-blue-200/80 rounded-md" />
          </div>
          <div className="h-6 w-14 bg-blue-300 rounded-lg flex-shrink-0" />
        </div>
      </div>

      {/* 3. Destination Items Skeleton */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between border border-slate-200/80 bg-slate-50/70 rounded-xl p-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="h-4 w-1/2 bg-gray-200 rounded-md" />
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded-lg flex-shrink-0" />
        </div>
        <div className="flex items-center justify-between border border-slate-200/80 bg-slate-50/70 rounded-xl p-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="h-4 w-2/5 bg-gray-200 rounded-md" />
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded-lg flex-shrink-0" />
        </div>
      </div>

      {/* 4. Add Destination Button Skeleton */}
      <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl py-2 flex items-center justify-center gap-2">
        <div className="w-4 h-4 rounded-full bg-indigo-200" />
        <div className="h-4 w-44 bg-indigo-200/80 rounded-md" />
      </div>
    </div>
  );
}
