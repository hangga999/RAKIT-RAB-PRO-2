import React, { useState } from "react";
import { Project, MasterCostItem } from "../types";
import { CreateRabProject } from "./CreateRabProject";
import { ScheduleTracker } from "./ScheduleTracker";
import {
  FolderKanban,
  Calculator,
  CalendarDays,
  ArrowLeft,
  Building2,
  MapPin,
  Coins,
} from "lucide-react";

interface ProjectWorkspaceProps {
  project: Project | null;
  masterItems: MasterCostItem[];
  allProjects: Project[];
  initialTab?: "rab" | "schedule";
  onSaveProject: (p: Project) => void;
  onCloseWorkspace: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  masterItems,
  allProjects,
  initialTab = "rab",
  onSaveProject,
  onCloseWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<"rab" | "schedule">(initialTab);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-500">
        <FolderKanban className="w-12 h-12 text-slate-300 mb-3" />
        <p className="font-semibold text-slate-700">No active project selected</p>
        <button
          onClick={onCloseWorkspace}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
        >
          Return to Master Project List
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden font-sans">
      {/* 1. PROJECT WORKSPACE CONTEXT HEADER & SUB-MENUS */}
      <div className="bg-white border-b border-slate-200 shadow-2xs z-10 shrink-0">
        {/* Top Info Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onCloseWorkspace}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Back to Master Project List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Project List</span>
            </button>

            <div className="h-4 w-px bg-slate-200"></div>

            {/* Project Code Badge */}
            <span className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
              {project.projectCode}
            </span>

            {/* Project Name & Owner */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>{project.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {project.status}
                </span>
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
              </div>
            </div>
          </div>

          {/* Right Summary Metrics */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Budget (BoQ):</span>
              <span className="text-sm font-bold font-mono text-blue-700">
                Rp {(project.grandTotal || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Core Sub-Menus (Tabs) */}
        <div className="px-6 flex items-center gap-4">
          <button
            onClick={() => setActiveTab("rab")}
            className={`py-3 px-3 flex items-center gap-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "rab"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>1. RAB (Bill of Quantities)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
              {project.items?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`py-3 px-3 flex items-center gap-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "schedule"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>2. Schedule &amp; Timeline Tracker</span>
            {project.scheduleItems && project.scheduleItems.some((s) => s.status === "Delayed") && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                ⚠️ Bottlenecks
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. SUB-MENU BODY CONTAINER */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === "rab" && (
          <CreateRabProject
            masterItems={masterItems}
            onSaveProject={onSaveProject}
            onNavigateToProjects={onCloseWorkspace}
            editingProject={project}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleTracker
            project={project}
            onUpdateProject={onSaveProject}
          />
        )}
      </div>
    </div>
  );
};
