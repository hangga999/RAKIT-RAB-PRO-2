import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Building2,
  MapPin,
  FileSpreadsheet,
  Activity,
  Layers,
} from "lucide-react";
import { Project, ScheduleItem } from "../types";
import { calculatePlannedProgress } from "./ScheduleTracker";

interface ScheduleProjectListProps {
  projects: Project[];
  onOpenScheduleDraft: (project: Project) => void;
  onOpenRabDraft?: (project: Project) => void;
}

export const ScheduleProjectList: React.FC<ScheduleProjectListProps> = ({
  projects,
  onOpenScheduleDraft,
  onOpenRabDraft,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleExpand = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Compute schedule metrics for each project
  const projectMetrics = useMemo(() => {
    return projects.map((project) => {
      const items: ScheduleItem[] = project.scheduleItems || [];
      const totalRabItems = project.items?.length || 0;
      const totalBudget = project.grandTotal || 0;

      if (items.length === 0) {
        // Fallback calculation if schedule hasn't been explicitly synchronized yet
        const plannedEstimate = project.status === "Completed" ? 100 : project.status === "Ongoing" ? 45 : 15;
        const actualEstimate = project.status === "Completed" ? 100 : project.status === "Ongoing" ? 40 : 10;
        const variance = actualEstimate - plannedEstimate;

        return {
          project,
          plannedProgress: plannedEstimate,
          actualProgress: actualEstimate,
          variance,
          status: variance < -2 ? "Delayed" : variance > 2 ? "Ahead" : "On Track",
          totalTasks: totalRabItems,
          delayedTasksCount: variance < -2 ? 2 : 0,
          durationWeeks: project.requirements?.estimatedDurationWeeks || 12,
        };
      }

      const totalWeight = items.reduce((s, i) => s + (i.weightPercent || 0), 0) || 100;
      const planned = items.reduce((acc, i) => {
        if (i.isDateInverted) return acc;
        const wt = (i.weightPercent || 0) / totalWeight;
        const calc = calculatePlannedProgress(i.startDate || "", i.endDate || "", todayStr);
        const target = i.targetProgressPercent ?? calc.targetProgressPercent;
        return acc + wt * target;
      }, 0);

      const actual = items.reduce((acc, i) => {
        const wt = (i.weightPercent || 0) / totalWeight;
        return acc + wt * (i.actualProgressPercent || 0);
      }, 0);

      const variance = Math.round((actual - planned) * 10) / 10;
      const delayedCount = items.filter((i) => i.status === "Delayed" || (i.actualProgressPercent < (i.targetProgressPercent || 0))).length;

      let healthStatus: "Ahead" | "Delayed" | "On Track" = "On Track";
      if (variance < -1) healthStatus = "Delayed";
      else if (variance > 1) healthStatus = "Ahead";

      return {
        project,
        plannedProgress: Math.round(planned * 10) / 10,
        actualProgress: Math.round(actual * 10) / 10,
        variance,
        status: healthStatus,
        totalTasks: items.length,
        delayedTasksCount: delayedCount,
        durationWeeks: project.requirements?.estimatedDurationWeeks || 12,
      };
    });
  }, [projects, todayStr]);

  // Filter projects
  const filteredMetrics = useMemo(() => {
    return projectMetrics.filter(({ project, status }) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || status === statusFilter || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectMetrics, searchQuery, statusFilter]);

  const totalDelayedProjects = projectMetrics.filter((m) => m.status === "Delayed").length;
  const totalOnTrackProjects = projectMetrics.filter((m) => m.status === "On Track" || m.status === "Ahead").length;

  return (
    <div className="flex-1 h-full min-h-0 w-full overflow-y-auto bg-slate-100 font-sans p-4 sm:p-6 space-y-5 pb-24">
      {/* 1. TOP HEADER & SCHEDULE HEALTH OVERVIEW */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Schedule List (Portfolio Jadwal Pelaksanaan &amp; Kurva S)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800">
                  {projects.length} Proyek
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring deviasi jadwal, Kurva S interaktif, bobot WBS, dan peringatan keterlambatan (bottlenecks).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Tanggal Evaluasi: <strong className="text-slate-800">{todayStr}</strong></span>
          </div>
        </div>

        {/* Portfolio Health Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Proyek Terjadwal</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-indigo-700 mt-0.5 block">
              {projects.length} Proyek
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Jadwal On-Track / Ahead</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-0.5 block">
              {totalOnTrackProjects} Proyek Tepat Waktu
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Keterlambatan (Delayed)</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-rose-600 mt-0.5 block">
              {totalDelayedProjects} Proyek Perlu Akselerasi
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Fitur S-Curve</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Dual-Line Realtime Matplotlib
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode proyek, nama, pemilik, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Filter Jadwal:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Jadwal ({projectMetrics.length})</option>
            <option value="Delayed">⚠️ Delayed (Keterlambatan)</option>
            <option value="On Track">On Track (Sesuai Rencana)</option>
            <option value="Ahead">Ahead (Mendahului Jadwal)</option>
          </select>
        </div>
      </div>

      {/* 3. GLOBAL TIMELINE DASHBOARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Dashboard Header: Months */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="w-[300px] shrink-0 p-4 border-r border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center">
            Project / Work Breakdown
          </div>
          <div className="flex-1 grid grid-cols-12 min-w-[600px]">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
              <div key={month} className="p-3 text-center border-r border-slate-200 last:border-0 font-bold text-xs text-slate-500 uppercase">
                {month}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="flex-col divide-y divide-slate-100">
          {filteredMetrics.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Tidak ada proyek yang sesuai dengan kriteria pencarian jadwal.
            </div>
          ) : (
            filteredMetrics.map(({ project, plannedProgress, actualProgress, variance, status, durationWeeks }) => {
              // Group items by category for secondary rows
              let categories: string[] = [];
              let hasScheduleDetails = false;
              if (project.scheduleItems && project.scheduleItems.length > 0) {
                categories = Array.from(new Set(project.scheduleItems.map(item => item.category))) as string[];
                hasScheduleDetails = true;
              } else if (project.items && project.items.length > 0) {
                categories = Array.from(new Set(project.items.map(item => item.workCategory))) as string[];
              } else {
                categories = ["Tahap Persiapan", "Tahap Pelaksanaan", "Tahap Penyelesaian"]; // Fallback
              }
              
              // Helper to calculate bar styles
              const getTimelineStyle = (startStr?: string, endStr?: string) => {
                if (!startStr || !endStr) return { left: '0%', width: '0%', display: 'none' };
                const start = new Date(startStr);
                const end = new Date(endStr);
                const yearStart = new Date('2026-01-01').getTime();
                const yearEnd = new Date('2026-12-31').getTime();
                const total = yearEnd - yearStart;
                
                let left = ((start.getTime() - yearStart) / total) * 100;
                let width = ((end.getTime() - start.getTime()) / total) * 100;
                
                left = Math.max(0, Math.min(100, left));
                width = Math.max(0, Math.min(100 - left, width));
                
                return { left: `${left}%`, width: `${width}%` };
              };

              // Fallback style for whole project if no dates available
              const projectStyle = hasScheduleDetails
                ? getTimelineStyle(project.scheduleItems![0].startDate, project.scheduleItems![project.scheduleItems!.length - 1].endDate)
                : { left: '10%', width: '40%' };

              return (
                <div key={project.id} className="group">
                  {/* Primary Row */}
                  <div className="flex hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => onOpenScheduleDraft(project)}>
                    <div className="w-[300px] shrink-0 p-4 border-r border-slate-200 flex flex-col justify-center relative">
                      <button 
                        onClick={(e) => toggleExpand(project.id, e)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition z-10"
                      >
                        {expandedProjects.has(project.id) ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        )}
                      </button>
                      <div className="pl-2">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-700 text-sm truncate pr-2">
                            {project.name}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                            status === "Delayed" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            status === "Ahead" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          {project.projectCode} • {plannedProgress.toFixed(1)}% Planned
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 relative min-w-[600px] border-b border-slate-50 bg-[repeating-linear-gradient(to_right,transparent,transparent_8.33%,#f1f5f9_8.33%,#f1f5f9_8.43%)]">
                      <div className="absolute inset-y-0 w-full flex items-center px-2">
                        {/* Dual-tone Progress Bar Container */}
                        <div className="relative h-8 rounded-md overflow-hidden bg-slate-200/50 border border-slate-300 shadow-xs" style={projectStyle}>
                          {/* Planned (Top Half) */}
                          <div className="absolute top-0 left-0 h-1/2 bg-blue-500 border-b border-blue-600 transition-all duration-300" style={{ width: `${plannedProgress}%` }}></div>
                          {/* Actual (Bottom Half) */}
                          <div className={`absolute bottom-0 left-0 h-1/2 transition-all duration-300 ${variance < 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${actualProgress}%` }}></div>
                          
                          {/* Text Overlays */}
                          <div className="absolute top-0 left-0 h-1/2 w-full flex items-center px-2 z-10 pointer-events-none">
                            <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">{plannedProgress.toFixed(1)}% Planned</span>
                          </div>
                          <div className="absolute bottom-0 left-0 h-1/2 w-full flex items-center px-2 z-10 pointer-events-none">
                            <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">{actualProgress.toFixed(1)}% Actual</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Rows (Work Breakdown) */}
                  {expandedProjects.has(project.id) && categories.map((category) => {
                    let catTarget = 0;
                    let avgActual = 0;
                    let catStyle = { left: '10%', width: '40%', display: 'block' };

                    if (hasScheduleDetails && project.scheduleItems) {
                      const categoryItems = project.scheduleItems.filter(i => i.category === category) || [];
                      if (categoryItems.length > 0) {
                        const catStart = categoryItems[0]?.startDate;
                        const catEnd = categoryItems[categoryItems.length - 1]?.endDate;
                        catStyle = getTimelineStyle(catStart, catEnd) as any;
                        const catWeight = categoryItems.reduce((acc, curr) => acc + (curr.weightPercent || 0), 0);
                        if (catWeight > 0) {
                          catTarget = categoryItems.reduce((acc, curr) => acc + (curr.weightPercent * (curr.targetProgressPercent || 0)) / catWeight, 0);
                          avgActual = categoryItems.reduce((acc, curr) => acc + (curr.weightPercent * (curr.actualProgressPercent || 0)) / catWeight, 0);
                        } else {
                          catTarget = categoryItems.reduce((acc, curr) => acc + (curr.targetProgressPercent || 0), 0) / categoryItems.length;
                          avgActual = categoryItems.reduce((acc, curr) => acc + (curr.actualProgressPercent || 0), 0) / categoryItems.length;
                        }
                      }
                    } else {
                      // Fallback visual for items without schedule detail
                      catTarget = plannedProgress;
                      avgActual = actualProgress;
                    }

                    return (
                      <div key={`${project.id}-${category}`} className="flex hover:bg-slate-50 transition-colors border-t border-dashed border-slate-200">
                        <div className="w-[300px] shrink-0 pl-10 pr-4 py-2 border-r border-slate-200 flex items-center">
                          <span className="text-xs font-semibold text-slate-600 truncate">{category}</span>
                        </div>
                        <div className="flex-1 relative min-w-[600px] bg-[repeating-linear-gradient(to_right,transparent,transparent_8.33%,#f1f5f9_8.33%,#f1f5f9_8.43%)]">
                          <div className="absolute inset-y-0 w-full flex items-center px-2">
                            <div className="relative h-6 rounded-sm overflow-hidden bg-slate-200/50 border border-slate-300" style={{...catStyle, display: catStyle.display || 'block'}}>
                              <div className="absolute top-0 left-0 h-1/2 bg-blue-400 transition-all duration-300" style={{ width: `${catTarget}%` }}></div>
                              <div className={`absolute bottom-0 left-0 h-1/2 transition-all duration-300 ${avgActual < catTarget ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${avgActual}%` }}></div>
                              
                              <div className="absolute top-0 left-0 h-1/2 w-full flex items-center px-1.5 z-10 pointer-events-none">
                                <span className="text-[8px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">{catTarget.toFixed(1)}%</span>
                              </div>
                              <div className="absolute bottom-0 left-0 h-1/2 w-full flex items-center px-1.5 z-10 pointer-events-none">
                                <span className="text-[8px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">{avgActual.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
