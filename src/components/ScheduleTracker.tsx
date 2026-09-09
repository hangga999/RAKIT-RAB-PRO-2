import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  Sliders,
  RefreshCw,
  BarChart3,
  Layers,
  ArrowRight,
  ArrowLeft,
  Info,
  CalendarRange,
  Zap,
  Filter,
  Search,
  Calculator,
  Building2,
  MapPin,
  Save,
  AlertCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { Project, RabItemEntry, ScheduleItem, WorkCategory } from "../types";
import { SCurveChart } from "./SCurveChart";
import { ExportDropdown } from "./ExportDropdown";
import { exportScheduleToExcel } from "../utils/excelExport";
import { exportScheduleToPdf } from "../utils/pdfExport";

interface ScheduleTrackerProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onNavigateBack?: () => void;
  onSwitchToRab?: () => void;
}

export interface ScheduleCalculationResult {
  isDateInverted: boolean;
  targetProgressPercent: number;
  displayTarget: string; // e.g. "45.2%" or "ERROR!"
  errorMessage?: string;
}

/**
 * Calculates planned progress (%) based on start date, end date, and reference current date.
 * Validation Rule: Planned End Date must always be equal to or later than Planned Start Date.
 * If Planned End Date < Planned Start Date:
 *   - Immediately halts progress calculations for that work item row.
 *   - Displays prominent red "ERROR!" warning string.
 * Otherwise dynamically recalculates target progress against current calendar date:
 *   - Current Date < Planned Start Date -> 0%
 *   - Current Date > Planned End Date -> 100%
 *   - Current Date between Start and End Date -> ((Current Date - Start Date) / (End Date - Start Date)) * 100%
 */
export function calculatePlannedProgress(
  startDateStr: string | undefined,
  endDateStr: string | undefined,
  referenceDateStr: string
): ScheduleCalculationResult {
  if (!startDateStr || !endDateStr) {
    return { isDateInverted: false, targetProgressPercent: 0, displayTarget: "0.0%" };
  }

  const start = new Date(startDateStr + "T00:00:00").getTime();
  const end = new Date(endDateStr + "T00:00:00").getTime();
  const current = new Date(referenceDateStr + "T00:00:00").getTime();

  if (isNaN(start) || isNaN(end) || isNaN(current)) {
    return { isDateInverted: false, targetProgressPercent: 0, displayTarget: "0.0%" };
  }

  // VALIDATION RULE: Planned End Date must always be equal to or later than Planned Start Date
  // Inverted range check:
  if (end < start) {
    return {
      isDateInverted: true,
      targetProgressPercent: 0,
      displayTarget: "ERROR!",
      errorMessage: "Planned End Date cannot be earlier than Planned Start Date",
    };
  }

  // Same start and end date edge case
  if (end === start) {
    const p = current >= start ? 100 : 0;
    return {
      isDateInverted: false,
      targetProgressPercent: p,
      displayTarget: `${p.toFixed(1)}%`,
    };
  }

  // Dynamic progress recalculation against current reference calendar date:
  // 1. Current Date < Planned Start Date -> 0%
  if (current < start) {
    return {
      isDateInverted: false,
      targetProgressPercent: 0,
      displayTarget: "0.0%",
    };
  }

  // 2. Current Date > Planned End Date -> 100%
  if (current > end) {
    return {
      isDateInverted: false,
      targetProgressPercent: 100,
      displayTarget: "100.0%",
    };
  }

  // 3. Current Date between Start and End Date -> ((Current Date - Start Date) / (End Date - Start Date)) * 100%
  const rawProgress = ((current - start) / (end - start)) * 100;
  const clamped = Math.min(100, Math.max(0, Math.round(rawProgress * 10) / 10));

  return {
    isDateInverted: false,
    targetProgressPercent: clamped,
    displayTarget: `${clamped.toFixed(1)}%`,
  };
}

