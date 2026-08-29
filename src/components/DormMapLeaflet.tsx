'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { MapComponentProps } from './MapComponent';

// Safe Dynamic Import with ssr: false to prevent "window is not defined" error
const MapComponent = dynamic<MapComponentProps>(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100/80 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200/80 animate-pulse">
        <Building2 className="w-8 h-8 text-blue-500 animate-bounce" />
        <p className="text-xs font-semibold text-slate-600">กำลังโหลดแผนที่ ม.อุบลฯ (CartoDB)...</p>
      </div>
    ),
  }
);

export default function DormMapLeaflet(props: MapComponentProps) {
  return <MapComponent {...props} />;
}
