import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2,
  HelpCircle,
} from "lucide-react";
import { ScheduleItem } from "../types";

export interface SCurveDataPoint {
  week: number;
  label: string;
  dateStr: string;
  plannedCumulative: number; // 0 to 100%
  actualCumulative: number | null; // 0 to 100% or null if future
  targetWeekly: number;
  actualWeekly: number | null;
}

interface SCurveChartProps {
  scheduleItems: ScheduleItem[];
  projectDurationWeeks?: number;
  referenceDate: string;
  projectStartDate?: string;
  projectName?: string;
  projectCode?: string;
}

export const SCurveChart: React.FC<SCurveChartProps> = ({
  scheduleItems,
  projectDurationWeeks = 12,
  referenceDate,
  projectStartDate = "2026-08-01",
  projectName,
  projectCode,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Compute Weekly S-Curve dataset dynamically from Schedule Items
  const { dataPoints, overallPlannedToDate, overallActualToDate, scheduleVariance, status } =
    useMemo(() => {
      const totalWeight = scheduleItems.reduce((sum, item) => sum + (item.weightPercent || 0), 0) || 100;
      const weeksCount = Math.max(8, projectDurationWeeks || 12);
      const startDate = new Date(projectStartDate);
      const refDate = new Date(referenceDate);

      // Determine the reference week
      const diffTime = refDate.getTime() - startDate.getTime();
      const currentRefWeek = Math.max(0, Math.min(weeksCount, Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1));

      // Standard cumulative S-curve logistic progression baseline weights
      // Produces the standard construction S-curve shape: slow start, steep middle, tapering end
      const logisticWeights: number[] = [];
      for (let w = 1; w <= weeksCount; w++) {
        const x = (w / weeksCount) * 10 - 5; // range [-5, 5]
        const sigmoid = 1 / (1 + Math.exp(-0.85 * x));
        logisticWeights.push(sigmoid);
      }
      const minSig = logisticWeights[0];
      const maxSig = logisticWeights[logisticWeights.length - 1];

      // Normalized planned cumulative from 0% at week 0 to 100% at week N
      const rawPoints: SCurveDataPoint[] = [];

      // Week 0 starting baseline
      rawPoints.push({
        week: 0,
        label: "M0",
        dateStr: projectStartDate,
        plannedCumulative: 0,
        actualCumulative: 0,
        targetWeekly: 0,
        actualWeekly: 0,
      });

      // Calculate cumulative planned and actuals
      let lastPlanned = 0;
      let lastActual = 0;

      // Current overall actual progress from items
      const currentSiteActual = scheduleItems.reduce((acc, item) => {
        const wt = (item.weightPercent || 0) / totalWeight;
        return acc + wt * (item.actualProgressPercent || 0);
      }, 0);

      // Current overall target planned from items
      const currentSitePlanned = scheduleItems.reduce((acc, item) => {
        const wt = (item.weightPercent || 0) / totalWeight;
        return acc + wt * (item.targetProgressPercent || 0);
      }, 0);

      for (let w = 1; w <= weeksCount; w++) {
        const weekDate = new Date(startDate);
        weekDate.setDate(weekDate.getDate() + w * 7);
        const dateStr = weekDate.toISOString().split("T")[0];

        // S-Curve planned cumulative:
        const normSig = (logisticWeights[w - 1] - minSig) / (maxSig - minSig);
        const plannedCum = Math.round(normSig * 1000) / 10;
        const targetWeekly = Math.max(0, Math.round((plannedCum - lastPlanned) * 10) / 10);
        lastPlanned = plannedCum;

        // Actual cumulative: recorded only up to current reference week
        let actualCum: number | null = null;
        let actualWeekly: number | null = null;

        if (w <= currentRefWeek) {
          // Proportionally distribute actual progress up to currentSiteActual
          const progressFactor = currentRefWeek > 0 ? w / currentRefWeek : 1;
          // Smooth curve approaching site actual
          const actualVal = Math.min(100, Math.round(currentSiteActual * Math.pow(progressFactor, 1.15) * 10) / 10);
          actualCum = actualVal;
          actualWeekly = Math.max(0, Math.round((actualVal - lastActual) * 10) / 10);
          lastActual = actualVal;
        }

        rawPoints.push({
          week: w,
          label: `M${w}`,
          dateStr,
          plannedCumulative: plannedCum,
          actualCumulative: actualCum,
          targetWeekly,
          actualWeekly,
        });
      }

      const variance = Math.round((currentSiteActual - currentSitePlanned) * 10) / 10;
      let statusLabel: "Ahead of Schedule" | "Delayed" | "On Track" = "On Track";
      if (variance < -0.5) statusLabel = "Delayed";
      else if (variance > 0.5) statusLabel = "Ahead of Schedule";

      return {
        dataPoints: rawPoints,
        overallPlannedToDate: Math.round(currentSitePlanned * 10) / 10,
        overallActualToDate: Math.round(currentSiteActual * 10) / 10,
        scheduleVariance: variance,
        status: statusLabel,
      };
    }, [scheduleItems, projectDurationWeeks, referenceDate, projectStartDate]);

  // SVG Coordinate mapping
  const width = 840;
  const height = isExpanded ? 340 : 230;
  const padding = { top: 25, right: 35, bottom: 40, left: 55 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const totalPoints = dataPoints.length;

  const getX = (index: number) => {
    return padding.left + (index / (totalPoints - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padding.top + graphHeight - (clamped / 100) * graphHeight;
  };

  // Build SVG Path for Planned S-Curve (Smooth cubic spline)
  const plannedPath = useMemo(() => {
    if (dataPoints.length === 0) return "";
    let d = `M ${getX(0)} ${getY(dataPoints[0].plannedCumulative)}`;

    for (let i = 0; i < dataPoints.length - 1; i++) {
      const p0 = dataPoints[i === 0 ? 0 : i - 1];
      const p1 = dataPoints[i];
      const p2 = dataPoints[i + 1];
      const p3 = dataPoints[i + 2 < dataPoints.length ? i + 2 : i + 1];

      const x1 = getX(i);
      const y1 = getY(p1.plannedCumulative);
      const x2 = getX(i + 1);
      const y2 = getY(p2.plannedCumulative);

      // Control points for smooth tension
      const cp1x = x1 + (x2 - x1) / 2.5;
      const cp1y = y1;
      const cp2x = x2 - (x2 - x1) / 2.5;
      const cp2y = y2;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
    return d;
  }, [dataPoints, graphWidth, graphHeight]);

  // Build SVG Path for Actual Progress
  const { actualPath, actualAreaPath, actualPointsCount } = useMemo(() => {
    const actualPoints = dataPoints.filter((p) => p.actualCumulative !== null);
    if (actualPoints.length <= 1) {
      return { actualPath: "", actualAreaPath: "", actualPointsCount: actualPoints.length };
    }

    let d = `M ${getX(0)} ${getY(actualPoints[0].actualCumulative!)}`;
    for (let i = 0; i < actualPoints.length - 1; i++) {
      const p1 = actualPoints[i];
      const p2 = actualPoints[i + 1];

      const x1 = getX(i);
      const y1 = getY(p1.actualCumulative!);
      const x2 = getX(i + 1);
      const y2 = getY(p2.actualCumulative!);

      const cp1x = x1 + (x2 - x1) / 2.5;
      const cp1y = y1;
      const cp2x = x2 - (x2 - x1) / 2.5;
      const cp2y = y2;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }

    const lastIdx = actualPoints.length - 1;
    const lastX = getX(lastIdx);
    const bottomY = getY(0);
    const startX = getX(0);

    const areaD = `${d} L ${lastX.toFixed(1)} ${bottomY} L ${startX.toFixed(1)} ${bottomY} Z`;

    return { actualPath: d, actualAreaPath: areaD, actualPointsCount: actualPoints.length };
  }, [dataPoints, graphWidth, graphHeight]);

  const activePoint = hoveredPointIndex !== null ? dataPoints[hoveredPointIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 font-sans">
      {/* 1. HEADER & METRIC BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Kurva S Proyek (Dual-Line S-Curve Performance Chart)
              </h3>
              {projectCode && (
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {projectCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi komparasi Rencana Kumulatif (Baseline) vs Realisasi Lapangan aktual terhadap timeline kalender.
            </p>
          </div>
        </div>

        {/* Right Status & Expand Button */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              status === "Delayed"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : status === "Ahead of Schedule"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {status === "Delayed" ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{status}</span>
            <span className="font-mono">
              ({scheduleVariance >= 0 ? `+${scheduleVariance}%` : `${scheduleVariance}%`})
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
            title={isExpanded ? "Collapse Chart" : "Expand Chart Height"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
        {/* Planned to Date */}
        <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Rencana (Target)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">
            {overallPlannedToDate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            Baseline Kumulatif s/d Saat Ini
          </span>
        </div>

        {/* Actual to Date */}
        <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Realisasi (Aktual)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
            {overallActualToDate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            Progress Lapangan Terverifikasi
          </span>
        </div>

        {/* Schedule Variance */}
        <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Deviasi / Varian</span>
            {scheduleVariance < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </div>
          <div
            className={`text-xl font-bold font-mono mt-0.5 ${
              scheduleVariance < 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {scheduleVariance > 0 ? `+${scheduleVariance.toFixed(1)}%` : `${scheduleVariance.toFixed(1)}%`}
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {scheduleVariance < 0 ? "Keterlambatan Fisik" : "Kemajuan Progresif"}
          </span>
        </div>

        {/* Timeline Range */}
        <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Durasi Proyek</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
            {projectDurationWeeks} Minggu
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            Mulai: {projectStartDate}
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE SVG S-CURVE CANVAS */}
      <div className="relative bg-slate-900 rounded-xl p-3 pt-4 border border-slate-800 shadow-inner overflow-hidden">
        {/* SVG Container */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[700px] select-none overflow-visible"
          >
            <defs>
              {/* Emerald Green gradient for actual progress shaded area */}
              <linearGradient id="actualFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Blue line glow effect */}
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Horizontal Grid lines at 0%, 25%, 50%, 75%, 100% */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = getY(pct);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray={pct === 0 || pct === 100 ? "none" : "4 4"}
                    strokeWidth={pct === 0 || pct === 100 ? 1.2 : 0.8}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono font-medium"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Vertical Week Grid Lines & Labels */}
            {dataPoints.map((pt, idx) => {
              const x = getX(idx);
              const isSelected = hoveredPointIndex === idx;

              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke={isSelected ? "#64748b" : "#1e293b"}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    strokeDasharray={idx === 0 ? "none" : "3 3"}
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-mono transition-colors ${
                      isSelected ? "fill-blue-400 font-bold" : "fill-slate-400"
                    }`}
                  >
                    {pt.label}
                  </text>
                  <text
                    x={x}
                    y={height - padding.bottom + 28}
                    textAnchor="middle"
                    className="text-[8px] fill-slate-500 font-mono hidden sm:block"
                  >
                    {pt.dateStr.slice(5)}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area Under Actual Curve */}
            {actualAreaPath && (
              <path
                d={actualAreaPath}
                fill="url(#actualFillGradient)"
                className="transition-all duration-300"
              />
            )}

            {/* 1. Planned Cumulative Progress Line (Blue) */}
            {plannedPath && (
              <path
                d={plannedPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* 2. Actual Cumulative Progress Line (Emerald Green) */}
            {actualPath && (
              <path
                d={actualPath}
                fill="none"
                stroke="#10b981"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Data Point Markers for Planned Curve */}
            {dataPoints.map((pt, idx) => {
              const x = getX(idx);
              const y = getY(pt.plannedCumulative);
              const isHovered = hoveredPointIndex === idx;

              return (
                <circle
                  key={`planned-pt-${idx}`}
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3}
                  fill="#1e293b"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                />
              );
            })}

            {/* Data Point Markers for Actual Curve */}
            {dataPoints.map((pt, idx) => {
              if (pt.actualCumulative === null) return null;
              const x = getX(idx);
              const y = getY(pt.actualCumulative);
              const isHovered = hoveredPointIndex === idx;

              return (
                <circle
                  key={`actual-pt-${idx}`}
                  cx={x}
                  cy={y}
                  r={isHovered ? 6.5 : 4}
                  fill="#064e3b"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                />
              );
            })}

            {/* Reference Date Vertical Indicator Line */}
            {activePoint && (
              <line
                x1={getX(hoveredPointIndex!)}
                y1={padding.top}
                x2={getX(hoveredPointIndex!)}
                y2={padding.top + graphHeight}
                stroke="#94a3b8"
                strokeWidth={1.2}
                strokeDasharray="4 2"
              />
            )}
          </svg>
        </div>

        {/* Interactive Hover Floating Card */}
        {activePoint && (
          <div
            className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-xs border border-slate-700 text-white rounded-lg p-3 shadow-xl text-xs z-20 min-w-[200px]"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
              <span className="font-bold text-blue-400 font-mono">
                {activePoint.label} ({activePoint.dateStr})
              </span>
              <span className="text-[10px] text-slate-400">Minggu ke-{activePoint.week}</span>
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Rencana Kumulatif:
                </span>
                <span className="font-bold text-blue-400">
                  {activePoint.plannedCumulative.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Realisasi Aktual:
                </span>
                <span className="font-bold text-emerald-400">
                  {activePoint.actualCumulative !== null
                    ? `${activePoint.actualCumulative.toFixed(1)}%`
                    : "Belum Tercatat"}
                </span>
              </div>

              {activePoint.actualCumulative !== null && (
                <div className="flex items-center justify-between border-t border-slate-700/80 pt-1.5 mt-1">
                  <span className="text-slate-300">Deviasi (Varian):</span>
                  <span
                    className={`font-bold ${
                      activePoint.actualCumulative - activePoint.plannedCumulative < 0
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {(activePoint.actualCumulative - activePoint.plannedCumulative) >= 0 ? "+" : ""}
                    {(activePoint.actualCumulative - activePoint.plannedCumulative).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Legend Overlay */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 px-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-5">
            {/* Planned Line Legend */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-0.5 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              </div>
              <span className="text-slate-300 font-medium">
                Target Rencana Kumulatif (Baseline Schedule)
              </span>
            </div>

            {/* Actual Line Legend */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-1 bg-emerald-500 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <span className="text-slate-300 font-medium">
                Realisasi Aktual Lapangan (Site Progress)
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Hover sembarang titik kurva untuk melihat detail progres per minggu
          </div>
        </div>
      </div>
    </div>
  );
};
