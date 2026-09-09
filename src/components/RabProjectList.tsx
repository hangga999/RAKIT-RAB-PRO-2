import React, { useState } from "react";
import {
  FileSpreadsheet,
  Search,
  PlusCircle,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  History,
  Copy,
  FolderOpen,
  ArrowRight,
  Layers,
  Sparkles,
  GitBranch,
  Plus,
  CheckCircle2,
  Clock,
  Briefcase,
  FileCode,
  FileEdit,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";
import { Project, RabRevision, DesignStyle, FinishingGrade } from "../types";
import { ExportDropdown } from "./ExportDropdown";
import { exportRabListToExcel } from "../utils/excelExport";
import { exportRabListToPdf } from "../utils/pdfExport";

interface RabProjectListProps {
  projects: Project[];
  onOpenRabDraft: (project: Project, revision?: RabRevision) => void;
  onCreateNewProject: (projectData: Partial<Project>) => void;
  onDuplicateRevision?: (projectId: string, revisionId: string) => void;
  onCreateRevision?: (projectId: string) => void;
  onDeleteRevision?: (projectId: string, revisionId: string) => void;
}

export const RabProjectList: React.FC<RabProjectListProps> = ({
  projects,
  onOpenRabDraft,
  onCreateNewProject,
  onDuplicateRevision,
  onCreateRevision,
  onDeleteRevision,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  // Track expanded accordion project rows
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    new Set([projects[0]?.id || ""])
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Delete Draft Confirmation Modal State
  const [revisionToDelete, setRevisionToDelete] = useState<{
    project: Project;
    revision: RabRevision;
  } | null>(null);

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

  const toggleExpandProject = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedProjectIds(new Set(projects.map((p) => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedProjectIds(new Set());
  };

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
      location: newLocation.trim() || "Indonesia",
      description: newDescription.trim(),
      status: "On Tender",
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

  // Helper to retrieve or synthesize revisions
  const getProjectRevisions = (project: Project): RabRevision[] => {
    if (project.revisions && project.revisions.length > 0) {
      return project.revisions;
    }
    // Fallback if revisions not yet defined
    return [
      {
        id: `rev-${project.id}-default`,
        projectId: project.id,
        revisionNumber: "Rev.01",
        title: "Initial Draft BoQ (Latest)",
        createdAt: project.createdAt || "2025-01-01",
        isLatest: true,
        itemCount: project.items?.length || 0,
        subtotal: project.subtotal || 0,
        grandTotal: project.grandTotal || 0,
        notes: "Draft awal BoQ proyek",
      },
    ];
  };

  const getLatestRevision = (project: Project): RabRevision => {
    const revs = getProjectRevisions(project);
    const foundLatest = revs.find((r) => r.isLatest);
    return foundLatest || revs[revs.length - 1];
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  const totalPortfolioBoQ = projects.reduce(
    (acc, p) => acc + (p.grandTotal || 0),
    0
  );

  const totalRevisionsCount = projects.reduce(
    (acc, p) => acc + (p.revisions?.length || 1),
    0
  );

  return (
    <div className="flex-1 h-full min-h-0 w-full overflow-y-auto bg-slate-100 font-sans p-4 sm:p-6 space-y-5 pb-24">
      {/* 1. TOP HEADER & KPI SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  RAB List &amp; Revision History (Accordion Tree)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                  {projects.length} Proyek
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalRevisionsCount} Revisi Total
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Grup revisi RAB tersusun dalam hirarki accordion. Baris tertutup menampilkan revisi terbaru (Latest), sedangkan baris terbuka menampilkan seluruh riwayat revisi (Rev.01, Rev.02, dst.).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ExportDropdown
              label="Export RAB List"
              onExportExcel={() => exportRabListToExcel(filteredProjects.length > 0 ? filteredProjects : projects)}
              onExportPdf={() => exportRabListToPdf(filteredProjects.length > 0 ? filteredProjects : projects)}
              menuTitle="Export Data RAB List"
            />
          </div>
        </div>

        {/* High Density Portfolio KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Total Nilai Portfolio (BoQ)
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-blue-700 mt-0.5 block truncate">
              Rp {totalPortfolioBoQ.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Total Versi Revisi Tersimpan
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-indigo-700 mt-0.5 block">
              {totalRevisionsCount} Versi RAB
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Rata-rata Revisi / Proyek
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-800 mt-0.5 block">
              {(totalRevisionsCount / (projects.length || 1)).toFixed(1)} Versi
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Database Engine
            </span>
            <span className="text-sm font-bold font-mono text-emerald-700 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              SQLite (RAB_Revisions)
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & ACCORDION EXPAND/COLLAPSE CONTROLS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode proyek, nama proyek, atau nama klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
            title="Buka semua accordion riwayat revisi"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Buka Semua Revisi</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
            title="Tutup semua accordion riwayat revisi"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Tutup Semua</span>
          </button>
        </div>
      </div>

      {/* 3. RAB ACCORDION LIST TABLE (STATUS COLUMN COMPLETELY REMOVED) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              {/* NOTE: Status column completely removed as requested */}
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 w-32">Project Code</th>
                <th className="py-3 px-4 min-w-[320px]">
                  Project Name &amp; RAB Revision
                </th>
                <th className="py-3 px-4 w-44">Client / Owner</th>
                <th className="py-3 px-3 text-center w-32">History Tree</th>
                <th className="py-3 px-4 text-right w-44">Budget (Grand Total)</th>
                <th className="py-3 px-4 text-center w-40">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada proyek yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const isExpanded = expandedProjectIds.has(project.id);
                  const revisions = getProjectRevisions(project);
                  const latestRev = getLatestRevision(project);

                  return (
                    <React.Fragment key={project.id}>
                      {/* PARENT ROW: When collapsed, displays Project Name alongside ONLY the latest RAB revision */}
                      <tr
                        onClick={() => toggleExpandProject(project.id)}
                        className={`transition-colors cursor-pointer border-b ${
                          isExpanded
                            ? "bg-slate-50/90 border-slate-300 font-medium"
                            : "hover:bg-blue-50/40 border-slate-100"
                        }`}
                      >
                        {/* Accordion Expand/Collapse Toggle Button */}
                        <td className="py-3.5 px-3 align-top break-words whitespace-normal text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleExpandProject(project.id, e)}
                            className="p-1 rounded hover:bg-slate-200/80 text-slate-500 transition cursor-pointer"
                            title={isExpanded ? "Tutup riwayat revisi" : "Lihat seluruh riwayat revisi"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>

                        {/* Project Code */}
                        <td className="py-3.5 px-4 align-top break-words whitespace-normal font-mono font-bold text-indigo-700">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-xs">
                            {project.projectCode}
                          </span>
                        </td>

                        {/* Project Name alongside ONLY the latest / most recent RAB revision */}
                        <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {project.name}
                            </span>
                            <span className="text-slate-400">—</span>
                            {/* Display latest revision badge */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              <span>RAB {latestRev.revisionNumber} (Latest)</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span>{latestRev.title}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">
                              Updated: {latestRev.createdAt}
                            </span>
                          </div>
                        </td>

                        {/* Client / Owner */}
                        <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                          <div className="font-medium text-slate-800">
                            {project.ownerName}
                          </div>
                          <div className="text-[11px] text-slate-500 break-words mt-0.5">
                            {project.location}
                          </div>
                        </td>

                        {/* Revision History Tree Count Indicator */}
                        <td className="py-3.5 px-3 align-top break-words whitespace-normal text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleExpandProject(project.id, e)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition"
                            title="Klik untuk membuka riwayat revisi"
                          >
                            <History className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{revisions.length} Revisi</span>
                          </button>
                        </td>

                        {/* Budget (Latest Grand Total) */}
                        <td className="py-3.5 px-4 align-top break-words whitespace-normal text-right font-mono">
                          <div className="font-bold text-slate-900 text-xs">
                            Rp {(latestRev.grandTotal || project.grandTotal || 0).toLocaleString("id-ID")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {latestRev.itemCount || project.items?.length || 0} Work Items
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 align-top break-words whitespace-normal text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRabDraft(project, latestRev);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                              title="Buka RAB Draft editor versi terbaru"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Buka (Latest)</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ACCORDION: Reveals full list of historical RAB revisions in chronological order */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={7} className="p-0">
                            <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-b from-slate-100/70 to-slate-50">
                              {/* Sub-header inside accordion */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <GitBranch className="w-4 h-4 text-indigo-600" />
                                  <span>
                                    Riwayat Pohon Revisi RAB (RAB Revision History Tree)
                                  </span>
                                  <span className="text-slate-400 font-normal">
                                    — {project.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500">
                                    Menampilkan {revisions.length} versi dokumen
                                  </span>
                                  {onCreateRevision && (
                                    <button
                                      type="button"
                                      onClick={() => onCreateRevision(project.id)}
                                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>+ Buat Revisi Baru (Rev.0{revisions.length + 1})</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Accordion Historical Revisions List */}
                              <div className="space-y-2">
                                {revisions.map((rev, rIdx) => (
                                  <div
                                    key={rev.id || rIdx}
                                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                      rev.isLatest
                                        ? "bg-white border-blue-300 shadow-2xs ring-1 ring-blue-400/30"
                                        : "bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Revision number badge */}
                                      <div className="flex flex-col items-center justify-center">
                                        <span
                                          className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                                            rev.isLatest
                                              ? "bg-blue-600 text-white"
                                              : "bg-slate-200 text-slate-700"
                                          }`}
                                        >
                                          {rev.revisionNumber}
                                        </span>
                                        {rev.isLatest && (
                                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight mt-0.5">
                                            Latest
                                          </span>
                                        )}
                                      </div>

                                      {/* Revision metadata */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-xs text-slate-900">
                                            {rev.title || `Revisi Versi ${rev.revisionNumber}`}
                                          </span>
                                          {rev.isLatest && (
                                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                              Aktif
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                          {rev.notes || "Catatan revisi BoQ"}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                                          <span>Tanggal: {rev.createdAt}</span>
                                          <span>•</span>
                                          <span>{rev.itemCount || 0} Work Items</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right side: Amount and Action */}
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                      <div className="text-right">
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">
                                          Grand Total BoQ
                                        </div>
                                        <div className="text-sm font-mono font-bold text-slate-900">
                                          Rp {(rev.grandTotal || 0).toLocaleString("id-ID")}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {/* DEDICATED "Edit Draft" ACTION BUTTON */}
                                        <button
                                          type="button"
                                          onClick={() => onOpenRabDraft(project, rev)}
                                          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                                            rev.isLatest
                                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                                              : "bg-slate-700 hover:bg-slate-800 text-white"
                                          }`}
                                          title={`Buka dan edit draft revisi ${rev.revisionNumber} di RAB Draft Editor`}
                                        >
                                          <FileEdit className="w-3.5 h-3.5" />
                                          <span>Edit Draft</span>
                                        </button>

                                        {/* DEDICATED "Delete Draft" ACTION BUTTON */}
                                        {onDeleteRevision && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setRevisionToDelete({ project, revision: rev })
                                            }
                                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                            title={`Hapus draft revisi ${rev.revisionNumber} secara permanen dari database SQLite`}
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                            <span>Delete Draft</span>
                                          </button>
                                        )}

                                        {onDuplicateRevision && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onDuplicateRevision(project.id, rev.id)
                                            }
                                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded text-xs transition cursor-pointer"
                                            title="Duplikasi draft revisi ini menjadi revisi baru"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Buat Proyek RAB Baru</h3>
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
                    Revisi Awal
                  </label>
                  <input
                    type="text"
                    value="RAB Rev.01 (Tender Draft)"
                    disabled
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Nama Proyek
                </label>
                <input
                  type="text"
                  placeholder="e.g. Renovasi Penthouse SCBD"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Proyek &amp; Buka RAB Rev.01
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE REVISION CONFIRMATION MODAL */}
      {revisionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-rose-600 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-sm">Konfirmasi Hapus Draft Revisi</h3>
              </div>
              <button
                onClick={() => setRevisionToDelete(null)}
                className="text-rose-200 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus draft revisi{" "}
                <strong className="text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {revisionToDelete.revision.revisionNumber}
                </strong>{" "}
                ({revisionToDelete.revision.title}) secara permanen dari database SQLite?
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 font-mono text-slate-600">
                <div>Proyek: <strong className="text-slate-800">{revisionToDelete.project.name}</strong></div>
                <div>Total BoQ: <strong className="text-slate-900">Rp {(revisionToDelete.revision.grandTotal || 0).toLocaleString("id-ID")}</strong></div>
                <div>Jumlah Pekerjaan: <strong className="text-slate-800">{revisionToDelete.revision.itemCount || 0} Work Items</strong></div>
                <div>Tanggal: {revisionToDelete.revision.createdAt}</div>
              </div>

              <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>Perhatian: Tindakan ini akan menghapus record revisi secara permanen dari SQLite dan tidak dapat dibatalkan.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteRevision) {
                      onDeleteRevision(
                        revisionToDelete.project.id,
                        revisionToDelete.revision.id
                      );
                    }
                    setRevisionToDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Draft Revisi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
