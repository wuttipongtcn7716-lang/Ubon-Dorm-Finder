'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MapComponentProps } from './MapComponent';
import MapSkeleton from './MapSkeleton';

// Safe Dynamic Import with ssr: false to prevent "window is not defined" error
const MapComponent = dynamic<MapComponentProps>(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <MapSkeleton 
        message="กำลังโหลดแผนที่ ม.อุบลฯ..." 
        className="w-full h-full min-h-[380px] rounded-3xl"
      />
    ),
  }
);

export default function DormMapLeaflet(props: MapComponentProps) {
  return <MapComponent {...props} />;
}
