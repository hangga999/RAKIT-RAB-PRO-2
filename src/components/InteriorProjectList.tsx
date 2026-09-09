import React, { useState } from "react";
import {
  FolderKanban,
  Search,
  Filter,
  PlusCircle,
  Building2,
  MapPin,
  Calendar,
  FileSpreadsheet,
  CalendarDays,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Database,
  Check,
  AlertCircle,
  ChevronDown,
  Info,
  Edit2,
} from "lucide-react";
import { InteriorProject, ProjectStatus, DesignStyle, FinishingGrade } from "../types";
import { ExportDropdown } from "./ExportDropdown";
import { exportInteriorProjectListToExcel } from "../utils/interiorProjectExport";
import { exportInteriorProjectListToPdf } from "../utils/interiorProjectExport";

interface InteriorProjectListProps {
  projects: InteriorProject[];
  onOpenRabDraft: (project: InteriorProject) => void;
  onOpenScheduleDraft: (project: InteriorProject) => void;
  onCreateNewInteriorProject: (projectData: Partial<InteriorProject>) => void;
  onUpdateProjectStatus: (projectId: string, newStatus: ProjectStatus) => void;
  onUpdateInteriorProject?: (project: InteriorProject) => void;
}

export const PROJECT_STATUS_OPTIONS: {
  value: ProjectStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}[] = [
  {
    value: "On Tender",
    label: "On Tender",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100",
    dotClass: "bg-amber-500",
    description: "Proses penawaran harga & tender dokumen",
  },
  {
    value: "Deal",
    label: "Deal",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100",
    dotClass: "bg-indigo-500",
    description: "Tender disetujui & SPK / Kontrak disepakati",
  },
  {
    value: "On Progress",
    label: "On Progress",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100",
    dotClass: "bg-blue-500",
    description: "Pekerjaan konstruksi aktif di lapangan",
  },
  {
    value: "Retention",
    label: "Retention",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100",
    dotClass: "bg-purple-500",
    description: "Masa pemeliharaan (retensi 5%) pasca BAST-1",
  },
  {
    value: "Done",
    label: "Done",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100",
    dotClass: "bg-emerald-500",
    description: "Pekerjaan tuntas 100% & BAST Final",
  },
];

