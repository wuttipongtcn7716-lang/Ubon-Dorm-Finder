'use client';

import React, { useState, useMemo } from 'react';
import { TimelineDataPoint } from '@/lib/analyticsDb';
import { Users, Calendar } from 'lucide-react';

interface AnalyticsChartProps {
  data: TimelineDataPoint[];
  isLoading?: boolean;
}

export default function AnalyticsChart({ data, isLoading }: AnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { points, maxVal, minVal, pathD, areaD, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], maxVal: 10, minVal: 0, pathD: '', areaD: '', yTicks: [0, 5, 10] };
    }

    const visitorsList = data.map((d) => d.visitors);
    const rawMax = Math.max(...visitorsList, 5);
    // Round maxVal up to a nice number
    const max = Math.ceil(rawMax * 1.15);
    const min = 0;

    const width = 800;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 35;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const computedPoints = data.map((d, idx) => {
      const x = paddingLeft + (idx / Math.max(data.length - 1, 1)) * plotWidth;
      const yRatio = (d.visitors - min) / Math.max(max - min, 1);
      const y = paddingTop + plotHeight - yRatio * plotHeight;
      return { x, y, data: d, index: idx };
    });

    // Build smooth SVG curve (Catmull-Rom or cubic Bezier)
    let pD = '';
    if (computedPoints.length === 1) {
      const pt = computedPoints[0];
      pD = `M ${pt.x - 20} ${pt.y} L ${pt.x + 20} ${pt.y}`;
    } else if (computedPoints.length > 1) {
      pD = `M ${computedPoints[0].x} ${computedPoints[0].y}`;
      for (let i = 0; i < computedPoints.length - 1; i++) {
        const p0 = computedPoints[i === 0 ? 0 : i - 1];
        const p1 = computedPoints[i];
        const p2 = computedPoints[i + 1];
        const p3 = computedPoints[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        pD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    }

    const firstPt = computedPoints[0];
    const lastPt = computedPoints[computedPoints.length - 1];
    const baselineY = paddingTop + plotHeight;
    const aD = `${pD} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;

    // 4 Y-axis ticks
    const step = Math.ceil(max / 3);
    const ticks = [0, step, step * 2, max];

    return {
      points: computedPoints,
      maxVal: max,
      minVal: min,
      pathD: pD,
      areaD: aD,
      yTicks: ticks,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-slate-100/80 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลกราฟ...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
        <Users className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-slate-500 font-medium text-sm">ยังไม่มีข้อมูลผู้ใช้งานในช่วงเวลานี้</p>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="relative w-full select-none">
      {/* SVG Container with Responsive Aspect Ratio */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox="0 0 800 240"
          className="w-full h-auto max-h-[300px] overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="90%" stopColor="#2563eb" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
            </linearGradient>
            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines and Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const plotHeight = 240 - 25 - 35;
            const y = 25 + plotHeight - (tick / Math.max(maxVal, 1)) * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={45}
                  y1={y}
                  x2={775}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? 'none' : '4 4'}
                />
                <text
                  x={38}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                  className="tabular-nums"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#visitorsGradient)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair Vertical Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={25}
              x2={activePoint.x}
              y2={205}
              stroke="#93c5fd"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Interactive Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            // Render circle on hover or at intervals for dense data
            const showCircle = isHovered || data.length <= 14 || idx % Math.ceil(data.length / 10) === 0;

            return (
              <g key={idx}>
                {/* Touch/Hover Target Area */}
                <rect
                  x={pt.x - (800 / data.length) / 2}
                  y={20}
                  width={800 / data.length}
                  height={190}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onTouchStart={() => setHoveredIndex(idx)}
                />

                {showCircle && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 3.5}
                    fill={isHovered ? '#1d4ed8' : '#ffffff'}
                    stroke="#1d4ed8"
                    strokeWidth={isHovered ? 2.5 : 2}
                    filter="url(#pointShadow)"
                    className="transition-all duration-150 pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* X-Axis Date Labels */}
          {points.map((pt, idx) => {
            // Adaptive label stepping based on data length
            let showLabel = false;
            if (data.length <= 7) {
              showLabel = true;
            } else if (data.length <= 14) {
              showLabel = idx % 2 === 0 || idx === data.length - 1;
            } else if (data.length <= 30) {
              showLabel = idx % 5 === 0 || idx === data.length - 1;
            } else {
              showLabel = idx % 15 === 0 || idx === data.length - 1;
            }

            if (!showLabel) return null;

            return (
              <text
                key={idx}
                x={pt.x}
                y={225}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
                fontWeight="500"
              >
                {pt.data.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Floating Hover Tooltip */}
      {activePoint && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-100 z-10"
          style={{
            left: `${(activePoint.x / 800) * 100}%`,
            top: `${(activePoint.y / 240) * 100}%`,
            marginTop: '-12px',
          }}
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 text-xs whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] mb-0.5">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>{activePoint.data.label}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{activePoint.data.visitors.toLocaleString()} คน</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
