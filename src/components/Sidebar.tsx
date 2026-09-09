import React from "react";
import {
  FileSpreadsheet,
  FolderKanban,
  TrendingUp,
  Database,
  Users,
  ChevronLeft,
  ChevronRight,
  Calculator,
  CalendarDays,
  Clock,
  Layers,
} from "lucide-react";

export type NavMenuKey =
  | "project-list"
  | "rab-list"
  | "schedule-list"
  | "rab-draft"
  | "schedule-draft"
  | "master-db"
  | "vendor-list"
  | "category-management"
  | "interior-project-list"
  | "interior-rab-list"
  | "interior-master-db"
  | "interior-rab-draft";

export interface SidebarProps {
  activeKey: NavMenuKey;
  onSelectMenu: (key: NavMenuKey) => void;
  projectCount: number;
  masterDbCount: number;
  vendorCount: number;
  activeProjectCode?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeKey,
  onSelectMenu,
  projectCount,
  masterDbCount,
  vendorCount,
  activeProjectCode,
  isCollapsed,
  onToggleCollapse,
}) => {
  const isEditingDraft = activeKey === "rab-draft" || activeKey === "schedule-draft";

  const mainMenuItems: {
    key: NavMenuKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | string;
    badge?: string;
  }[] = [
    {
      key: "project-list",
      label: "Project List",
      icon: FolderKanban,
      count: projectCount,
      badge: "Status",
    },
    {
      key: "rab-list",
      label: "RAB List",
      icon: FileSpreadsheet,
      count: projectCount,
    },
    {
      key: "schedule-list",
      label: "Schedule List",
      icon: CalendarDays,
      count: projectCount,
    },
  ];

  const secondaryMenuItems: {
    key: NavMenuKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | string;
  }[] = [
    {
      key: "master-db",
      label: "Master Database (AHS)",
      icon: Database,
      count: masterDbCount,
    },
    {
      key: "vendor-list",
      label: "Vendor Directory",
      icon: Users,
      count: vendorCount,
    },
    {
      key: "category-management",
      label: "Category Management",
      icon: Layers,
    },
  ];

  const interiorMenuItems: {
    key: NavMenuKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "interior-project-list", label: "Project List", icon: FolderKanban },
    { key: "interior-rab-list", label: "RAB List", icon: FileSpreadsheet },
    { key: "interior-master-db", label: "Database Specification", icon: Database },
    { key: "interior-rab-draft", label: "RAB Draft (Interior)", icon: Calculator },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-slate-900 flex flex-col text-slate-300 shrink-0 select-none border-r border-slate-800 transition-all duration-200`}
    >
      {/* High Density Brand Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white italic text-base shadow-sm shrink-0">
              R
            </div>
            <div className="truncate">
              <h1 className="font-bold text-sm text-white leading-tight truncate">
                Rakitco ERP
              </h1>
              <span className="block text-[11px] font-normal text-slate-400">
                Desktop Systems v2.2
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded mx-auto flex items-center justify-center font-bold text-white italic text-base shadow-sm">
            R
          </div>
        )}

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Core Navigation Section */}
      <div className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {/* SECTION 1: WORKSPACES */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Project Workspaces
            </div>
          )}

          <nav className="space-y-1" aria-label="Workspaces Menu">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;

              return (
                <button
                  key={item.key}
                  id={`sidebar-nav-${item.key}`}
                  onClick={() => onSelectMenu(item.key)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-md transition-all group cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    } ${isCollapsed ? "mx-auto" : "mr-3"}`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ml-auto ${
                        isActive
                          ? "bg-blue-700 text-white font-bold"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SECTION 2: ACTIVE DRAFT EDITOR (When a project is open) */}
        {activeProjectCode && (
          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                <span>Active Project Draft</span>
                <span className="font-mono text-[9px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800">
                  {activeProjectCode}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => onSelectMenu("rab-draft")}
                title={isCollapsed ? `RAB Draft: ${activeProjectCode}` : undefined}
                className={`w-full flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeKey === "rab-draft"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Calculator
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeKey === "rab-draft" ? "text-white" : "text-indigo-400"
                  } ${isCollapsed ? "mx-auto" : "mr-2.5"}`}
                />
                {!isCollapsed && <span className="truncate">RAB Draft</span>}
              </button>

              <button
                onClick={() => onSelectMenu("schedule-draft")}
                title={isCollapsed ? `Schedule & S-Curve: ${activeProjectCode}` : undefined}
                className={`w-full flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeKey === "schedule-draft"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <TrendingUp
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeKey === "schedule-draft" ? "text-white" : "text-emerald-400"
                  } ${isCollapsed ? "mx-auto" : "mr-2.5"}`}
                />
                {!isCollapsed && <span className="truncate">Schedule &amp; S-Curve</span>}
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: SYSTEM REFERENCES */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System References
            </div>
          )}

          <nav className="space-y-1" aria-label="Reference Menu">
            {secondaryMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;

              return (
                <button
                  key={item.key}
                  id={`sidebar-nav-${item.key}`}
                  onClick={() => onSelectMenu(item.key)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-md transition-all group cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    } ${isCollapsed ? "mx-auto" : "mr-3"}`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ml-auto ${
                        isActive
                          ? "bg-blue-700 text-white font-bold"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SECTION 4: INTERIOR MASTER */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Interior Master
            </div>
          )}

          <nav className="space-y-1" aria-label="Interior Menu">
            {interiorMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;

              return (
                <button
                  key={item.key}
                  id={`sidebar-nav-${item.key}`}
                  onClick={() => onSelectMenu(item.key)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-md transition-all group cursor-pointer ${
                    isActive
                      ? "bg-amber-600 text-white shadow-xs font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-white" : "text-amber-500 group-hover:text-amber-400"
                    } ${isCollapsed ? "mx-auto" : "mr-3"}`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-[11px] text-slate-400">
        {!isCollapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="truncate font-mono">SQLite Hub: Online</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center gap-2 py-1.5 mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition cursor-pointer"
                title="Minimize Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-semibold">Minimize Sidebar</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" title="SQLite Hub: Online"></div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition cursor-pointer"
                title="Maximize Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
