'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Dormitory } from '@/types/dormitory';
import { 
  Crosshair, Check, X, Navigation, 
  Car, Bike, MapPin, Compass, Circle, ArrowUpDown,
  ChevronRight, ChevronDown, ShieldCheck, Plus,
  LocateFixed, Flag, Layers, RotateCcw, Building,
  Search, SlidersHorizontal, Loader2, Info, Edit3,
  ChevronUp, Minus
} from 'lucide-react';
import { 
  landmarksData, getLandmarkMeta, LandmarkItem, 
  LandmarkGroup, MAIN_CATEGORIES 
} from '@/data/landmarks';
import Link from 'next/link';
import { LAT_OFFSET as DEFAULT_LAT_OFFSET, LNG_OFFSET as DEFAULT_LNG_OFFSET } from '@/config/mapConfig';

// Dynamically require leaflet.markercluster only in browser
if (typeof window !== 'undefined') {
  try {
    require('leaflet.markercluster');
  } catch (e) {}
}

// Color Scheme for Multi-Destination Comparison (Up to 4 destinations)
export const ROUTE_COLORS = [
  { 
    color: '#1a73e8', 
    borderColor: '#60a5fa', 
    haloColor: '#1e3a8a', 
    dotColor: 'bg-indigo-600', 
    textColor: 'text-indigo-700', 
    bgLight: 'bg-indigo-50', 
    borderLight: 'border-indigo-200/80',
    label: 'ปลายทาง 1'
  },
  { 
    color: '#ea580c', 
    borderColor: '#fb923c', 
    haloColor: '#7c2d12', 
    dotColor: 'bg-orange-600', 
    textColor: 'text-orange-700', 
    bgLight: 'bg-orange-50', 
    borderLight: 'border-orange-200/80',
    label: 'ปลายทาง 2'
  },
  { 
    color: '#059669', 
    borderColor: '#34d399', 
    haloColor: '#064e3b', 
    dotColor: 'bg-emerald-600', 
    textColor: 'text-emerald-700', 
    bgLight: 'bg-emerald-50', 
    borderLight: 'border-emerald-200/80',
    label: 'ปลายทาง 3'
  },
  { 
    color: '#9333ea', 
    borderColor: '#c084fc', 
    haloColor: '#581c87', 
    dotColor: 'bg-purple-600', 
    textColor: 'text-purple-700', 
    bgLight: 'bg-purple-50', 
    borderLight: 'border-purple-200/80',
    label: 'ปลายทาง 4'
  },
];

export interface DestinationItem {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  colorIndex: number;
  icon?: string;
  category?: string;
  distanceKm?: number;
  durationMins?: number;
}

// Approved major campus landmarks used as default origin points
export const OFFICIAL_CAMPUS_GATES = [
  { id: 'CLB3', name: 'อาคารเรียนรวม 3 (CLB3)', lat: 15.117810, lng: 104.907578, icon: '🏛️', category: 'building' },
  { id: 'CLB4', name: 'อาคารเรียนรวม 4 (CLB4)', lat: 15.120793, lng: 104.908469, icon: '🏛️', category: 'building' },
  { id: 'CLB5', name: 'อาคารเรียนรวม 5 (CLB5)', lat: 15.120244, lng: 104.909043, icon: '🏛️', category: 'building' },
  { id: 'ODL', name: 'หอสมุดกลาง (ODL)', lat: 15.118783, lng: 104.907804, icon: '📚', category: 'building' },
  { id: 'OFFICE', name: 'สำนักงานอธิการบดี', lat: 15.117253, lng: 104.903069, icon: '🏢', category: 'building' },
];

const defaultCenter: [number, number] = [15.1186, 104.9150];

export function calculateDistanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dKm = R * c;
  if (dKm < 1) {
    const meters = Math.round((dKm * 1000) / 10) * 10;
    return `${meters} ม.`;
  }
  return `${dKm.toFixed(1)} กม.`;
}

