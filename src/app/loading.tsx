import React from 'react';
import DormCardSkeleton from '@/components/DormCardSkeleton';

export default function LoadingHomePage() {
  return (
    <main className="min-h-screen pb-16 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Hero banner skeleton */}
        <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
        
        {/* Filter bar skeleton */}
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        
        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <DormCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </main>
  );
}