export const ScheduleTracker: React.FC<ScheduleTrackerProps> = ({
  project,
  onUpdateProject,
  onNavigateBack,
  onSwitchToRab,
}) => {
  // Reference Calendar Date (defaults to today's date: 2026-09-06 or current date)
  const defaultToday = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const [referenceDate, setReferenceDate] = useState<string>(defaultToday);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showSCurve, setShowSCurve] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Synchronize and generate Schedule Items from RAB Items
  const synchronizedScheduleItems: ScheduleItem[] = useMemo(() => {
    const rabItems: RabItemEntry[] = project.items || [];
    const existingSchedule: ScheduleItem[] = project.scheduleItems || [];

    const totalRABSubtotal = project.subtotal || 1;
    const baseDate = new Date(project.createdAt || defaultToday);

    // Map each RAB item to a Schedule Item
    return rabItems.map((rabItem, index) => {
      const existing = existingSchedule.find(
        (s) => s.rabItemId === rabItem.id || s.id === rabItem.id
      );

      // Default start and end dates staggered by category order if not set
      const defaultStart = new Date(baseDate);
      defaultStart.setDate(defaultStart.getDate() + index * 4);
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultEnd.getDate() + 21); // 3 weeks duration

      const startDate = existing?.startDate || defaultStart.toISOString().split("T")[0];
      const endDate = existing?.endDate || defaultEnd.toISOString().split("T")[0];

      // Auto-calculated Planned Progress based on reference calendar date
      const calc = calculatePlannedProgress(startDate, endDate, referenceDate);
      const planned = calc.targetProgressPercent;
      const isDateInverted = calc.isDateInverted;
      const displayTarget = calc.displayTarget;
      const actual = existing?.actualProgressPercent ?? (index === 0 ? 100 : index === 1 ? 65 : index === 2 ? 30 : 0);

      // Determine status
      let status: "Not Started" | "On Track" | "Delayed" | "Completed" = "On Track";
      if (isDateInverted) {
        status = "Delayed";
      } else if (actual >= 100) {
        status = "Completed";
      } else if (actual < planned) {
        status = "Delayed";
      } else if (planned === 0 && actual === 0) {
        status = "Not Started";
      } else {
        status = "On Track";
      }

      const itemWeight = Math.round(((rabItem.totalPrice || 0) / totalRABSubtotal) * 1000) / 10;

      return {
        id: existing?.id || `sch-${rabItem.id}`,
        rabItemId: rabItem.id,
        wbsCode: `WBS ${index + 1}.0`,
        taskName: rabItem.itemName,
        specification: rabItem.specification,
        category: rabItem.workCategory,
        volume: rabItem.volume,
        unit: rabItem.unit,
        totalPrice: rabItem.totalPrice,
        weightPercent: itemWeight,
        targetProgressPercent: planned,
        actualProgressPercent: actual,
        startDate: startDate,
        endDate: endDate,
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        status: status,
        isDateInverted: isDateInverted,
        targetProgressDisplay: displayTarget,
      };
    });
  }, [project.items, project.scheduleItems, project.subtotal, project.createdAt, defaultToday, referenceDate]);

  // Handle updates to specific schedule item with reactive recalculation
  const handleItemChange = (itemId: string, updates: Partial<ScheduleItem>) => {
    const updatedSchedule = synchronizedScheduleItems.map((item) => {
      if (item.id === itemId) {
        const merged = { ...item, ...updates };

        // Re-calculate target planned if dates changed
        const newStart = updates.startDate !== undefined ? updates.startDate : merged.startDate;
        const newEnd = updates.endDate !== undefined ? updates.endDate : merged.endDate;

        const calc = calculatePlannedProgress(newStart, newEnd, referenceDate);
        merged.startDate = newStart;
        merged.endDate = newEnd;
        merged.plannedStartDate = newStart;
        merged.plannedEndDate = newEnd;
        merged.targetProgressPercent = calc.targetProgressPercent;
        merged.isDateInverted = calc.isDateInverted;
        merged.targetProgressDisplay = calc.displayTarget;

        // Re-calculate status
        if (calc.isDateInverted) {
          merged.status = "Delayed";
        } else {
          const planned = merged.targetProgressPercent || 0;
          const actual = merged.actualProgressPercent || 0;
          if (actual >= 100) {
            merged.status = "Completed";
          } else if (actual < planned) {
            merged.status = "Delayed";
          } else if (planned === 0 && actual === 0) {
            merged.status = "Not Started";
          } else {
            merged.status = "On Track";
          }
        }

        return merged;
      }
      return item;
    });

    onUpdateProject({
      ...project,
      scheduleItems: updatedSchedule,
    });
  };

  // Auto-distribute dates evenly across project duration
  const handleAutoDistributeDates = () => {
    const baseDate = new Date(project.createdAt || defaultToday);
    const durationWeeks = project.requirements?.estimatedDurationWeeks || 12;
    const totalDays = durationWeeks * 7;
    const itemsCount = synchronizedScheduleItems.length;

    if (itemsCount === 0) return;

    const intervalDays = Math.max(3, Math.floor(totalDays / itemsCount));

    const updated = synchronizedScheduleItems.map((item, idx) => {
      const start = new Date(baseDate);
      start.setDate(start.getDate() + idx * intervalDays);

      const end = new Date(start);
      end.setDate(end.getDate() + 18); // default 2.5 weeks duration

      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      const calc = calculatePlannedProgress(startStr, endStr, referenceDate);

      return {
        ...item,
        startDate: startStr,
        endDate: endStr,
        plannedStartDate: startStr,
        plannedEndDate: endStr,
        targetProgressPercent: calc.targetProgressPercent,
        isDateInverted: calc.isDateInverted,
        targetProgressDisplay: calc.displayTarget,
      };
    });

    onUpdateProject({
      ...project,
      scheduleItems: updated,
    });
  };

  const handleSaveSchedule = () => {
    onUpdateProject({
      ...project,
      scheduleItems: synchronizedScheduleItems,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return synchronizedScheduleItems.filter((item) => {
      const matchesSearch =
        item.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.wbsCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.specification && item.specification.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [synchronizedScheduleItems, searchQuery, categoryFilter]);

  // Group filtered items by WBS Category
  const groupedByCategory = useMemo(() => {
    const map = new Map<WorkCategory, ScheduleItem[]>();
    filteredItems.forEach((item) => {
      const existing = map.get(item.category) || [];
      existing.push(item);
      map.set(item.category, existing);
    });
    return map;
  }, [filteredItems]);

  // Overall calculations
  const totalProjectWeight = useMemo(() => {
    return synchronizedScheduleItems.reduce((acc, i) => acc + (i.weightPercent || 0), 0) || 100;
  }, [synchronizedScheduleItems]);

  const invertedDateItems = useMemo(() => {
    return synchronizedScheduleItems.filter((i) => i.isDateInverted);
  }, [synchronizedScheduleItems]);

  const overallPlanned = useMemo(() => {
    return synchronizedScheduleItems.reduce((acc, i) => {
      if (i.isDateInverted) return acc; // Halt progress calculation for inverted date items
      const wt = (i.weightPercent || 0) / totalProjectWeight;
      return acc + wt * (i.targetProgressPercent || 0);
    }, 0);
  }, [synchronizedScheduleItems, totalProjectWeight]);

  const overallActual = useMemo(() => {
    return synchronizedScheduleItems.reduce((acc, i) => {
      const wt = (i.weightPercent || 0) / totalProjectWeight;
      return acc + wt * (i.actualProgressPercent || 0);
    }, 0);
  }, [synchronizedScheduleItems, totalProjectWeight]);

  const scheduleVariance = Math.round((overallActual - overallPlanned) * 10) / 10;

  const delayedItems = useMemo(() => {
    return synchronizedScheduleItems.filter((i) => i.status === "Delayed");
  }, [synchronizedScheduleItems]);

  const categoriesList = useMemo(() => {
    return Array.from(new Set(synchronizedScheduleItems.map((i) => i.category)));
  }, [synchronizedScheduleItems]);

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-slate-100 font-sans">
      {/* 1. TOP CONTEXT STRIP & WORKSPACE ACTIONS */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Project Context & Breadcrumb */}
          <div className="flex items-center gap-3">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Back to Schedule List"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Schedule List</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200"></div>

            <span className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
              {project.projectCode}
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>{project.name}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-xs font-semibold text-slate-600">Schedule Draft &amp; S-Curve</span>
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {project.ownerName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {project.location}
                </span>
                <span>•</span>
                <span className="font-mono text-blue-700 font-semibold">
                  BoQ: Rp {(project.grandTotal || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {onSwitchToRab && (
              <button
                onClick={onSwitchToRab}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                <span>Switch to RAB Draft</span>
              </button>
            )}

            <button
              onClick={handleSaveSchedule}
              className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              }`}
            >
              {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? "Tersimpan!" : "Simpan Jadwal"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE WORKSPACE BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* INVERTED DATE WARNING BANNER */}
        {invertedDateItems.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <span>Peringatan Validasi Tanggal: Rentang Tanggal Terbalik Terdeteksi ({invertedDateItems.length} Pekerjaan)</span>
              </h4>
              <p className="text-xs text-rose-700 mt-1">
                Terdapat pekerjaan dengan <strong>Planned End Date lebih awal dari Planned Start Date</strong> (contoh: Start: 05 Aug 2025, End: 01 Aug 2025).
                Sistem seketika <strong>menghentikan perhitungan progress</strong> untuk baris tersebut dan menampilkan string{" "}
                <span className="font-mono font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded text-[11px]">ERROR!</span> pada sel Target Progress (%).
                Mohon sesuaikan kembali tanggal akhir agar sama dengan atau setelah tanggal mulai.
              </p>
            </div>
          </div>
        )}

        {/* TOP CONTROLS & KPI BAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  WBS Synchronization Active
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {synchronizedScheduleItems.length} RAB Work Items Loaded
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Jadwal Pelaksanaan &amp; Manajemen WBS Proyek
              </h3>
              <p className="text-xs text-slate-500">
                Kolom Target Progress (%) dihitung otomatis secara dinamis terhadap kalender pelaksanaan kerja.
              </p>
            </div>

            {/* Reference Date Controller & Action Tools */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="text-[11px]">
                  <span className="text-slate-500 font-medium block">Tanggal Evaluasi (Cutoff):</span>
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => setReferenceDate(defaultToday)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                title="Reset to real-world today"
              >
                Hari Ini
              </button>

              <button
                onClick={handleAutoDistributeDates}
                className="px-3 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Distribusi jadwal otomatis merata berdasarkan durasi RAB"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Plan Dates</span>
              </button>

              <button
                onClick={() => setShowSCurve(!showSCurve)}
                className={`px-3 py-1 text-[11px] font-semibold rounded border transition flex items-center gap-1.5 cursor-pointer ${
                  showSCurve
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{showSCurve ? "Sembunyikan Kurva S" : "Tampilkan Kurva S"}</span>
              </button>

              <ExportDropdown
                label="Export Jadwal"
                onExportExcel={() => exportScheduleToExcel(project, synchronizedScheduleItems)}
                onExportPdf={() => exportScheduleToPdf(project, synchronizedScheduleItems)}
                menuTitle="Jadwal & Kurva S Export"
              />
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5">
            <div className="bg-slate-50/90 rounded-lg p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Target Rencana Kumulatif
              </span>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
                {overallPlanned.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, overallPlanned)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50/90 rounded-lg p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Realisasi Aktual Lapangan
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {overallActual.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    scheduleVariance < 0 ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${Math.min(100, overallActual)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50/90 rounded-lg p-3 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Deviasi (Varian Jadwal)
              </span>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  scheduleVariance < 0
                    ? "text-rose-600"
                    : scheduleVariance > 0
                    ? "text-emerald-600"
                    : "text-slate-700"
                }`}
              >
                {scheduleVariance > 0 ? `+${scheduleVariance.toFixed(1)}%` : `${scheduleVariance.toFixed(1)}%`}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {scheduleVariance < 0 ? "⚠️ Keterlambatan Waktu" : "Kemajuan Pekerjaan"}
              </span>
            </div>

            <div
              className={`rounded-lg p-3 border ${
                delayedItems.length > 0
                  ? "bg-rose-50/80 border-rose-200 text-rose-900"
                  : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              }`}
            >
              <span className="text-[11px] font-bold uppercase block">
                Bottlenecks / Keterlambatan
              </span>
              <div className="text-2xl font-bold font-mono mt-1">
                {delayedItems.length} Pekerjaan
              </div>
              <span className="text-[10px] mt-1 block font-medium">
                {delayedItems.length > 0 ? "⚠️ Perlu percepatan lapangan" : "Semua item berjalan tepat waktu"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. DUAL-LINE INTERACTIVE S-CURVE CHART */}
        {showSCurve && (
          <SCurveChart
            scheduleItems={synchronizedScheduleItems}
            projectDurationWeeks={project.requirements?.estimatedDurationWeeks || 12}
            referenceDate={referenceDate}
            projectStartDate={project.createdAt || defaultToday}
            projectName={project.name}
            projectCode={project.projectCode}
          />
        )}

        {/* 4. STRUCTURED SCHEDULE TABLE (GROUPED BY WBS CATEGORIES) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Toolbar & Search Filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Tabel Breakdown WBS &amp; Monitoring Progress
              </h4>
              <p className="text-xs text-slate-500">
                Daftar pekerjaan terstruktur menurut kategori WBS dengan kontrol bobot dan realisasi aktual.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari item pekerjaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 w-44 sm:w-56"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Kategori ({categoriesList.length})</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Structured Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 align-top px-3 w-16 text-center whitespace-nowrap">WBS</th>
                  <th className="py-2.5 align-top px-4 min-w-[260px]">Work Item &amp; Specification</th>
                  <th className="py-2.5 align-top px-3 text-right w-24 whitespace-nowrap">Bobot (%)</th>
                  <th className="py-2.5 align-top px-3 w-36 whitespace-nowrap">Planned Start Date</th>
                  <th className="py-2.5 align-top px-3 w-36 whitespace-nowrap">Planned End Date</th>
                  <th className="py-2.5 align-top px-3 text-right w-32 whitespace-nowrap">Target Progress (%)</th>
                  <th className="py-2.5 align-top px-3 text-right w-36 whitespace-nowrap">Actual Progress (%)</th>
                  <th className="py-2.5 align-top px-3 text-center w-32 whitespace-nowrap">Status / Alert</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-normal">
                {groupedByCategory.size === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada item pekerjaan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  Array.from(groupedByCategory.entries()).map(([category, items]) => {
                    const catWeight = items.reduce((s, i) => s + i.weightPercent, 0);
                    const catTarget =
                      catWeight > 0
                        ? items.reduce((s, i) => s + (i.weightPercent / catWeight) * i.targetProgressPercent, 0)
                        : 0;
                    const catActual =
                      catWeight > 0
                        ? items.reduce((s, i) => s + (i.weightPercent / catWeight) * i.actualProgressPercent, 0)
                        : 0;

                    return (
                      <React.Fragment key={category}>
                        {/* WBS Category Group Header Row */}
                        <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-b border-slate-200">
                          <td colSpan={2} className="py-2.5 px-4 text-xs text-indigo-950 uppercase tracking-tight">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
                              <span>{category}</span>
                              <span className="text-[10px] text-slate-400 font-normal ml-2">
                                ({items.length} Pekerjaan)
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 align-top break-words whitespace-normal px-3 text-right font-mono text-xs text-indigo-900">
                            {catWeight.toFixed(1)}%
                          </td>
                          <td colSpan={2} className="py-2.5 px-3 text-slate-500 text-[11px] font-medium">
                            Sub-Timeline Group
                          </td>
                          <td className="py-2.5 align-top break-words whitespace-normal px-3 text-right font-mono text-blue-700 font-bold">
                            {catTarget.toFixed(1)}%
                          </td>
                          <td className="py-2.5 align-top break-words whitespace-normal px-3 text-right font-mono text-emerald-700 font-bold">
                            {catActual.toFixed(1)}%
                          </td>
                          <td className="py-2.5 align-top break-words whitespace-normal px-3 text-center">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                              WBS Group
                            </span>
                          </td>
                        </tr>

                        {/* Work Item Rows inside Category */}
                        {items.map((item, index) => {
                          const isDelayed = item.status === "Delayed";
                          const delayAmount = Math.max(0, (item.targetProgressPercent ?? 0) - item.actualProgressPercent);

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-100 transition-colors ${
                                isDelayed ? "bg-rose-50/20 border-l-4 border-l-rose-500" : index % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }`}
                            >
                              {/* WBS Code */}
                              <td className="py-3 align-top break-words whitespace-normal px-3 text-center font-mono font-bold text-slate-500 text-[11px]">
                                {item.wbsCode}
                              </td>

                              {/* Work Item Name & Spec */}
                              <td className="py-3 align-top break-words whitespace-normal px-4">
                                <div className="font-semibold text-slate-800 text-xs leading-relaxed">
                                  {item.taskName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal break-words whitespace-normal leading-relaxed mt-0.5">
                                  {item.specification || "Standard Specification"}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Vol: {item.volume} {item.unit} • Rp {(item.totalPrice || 0).toLocaleString("id-ID")}
                                </div>
                              </td>

                              {/* Weight Percentage (Bobot %) */}
                              <td className="py-3 align-top break-words whitespace-normal px-3 text-right font-mono font-bold text-slate-700">
                                {item.weightPercent.toFixed(1)}%
                              </td>

                              {/* Planned Start Date */}
                              <td className="py-3 align-top break-words whitespace-normal px-3">
                                <input
                                  type="date"
                                  value={item.startDate}
                                  onChange={(e) =>
                                    handleItemChange(item.id, { startDate: e.target.value })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                              </td>

                              {/* Planned End Date */}
                              <td className="py-3 align-top break-words whitespace-normal px-3">
                                <input
                                  type="date"
                                  value={item.endDate}
                                  onChange={(e) =>
                                    handleItemChange(item.id, { endDate: e.target.value })
                                  }
                                  className={`w-full bg-white border rounded px-2 py-1 text-[11px] font-mono text-slate-800 focus:outline-none transition ${
                                    item.isDateInverted
                                      ? "border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-400/40"
                                      : "border-slate-300 focus:border-blue-500"
                                  }`}
                                />
                                {item.isDateInverted && (
                                  <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                                    ⚠️ End &lt; Start
                                  </span>
                                )}
                              </td>

                              {/* Target Progress (%) - Auto Calculated with Reactive Inverted Date Error Detection */}
                              <td className="py-3 align-top break-words whitespace-normal px-3 text-right font-mono">
                                {item.isDateInverted ? (
                                  <div className="flex flex-col items-end">
                                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-600 text-white shadow-xs inline-flex items-center gap-1 animate-pulse">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      ERROR!
                                    </span>
                                    <span className="text-[9px] font-bold text-rose-600 mt-0.5">
                                      Perhitungan Dihentikan
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="inline-flex items-center gap-1 justify-end font-bold text-blue-700">
                                      <span>{(item.targetProgressPercent ?? 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-blue-100 rounded-full h-1 mt-1 overflow-hidden">
                                      <div
                                        className="bg-blue-600 h-full rounded-full"
                                        style={{ width: `${Math.min(100, item.targetProgressPercent ?? 0)}%` }}
                                      />
                                    </div>
                                  </>
                                )}
                              </td>

                              {/* Actual Progress (%) - Interactive Input */}
                              <td className="py-3 align-top break-words whitespace-normal px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={item.actualProgressPercent}
                                    onChange={(e) =>
                                      handleItemChange(item.id, {
                                        actualProgressPercent: Math.min(
                                          100,
                                          Math.max(0, parseFloat(e.target.value) || 0)
                                        ),
                                      })
                                    }
                                    className="w-16 text-right bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                                  />
                                  <span className="text-slate-400 font-mono text-xs">%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.isDateInverted
                                        ? "bg-slate-300"
                                        : isDelayed
                                        ? "bg-rose-500"
                                        : "bg-emerald-600"
                                    }`}
                                    style={{ width: `${Math.min(100, item.actualProgressPercent)}%` }}
                                  />
                                </div>
                              </td>

                              {/* Status / Alert Indicator */}
                              <td className="py-3 align-top break-words whitespace-normal px-3 text-center">
                                {item.isDateInverted ? (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-rose-600 text-white border border-rose-700 shadow-[0_2px_4px_rgba(225,29,72,0.3)] inline-flex items-center gap-1 uppercase tracking-wide">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Date Error</span>
                                  </span>
                                ) : item.actualProgressPercent >= 100 ? (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-purple-600 text-white border border-purple-700 shadow-[0_2px_4px_rgba(147,51,234,0.3)] inline-flex items-center gap-1 uppercase tracking-wide">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Completed</span>
                                  </span>
                                ) : isDelayed ? (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-rose-500 text-white border border-rose-600 shadow-[0_2px_4px_rgba(244,63,94,0.3)] inline-flex items-center gap-1 uppercase tracking-wide">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Delayed (-{delayAmount.toFixed(1)}%)</span>
                                  </span>
                                ) : item.targetProgressPercent === 0 && item.actualProgressPercent === 0 ? (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 shadow-xs inline-flex items-center gap-1 uppercase tracking-wide">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pending</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white border border-emerald-600 shadow-[0_2px_4px_rgba(16,185,129,0.3)] inline-flex items-center gap-1 uppercase tracking-wide">
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>On Track</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