// Zero-Drift Locked Markers with Explicit Anchor Coordinates
const createUserGpsMarker = (label?: string) => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(37, 99, 235, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background: #2563eb; border: 2.5px solid white; box-shadow: 0 0 10px rgba(37, 99, 235, 0.8);"></div>
        <div style="position: absolute; left: 26px; top: 50%; transform: translateY(-50%); background: #1e3a8a; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; border: 1.5px solid #93c5fd; box-shadow: 0 4px 12px rgba(0,0,0,0.25); white-space: nowrap; pointer-events: none;">
          ${label || 'ตำแหน่ง GPS ของคุณ'}
        </div>
      </div>
    `,
    className: 'custom-gps-user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};


const createCampusGateMarker = (name: string, isSelected: boolean = false) => {
  return L.divIcon({
    html: `
      <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          transform: translate(-50%, -50%);
          background: ${isSelected ? '#0f172a' : '#1e3a8a'};
          color: #fef08a;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid #93c5fd;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          cursor: pointer;
        ">
          <span>🏛️</span>
          <span>${name}</span>
        </div>
      </div>
    `,
    className: 'custom-campus-gate-marker',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    popupAnchor: [0, -16],
  });
};

const createOriginMarker = (label: string, isGps: boolean = false, isWhite: boolean = false) => {
  if (isGps) {
    return createUserGpsMarker(label);
  }
  return L.divIcon({
    html: `
      <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          transform: translate(-50%, -50%);
          background: #0284c7;
          color: white;
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 900;
          border: 2px solid #bae6fd;
          box-shadow: 0 0 0 4px rgba(2,132,199,0.4), 0 6px 16px rgba(0,0,0,0.3);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          cursor: pointer;
        ">
          <span>${isWhite ? '🛡️' : '🏠'} จุดเริ่มต้น:</span>
          <span style="color: #fef08a;">${label}</span>
        </div>
      </div>
    `,
    className: 'custom-origin-marker',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
};

const createCustomMarker = (isWhite: boolean, isSelected: boolean, name: string) => {
  const bgColor = isSelected ? '#0284c7' : isWhite ? '#059669' : '#d97706';
  const borderColor = isSelected ? '#bae6fd' : isWhite ? '#6ee7b7' : '#fcd34d';

  return L.divIcon({
    html: `
      <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          transform: translate(-50%, -50%);
          background: ${bgColor};
          color: white;
          padding: ${isSelected ? '5px 12px' : '4px 10px'};
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid ${borderColor};
          box-shadow: ${isSelected ? '0 0 0 4px rgba(2,132,199,0.4), 0 6px 16px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.2)'};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          white-space: nowrap;
          cursor: pointer;
        ">
          <span>${isWhite ? '🛡️' : '🏠'}</span>
          <span>${name}</span>
        </div>
      </div>
    `,
    className: 'custom-flexible-dorm-marker',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    popupAnchor: [0, -16],
  });
};

const createDestinationPoiMarker = (name: string, index: number, icon: string = '📍') => {
  const colorMeta = ROUTE_COLORS[index % ROUTE_COLORS.length];
  return L.divIcon({
    html: `
      <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          transform: translate(-50%, -50%);
          background: ${colorMeta.color};
          color: white;
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 900;
          border: 2px solid ${colorMeta.borderColor};
          box-shadow: 0 0 0 4px ${colorMeta.color}55, 0 6px 16px rgba(0,0,0,0.3);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          cursor: pointer;
        ">
          <span style="font-size: 10px; background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 9999px;">${index + 1}</span>
          <span>${icon}</span>
          <span>${name}</span>
        </div>
      </div>
    `,
    className: 'custom-dest-poi-marker',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
};

const createLandmarkMarker = (landmark: LandmarkItem, isSelected: boolean = false) => {
  const meta = getLandmarkMeta(landmark.category, landmark.name);

  return L.divIcon({
    html: `
      <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          transform: translate(-50%, -50%);
          background: ${isSelected ? '#0f172a' : 'white'};
          color: ${isSelected ? 'white' : '#0f172a'};
          padding: ${isSelected ? '5px 12px' : '4px 10px'};
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid ${meta.color};
          box-shadow: ${isSelected ? '0 0 0 3px rgba(15,23,42,0.35), 0 4px 14px rgba(0,0,0,0.3)' : '0 3px 10px rgba(0,0,0,0.18)'};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          white-space: nowrap;
          cursor: pointer;
        ">
          <span style="font-size: 12px; line-height: 1;">${meta.icon}</span>
          <span style="color: ${isSelected ? '#fde047' : '#1e293b'}; line-height: 1;">${landmark.name}</span>
        </div>
      </div>
    `,
    className: 'custom-flexible-landmark-marker',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
};

export type SelectedPlaceType = 
  | { type: 'dorm'; dorm: Dormitory }
  | { type: 'landmark'; landmark: LandmarkItem };

export type OriginMode = 'gps' | 'dorm' | 'gate' | 'custom';

export interface OriginPointData {
  mode: OriginMode;
  lat: number;
  lng: number;
  label: string;
  dormId?: string | number;
  isWhite?: boolean;
}

function MapEventsHandler({
  isPickingManualOrigin,
  onPickManualOrigin,
}: {
  isPickingManualOrigin: boolean;
  onPickManualOrigin: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      console.log(`Map Clicked Coordinates -> Latitude: ${e.latlng.lat}, Longitude: ${e.latlng.lng}`);
      if (isPickingManualOrigin) {
        onPickManualOrigin(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapController({
  targetCenter,
  zoom,
}: {
  targetCenter: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter && !isNaN(targetCenter[0]) && !isNaN(targetCenter[1])) {
      map.flyTo(targetCenter, zoom || 16, { animate: true, duration: 1.2 });
    }
  }, [targetCenter, zoom, map]);
  return null;
}

function MarkerClusterGroupLayer({
  dorms,
  selectedDormId,
  selectedLandmarkName,
  visibleLandmarks,
  onSelectPlace,
  adjustLatLng,
  onMarkerDragged,
}: {
  dorms: Dormitory[];
  selectedDormId?: string | number | null;
  selectedLandmarkName?: string | null;
  visibleLandmarks: LandmarkItem[];
  onSelectPlace: (place: SelectedPlaceType) => void;
  adjustLatLng: (lat: number, lng: number) => [number, number];
  onMarkerDragged: (name: string, lat: number, lng: number) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  const dormMarkersMapRef = useRef<Map<string | number, L.Marker>>(new Map());
  const landmarkMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    let group: L.MarkerClusterGroup | L.LayerGroup;

    if (typeof (L as any).markerClusterGroup === 'function') {
      group = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        spiderfyDistanceMultiplier: 2.2,
        animate: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let sizeClass = 'w-9 h-9 text-xs';
          let bgClass = 'bg-[#0f2b5c] text-white border-white/80';

          if (count > 20) {
            sizeClass = 'w-11 h-11 text-sm font-black';
            bgClass = 'bg-amber-600 text-white border-amber-300';
          } else if (count > 8) {
            sizeClass = 'w-10 h-10 text-xs font-bold';
            bgClass = 'bg-[#1e3a8a] text-white border-white';
          }

          return L.divIcon({
            html: `
              <div class="${sizeClass} ${bgClass} rounded-full border-2 shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 select-none">
                <span>${count}</span>
              </div>
            `,
            className: 'custom-marker-cluster-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
        },
      });
    } else {
      group = L.layerGroup();
    }

    clusterGroupRef.current = group;
    map.addLayer(group);

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map]);

  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;

    dormMarkersMapRef.current.forEach((marker) => {
      group.removeLayer(marker);
    });
    dormMarkersMapRef.current.clear();

    dorms.forEach((dorm) => {
      if (dorm.id === selectedDormId) return;

      const rawLat = Number(dorm.lat ?? dorm.latitude);
      const rawLng = Number(dorm.lng ?? dorm.longitude);
      if (!rawLat || !rawLng || isNaN(rawLat) || isNaN(rawLng)) return;

      const [dormLat, dormLng] = adjustLatLng(rawLat, rawLng);

      const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');

      const marker = L.marker([dormLat, dormLng], {
        icon: createCustomMarker(isWhite, false, dorm.name),
        riseOnHover: true,
        draggable: true,
      });

      marker.on('click', () => {
        onSelectPlace({ type: 'dorm', dorm });
      });

      marker.on('dragend', (event) => {
        const newLatLng = event.target.getLatLng();
        onMarkerDragged(dorm.name, newLatLng.lat, newLatLng.lng);
      });

      group.addLayer(marker);
      dormMarkersMapRef.current.set(dorm.id, marker);
    });
  }, [dorms, selectedDormId, onSelectPlace, adjustLatLng, onMarkerDragged]);

  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;

    landmarkMarkersMapRef.current.forEach((marker) => {
      group.removeLayer(marker);
    });
    landmarkMarkersMapRef.current.clear();

    visibleLandmarks.forEach((landmark) => {
      const rawLat = Number(landmark.lat);
      const rawLng = Number(landmark.lng);
      if (!rawLat || !rawLng || isNaN(rawLat) || isNaN(rawLng)) return;

      const [lLat, lLng] = adjustLatLng(rawLat, rawLng);

      const isSelected = selectedLandmarkName === landmark.name;

      const marker = L.marker([lLat, lLng], {
        icon: createLandmarkMarker(landmark, isSelected),
        riseOnHover: true,
        zIndexOffset: isSelected ? 500 : 0,
        draggable: true,
      });

      marker.on('click', () => {
        onSelectPlace({ type: 'landmark', landmark });
      });

      marker.on('dragend', (event) => {
        const newLatLng = event.target.getLatLng();
        onMarkerDragged(landmark.name, newLatLng.lat, newLatLng.lng);
      });

      group.addLayer(marker);
      landmarkMarkersMapRef.current.set(landmark.name, marker);
    });
  }, [visibleLandmarks, selectedLandmarkName, onSelectPlace, adjustLatLng, onMarkerDragged]);

  return null;
}

interface CalculatedRoute {
  id: string | number;
  coords: [number, number][];
  color: string;
  haloColor: string;
  distanceKm: number;
  baseDurationMins: number;
}

export const LEG_COLORS = [
  { color: '#3b82f6', haloColor: '#1e3a8a', bgClass: 'bg-blue-600', textClass: 'text-blue-600', name: 'ฟ้า' },
  { color: '#10b981', haloColor: '#064e3b', bgClass: 'bg-emerald-600', textClass: 'text-emerald-600', name: 'เขียว' },
  { color: '#f59e0b', haloColor: '#78350f', bgClass: 'bg-amber-500', textClass: 'text-amber-500', name: 'ส้ม' },
  { color: '#8b5cf6', haloColor: '#4c1d95', bgClass: 'bg-purple-600', textClass: 'text-purple-600', name: 'ม่วง' },
  { color: '#ef4444', haloColor: '#7f1d1d', bgClass: 'bg-rose-600', textClass: 'text-rose-600', name: 'แดง' },
];

interface MultiColorLeg {
  id: string | number;
  coords: [number, number][];
  color: string;
  haloColor: string;
  distanceKm: number;
  baseDurationMins: number;
}

function MultiRoadRoutingLayer({
  originLocation,
  destinations,
  forceFitKey,
  onUpdateStats,
  activeDestId,
  setActiveDestId,
  adjustLatLng,
}: {
  originLocation: { lat: number; lng: number; label?: string; mode?: OriginMode };
  destinations: DestinationItem[];
  forceFitKey?: number | null;
  onUpdateStats?: (statsMap: Record<string | number, { distanceKm: number; baseDurationMins: number; distanceMeters: number }>) => void;
  activeDestId: string | number | null;
  setActiveDestId: (id: string | number | null) => void;
  adjustLatLng: (lat: number, lng: number) => [number, number];
}) {
  const map = useMap();
  const [legs, setLegs] = useState<MultiColorLeg[]>([]);
  const lastFitKeyRef = useRef<string | null>(null);
  const lastDestinationsKeyRef = useRef<string>('');

  useEffect(() => {
    if (!map || destinations.length === 0) {
      setLegs([]);
      return;
    }

    // Determine if the actual list of destinations changed
    const destKeys = destinations.map((d) => d.id).join('|');
    const destsChanged = lastDestinationsKeyRef.current !== destKeys;
    lastDestinationsKeyRef.current = destKeys;

    // Clear previous legs instantly ONLY if destinations list changed (prevents flickering on GPS updates)
    if (destsChanged) {
      setLegs([]);
    }

    let isCancelled = false;
    
    // Apply offset adjustment to origin if it's a database/stored point
    const originNeedsOffset = originLocation.mode !== 'gps' && originLocation.mode !== 'custom';
    const [startLat, startLng] = originNeedsOffset
      ? adjustLatLng(Number(originLocation.lat), Number(originLocation.lng))
      : [Number(originLocation.lat), Number(originLocation.lng)];

    if (isNaN(startLat) || isNaN(startLng)) return;

    const fetchMultiColorLegs = async () => {
      const allCoords: [number, number][] = [];
      const statsMap: Record<string | number, { distanceKm: number; baseDurationMins: number; distanceMeters: number }> = {};
      
      // 2. วนลูปสร้าง Request แยกแต่ละเส้นทางจาก Origin -> Destination[i] (ยิงแยกเส้นตรงจาก GPS ไปหาแต่ละจุดโดยตรง)
      const legPromises = destinations.map((d, idx) => {
        const [adjLat, adjLng] = adjustLatLng(Number(d.lat), Number(d.lng));
        if (isNaN(adjLat) || isNaN(adjLng)) return Promise.resolve(null);

        const colorMeta = ROUTE_COLORS[idx % ROUTE_COLORS.length];

        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${adjLng},${adjLat}?overview=full&geometries=geojson&steps=true&radiuses=150;150`;

        return fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (data.code === 'Ok' && data.routes && data.routes[0]) {
              const r = data.routes[0];
              const coords: [number, number][] = r.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
              );
              const km = parseFloat((r.distance / 1000).toFixed(1));
              const duration = Math.max(r.duration, (r.distance / 1000 / 28) * 3600);
              const baseMins = Math.max(1, Math.round(duration / 60));

              return {
                id: d.id,
                coords,
                color: colorMeta.color,
                haloColor: colorMeta.haloColor,
                distanceKm: km,
                baseDurationMins: baseMins,
                distanceMeters: r.distance,
              };
            }
            throw new Error('No route');
          })
          .catch((err) => {
            console.error(`ไม่สามารถคำนวณเส้นทางไปยัง "${d.name}" ได้ กรุณาตรวจสอบพิกัดของสถานที่นี้`, err);
            // Fallback เส้นตรงเชื่อมคู่จุดนั้นๆ
            return {
              id: d.id,
              coords: [[startLat, startLng], [adjLat, adjLng]] as [number, number][],
              color: colorMeta.color,
              haloColor: colorMeta.haloColor,
              distanceKm: 0,
              baseDurationMins: 0,
              distanceMeters: 0,
            };
          });
      });

      // 3. จัดการผลลัพธ์พร้อมกันด้วย Promise.all()
      const resolvedLegs = await Promise.all(legPromises);
      const validLegs = resolvedLegs.filter((leg): leg is NonNullable<typeof leg> => leg !== null);

      if (!isCancelled) {
        validLegs.forEach((leg) => {
          statsMap[leg.id] = {
            distanceKm: leg.distanceKm,
            baseDurationMins: leg.baseDurationMins,
            distanceMeters: leg.distanceMeters,
          };
          leg.coords.forEach((c) => allCoords.push(c));
        });

        // Add start origin coordinates to bounds calculation to make sure they are always visible
        allCoords.push([startLat, startLng]);

        setLegs(validLegs);

        if (onUpdateStats) {
          onUpdateStats(statsMap);
        }

        // Fit bounds key excludes raw GPS coordinate changes to avoid auto-zoom bounce
        const destKeys = destinations.map((d) => `${d.id}-${d.lat}-${d.lng}`).join('|');
        const fitKey = `${destKeys}-${forceFitKey || 0}`;

        const isInteracting = (map.dragging as any)?.moving() || (map as any)._animatingZoom;

        if (allCoords.length > 1 && lastFitKeyRef.current !== fitKey && !isInteracting) {
          lastFitKeyRef.current = fitKey;
          const bounds = L.latLngBounds(allCoords);
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
        }
      }
    };

    fetchMultiColorLegs();

    return () => {
      isCancelled = true;
    };
  }, [map, originLocation.lat, originLocation.lng, originLocation.mode, destinations, forceFitKey, onUpdateStats, adjustLatLng]);

  if (legs.length === 0) return null;

  // Declarative bringToFront by rendering the active/hovered leg last!
  const sortedLegs = [...legs].sort((a, b) => {
    if (a.id === activeDestId) return 1;
    if (b.id === activeDestId) return -1;
    return 0;
  });

  return (
    <>
      {sortedLegs.map((leg, index) => {
        const isActive = activeDestId === leg.id;
        return (
          <React.Fragment key={`leg-${leg.id}-${index}`}>
            {/* Outer Halo เรืองแสงตามสีช่วง */}
            <Polyline
              positions={leg.coords}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.bringToFront();
                  setActiveDestId(leg.id);
                },
                mouseout: () => {
                  setActiveDestId(null);
                },
                click: (e) => {
                  e.target.bringToFront();
                  setActiveDestId(leg.id);
                }
              }}
              pathOptions={{
                color: leg.haloColor,
                weight: isActive ? 12 : 8,
                opacity: isActive ? 0.6 : 0.25, // default opacity reduced for overlapping
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Core Polyline แยกสีแต่ละช่วงชัดเจน */}
            <Polyline
              positions={leg.coords}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.bringToFront();
                  setActiveDestId(leg.id);
                },
                mouseout: () => {
                  setActiveDestId(null);
                },
                click: (e) => {
                  e.target.bringToFront();
                  setActiveDestId(leg.id);
                }
              }}
              pathOptions={{
                color: leg.color,
                weight: isActive ? 9 : 5.5,
                opacity: isActive ? 0.95 : 0.6, // opacity 0.6 by default as requested
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}


export interface MapComponentProps {
  dorms: Dormitory[];
  selectedDorm?: Dormitory | null;
  userLocation?: { lat: number; lng: number } | null;
  showRoute?: boolean;
  travelMode?: 'driving' | 'motorcycle' | 'bicycling' | 'walking';
  showLandmarks?: boolean;
  onRouteCalculated?: (distanceMeters: number, durationSeconds: number) => void;
  onSelectDorm?: (dorm: Dormitory) => void;
  onNavigate?: (dorm: Dormitory) => void;
  className?: string;
  initialZoom?: number;
}

export default function MapComponent({
  dorms,
  selectedDorm,
  userLocation,
  showRoute = false,
  travelMode = 'driving',
  onRouteCalculated,
  onSelectDorm,
  onNavigate,
  className = 'w-full h-full min-h-[500px] flex-1',
  initialZoom = 15,
}: MapComponentProps) {
  // Safe Default Icon Fix inside useEffect
  useEffect(() => {
    if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  }, []);

  // Vehicle Type State
    const [vehicleType, setVehicleType] = useState<'driving' | 'motorcycle'>(
    travelMode === 'motorcycle' ? 'motorcycle' : 'driving'
  );

  useEffect(() => {
    if (travelMode === 'motorcycle') {
      setVehicleType('motorcycle');
    } else {
      setVehicleType('driving');
    }
  }, [travelMode]);

  // Real-time GPS Location Tracking
  const [liveGpsLocation, setLiveGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsToast, setGpsToast] = useState<string | null>(null);
  const [targetFlyCenter, setTargetFlyCenter] = useState<[number, number] | null>(null);

  // Coordinate Offset Adjustment (Google Maps -> OpenStreetMap alignment)
  const [latOffset, setLatOffset] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('map_lat_offset');
      return saved !== null ? parseFloat(saved) : DEFAULT_LAT_OFFSET;
    }
    return DEFAULT_LAT_OFFSET;
  });
  const [lngOffset, setLngOffset] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('map_lng_offset');
      return saved !== null ? parseFloat(saved) : DEFAULT_LNG_OFFSET;
    }
    return DEFAULT_LNG_OFFSET;
  });
  const [showOffsetControls, setShowOffsetControls] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsAdmin(params.get('admin') === 'true');
    }
  }, []);

  const adjustLatLng = useCallback((lat: number, lng: number): [number, number] => {
    return [lat + latOffset, lng + lngOffset];
  }, [latOffset, lngOffset]);

  const handleOffsetChange = (newLat: number, newLng: number) => {
    setLatOffset(newLat);
    setLngOffset(newLng);
    if (typeof window !== 'undefined') {
      localStorage.setItem('map_lat_offset', newLat.toString());
      localStorage.setItem('map_lng_offset', newLng.toString());
    }
  };

  // Draggable marker coordinate display state
  const [copiedCoords, setCopiedCoords] = useState<{ name: string; lat: number; lng: number } | null>(null);

  const handleMarkerDragEnd = useCallback((name: string, newLat: number, newLng: number) => {
    setCopiedCoords({ name, lat: newLat, lng: newLng });
    console.log(`[Draggable Marker] "${name}" moved to Lat: ${newLat}, Lng: ${newLng}`);
  }, []);

  // Dynamic Origin State: Defaults to GPS
  const [originPoint, setOriginPoint] = useState<OriginPointData>(() => {
    return {
      mode: 'gps',
      lat: userLocation?.lat || defaultCenter[0],
      lng: userLocation?.lng || defaultCenter[1],
      label: 'ตำแหน่ง GPS ของคุณ',
    };
  });

  // Auto-update GPS origin when userLocation prop or GPS arrives
  useEffect(() => {
    if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
      setLiveGpsLocation(userLocation);
      setOriginPoint((prev) => {
        if (prev.mode === 'gps') {
          return {
            ...prev,
            lat: userLocation.lat,
            lng: userLocation.lng,
          };
        }
        return prev;
      });
    }
  }, [userLocation]);

  // Initial immediate GPS fetch on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setLiveGpsLocation({ lat: uLat, lng: uLng });
        setOriginPoint((prev) => {
          if (prev.mode === 'gps') {
            return {
              ...prev,
              lat: uLat,
              lng: uLng,
            };
          }
          return prev;
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Continuous background GPS Watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    let watchId: number | null = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setLiveGpsLocation({ lat: uLat, lng: uLng });
          setOriginPoint((prev) => {
            if (prev.mode === 'gps') {
              return { ...prev, lat: uLat, lng: uLng };
            }
            return prev;
          });
        },
        () => {},
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      );
    } catch (e) {}

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Change Origin Dropdown State
  const [isOriginModalOpen, setIsOriginModalOpen] = useState(false);
  const [originSearchTerm, setOriginSearchTerm] = useState('');
  const [originTab, setOriginTab] = useState<'gps' | 'dorm' | 'gate' | 'map'>('dorm');
  const [isPickingManualOrigin, setIsPickingManualOrigin] = useState(false);
  const originModalRef = useRef<HTMLDivElement>(null);

  // Multi-Destination Comparison State
  const [destinations, setDestinations] = useState<DestinationItem[]>(() => {
    if (selectedDorm) {
      const dLat = Number(selectedDorm.lat ?? selectedDorm.latitude);
      const dLng = Number(selectedDorm.lng ?? selectedDorm.longitude);
      return [{
        id: selectedDorm.id,
        name: selectedDorm.name,
        lat: dLat,
        lng: dLng,
        colorIndex: 0,
        icon: '🏠',
        category: 'หอพักเป้าหมาย',
      }];
    }
    const defaultGate = OFFICIAL_CAMPUS_GATES[0];
    return [{
      id: defaultGate.name,
      name: defaultGate.name,
      lat: defaultGate.lat,
      lng: defaultGate.lng,
      colorIndex: 0,
      icon: defaultGate.icon,
      category: defaultGate.category,
    }];
  });

  // Sync destination 1 when selectedDorm changes
  useEffect(() => {
    if (selectedDorm) {
      const dLat = Number(selectedDorm.lat ?? selectedDorm.latitude);
      const dLng = Number(selectedDorm.lng ?? selectedDorm.longitude);
      if (!isNaN(dLat) && !isNaN(dLng)) {
        setDestinations((prev) => {
          const rest = prev.slice(1);
          const firstDest: DestinationItem = {
            id: selectedDorm.id,
            name: selectedDorm.name,
            lat: dLat,
            lng: dLng,
            colorIndex: 0,
            icon: '🏠',
            category: 'หอพักเป้าหมาย',
          };
          return [firstDest, ...rest];
        });
        setForceFitKey(Date.now());
      }
    }
  }, [selectedDorm]);

  const [isAddPoiDropdownOpen, setIsAddPoiDropdownOpen] = useState(false);
  const [poiSearchTerm, setPoiSearchTerm] = useState('');
  const [poiFilterCategory, setPoiFilterCategory] = useState<string>('all');
  const addPoiDropdownRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState<LandmarkGroup>('none');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceType | null>(null);

  const [forceFitKey, setForceFitKey] = useState<number>(0);
  const [destinationStats, setDestinationStats] = useState<Record<string | number, { distanceKm: number; baseDurationMins: number; distanceMeters: number }>>({});

  // Minimize/maximize comparison panel
  const [isComparePanelMinimized, setIsComparePanelMinimized] = useState(false);

  // Highlight/active destination route leg ID
  const [activeDestId, setActiveDestId] = useState<string | number | null>(null);

  const handleRequestLiveGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsToast('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }

    setIsLocatingGps(true);
    setGpsToast('กำลังค้นหาพิกัด GPS สดของคุณ...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLiveGpsLocation({ lat: userLat, lng: userLng });
        setTargetFlyCenter([userLat, userLng]);
        setIsLocatingGps(false);
        setGpsToast(`📍 พิกัด GPS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
        setTimeout(() => setGpsToast(null), 4000);
      },
      (err) => {
        setIsLocatingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsToast('กรุณาอนุญาตการเข้าถึง Location ในเบราว์เซอร์');
        } else {
          setGpsToast('ไม่สามารถค้นหาตำแหน่ง GPS ได้ในขณะนี้');
        }
        setTimeout(() => setGpsToast(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (addPoiDropdownRef.current && !addPoiDropdownRef.current.contains(event.target as Node)) {
        setIsAddPoiDropdownOpen(false);
      }
      if (originModalRef.current && !originModalRef.current.contains(event.target as Node)) {
        setIsOriginModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSetOriginToGps = () => {
    if (liveGpsLocation) {
      setOriginPoint({
        mode: 'gps',
        lat: liveGpsLocation.lat,
        lng: liveGpsLocation.lng,
        label: 'ตำแหน่ง GPS ของคุณ',
      });
      setTargetFlyCenter([liveGpsLocation.lat, liveGpsLocation.lng]);
    } else {
      handleRequestLiveGps();
      navigator.geolocation.getCurrentPosition((pos) => {
        setOriginPoint({
          mode: 'gps',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'ตำแหน่ง GPS ของคุณ',
        });
        setTargetFlyCenter([pos.coords.latitude, pos.coords.longitude]);
      });
    }
    setIsOriginModalOpen(false);
    setForceFitKey(Date.now());
  };

  const handleSetOriginToDorm = (dorm: Dormitory) => {
    const dLat = Number(dorm.lat ?? dorm.latitude);
    const dLng = Number(dorm.lng ?? dorm.longitude);
    setOriginPoint({
      mode: 'dorm',
      lat: dLat,
      lng: dLng,
      label: dorm.name,
      dormId: dorm.id,
      isWhite: Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน'),
    });
    const [adjustedLat, adjustedLng] = adjustLatLng(dLat, dLng);
    setTargetFlyCenter([adjustedLat, adjustedLng]);
    setIsOriginModalOpen(false);
    setForceFitKey(Date.now());
  };

  const handleSetOriginToGate = (gate: typeof OFFICIAL_CAMPUS_GATES[0]) => {
    setOriginPoint({
      mode: 'gate',
      lat: gate.lat,
      lng: gate.lng,
      label: gate.name,
    });
    const [adjustedLat, adjustedLng] = adjustLatLng(gate.lat, gate.lng);
    setTargetFlyCenter([adjustedLat, adjustedLng]);
    setIsOriginModalOpen(false);
    setForceFitKey(Date.now());
  };

  const handlePickManualOriginOnMap = (lat: number, lng: number) => {
    setOriginPoint({
      mode: 'custom',
      lat,
      lng,
      label: `พิกัด ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
    setIsPickingManualOrigin(false);
    setIsOriginModalOpen(false);
    setForceFitKey(Date.now());
  };

  const visibleLandmarks = useMemo(() => {
    if (activeCategory === 'none') return [];
    if (activeCategory === 'all') return landmarksData;
    return landmarksData.filter((lm) => {
      const meta = getLandmarkMeta(lm.category, lm.name);
      return meta.group === activeCategory || lm.category === activeCategory;
    });
  }, [activeCategory]);

  const handleSelectPlace = useCallback((place: SelectedPlaceType) => {
    setSelectedPlace(place);
    if (place.type === 'dorm' && onSelectDorm) {
      onSelectDorm(place.dorm);
    }
  }, [onSelectDorm]);

  const handleAddPoiDestination = (poi: LandmarkItem) => {
    const meta = getLandmarkMeta(poi.category, poi.name);
    setDestinations((prev) => {
      if (prev.some((d) => d.id === poi.name)) return prev;
      if (prev.length >= 4) return prev;
      const newDest: DestinationItem = {
        id: poi.name,
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        colorIndex: prev.length,
        icon: meta.icon,
        category: meta.label,
      };
      return [...prev, newDest];
    });
    setIsAddPoiDropdownOpen(false);
    setPoiSearchTerm('');
    setForceFitKey(Date.now());
  };

  const handleRemoveDestination = (idToRemove: string | number) => {
    setDestinations((prev) => {
      const filtered = prev.filter((d) => d.id !== idToRemove);
      return filtered.map((d, idx) => ({ ...d, colorIndex: idx }));
    });
    setForceFitKey(Date.now());
  };

  const handleStatsUpdated = useCallback((statsMap: Record<string | number, { distanceKm: number; baseDurationMins: number; distanceMeters: number }>) => {
    setDestinationStats(statsMap);
    if (destinations.length > 0 && statsMap[destinations[0].id] && onRouteCalculated) {
      const s = statsMap[destinations[0].id];
      const effMins = vehicleType === 'motorcycle' ? Math.max(1, Math.round(s.baseDurationMins * 0.85)) : s.baseDurationMins;
      onRouteCalculated(s.distanceMeters, effMins * 60);
    }
  }, [destinations, vehicleType, onRouteCalculated]);

  const activeCategoryMeta = MAIN_CATEGORIES.find((c) => c.id === activeCategory) || MAIN_CATEGORIES[0];

  const availablePoisToAdd = useMemo(() => {
    const currentIds = new Set(destinations.map((d) => d.id));
    return landmarksData
      .filter((p) => !currentIds.has(p.name))
      .filter((p) => {
        if (poiFilterCategory !== 'all' && p.category !== poiFilterCategory) {
          const meta = getLandmarkMeta(p.category, p.name);
          if (meta.group !== poiFilterCategory) return false;
        }
        if (!poiSearchTerm) return true;
        const q = poiSearchTerm.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      });
  }, [destinations, poiSearchTerm, poiFilterCategory]);

  const filteredDormsForOrigin = useMemo(() => {
    if (!originSearchTerm) return dorms;
    const q = originSearchTerm.toLowerCase();
    return dorms.filter((d) => d.name.toLowerCase().includes(q) || (d.zone && d.zone.toLowerCase().includes(q)));
  }, [dorms, originSearchTerm]);

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden bg-slate-100 ${className}`}>
      
      {/* 1. Google Maps Style Multi-Destination Comparison Box (Floating Card on Top-Left) */}
      <div className={`absolute top-3 left-3 sm:left-4 w-[calc(100%-110px)] sm:w-88 md:w-[420px] pointer-events-auto transition-all duration-300 ${isOriginModalOpen || isAddPoiDropdownOpen ? 'z-[9999]' : 'z-[1000]'}`}>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 p-4 flex flex-col font-sans transition-all">
          
          {/* 1. ส่วนหัว */}
          <div className={`flex justify-between items-center select-none ${isComparePanelMinimized ? '' : 'mb-3 pb-2 border-b border-slate-100'}`}>
            <div 
              onClick={() => setIsComparePanelMinimized(!isComparePanelMinimized)}
              className="flex items-center text-blue-600 font-extrabold text-[11px] xs:text-xs sm:text-sm cursor-pointer hover:opacity-85 select-none flex-1 min-w-0 mr-1"
              title={isComparePanelMinimized ? "คลิกเพื่อขยายแถบเปรียบเทียบ" : "คลิกเพื่อย่อแถบเปรียบเทียบ"}
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-1.5 flex-shrink-0 animate-pulse"></div>
              <span className="truncate">เปรียบเทียบ ({destinations.length}/4)</span>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* ปุ่มเลือกโหมดเดินทาง */}
              {!isComparePanelMinimized && (
                <div className="flex bg-gray-100 rounded-full p-0.5 select-none">
                  <button 
                    type="button"
                    onClick={() => setVehicleType('driving')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer ${
                      vehicleType === 'driving' 
                        ? 'bg-slate-900 text-yellow-400 shadow-xs' 
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <span>🚗</span>
                    <span className="hidden xs:inline">รถยนต์</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVehicleType('motorcycle')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer ${
                      vehicleType === 'motorcycle' 
                        ? 'bg-slate-900 text-yellow-400 shadow-xs' 
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <span>🚲</span>
                    <span className="hidden xs:inline">มอเตอร์ไซค์</span>
                  </button>
                </div>
              )}

              {/* ปุ่มย่อ/ขยาย (Minimize/Maximize) */}
              <button
                type="button"
                onClick={() => setIsComparePanelMinimized(!isComparePanelMinimized)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition flex items-center justify-center cursor-pointer flex-shrink-0"
                title={isComparePanelMinimized ? "ขยายเนื้อหา" : "ย่อเนื้อหา"}
              >
                {isComparePanelMinimized ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* ซ่อน/แสดง เนื้อหาของกล่องเปรียบเทียบตามสถานะย่อขยาย */}
          {!isComparePanelMinimized && (
            <>
              {/* 2. จุดเริ่มต้น (Origin) */}
              <div className="relative mb-2">
                <div className="flex items-center justify-between border border-blue-200 bg-blue-50 rounded-xl p-2.5 shadow-2xs">
                  <div className="flex items-center text-slate-800 font-bold text-xs sm:text-sm truncate mr-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-blue-600 p-0.5 mr-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="truncate">
                      {originPoint.mode === 'gps' ? '📡' : originPoint.isWhite ? '🛡️' : '🏠'} จุดเริ่มต้น: {originPoint.label}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsOriginModalOpen(!isOriginModalOpen)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs"
                  >
                    <span>✏️</span>
                    <span>เปลี่ยน</span>
                  </button>
                </div>

                {/* Origin Selection Dropdown Menu - z-[9999] to prevent overlapping */}
                {isOriginModalOpen && (
                  <div 
                    ref={originModalRef}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-[9999] max-h-84 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[11px] font-extrabold text-[#0a1931]">
                      <span>เลือกจุดเริ่มต้น (Origin)</span>
                      <button 
                        onClick={() => setIsOriginModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex overflow-x-auto no-scrollbar gap-1 p-0.5 bg-slate-100 rounded-xl text-[10px] font-extrabold whitespace-nowrap">
                      <button
                        onClick={() => setOriginTab('gps')}
                        className={`flex-1 min-w-[70px] py-1 px-1 rounded-lg transition text-center ${originTab === 'gps' ? 'bg-[#0a1931] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        📡 GPS สด
                      </button>
                      <button
                        onClick={() => setOriginTab('dorm')}
                        className={`flex-1 min-w-[80px] py-1 px-1 rounded-lg transition text-center ${originTab === 'dorm' ? 'bg-[#0a1931] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        🏠 หอพัก (60)
                      </button>
                      <button
                        onClick={() => setOriginTab('gate')}
                        className={`flex-1 min-w-[85px] py-1 px-1 rounded-lg transition text-center ${originTab === 'gate' ? 'bg-[#0a1931] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        🏛️ จุดสำคัญ ม.
                      </button>
                      <button
                        onClick={() => {
                          setOriginTab('map');
                          setIsPickingManualOrigin(true);
                          setIsOriginModalOpen(false);
                          setGpsToast('👆 คลิกจุดใดก็ได้บนแผนที่เพื่อตั้งเป็นจุดเริ่มต้น');
                        }}
                        className={`flex-1 min-w-[80px] py-1 px-1 rounded-lg transition text-center ${originTab === 'map' ? 'bg-[#0a1931] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        📍 ปักหมุดเอง
                      </button>
                    </div>

                    {originTab === 'gps' && (
                      <div className="p-3 bg-blue-50 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
                        <LocateFixed className="w-6 h-6 text-blue-600 animate-pulse" />
                        <div className="text-xs font-black text-blue-950">ใช้ตำแหน่ง GPS ปัจจุบันของคุณ</div>
                        <p className="text-[10px] text-slate-500">ดึงพิกัดสดจากอุปกรณ์เพื่อใช้นำทางแบบ Real-time</p>
                        <button
                          onClick={handleSetOriginToGps}
                          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition shadow-xs cursor-pointer"
                        >
                          ยืนยันใช้ตำแหน่ง GPS
                        </button>
                      </div>
                    )}

                    {originTab === 'dorm' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={originSearchTerm}
                            onChange={(e) => setOriginSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อหอพัก 60 แห่ง..."
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-7 pr-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                          />
                        </div>
                        <div className="overflow-y-auto max-h-48 divide-y divide-slate-100">
                          {filteredDormsForOrigin.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => handleSetOriginToDorm(d)}
                              className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-950 transition text-left rounded-lg cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span>{d.isWhiteDorm ? '🛡️' : '🏠'}</span>
                                <span className="font-bold truncate">{d.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium truncate ml-1">{d.zone}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {originTab === 'gate' && (
                      <div className="overflow-y-auto max-h-48 divide-y divide-slate-100">
                        {OFFICIAL_CAMPUS_GATES.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => handleSetOriginToGate(g)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-950 transition text-left rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span>{g.icon}</span>
                              <span className="font-extrabold text-[#0a1931]">{g.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">ใน ม.อุบลฯ</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. จุดหมาย (Destinations List with Interactive Search & Metrics) */}
              <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {destinations.map((dest, idx) => {
                  const colorMeta = ROUTE_COLORS[idx % ROUTE_COLORS.length];
                  const stats = destinationStats[dest.id];
                  const effectiveMins = stats 
                    ? (vehicleType === 'motorcycle' ? Math.max(1, Math.round(stats.baseDurationMins * 0.85)) : stats.baseDurationMins)
                    : null;

                  return (
                    <div 
                      key={dest.id}
                      onMouseEnter={() => setActiveDestId(dest.id)}
                      onMouseLeave={() => setActiveDestId(null)}
                      onClick={() => setActiveDestId(dest.id)}
                      className={`flex items-center justify-between border rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-400 transition cursor-pointer select-none ${
                        activeDestId === dest.id 
                          ? 'border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-400 shadow-xs' 
                          : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center flex-grow min-w-0 pr-2">
                        {/* วงกลมหมายเลข */}
                        <div 
                          className="flex items-center justify-center w-6 h-6 rounded-full text-white font-bold mr-2 text-xs flex-shrink-0 shadow-2xs"
                          style={{ backgroundColor: colorMeta.color }}
                        >
                          {idx + 1}
                        </div>
                        <span className="mr-1 text-sm flex-shrink-0">{dest.icon || '🏠'}</span>
                        
                        {/* ช่องกรอกข้อความ / แสดงชื่อ */}
                        <input 
                          type="text" 
                          value={dest.name} 
                          readOnly
                          className="ml-1 bg-transparent border-none outline-none text-slate-800 font-bold w-full text-xs sm:text-sm truncate cursor-default" 
                          placeholder="ค้นหาหอพัก..." 
                        />
                      </div>

                      {/* ป้ายระยะทาง & เวลา */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="bg-white border border-gray-200 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">
                          {stats && effectiveMins !== null ? (
                            <span>{vehicleType === 'driving' ? '🚗' : '🚲'} {stats.distanceKm} กม. (~{effectiveMins} น.)</span>
                          ) : (
                            <span className="text-slate-400 text-[10px] animate-pulse">คำนวณ...</span>
                          )}
                        </div>

                        {destinations.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDestination(dest.id);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                            title="ลบสถานที่นี้"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. ปุ่มเพิ่มสถานที่เปรียบเทียบ */}
              {destinations.length < 4 && (
                <div className="relative" ref={addPoiDropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setIsAddPoiDropdownOpen(!isAddPoiDropdownOpen)}
                    className="w-full border-2 border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/30 hover:bg-indigo-50 rounded-xl py-2 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ เพิ่มสถานที่เปรียบเทียบ ({destinations.length}/4)</span>
                  </button>

                  {/* Add POI Dropdown Menu - z-[9999] to prevent overlapping */}
                  {isAddPoiDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-[9999] max-h-64 sm:max-h-80 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[11px] font-extrabold text-slate-700">
                        <span>เลือกสถานที่ปลายทาง ({availablePoisToAdd.length} แห่ง)</span>
                        <button 
                          onClick={() => setIsAddPoiDropdownOpen(false)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={poiSearchTerm}
                          onChange={(e) => setPoiSearchTerm(e.target.value)}
                          placeholder="ค้นหาประตู ม., ร้านอาหาร, คาเฟ่, อาคาร..."
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
                        {['all', 'building', 'official', 'food', 'cafe', 'store', 'hospital', 'service', 'hangout'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setPoiFilterCategory(cat)}
                            className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-bold transition ${
                              poiFilterCategory === cat
                                ? 'bg-[#0a1931] text-amber-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat === 'all' ? 'ทั้งหมด' : cat === 'building' ? '🏛️ ประตู/อาคาร' : cat === 'official' ? '🏛️ ราชการ' : cat === 'food' ? '🍜 อาหาร' : cat === 'cafe' ? '☕ คาเฟ่' : cat === 'store' ? '🏪 ร้านค้า' : cat === 'hospital' ? '🏥 สุขภาพ' : cat === 'service' ? '✂️ บริการ' : '🍻 แฮงค์เอาท์'}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-52 divide-y divide-slate-100">
                        {availablePoisToAdd.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 font-medium">
                            ไม่พบสถานที่ที่ค้นหา
                          </div>
                        ) : (
                          availablePoisToAdd.map((p) => {
                            const meta = getLandmarkMeta(p.category, p.name);
                            const directDist = calculateDistanceBetween(originPoint.lat, originPoint.lng, p.lat, p.lng);

                            return (
                              <button
                                key={p.name}
                                onClick={() => handleAddPoiDestination(p)}
                                className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-950 transition text-left rounded-xl cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <span className="text-sm">{meta.icon}</span>
                                  <div className="truncate">
                                    <div className="font-bold truncate text-[#0a1931]">{p.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{meta.label}</div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-2xs flex-shrink-0">
                                  ~{directDist}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* 2. Top-Right Category Dropdown Filter */}
      <div className={`absolute top-3 right-3 sm:right-4 flex items-center gap-2 pointer-events-auto transition-all duration-300 ${(isCategoryDropdownOpen || showOffsetControls) ? 'z-[9999]' : 'z-[1000]'}`}>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 text-blue-950 font-bold text-xs shadow-lg shadow-black/10 border border-slate-200/80 backdrop-blur-md hover:bg-white transition active:scale-95 cursor-pointer"
          >
            <span className="text-sm">{activeCategoryMeta.icon}</span>
            <span className="hidden sm:inline max-w-[120px] truncate">{activeCategoryMeta.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCategoryDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                เลือกหมวดหมู่หลัก
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {MAIN_CATEGORIES.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold transition text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-950 text-amber-300' 
                          : 'text-slate-700 hover:bg-slate-100 hover:text-blue-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map Calibration Tool */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowOffsetControls(!showOffsetControls)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 font-bold text-xs shadow-lg shadow-black/10 border border-slate-200/80 backdrop-blur-md hover:bg-white transition active:scale-95 cursor-pointer ${showOffsetControls ? 'text-amber-600 border-amber-300 bg-amber-50/50' : 'text-blue-950'}`}
              title="ตั้งค่าชดเชยพิกัด (Offset Calibration)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ปรับจูนพิกัด OSM</span>
            </button>

            {showOffsetControls && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <span className="text-xs font-black text-blue-950 flex items-center gap-1">
                    🛠️ เครื่องมือปรับจูนพิกัด (OSM Offset)
                  </span>
                  <button 
                    onClick={() => setShowOffsetControls(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                  พิกัดเดิมอ้างอิงจาก Google Maps เมื่อนำมาแสดงบน OpenStreetMap อาจคลาดเคลื่อนเล็กน้อย ใช้ปุ่มด้านล่างเพื่อขยับพิกัดหมุดให้ตรงกับตึกและถนนบน OSM
                </p>

                {/* Offset value display */}
                <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100 flex flex-col gap-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lat Offset (N/S):</span>
                    <span className="font-bold text-blue-700">{latOffset >= 0 ? '+' : ''}{latOffset.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lng Offset (E/W):</span>
                    <span className="font-bold text-blue-700">{lngOffset >= 0 ? '+' : ''}{lngOffset.toFixed(6)}</span>
                  </div>
                </div>

                {/* Calibration Buttons */}
                <div className="space-y-3">
                  {/* 4-way direction pad */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">เลื่อนตำแหน่งหมุด</span>
                    <div className="grid grid-cols-3 gap-1 w-32">
                      <div></div>
                      <button
                        type="button"
                        onClick={() => handleOffsetChange(latOffset + 0.00001, lngOffset)}
                        className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="เลื่อนขึ้น (เหนือ)"
                      >
                        ▲
                      </button>
                      <div></div>

                      <button
                        type="button"
                        onClick={() => handleOffsetChange(latOffset, lngOffset - 0.00001)}
                        className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="เลื่อนซ้าย (ตะวันตก)"
                      >
                        ◀
                      </button>
                      <div className="flex items-center justify-center text-[10px] font-black text-slate-400">
                        1ม.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOffsetChange(latOffset, lngOffset + 0.00001)}
                        className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="เลื่อนขวา (ตะวันออก)"
                      >
                        ▶
                      </button>

                      <div></div>
                      <button
                        type="button"
                        onClick={() => handleOffsetChange(latOffset - 0.00001, lngOffset)}
                        className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="เลื่อนลง (ใต้)"
                      >
                        ▼
                      </button>
                      <div></div>
                    </div>
                  </div>

                  {/* Coarse adjustment buttons (5 meters) */}
                  <div className="flex justify-between gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(latOffset + 0.00005, lngOffset)}
                      className="flex-1 py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
                    >
                      ขึ้น 5ม.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(latOffset - 0.00005, lngOffset)}
                      className="flex-1 py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
                    >
                      ลง 5ม.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(latOffset, lngOffset - 0.00005)}
                      className="flex-1 py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
                    >
                      ซ้าย 5ม.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(latOffset, lngOffset + 0.00005)}
                      className="flex-1 py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
                    >
                      ขวา 5ม.
                    </button>
                  </div>

                  {/* Reset to defaults */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(DEFAULT_LAT_OFFSET, DEFAULT_LNG_OFFSET)}
                      className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold rounded-xl text-xs transition active:scale-95 cursor-pointer text-center border border-amber-200"
                    >
                      ใช้ค่าชดเชยแนะนำ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(0, 0)}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs transition active:scale-95 cursor-pointer"
                    >
                      ล้างค่า (0)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Floating Live GPS Button on Bottom Right */}
      <div className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={handleSetOriginToGps}
          disabled={isLocatingGps}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/95 text-blue-900 font-extrabold text-xs shadow-xl border border-slate-200/90 backdrop-blur-md hover:bg-blue-50 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          title="ค้นหาตำแหน่ง GPS สดของคุณ"
        >
          {isLocatingGps ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4 text-blue-600 animate-pulse" />
          )}
          <span className="hidden sm:inline">ตำแหน่งของฉัน (GPS)</span>
        </button>

        {gpsToast && (
          <div className="bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-blue-400/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            {gpsToast}
          </div>
        )}
      </div>

      {/* Main Map Container with CartoDB Positron */}
      <MapContainer
        center={originPoint.mode !== 'gps' && originPoint.mode !== 'custom' 
          ? adjustLatLng(originPoint.lat, originPoint.lng)
          : [originPoint.lat, originPoint.lng]}
        zoom={initialZoom}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="w-full h-full flex-1 [&_.leaflet-control-attribution]:hidden"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />

        {/* Map Center & Pan Handler */}
        <MapController targetCenter={targetFlyCenter} />

        {/* Map Click Handler for Custom Origin Picking */}
        <MapEventsHandler
          isPickingManualOrigin={isPickingManualOrigin}
          onPickManualOrigin={handlePickManualOriginOnMap}
        />

        {/* User Live GPS Marker */}
        {liveGpsLocation && originPoint.mode !== 'gps' && (
          <Marker
            position={[liveGpsLocation.lat, liveGpsLocation.lng]}
            icon={createUserGpsMarker('คุณอยู่ที่นี่ (GPS)')}
            zIndexOffset={1000}
          />
        )}

        {/* Origin Marker (Point A) */}
        {(() => {
          const originNeedsOffset = originPoint.mode !== 'gps' && originPoint.mode !== 'custom';
          const [originLat, originLng] = originNeedsOffset
            ? adjustLatLng(originPoint.lat, originPoint.lng)
            : [originPoint.lat, originPoint.lng];
          return (
            <Marker
              position={[originLat, originLng]}
              icon={createOriginMarker(originPoint.label, originPoint.mode === 'gps', originPoint.isWhite)}
              zIndexOffset={950}
            />
          );
        })()}

        
        {/* Official Campus Gates Markers */}
        {OFFICIAL_CAMPUS_GATES.map((gate) => {
          const isSelectedAsDest = destinations.some((d) => d.name === gate.name);
          const isSelectedAsOrigin = originPoint.label === gate.name;
          if (isSelectedAsDest || isSelectedAsOrigin) return null;

          const [gateLat, gateLng] = adjustLatLng(gate.lat, gate.lng);

          return (
            <Marker
              key={gate.id}
              position={[gateLat, gateLng]}
              icon={createCampusGateMarker(gate.name)}
              draggable={true}
              eventHandlers={{
                click: () => {
                  handleAddPoiDestination({
                    name: gate.name,
                    lat: gate.lat,
                    lng: gate.lng,
                    category: gate.category,
                  });
                },
                dragend: (event) => {
                  const newLatLng = event.target.getLatLng();
                  handleMarkerDragEnd(gate.name, newLatLng.lat, newLatLng.lng);
                }
              }}
            />
          );
        })}

        {destinations.map((p, idx) => {
          const [destLat, destLng] = adjustLatLng(p.lat, p.lng);
          return (
            <Marker
              key={p.id}
              position={[destLat, destLng]}
              icon={createDestinationPoiMarker(p.name, idx, p.icon)}
              draggable={true}
              zIndexOffset={activeDestId === p.id ? 1000 : 800}
              eventHandlers={{
                mouseover: () => setActiveDestId(p.id),
                mouseout: () => setActiveDestId(null),
                click: () => setActiveDestId(p.id),
                dragend: (event) => {
                  const newLatLng = event.target.getLatLng();
                  handleMarkerDragEnd(p.name, newLatLng.lat, newLatLng.lng);
                }
              }}
            />
          );
        })}

        {/* Multi-Destination In-App OSRM Driving Road Routing */}
        <MultiRoadRoutingLayer
          originLocation={originPoint}
          destinations={destinations}
          forceFitKey={forceFitKey}
          onUpdateStats={handleStatsUpdated}
          activeDestId={activeDestId}
          setActiveDestId={setActiveDestId}
          adjustLatLng={adjustLatLng}
        />

        {/* Marker Clustering Layer for other dorms & landmarks */}
        <MarkerClusterGroupLayer
          dorms={dorms}
          selectedDormId={originPoint.mode === 'dorm' ? originPoint.dormId : null}
          selectedLandmarkName={selectedPlace?.type === 'landmark' ? selectedPlace.landmark.name : null}
          visibleLandmarks={visibleLandmarks}
          onSelectPlace={handleSelectPlace}
          adjustLatLng={adjustLatLng}
          onMarkerDragged={handleMarkerDragEnd}
        />
      </MapContainer>

      {/* Google Maps Style Route Info Card (Floating Bottom-Left) */}
      {!selectedPlace && destinations.length > 0 && destinationStats[destinations[0].id] && (
        <div id="route-info-card" className="map-route-card animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="route-icon-box">
            {vehicleType === 'driving' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#475569">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
                <circle cx="7.5" cy="14.5" r="1.5" fill="#475569"/>
                <circle cx="16.5" cy="14.5" r="1.5" fill="#475569"/>
              </svg>
            ) : (
              <Bike className="w-5 h-5 text-slate-600" />
            )}
          </div>
          <div className="route-details">
            <div id="route-time" className="route-time">
              {vehicleType === 'motorcycle' 
                ? Math.max(1, Math.round(destinationStats[destinations[0].id].baseDurationMins * 0.85))
                : destinationStats[destinations[0].id].baseDurationMins
              } นาที
            </div>
            <div id="route-distance" className="route-distance">
              {destinationStats[destinations[0].id].distanceKm} กม. ({destinations[0].name})
            </div>
          </div>
        </div>
      )}

      {/* Detail Card Overlay */}
      {selectedPlace && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[380px] z-[1000] bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-3xl p-4 animate-in slide-in-from-bottom-4 duration-300">
          {selectedPlace.type === 'dorm' ? (
            (() => {
              const dorm = selectedPlace.dorm;
              const isWhite = Boolean(dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน');
              const rawDormLat = Number(dorm.lat ?? dorm.latitude);
              const rawDormLng = Number(dorm.lng ?? dorm.longitude);
              const [dormLat, dormLng] = adjustLatLng(rawDormLat, rawDormLng);
              const minPrice = dorm.minPrice || 3000;
              const maxPriceText = dorm.maxPrice && dorm.maxPrice > minPrice ? ` - ${dorm.maxPrice.toLocaleString()}` : '';

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWhite ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold shadow-xs">
                          <span>🛡️</span>
                          <span>หอพักสีขาว ม.อุบลฯ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
                          <span>🏠</span>
                          <span>หอพักทั่วไป</span>
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                        {dorm.zone || 'รอบ ม.อุบลฯ'}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPlace(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                      title="ปิดหน้าต่างนี้"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0a1931] leading-snug">
                      {dorm.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base sm:text-lg font-black text-amber-600">
                        ฿{minPrice.toLocaleString()}{maxPriceText}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/เดือน</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-100/90 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-950 font-bold flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate max-w-[160px]">ห่างจาก {originPoint.label}:</span>
                      </span>
                      <span className="font-extrabold text-indigo-900">
                        {(() => {
                          const originNeedsOffset = originPoint.mode !== 'gps' && originPoint.mode !== 'custom';
                          const [calcOriginLat, calcOriginLng] = originNeedsOffset
                            ? adjustLatLng(originPoint.lat, originPoint.lng)
                            : [originPoint.lat, originPoint.lng];
                          return calculateDistanceBetween(calcOriginLat, calcOriginLng, dormLat, dormLng);
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleSetOriginToDorm(dorm);
                        setSelectedPlace(null);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition active:scale-95 text-center shadow-md cursor-pointer"
                    >
                      ตั้งเป็นจุดเริ่มต้น (A)
                    </button>
                    <Link
                      href={`/dorm/${dorm.id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-2xl bg-[#0a1931] hover:bg-blue-950 text-amber-300 font-black text-xs transition active:scale-95 border border-amber-400/40 text-center shadow-md"
                    >
                      <span>ดูรายละเอียด</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                    </Link>
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const landmark = selectedPlace.landmark;
              const meta = getLandmarkMeta(landmark.category, landmark.name);
              const rawLandmarkLat = Number(landmark.lat);
              const rawLandmarkLng = Number(landmark.lng);
              const [lLat, lLng] = adjustLatLng(rawLandmarkLat, rawLandmarkLng);

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{meta.icon}</span>
                      <span 
                        className="px-2.5 py-0.5 rounded-lg text-white text-[10px] font-extrabold shadow-xs"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPlace(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                      title="ปิด"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-[#0a1931] leading-snug">
                      {landmark.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">จุดสังเกตและสถานที่รอบ ม.อุบลฯ</p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-100/90 text-xs flex items-center justify-between">
                    <span className="text-indigo-950 font-bold">ระยะทางจาก {originPoint.label}:</span>
                    <span className="font-extrabold text-indigo-900">
                      {(() => {
                        const originNeedsOffset = originPoint.mode !== 'gps' && originPoint.mode !== 'custom';
                        const [calcOriginLat, calcOriginLng] = originNeedsOffset
                          ? adjustLatLng(originPoint.lat, originPoint.lng)
                          : [originPoint.lat, originPoint.lng];
                        return calculateDistanceBetween(calcOriginLat, calcOriginLng, lLat, lLng);
                      })()}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleAddPoiDestination(landmark);
                        setSelectedPlace(null);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition active:scale-95 text-center shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มเข้าสู่การเปรียบเทียบระยะทาง</span>
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 5. Draggable Calibration Copy Card */}
      {copiedCoords && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-24px)] sm:w-96 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-amber-400/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col gap-2.5 font-sans">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              📍 ขยับพิกัด: {copiedCoords.name}
            </span>
            <button 
              onClick={() => setCopiedCoords(null)} 
              className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            ลากหมุดขยับตำแหน่งเสร็จแล้ว! ใช้ตัวเลือกด้านล่างเพื่อคัดลอกค่าไปอัปเดตลงในฐานข้อมูล
          </p>

          <div className="flex flex-col gap-2">
            {/* OSM Position */}
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-2.5 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                <span>1. พิกัดจริงบน OSM (ยึดตามหมุดที่ลากล่าสุด)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`"lat": ${copiedCoords.lat.toFixed(6)}, "lng": ${copiedCoords.lng.toFixed(6)}`);
                    alert('คัดลอกพิกัดจริง OSM เรียบร้อย!');
                  }}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-md text-[9px] transition cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <div className="font-mono text-xs text-amber-200 font-bold select-all">
                "lat": {copiedCoords.lat.toFixed(6)}, "lng": {copiedCoords.lng.toFixed(6)}
              </div>
            </div>

            {/* Database Raw Position */}
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-2.5 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                <span>2. พิกัดดิบสำหรับฐานข้อมูล (หักล้างค่าชดเชยออก)</span>
                <button
                  type="button"
                  onClick={() => {
                    const rawLat = copiedCoords.lat - latOffset;
                    const rawLng = copiedCoords.lng - lngOffset;
                    navigator.clipboard.writeText(`"lat": ${rawLat.toFixed(6)}, "lng": ${rawLng.toFixed(6)}`);
                    alert('คัดลอกพิกัดสำหรับฐานข้อมูลเรียบร้อย!');
                  }}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-md text-[9px] transition cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <div className="font-mono text-xs text-indigo-300 font-bold select-all">
                "lat": {(copiedCoords.lat - latOffset).toFixed(6)}, "lng": {(copiedCoords.lng - lngOffset).toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
