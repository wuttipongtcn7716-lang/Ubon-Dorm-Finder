import { Suspense } from 'react';
import DormExplorer from '@/components/DormExplorer';
import WelcomeScreen from '@/components/WelcomeScreen';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';
import DormCardSkeleton from '@/components/DormCardSkeleton';

export default function HomePage() {
  const dorms = dormsData as Dormitory[];

  return (
    <main className="min-h-screen pb-16 bg-[#f8fafc]">
      <WelcomeScreen />
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="h-48 bg-slate-200/70 rounded-3xl animate-pulse" />
            <div className="h-28 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <DormCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        }
      >
        <DormExplorer initialDorms={dorms} />
      </Suspense>
    </main>
  );
}
