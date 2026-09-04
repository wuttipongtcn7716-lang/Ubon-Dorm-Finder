import React from 'react';
import DormDetailSkeleton from '@/components/DormDetailSkeleton';

export default function LoadingDormDetailPage() {
  return (
    <main className="min-h-screen pb-16 bg-[#f8fafc]">
      <DormDetailSkeleton />
    </main>
  );
}