export const InteriorProjectList: React.FC<InteriorProjectListProps> = ({
  projects,
  onOpenRabDraft,
  onOpenScheduleDraft,
  onCreateNewInteriorProject,
  onUpdateProjectStatus,
  onUpdateInteriorProject,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [infoInteriorProject, setInfoInteriorProject] = useState<InteriorProject | null>(null);
  const [editInteriorProject, setEditInteriorProject] = useState<InteriorProject | null>(null);
  const [lastUpdatedNotice, setLastUpdatedNotice] = useState<{
    id: string;
    status: ProjectStatus;
  } | null>(null);

  // Form State
  const defaultNextCode = `PRJ-2026-${String(projects.length + 1).padStart(3, "0")}`;
  const [newCode, setNewCode] = useState(defaultNextCode);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBuildingArea, setNewBuildingArea] = useState<number>(150);
  const [newFloorsCount, setNewFloorsCount] = useState<number>(2);
  const [newDesignStyle, setNewDesignStyle] = useState<DesignStyle>("Modern Minimalist");
  const [newFinishingGrade, setNewFinishingGrade] = useState<FinishingGrade>("Deluxe (Medium)");
  const [newInitialStatus, setNewInitialStatus] = useState<ProjectStatus>("On Tender");

  const handleOpenCreateModal = () => {
    setNewCode(`PRJ-2026-${String(projects.length + 1).padStart(3, "0")}`);
    setNewName("");
    setNewOwner("");
    setNewLocation("");
    setNewDescription("");
    setNewBuildingArea(150);
    setNewFloorsCount(2);
    setNewDesignStyle("Modern Minimalist");
    setNewFinishingGrade("Deluxe (Medium)");
    setNewInitialStatus("On Tender");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    onCreateNewInteriorProject({
      projectCode: newCode.trim(),
      name: newName.trim(),
      ownerName: newOwner.trim() || "Client",
      location: newLocation.trim() || "Indonesia",
      description: newDescription.trim(),
      status: newInitialStatus,
      requirements: {
        landArea: 0,
        buildingArea: newBuildingArea,
        floorsCount: newFloorsCount,
        ceilingHeight: 3.2,
        designStyle: newDesignStyle,
        finishingGrade: newFinishingGrade,
        scopeOfWork: ["Struktur", "Arsitektur", "Interior"],
        estimatedDurationWeeks: 12,
      },
    });

    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    onUpdateProjectStatus(projectId, newStatus);
    setLastUpdatedNotice({ id: projectId, status: newStatus });
    setTimeout(() => {
      setLastUpdatedNotice(null);
    }, 3000);
  };

  // Filtered projects
  const filteredInteriorProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    const currentStatus = p.status || "On Tender";
    const matchesStatus = statusFilter === "ALL" || currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const countByStatus = {
    "On Tender": projects.filter((p) => (p.status || "On Tender") === "On Tender").length,
    Deal: projects.filter((p) => p.status === "Deal").length,
    "On Progress": projects.filter((p) => p.status === "On Progress").length,
    Retention: projects.filter((p) => p.status === "Retention").length,
    Done: projects.filter((p) => p.status === "Done").length,
  };

  const totalPortfolioBoQ = projects.reduce(
    (acc, p) => acc + (p.grandTotal || 0),
    0
  );

  return (
    <div className="flex-1 h-full min-h-0 w-full overflow-y-auto bg-slate-100 font-sans p-4 sm:p-6 space-y-5 pb-24">
      {/* 1. TOP HEADER & PORTFOLIO STATUS SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-700">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  InteriorProject List (Master Manajemen Proyek)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800">
                  {projects.length} Registered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola status siklus proyek secara langsung (On Tender, Deal, On Progress, Retention, Done) dengan update instan ke SQLite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite Connected</span>
            </div>

            <ExportDropdown
              label="Export InteriorProjects"
              onExportExcel={() => exportInteriorProjectListToExcel(projects)}
              onExportPdf={() => exportInteriorProjectListToPdf(projects)}
              menuTitle="InteriorProject Portfolio Export"
            />

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Daftarkan Proyek Baru</span>
            </button>
          </div>
        </div>

        {/* 5-Stage Lifecycle KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {PROJECT_STATUS_OPTIONS.map((opt) => {
            const count = countByStatus[opt.value];
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(isSelected ? "ALL" : opt.value)}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/50"
                    : "bg-slate-50 hover:bg-white text-slate-700 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isSelected ? "text-indigo-300" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${opt.dotClass}`}
                    ></span>
                    {opt.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                      isSelected
                        ? "bg-slate-800 text-white"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-2">
                  <div
                    className={`text-xl font-bold font-mono ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {count} <span className="text-xs font-normal">Proyek</span>
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                    title={opt.description}
                  >
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-time DB notification toast */}
        {lastUpdatedNotice && (
          <div className="mt-3 px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Status Terupdate Otomatis:</strong> Proyek{" "}
                <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">
                  {projects.find((p) => p.id === lastUpdatedNotice.id)?.projectCode || lastUpdatedNotice.id}
                </code>{" "}
                berhasil diperbarui ke status{" "}
                <span className="font-bold underline">
                  "{lastUpdatedNotice.status}"
                </span>
                .
              </span>
              {statusFilter !== "ALL" && statusFilter !== lastUpdatedNotice.status && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(lastUpdatedNotice.status)}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition cursor-pointer shadow-2xs"
                >
                  Buka Tab {lastUpdatedNotice.status} →
                </button>
              )}
            </div>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-100/80 px-2 py-0.5 rounded">
              Status Tersimpan & Sinkron
            </span>
          </div>
        )}
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
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Status ({projects.length})</option>
              {PROJECT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({countByStatus[opt.value]})
                </option>
              ))}
            </select>
          </div>

          {statusFilter !== "ALL" && (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer underline"
            >
              Reset Filter
            </button>
          )}

          <div className="text-slate-400 text-xs font-mono">
            Menampilkan {filteredInteriorProjects.length} dari {projects.length} Proyek
          </div>
        </div>
      </div>

      {/* 3. PROJECT LIST TABLE WITH INTERACTIVE STATUS DROPDOWN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-40 ">InteriorProject Code</th>
                <th className="py-3 px-4 min-w-[240px]">InteriorProject Name &amp; Description</th>
                <th className="py-3 px-4 w-44">Client / Owner</th>
                <th className="py-3 px-4 w-44">Location &amp; Specs</th>
                {/* Status Column with selector */}
                <th className="py-3 px-4 w-48 text-left">
                  <div className="flex items-center gap-1.5">
                    <span>Status Siklus</span>
                    <span className="text-[10px] font-normal text-slate-400 lowercase">
                      (interactive)
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right w-40">Grand Total (BoQ)</th>
                <th className="py-3 px-4 text-center w-48">Workspaces</th>
                <th className="py-3 px-4 text-center w-32">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredInteriorProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>Tidak ada proyek yang sesuai dengan kriteria pencarian / filter.</div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("ALL");
                      }}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Reset filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredInteriorProjects.map((project) => {
                  const currentStatusConfig =
                    PROJECT_STATUS_OPTIONS.find(
                      (opt) => opt.value === project.status
                    ) || PROJECT_STATUS_OPTIONS[0];

                  const isJustUpdated = lastUpdatedNotice?.id === project.id;

                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isJustUpdated ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      {/* InteriorProject Code */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal font-mono font-bold text-indigo-700 ">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 font-mono text-xs inline-block">
                          {project.projectCode}
                        </span>
                      </td>

                      {/* InteriorProject Name & Description */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                        <div className="font-bold text-slate-900 text-sm">
                          {project.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {project.description || "Tidak ada deskripsi proyek."}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>Dibuat: {project.createdAt}</span>
                          <span>•</span>
                          <span>{project.revisions?.length || 1} Revisi RAB</span>
                        </div>
                      </td>

                      {/* Client / Owner */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                        <div className="font-medium text-slate-800">
                          {project.ownerName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>Pemberi Tugas</span>
                        </div>
                      </td>

                      {/* Location & Specs */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {project.location}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          LB {project.requirements?.buildingArea || 0} m² •{" "}
                          {project.requirements?.floorsCount || 1} Lantai
                        </div>
                      </td>

                      {/* Interactive Status Selector Dropdown */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                        <div className="relative inline-block w-full max-w-[170px]">
                          <select
                            value={project.status || "On Tender"}
                            onChange={(e) =>
                              handleStatusChange(
                                project.id,
                                e.target.value as ProjectStatus
                              )
                            }
                            className={`w-full appearance-none pl-6 pr-7 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${currentStatusConfig.badgeClass}`}
                            title="Klik untuk mengubah status proyek secara real-time"
                          >
                            {PROJECT_STATUS_OPTIONS.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                className="bg-white text-slate-800 font-medium py-1"
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {/* Status colored dot indicator */}
                          <span
                            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${currentStatusConfig.dotClass}`}
                          />

                          {/* Dropdown Chevron */}
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>

                        {/* SQLite update confirmation tag */}
                        {isJustUpdated && (
                          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 animate-pulse">
                            <Check className="w-3 h-3" />
                            <span>SQLite Updated</span>
                          </div>
                        )}
                      </td>

                      {/* Grand Total BoQ */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal text-right font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          Rp {(project.grandTotal || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {project.items?.length || 0} Work Items
                        </div>
                      </td>

                      {/* Workspaces Shortcuts */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenRabDraft(project)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Buka RAB Draft Editor"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>RAB</span>
                          </button>

                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top break-words whitespace-normal text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInfoInteriorProject(project)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title="Informasi Proyek"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditInteriorProject(project)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                            title="Edit Proyek"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Registrasi Proyek Baru</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Kode Proyek (ID)
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-indigo-700"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Status Siklus Awal
                  </label>
                  <select
                    value={newInitialStatus}
                    onChange={(e) =>
                      setNewInitialStatus(e.target.value as ProjectStatus)
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800"
                  >
                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Nama Proyek
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pembangunan Villa Tropis 2 Lantai"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Nama Klien / Pemilik
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bpk. Hendra Gunawan"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Lokasi Proyek
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SCBD Jakarta Selatan"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Luas Bangunan (m²)
                  </label>
                  <input
                    type="number"
                    value={newBuildingArea}
                    onChange={(e) =>
                      setNewBuildingArea(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Jumlah Lantai
                  </label>
                  <input
                    type="number"
                    value={newFloorsCount}
                    onChange={(e) =>
                      setNewFloorsCount(Number(e.target.value) || 1)
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Deskripsi / Catatan Proyek
                </label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan ruang lingkup pekerjaan atau spesifikasi utama..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Proyek ke SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {infoInteriorProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Detail Proyek</h3>
              </div>
              <button
                onClick={() => setInfoInteriorProject(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 font-bold mb-1">Kode Proyek</div>
                  <div className="font-mono text-indigo-700 font-bold">{infoInteriorProject.projectCode}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold mb-1">Status Siklus</div>
                  <div className="font-semibold text-slate-800">{infoInteriorProject.status}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 font-bold mb-1">Nama Proyek</div>
                  <div className="font-semibold text-slate-900 text-sm">{infoInteriorProject.name}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 font-bold mb-1">Klien / Pemilik</div>
                  <div className="text-slate-800">{infoInteriorProject.ownerName || "-"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 font-bold mb-1">Lokasi</div>
                  <div className="text-slate-800">{infoInteriorProject.location || "-"}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold mb-1">Luas Bangunan</div>
                  <div className="text-slate-800">{infoInteriorProject.requirements?.buildingArea || 0} m²</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold mb-1">Jumlah Lantai</div>
                  <div className="text-slate-800">{infoInteriorProject.requirements?.floorsCount || 1}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 font-bold mb-1">Deskripsi</div>
                  <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{infoInteriorProject.description || "Tidak ada deskripsi"}</div>
                </div>
              </div>
              <div className="pt-4 flex justify-end border-t border-slate-100">
                <button onClick={() => setInfoInteriorProject(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editInteriorProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Edit Metadata Proyek</h3>
              </div>
              <button
                onClick={() => setEditInteriorProject(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateInteriorProject) {
                  onUpdateInteriorProject(editInteriorProject);
                }
                setEditInteriorProject(null);
              }}
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Kode Proyek (ID)
                  </label>
                  <input
                    type="text"
                    value={editInteriorProject.projectCode}
                    onChange={(e) => setEditInteriorProject({ ...editInteriorProject, projectCode: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-indigo-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Status Siklus
                  </label>
                  <select
                    value={editInteriorProject.status}
                    onChange={(e) => setEditInteriorProject({ ...editInteriorProject, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800"
                  >
                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Nama Proyek
                </label>
                <input
                  type="text"
                  value={editInteriorProject.name}
                  onChange={(e) => setEditInteriorProject({ ...editInteriorProject, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Klien / Pemilik
                  </label>
                  <input
                    type="text"
                    value={editInteriorProject.ownerName}
                    onChange={(e) => setEditInteriorProject({ ...editInteriorProject, ownerName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={editInteriorProject.location}
                    onChange={(e) => setEditInteriorProject({ ...editInteriorProject, location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Luas Bangunan (m²)
                  </label>
                  <input
                    type="number"
                    value={editInteriorProject.requirements?.buildingArea || 0}
                    onChange={(e) => setEditInteriorProject({
                      ...editInteriorProject,
                      requirements: { ...editInteriorProject.requirements, buildingArea: Number(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Jumlah Lantai
                  </label>
                  <input
                    type="number"
                    value={editInteriorProject.requirements?.floorsCount || 1}
                    onChange={(e) => setEditInteriorProject({
                      ...editInteriorProject,
                      requirements: { ...editInteriorProject.requirements, floorsCount: Number(e.target.value) || 1 }
                    })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Deskripsi / Catatan Proyek
                </label>
                <textarea
                  rows={2}
                  value={editInteriorProject.description}
                  onChange={(e) => setEditInteriorProject({ ...editInteriorProject, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditInteriorProject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
