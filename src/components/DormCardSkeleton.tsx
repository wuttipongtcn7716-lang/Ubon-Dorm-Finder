import React from 'react';

export default function DormCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden flex flex-col justify-between shadow-xs animate-pulse">
      <div>
        {/* Image Skeleton */}
        <div className="h-48 w-full bg-gray-200 relative">
          <div className="absolute top-3 left-3 h-6 w-24 bg-gray-300 rounded-full" />
          <div className="absolute bottom-3 right-3 h-5 w-16 bg-gray-300 rounded-md" />
        </div>

        {/* Content Skeleton */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1.5">
            <div className="h-3 w-1/3 bg-gray-200 rounded-md" />
            <div className="h-5 w-4/5 bg-gray-200 rounded-md" />
          </div>

          {/* Price Skeleton */}
          <div className="h-7 w-1/2 bg-gray-200 rounded-md" />

          {/* Tags Skeleton */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="h-5 w-16 bg-gray-200 rounded-md" />
            <div className="h-5 w-14 bg-gray-200 rounded-md" />
            <div className="h-5 w-14 bg-gray-200 rounded-md" />
          </div>
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="p-4 sm:p-5 pt-0 grid grid-cols-2 gap-2">
        <div className="h-9 bg-gray-200 rounded-xl" />
        <div className="h-9 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
