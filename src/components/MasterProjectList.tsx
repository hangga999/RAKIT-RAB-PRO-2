import React, { useState } from "react";
import {
  FolderKanban,
  Search,
  Filter,
  Eye,
  PlusCircle,
  Calendar,
  MapPin,
  Building,
  X,
  TrendingUp,
  Download,
  Calculator,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Building2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Project, ProjectStatus, DesignStyle, FinishingGrade } from "../types";
import { DualScrollTable } from "./DualScrollTable";

interface MasterProjectListProps {
  projects: Project[];
  onOpenWorkspace: (project: Project, tab?: "rab" | "schedule") => void;
  onCreateNewProject: (projectData: Partial<Project>) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const MasterProjectList: React.FC<MasterProjectListProps> = ({
  projects,
  onOpenWorkspace,
  onCreateNewProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // New Project Form State
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
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    onCreateNewProject({
      projectCode: newCode.trim(),
      name: newName.trim(),
      ownerName: newOwner.trim() || "Client",
      location: newLocation.trim() || "Jakarta",
      description: newDescription.trim(),
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

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPortfolioBudget = projects.reduce((sum, p) => sum + p.grandTotal, 0);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "On Tender":
        return "bg-amber-50 text-amber-700 border-amber-300";
      case "Deal":
        return "bg-indigo-50 text-indigo-700 border-indigo-300";
      case "On Progress":
        return "bg-blue-50 text-blue-700 border-blue-300";
      case "Retention":
        return "bg-purple-50 text-purple-700 border-purple-300";
      case "Done":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 1. Header & Central Hub Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            Master Project List (Central Management Hub)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar ikhtisar seluruh portofolio proyek. Klik "Edit RAB" untuk membuka workspace BoQ atau "Schedule" untuk timeline.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Buat Proyek Baru</span>
        </button>
      </div>

      {/* 2. KPI Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Proyek
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {projects.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Tercatat di SQLite Database
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Nilai Portofolio (RAB)
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            Rp{" "}
            {totalPortfolioBudget.toLocaleString("id-ID", {
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Akumulasi estimasi seluruh proyek
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Status Proyek Aktif
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className="text-amber-700 font-bold">
              {projects.filter((p) => p.status === "On Tender").length} On Tender
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-bold">
              {projects.filter((p) => p.status === "On Progress").length} On Progress
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">
              {projects.filter((p) => p.status === "Done").length} Done
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tahapan siklus proyek
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata Nilai per Proyek
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1 font-mono">
            Rp{" "}
            {(projects.length > 0
              ? totalPortfolioBudget / projects.length
              : 0
            ).toLocaleString("id-ID", {
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Rerata budget per project
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode proyek, nama, pemilik, lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="On Tender">On Tender</option>
            <option value="Deal">Deal</option>
            <option value="On Progress">On Progress</option>
            <option value="Retention">Retention</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      {/* 4. Master Project Table with Explicit "Edit RAB" and "Schedule" Actions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <DualScrollTable>
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-4 w-32">Project Code</th>
                <th className="py-3 px-4">Nama Proyek</th>
                <th className="py-3 px-4">Klien / Pemilik</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4 text-center">Spesifikasi Luas</th>
                <th className="py-3 px-4 text-right">Nilai RAB (IDR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center min-w-[200px]">Workspace Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada proyek yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Project Code */}
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                        {p.projectCode}
                      </span>
                    </td>

                    {/* Project Name & Description */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.name}
                      <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                        {p.description || "No description provided"}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.ownerName}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {p.location}
                        </span>
                      </div>
                    </td>

                    {/* Area & Design */}
                    <td className="py-3 px-4 text-center">
                      <div className="text-[11px] text-slate-600 font-medium">
                        {p.requirements?.buildingArea || 0} m² •{" "}
                        {p.requirements?.floorsCount || 1} Lt
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {p.requirements?.designStyle || "-"}
                      </div>
                    </td>

                    {/* Total Budget */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/40">
                      Rp{" "}
                      {p.grandTotal.toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* DEDICATED WORKSPACE ACTIONS: Edit RAB, Schedule, Inspect */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit RAB Button */}
                        <button
                          onClick={() => onOpenWorkspace(p, "rab")}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Buka dan Edit Rincian Item RAB / BoQ"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Edit RAB</span>
                        </button>

                        {/* Schedule & Timeline Button */}
                        <button
                          onClick={() => onOpenWorkspace(p, "schedule")}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Buka Schedule Timeline & Kurva-S"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>Schedule</span>
                        </button>

                        {/* Quick View Details Button */}
                        <button
                          onClick={() => setInspectingProject(p)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Lihat Rekap Data Cepat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={() => setProjectToDelete(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus Proyek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DualScrollTable>
      </div>

      {/* 5. CREATE NEW PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">Buat Proyek Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Daftarkan metadata awal proyek sebelum menyusun Bill of Quantities (RAB)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Project Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. PRJ-2026-001"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Renovasi Villa Seminyak"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Owner / Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. Bpk. Hendra Gunawan"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Location / Site Address
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Jl. Sunset Road, Seminyak, Bali"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Project Description / Scope Summary
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ringkasan lingkup pekerjaan, catatan arsitektural..."
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Build Area (m²)
                  </label>
                  <input
                    type="number"
                    value={newBuildingArea}
                    onChange={(e) => setNewBuildingArea(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Floors
                  </label>
                  <input
                    type="number"
                    value={newFloorsCount}
                    onChange={(e) => setNewFloorsCount(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Design Style
                  </label>
                  <select
                    value={newDesignStyle}
                    onChange={(e) => setNewDesignStyle(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Industrial Chic">Industrial Chic</option>
                    <option value="Japandi / Wabi-Sabi">Japandi</option>
                    <option value="Classic Luxury">Classic Luxury</option>
                    <option value="Tropical Contemporary">Tropical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Finishing Tier
                  </label>
                  <select
                    value={newFinishingGrade}
                    onChange={(e) => setNewFinishingGrade(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Standard (Ekonomis)">Standard</option>
                    <option value="Deluxe (Medium)">Deluxe</option>
                    <option value="Premium (Luxury / High-End)">Premium</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Simpan &amp; Buka Workspace RAB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. INSPECT PROJECT MODAL */}
      {inspectingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-500 text-white font-mono text-[10px] px-2 py-0.5 rounded font-semibold">
                    {inspectingProject.projectCode}
                  </span>
                  <h3 className="font-bold text-sm">{inspectingProject.name}</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Client: {inspectingProject.ownerName} • {inspectingProject.location}
                </p>
              </div>
              <button
                onClick={() => setInspectingProject(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total RAB:</span>
                  <span className="font-mono font-bold text-sm text-blue-700">
                    Rp {inspectingProject.grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Pekerjaan:</span>
                  <span className="font-semibold text-xs text-slate-800">
                    {inspectingProject.items?.length || 0} Line Items
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Luas Bangunan:</span>
                  <span className="font-semibold text-xs text-slate-800">
                    {inspectingProject.requirements?.buildingArea} m² ({inspectingProject.requirements?.floorsCount} Lt)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status:</span>
                  <span className="font-semibold text-xs text-emerald-700">
                    {inspectingProject.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item Pekerjaan</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3 text-right">Vol</th>
                      <th className="py-2 px-3 text-right">Harga Satuan</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inspectingProject.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {item.itemName}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{item.workCategory}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {item.volume} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          Rp {item.unitPrice.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          Rp {item.totalPrice.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  const p = inspectingProject;
                  setInspectingProject(null);
                  onOpenWorkspace(p, "rab");
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Buka di Edit RAB</span>
              </button>
              <button
                onClick={() => {
                  const p = inspectingProject;
                  setInspectingProject(null);
                  onOpenWorkspace(p, "schedule");
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Buka di Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PROJECT MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Proyek</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <div className="p-5 text-xs text-slate-600 space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus proyek <span className="font-bold text-slate-900">{projectToDelete.name}</span> ({projectToDelete.projectCode})?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Seluruh data estimasi, RAB, dan schedule proyek ini akan dihapus permanen.</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProject) {
                    onDeleteProject(projectToDelete.id);
                  }
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Proyek</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
