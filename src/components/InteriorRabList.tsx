import React, { useState } from "react";
import { InteriorProject, InteriorRABRevision } from "../types";
import { 
  Building2, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  History, 
  Copy, 
  FolderOpen, 
  Sparkles, 
  GitBranch, 
  Plus, 
  FileEdit, 
  Trash2, 
  AlertCircle, 
  X,
  FileSpreadsheet
} from "lucide-react";

interface Props {
  projects: InteriorProject[];
  onOpenDraft: (project: InteriorProject, revision?: InteriorRABRevision) => void;
  onCreateProject: () => void;
}

export const InteriorRabList: React.FC<Props> = ({ projects, onOpenDraft, onCreateProject }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    new Set([projects[0]?.id || ""])
  );
  
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

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  const getProjectRevisions = (project: InteriorProject): InteriorRABRevision[] => {
    return project.revisions || [];
  };

  const getLatestRevision = (project: InteriorProject): InteriorRABRevision | null => {
    const revs = getProjectRevisions(project);
    if (revs.length === 0) return null;
    return revs[revs.length - 1]; // Assume last is latest for simplicity
  };

  return (
    <div className="flex-1 h-full min-h-0 w-full overflow-y-auto bg-slate-100 font-sans p-4 sm:p-6 space-y-5 pb-24">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Interior RAB List &amp; Revision History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                  {projects.length} Proyek
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Isolated environment for Interior Master and specific pricing logic.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode proyek, nama proyek, atau nama klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Buka Semua Revisi</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Tutup Semua</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 w-32">Project Code</th>
                <th className="py-3 px-4 min-w-[320px]">Project Name &amp; RAB Revision</th>
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
                      <tr
                        onClick={() => toggleExpandProject(project.id)}
                        className={`transition-colors cursor-pointer border-b ${
                          isExpanded
                            ? "bg-slate-50/90 border-slate-300 font-medium"
                            : "hover:bg-emerald-50/40 border-slate-100"
                        }`}
                      >
                        <td className="py-3.5 px-3 align-top break-words whitespace-normal text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleExpandProject(project.id, e)}
                            className="p-1 rounded hover:bg-slate-200/80 text-slate-500 transition cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 align-top break-words whitespace-normal font-mono font-bold text-emerald-700">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-xs">
                            {project.projectCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {project.name}
                            </span>
                            {latestRev && (
                              <>
                                <span className="text-slate-400">—</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>RAB {latestRev.version} (Latest)</span>
                                </span>
                              </>
                            )}
                          </div>
                          {latestRev && (
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                              <span>{latestRev.name}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-400">
                                Updated: {latestRev.date}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top break-words whitespace-normal">
                          <div className="font-medium text-slate-800">
                            {project.ownerName}
                          </div>
                          <div className="text-[11px] text-slate-500 break-words mt-0.5">
                            {project.location}
                          </div>
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {project.status || "On Tender"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-top break-words whitespace-normal text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleExpandProject(project.id, e)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition"
                          >
                            <History className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{revisions.length} Revisi</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 align-top break-words whitespace-normal text-right font-mono">
                          <div className="font-bold text-slate-900 text-xs">
                            Rp {(latestRev ? latestRev.grandTotal : 0).toLocaleString("id-ID")}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top break-words whitespace-normal text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if(latestRev) onOpenDraft(project, latestRev);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Buka (Latest)</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={7} className="p-0">
                            <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-b from-slate-100/70 to-slate-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <GitBranch className="w-4 h-4 text-emerald-600" />
                                  <span>Riwayat Pohon Revisi RAB (Interior)</span>
                                  <span className="text-slate-400 font-normal">— {project.name}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {revisions.map((rev, rIdx) => {
                                  const isLast = rIdx === revisions.length - 1;
                                  return (
                                    <div
                                      key={rev.id || rIdx}
                                      className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                        isLast
                                          ? "bg-white border-emerald-300 shadow-2xs ring-1 ring-emerald-400/30"
                                          : "bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center">
                                          <span
                                            className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                                              isLast
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-200 text-slate-700"
                                            }`}
                                          >
                                            Rev.0{rev.version}
                                          </span>
                                          {isLast && (
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight mt-0.5">
                                              Latest
                                            </span>
                                          )}
                                        </div>

                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-slate-900">
                                              {rev.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                                            <span>Tanggal: {rev.date}</span>
                                          </div>
                                        </div>
                                      </div>

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
                                          <button
                                            type="button"
                                            onClick={() => onOpenDraft(project, rev)}
                                            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                                              isLast
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                : "bg-slate-700 hover:bg-slate-800 text-white"
                                            }`}
                                          >
                                            <FileEdit className="w-3.5 h-3.5" />
                                            <span>Edit Draft</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
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
    </div>
  );
};
