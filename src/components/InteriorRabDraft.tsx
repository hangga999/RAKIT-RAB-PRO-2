import React, { useState } from "react";
import { 
  InteriorProject, 
  InteriorRABRevision, 
  InteriorRABSection, 
  InteriorRABItem, 
  InteriorItemSpecificationRow, 
  InteriorSpecification,
  ProjectStatus 
} from "../types";
import { PROJECT_STATUS_OPTIONS } from "./InteriorProjectList";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Save, 
  Copy, 
  CheckCircle, 
  X, 
  ArrowRight, 
  Info 
} from "lucide-react";
import { ExportDropdown } from "./ExportDropdown";
import { exportInteriorToExcel, exportInteriorToPdf } from "../utils/interiorExport";
import { SpecCombobox } from "./SpecCombobox";

interface Props {
  project: InteriorProject;
  initialRevisionId?: string;
  specDatabase: InteriorSpecification[];
  onClose: () => void;
  onSave: (p: InteriorProject) => void;
}

export const InteriorRabDraft: React.FC<Props> = ({ project, initialRevisionId, specDatabase, onClose, onSave }) => {
  const currentRevisions = project.revisions || [];
  const defaultRevId = (initialRevisionId && currentRevisions.some(r => r.id === initialRevisionId))
    ? initialRevisionId
    : (currentRevisions[currentRevisions.length - 1]?.id || "rev-1");

  const [activeRevisionId, setActiveRevisionId] = useState<string>(defaultRevId);
  
  const activeRevision = currentRevisions.find(r => r.id === activeRevisionId) || 
    currentRevisions[currentRevisions.length - 1] || {
      id: "rev-1",
      name: "Initial Draft",
      date: new Date().toISOString().split("T")[0],
      version: 1,
      isDraft: true,
      sections: [],
      usePpn: false,
      grandTotal: 0
    };

  const [sections, setSections] = useState<InteriorRABSection[]>(() => 
    JSON.parse(JSON.stringify(activeRevision.sections || []))
  );
  const [usePpn, setUsePpn] = useState<boolean>(activeRevision.usePpn || false);
  const [contingencyPercent, setContingencyPercent] = useState<number>(activeRevision.contingencyPercent || 0);
  const [overheadProfitPercent, setOverheadProfitPercent] = useState<number>(activeRevision.overheadProfitPercent || 0);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(project.status || "On Tender");
  const [showInternal, setShowInternal] = useState(true);

  // Helper to switch active revision and load its dedicated state cleanly
  const loadRevision = (revId: string) => {
    const rev = currentRevisions.find(r => r.id === revId);
    if (rev) {
      setActiveRevisionId(rev.id);
      setSections(JSON.parse(JSON.stringify(rev.sections || [])));
      setUsePpn(rev.usePpn || false);
      setContingencyPercent(rev.contingencyPercent || 0);
      setOverheadProfitPercent(rev.overheadProfitPercent || 0);
    }
  };

  // Save As Modal state
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState("");
  const [saveAsNotes, setSaveAsNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Revision sequence calculations
  let maxRevisionNum = 0;
  currentRevisions.forEach((r) => {
    if (r.version && r.version > maxRevisionNum) maxRevisionNum = r.version;
    const match = r.name.match(/Rev(?:isi|\.)?\s*(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxRevisionNum) maxRevisionNum = n;
    }
  });
  if (maxRevisionNum === 0) maxRevisionNum = currentRevisions.length || 1;
  const nextRevSeq = `Rev.${String(maxRevisionNum + 1).padStart(2, "0")}`;
  const currentActiveRev = activeRevision.name.startsWith("Rev.")
    ? activeRevision.name
    : `Rev.${String(activeRevision.version || 1).padStart(2, "0")}`;

  const addSection = () => {
    setSections([...sections, {
      id: `sec-${Date.now()}`,
      sectionName: "NEW SECTION",
      profitMarginPercent: 30,
      items: []
    }]);
  };

  const addItem = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: [...s.items, {
            id: `itm-${Date.now()}`,
            description: "",
            unit: "set",
            qty: 1,
            profitMarginPercent: s.profitMarginPercent,
            specs: [{
              id: `spc-${Date.now()}`,
              specName: "",
              length_l: 0,
              width_w: 0,
              height_h: 0,
              factor: 1.0,
              model: "",
              baseCostUnitPrice: 0
            }]
          }]
        };
      }
      return s;
    }));
  };

  const addSpecRow = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: s.items.map(i => {
            if (i.id === itemId) {
              return {
                ...i,
                specs: [...i.specs, {
                  id: `spc-${Date.now()}`,
                  specName: "",
                  length_l: 0,
                  width_w: 0,
                  height_h: 0,
                  factor: 1.0,
                  model: "",
                  baseCostUnitPrice: 0
                }]
              };
            }
            return i;
          })
        };
      }
      return s;
    }));
  };

  const updateSection = (sectionId: string, field: keyof InteriorRABSection, value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        if (field === "profitMarginPercent") {
          const oldProfit = s.profitMarginPercent;
          return {
            ...s,
            profitMarginPercent: value,
            items: s.items.map(item => {
              if (item.profitMarginPercent === undefined || item.profitMarginPercent === oldProfit) {
                return { ...item, profitMarginPercent: value };
              }
              return item;
            })
          };
        }
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const updateItem = (sectionId: string, itemId: string, field: keyof InteriorRABItem, value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
        };
      }
      return s;
    }));
  };

  const updateSpec = (sectionId: string, itemId: string, specId: string, field: keyof InteriorItemSpecificationRow, value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: s.items.map(i => {
            if (i.id === itemId) {
              return {
                ...i,
                specs: i.specs.map(spc => spc.id === specId ? { ...spc, [field]: value } : spc)
              };
            }
            return i;
          })
        };
      }
      return s;
    }));
  };

  const handleSpecSelect = (sectionId: string, itemId: string, specId: string, specName: string) => {
    const dbMatch = specDatabase.find(x => x.name === specName);
    const baseCost = dbMatch ? dbMatch.baseCost : 0;
    
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: s.items.map(i => {
            if (i.id === itemId) {
              return {
                ...i,
                specs: i.specs.map(spc => spc.id === specId ? { ...spc, specName, baseCostUnitPrice: baseCost || spc.baseCostUnitPrice } : spc)
              };
            }
            return i;
          })
        };
      }
      return s;
    }));
  };

  const calcSpecBaseAmount = (spec: InteriorItemSpecificationRow, parentQty: number) => {
    const vol = (spec.length_l > 0 && spec.height_h > 0) 
      ? (spec.length_l * spec.height_h * spec.factor) 
      : (parentQty * spec.factor);
    return spec.baseCostUnitPrice * vol;
  };

  const calcItemBaseTotal = (item: InteriorRABItem) => {
    return item.specs.reduce((sum, spc) => sum + calcSpecBaseAmount(spc, item.qty), 0);
  };

  const getItemProfit = (item: InteriorRABItem, sec: InteriorRABSection) => {
    return item.profitMarginPercent !== undefined ? item.profitMarginPercent : sec.profitMarginPercent;
  };

  const calcItemSellingUnitPrice = (item: InteriorRABItem, marginPercent: number) => {
    const baseTotal = calcItemBaseTotal(item);
    return baseTotal * (1 + marginPercent / 100);
  };

  const calcItemSellingAmount = (item: InteriorRABItem, marginPercent: number) => {
    return calcItemSellingUnitPrice(item, marginPercent) * item.qty;
  };

  const calcSectionSubtotal = (sec: InteriorRABSection) => {
    return sec.items.reduce((sum, item) => sum + calcItemSellingAmount(item, getItemProfit(item, sec)), 0);
  };

  const calcSectionBaseTotal = (sec: InteriorRABSection) => {
    return sec.items.reduce((sum, item) => sum + calcItemBaseTotal(item), 0);
  };

  // Financial calculations
  const subtotalSelling = sections.reduce((sum, sec) => sum + calcSectionSubtotal(sec), 0);
  const totalBaseHpp = sections.reduce((sum, sec) => sum + calcSectionBaseTotal(sec), 0);
  const totalItemsCount = sections.reduce((sum, sec) => sum + sec.items.length, 0);

  // Overhead & Contingencies Markup
  const combinedMarkupPercent = contingencyPercent + overheadProfitPercent;
  const overheadContingenciesValue = subtotalSelling * (combinedMarkupPercent / 100);

  // Subtotal / Grand Total Estimate (excl. PPN)
  const grandTotalExclPpn = subtotalSelling + overheadContingenciesValue;

  // Profit / Margin calculation
  const profitMargin = totalBaseHpp > 0 
    ? Math.max(0, grandTotalExclPpn - totalBaseHpp) 
    : Math.max(0, grandTotalExclPpn - overheadContingenciesValue);

  // PPN 11%
  const taxAmount = usePpn ? grandTotalExclPpn * 0.11 : 0;
  const grandTotalInclPpn = grandTotalExclPpn + taxAmount;

  // Save changes directly into current revision
  const handleSaveOnly = () => {
    const updatedRev: InteriorRABRevision = {
      ...activeRevision,
      sections: JSON.parse(JSON.stringify(sections)),
      usePpn,
      contingencyPercent,
      overheadProfitPercent,
      grandTotal: grandTotalInclPpn,
      date: new Date().toISOString().split("T")[0]
    };
    const updatedRevisions = (project.revisions || []).map(r => r.id === updatedRev.id ? updatedRev : r);
    const latestRev = updatedRevisions[updatedRevisions.length - 1];
    const updatedProject: InteriorProject = {
      ...project,
      status: projectStatus,
      grandTotal: latestRev ? latestRev.grandTotal : grandTotalInclPpn,
      revisions: updatedRevisions
    };
    onSave(updatedProject);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Save As new revision
  const handleConfirmSaveAs = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = saveAsTitle.trim() || `Revisi ${nextRevSeq}`;
    const newRev: InteriorRABRevision = {
      id: `rev-${Date.now()}`,
      name: finalTitle,
      date: new Date().toISOString().split("T")[0],
      version: maxRevisionNum + 1,
      isDraft: true,
      sections: JSON.parse(JSON.stringify(sections)),
      usePpn,
      contingencyPercent,
      overheadProfitPercent,
      grandTotal: grandTotalInclPpn
    };
    const updatedProject: InteriorProject = {
      ...project,
      status: projectStatus,
      grandTotal: grandTotalInclPpn,
      revisions: [...(project.revisions || []), newRev]
    };
    setActiveRevisionId(newRev.id);
    onSave(updatedProject);
    setIsSaveAsModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Save and close
  const handleBack = () => {
    const updatedRev: InteriorRABRevision = {
      ...activeRevision,
      sections: JSON.parse(JSON.stringify(sections)),
      usePpn,
      contingencyPercent,
      overheadProfitPercent,
      grandTotal: grandTotalInclPpn,
      date: new Date().toISOString().split("T")[0]
    };
    const updatedRevisions = (project.revisions || []).map(r => r.id === updatedRev.id ? updatedRev : r);
    const latestRev = updatedRevisions[updatedRevisions.length - 1];
    const updatedProject: InteriorProject = {
      ...project,
      status: projectStatus,
      grandTotal: latestRev ? latestRev.grandTotal : grandTotalInclPpn,
      revisions: updatedRevisions
    };
    onSave(updatedProject);
    onClose();
  };

  const handleExportExcel = () => {
    exportInteriorToExcel(
      project, 
      { 
        ...activeRevision, 
        sections, 
        usePpn, 
        contingencyPercent,
        overheadProfitPercent,
        grandTotal: grandTotalInclPpn 
      }, 
      showInternal
    );
  };

  const handleExportPdf = () => {
    exportInteriorToPdf(
      project, 
      { 
        ...activeRevision, 
        sections, 
        usePpn, 
        contingencyPercent,
        overheadProfitPercent,
        grandTotal: grandTotalInclPpn 
      }, 
      false
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-100 relative">
      {/* SUCCESS TOAST NOTIFICATION */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-100" />
          <span>Draft Interior RAB Berhasil Disimpan!</span>
        </div>
      )}

      {/* TOP BAR HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Interior RAB Draft
              </h2>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-200">
                {currentActiveRev}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{project.projectCode} - {project.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* DEDICATED "SAVE" (OVERWRITE CURRENT REVISION) */}
          <button 
            type="button"
            onClick={handleSaveOnly}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Simpan langsung perubahan ke draft revisi aktif ini"
          >
            <Save className="w-3.5 h-3.5 text-slate-300" />
            <span>Save</span>
          </button>

          {/* DEDICATED "SAVE AS" (NEW REVISION SNAPSHOT) */}
          <button 
            type="button"
            onClick={() => {
              setSaveAsTitle(`Revisi ${nextRevSeq} - Penyesuaian Interior`);
              setSaveAsNotes("");
              setIsSaveAsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Simpan sebagai revisi baru dengan nomor urut berikutnya"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-200" />
            <span>Save As...</span>
          </button>

          {/* UNIVERSAL EXPORT DROPDOWN */}
          <ExportDropdown
            label="Export RAB"
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            menuTitle="Export Data RAB"
          />

          <div className="w-px h-6 bg-slate-200" />

          {/* GRAND TOTAL SUMMARY PILL */}
          <div className="text-right pl-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total Estimate</div>
            <div className="text-lg font-black text-emerald-600 font-mono leading-tight">
              Rp {grandTotalInclPpn.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6 space-y-4">
        {/* COMPACT PROJECT METADATA STRIP */}
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Client:</span>
              <span className="font-semibold text-slate-800">{project.ownerName || "-"}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Site Location:</span>
              <span className="font-medium text-slate-700">{project.location || "-"}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Build Area:</span>
              <span className="font-mono text-slate-700 font-semibold">
                {project.requirements?.buildingArea ? `${project.requirements.buildingArea} m²` : "180 m²"} ({project.requirements?.floorsCount || 1} Floors)
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tier / Style:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                {project.requirements?.finishingGrade || "Deluxe (Medium)"} • {project.requirements?.designStyle || "Modern Minimalist"}
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
              <select
                value={projectStatus}
                onChange={(e) => {
                  const newStatus = e.target.value as ProjectStatus;
                  setProjectStatus(newStatus);
                  onSave({ ...project, status: newStatus });
                }}
                className="px-2.5 py-1 rounded-md text-xs font-bold border transition cursor-pointer bg-slate-50 hover:bg-white text-slate-800 border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                title="Ubah status siklus proyek secara langsung"
              >
                {PROJECT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Revision Switcher if multiple revisions exist */}
            {currentRevisions.length > 1 && (
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 text-xs">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Rev:</span>
                <select
                  value={activeRevisionId}
                  onChange={(e) => loadRevision(e.target.value)}
                  className="bg-transparent text-indigo-900 font-bold font-mono text-xs focus:outline-none cursor-pointer"
                >
                  {currentRevisions.map((r, idx) => (
                    <option key={r.id} value={r.id}>
                      {r.name || `Rev.${String(r.version || idx + 1).padStart(2, '0')}`} {r.isDraft ? '(Draft)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={() => setShowInternal(!showInternal)}
              className="text-[11px] bg-slate-50 border border-slate-300 px-2.5 py-1 rounded text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              {showInternal ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{showInternal ? "Hide Internal (HPP)" : "Unhide Internal (HPP)"}</span>
            </button>
          </div>
        </div>

        <div className="border border-slate-300 bg-white shadow-xs rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-max">
          <div className="flex items-center bg-slate-800 text-white text-xs font-bold divide-x divide-slate-600 border-b border-slate-700 sticky top-0 z-20">
            <div className="w-12 py-3 px-2 text-center">No</div>
            <div className="w-64 py-3 px-2">Item Description</div>
            <div className="w-64 py-3 px-2">Specification</div>
            <div className="w-16 py-3 px-2 text-center">Unit</div>
            <div className="w-20 py-3 px-2 text-center">Qty</div>
            <div className="w-32 py-3 px-2 text-right">Unit Price (Sell)</div>
            <div className="w-32 py-3 px-2 text-right">Amount (Sell)</div>
            {showInternal && (
              <>
                <div className="w-24 py-3 px-2 text-center bg-slate-700">Length (L)</div>
                <div className="w-24 py-3 px-2 text-center bg-slate-700">Width (W)</div>
                <div className="w-24 py-3 px-2 text-center bg-slate-700">Height (H)</div>
                <div className="w-20 py-3 px-2 text-center bg-slate-700">Factor</div>
                <div className="w-32 py-3 px-2 text-center bg-slate-700">Model</div>
                <div className="w-32 py-3 px-2 text-right bg-slate-700">Base Cost / Unit</div>
                <div className="w-32 py-3 px-2 text-right bg-slate-700">Base Amount</div>
                <div className="w-32 py-3 px-2 text-right bg-slate-900">Total Base (HPP)</div>
                <div className="w-24 py-3 px-2 text-center bg-slate-900">% Profit</div>
              </>
            )}
          </div>

          <div className="divide-y divide-slate-200">
            {sections.map((sec, secIdx) => (
              <React.Fragment key={sec.id}>
                <div className="flex items-center bg-slate-200 divide-x divide-slate-300 font-bold text-sm group relative">
                  <div className="w-12 py-2 px-2 text-center text-slate-500">▪</div>
                  <div className="w-64 py-1 px-2 h-full">
                    <input type="text" value={sec.sectionName} onChange={e => updateSection(sec.id, "sectionName", e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-900 placeholder-slate-400" placeholder="SECTION HEADER" />
                  </div>
                  <div className="w-64 py-2 px-2" />
                  <div className="w-16 py-2 px-2" />
                  <div className="w-20 py-2 px-2" />
                  <div className="w-32 py-2 px-2" />
                  <div className="w-32 py-2 px-2 text-right text-emerald-800 font-black text-sm">
                    Rp {calcSectionSubtotal(sec).toLocaleString("id-ID", {maximumFractionDigits:0})}
                  </div>
                  {showInternal && (
                    <>
                      <div className="w-24 py-2 px-1" />
                      <div className="w-24 py-2 px-1" />
                      <div className="w-24 py-2 px-1" />
                      <div className="w-20 py-2 px-1" />
                      <div className="w-32 py-2 px-1" />
                      <div className="w-32 py-2 px-1" />
                      <div className="w-32 py-2 px-1" />
                      <div className="w-32 py-2 px-2 text-right font-bold text-amber-800 bg-amber-100/50 text-xs flex items-center justify-end">
                        Rp {calcSectionBaseTotal(sec).toLocaleString("id-ID", {maximumFractionDigits:0})}
                      </div>
                      <div className="w-24 py-1 px-1 flex items-center justify-center bg-slate-300">
                        <div className="flex items-center gap-0.5" title="Section Profit % (Default untuk semua item baru)">
                          <input 
                            type="number" 
                            value={sec.profitMarginPercent} 
                            onChange={e => updateSection(sec.id, "profitMarginPercent", Number(e.target.value))} 
                            className="w-14 text-center py-0.5 px-0.5 bg-white border border-slate-400 rounded text-xs font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" 
                            title="Sec Profit %" 
                          />
                          <span className="text-[11px] font-bold text-slate-700">%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {sec.items.map((item, itemIdx) => {
                  const baseTotal = calcItemBaseTotal(item);
                  const itemProfit = getItemProfit(item, sec);
                  const sellUnit = calcItemSellingUnitPrice(item, itemProfit);
                  const sellAmount = calcItemSellingAmount(item, itemProfit);

                  return (
                    <React.Fragment key={item.id}>
                      <div className="flex bg-white divide-x divide-slate-200 text-sm hover:bg-slate-50">
                        <div className="w-12 py-2 px-2 text-center text-slate-500 font-semibold">{itemIdx + 1}</div>
                        <div className="w-64 py-2 px-2 font-semibold text-slate-800">
                           <input type="text" value={item.description} onChange={e => updateItem(sec.id, item.id, "description", e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none p-0 placeholder-slate-300" placeholder="Work Item Description" />
                        </div>
                        <div className="w-64 py-1 px-2 h-full">
                           <SpecCombobox 
                                value={item.specs[0]?.specName || ""} 
                                onChange={(val) => updateSpec(sec.id, item.id, item.specs[0]?.id || "", "specName", val)}
                                onSelect={(name, cost) => handleSpecSelect(sec.id, item.id, item.specs[0]?.id || "", name)}
                                specDatabase={specDatabase}
                             />
                        </div>
                        <div className="w-16 py-2 px-2">
                          <input type="text" value={item.unit} onChange={e => updateItem(sec.id, item.id, "unit", e.target.value)} className="w-full text-center bg-transparent border-none focus:ring-0 p-0" />
                        </div>
                        <div className="w-20 py-2 px-2">
                          <input type="number" value={item.qty || ""} onChange={e => updateItem(sec.id, item.id, "qty", Number(e.target.value))} className="w-full text-center bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-800" />
                        </div>
                        <div className="w-32 py-2 px-2 text-right text-slate-700">
                          {sellUnit.toLocaleString("id-ID", {maximumFractionDigits:0})}
                        </div>
                        <div className="w-32 py-2 px-2 text-right font-bold text-slate-900">
                          {sellAmount.toLocaleString("id-ID", {maximumFractionDigits:0})}
                        </div>
                        
                        {showInternal && item.specs[0] && (
                          <>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].length_l || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "length_l", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="L" />
                            </div>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].width_w || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "width_w", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="W" />
                            </div>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].height_h || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "height_h", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="H" />
                            </div>
                            <div className="w-20 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].factor || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "factor", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Fac" />
                            </div>
                            <div className="w-32 py-1 px-1">
                               <input type="text" value={item.specs[0].model} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "model", e.target.value)} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Model" />
                            </div>
                            <div className="w-32 py-1 px-2 flex items-center justify-end">
                               <input type="number" value={item.specs[0].baseCostUnitPrice || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "baseCostUnitPrice", Number(e.target.value))} className="w-24 text-right text-xs border border-slate-200 rounded p-1 font-semibold text-slate-800" />
                            </div>
                            <div className="w-32 py-1 px-2 text-right flex items-center justify-end text-xs text-slate-500">
                               {calcSpecBaseAmount(item.specs[0], item.qty).toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            
                            <div className="w-32 py-2 px-2 text-right font-bold text-amber-600 bg-amber-50 text-sm">
                              {baseTotal.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            <div className="w-24 py-1 px-1 flex items-center justify-center bg-emerald-50 text-sm">
                              <div className="flex items-center gap-0.5" title="Penyesuaian profit item ini">
                                <input
                                  type="number"
                                  value={itemProfit}
                                  onChange={e => updateItem(sec.id, item.id, "profitMarginPercent", Number(e.target.value))}
                                  className="w-14 text-center py-1 px-0.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                  title="Edit % profit item"
                                />
                                <span className="text-[11px] font-bold text-emerald-700">%</span>
                              </div>
                            </div>
                          </>
                        )}
                        {showInternal && !item.specs[0] && (
                          <>
                            <div className="w-24 bg-slate-50" />
                            <div className="w-24 bg-slate-50" />
                            <div className="w-24 bg-slate-50" />
                            <div className="w-20 bg-slate-50" />
                            <div className="w-32 bg-slate-50" />
                            <div className="w-32 bg-slate-50" />
                            <div className="w-32 bg-slate-50" />
                            <div className="w-32 py-2 px-2 text-right font-bold text-amber-600 bg-amber-50">
                              {baseTotal.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            <div className="w-24 py-1 px-1 flex items-center justify-center bg-emerald-50">
                              <div className="flex items-center gap-0.5" title="Penyesuaian profit item ini">
                                <input
                                  type="number"
                                  value={itemProfit}
                                  onChange={e => updateItem(sec.id, item.id, "profitMarginPercent", Number(e.target.value))}
                                  className="w-14 text-center py-1 px-0.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                  title="Edit % profit item"
                                />
                                <span className="text-[11px] font-bold text-emerald-700">%</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {item.specs.slice(1).map((spc) => {
                        const spcBaseAmt = calcSpecBaseAmount(spc, item.qty);
                        return (
                          <div key={spc.id} className="flex bg-white divide-x divide-slate-200 text-xs text-slate-600 border-b border-dashed border-slate-200 items-center">
                             <div className="w-12 bg-slate-50 h-full min-h-[36px]" />
                             <div className="w-64 bg-slate-50 h-full min-h-[36px] flex justify-end items-center px-2">
                                <button 
                                  onClick={() => {
                                    const newSpecs = item.specs.filter(s => s.id !== spc.id);
                                    updateItem(sec.id, item.id, "specs", newSpecs);
                                  }} 
                                  className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Remove Sub-Row"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                             <div className="w-64 py-1 px-2">
                                <SpecCombobox 
                                   value={spc.specName} 
                                   onChange={(val) => updateSpec(sec.id, item.id, spc.id, "specName", val)}
                                   onSelect={(name, cost) => handleSpecSelect(sec.id, item.id, spc.id, name)}
                                   specDatabase={specDatabase}
                                />
                             </div>
                             <div className="w-16 bg-slate-50" />
                             <div className="w-20 bg-slate-50" />
                             <div className="w-32 bg-slate-50" />
                             <div className="w-32 bg-slate-50" />
                             
                             {showInternal && (
                               <>
                                 <div className="w-24 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.length_l || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "length_l", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="L" />
                                 </div>
                                 <div className="w-24 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.width_w || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "width_w", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="W" />
                                 </div>
                                 <div className="w-24 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.height_h || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "height_h", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="H" />
                                 </div>
                                 <div className="w-20 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.factor || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "factor", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Fac" />
                                 </div>
                                 <div className="w-32 py-1 px-1">
                                    <input type="text" value={spc.model} onChange={e => updateSpec(sec.id, item.id, spc.id, "model", e.target.value)} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Model" />
                                 </div>
                                 <div className="w-32 py-1 px-2 flex items-center justify-end">
                                    <input type="number" value={spc.baseCostUnitPrice || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "baseCostUnitPrice", Number(e.target.value))} className="w-24 text-right text-xs border border-slate-200 rounded p-1 font-semibold text-slate-800" />
                                 </div>
                                 <div className="w-32 py-1 px-2 text-right flex items-center justify-end text-slate-500">
                                    {spcBaseAmt.toLocaleString("id-ID", {maximumFractionDigits:0})}
                                 </div>
                                 <div className="w-32 bg-slate-50" />
                                 <div className="w-24 bg-slate-50" />
                               </>
                             )}
                          </div>
                        )
                      })}
                      <div className="bg-white border-b-2 border-slate-300 pt-1 pb-3 pl-14 flex items-center gap-4">
                        <button onClick={() => addSpecRow(sec.id, item.id)} className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-emerald-600 px-3 py-1 rounded transition cursor-pointer flex items-center gap-1">
                          <Plus className="w-3 h-3" /> ADD SPEC ROW
                        </button>
                        
                        <div className="w-px h-4 bg-slate-200" />
                        
                        <button 
                          onClick={() => {
                             const newItems = sec.items.filter(i => i.id !== item.id);
                             updateSection(sec.id, "items", newItems);
                          }} 
                          className="text-[10px] font-bold text-red-400 hover:text-red-600 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> DELETE WORK ITEM
                        </button>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div className="bg-white border-b-2 border-slate-300 pt-2 pb-4 pl-14">
                  <button onClick={() => addItem(sec.id)} className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 px-4 py-2 rounded transition cursor-pointer flex items-center gap-1 border border-slate-200 shadow-xs">
                    <Plus className="w-3 h-3" /> ADD NEW WORK ITEM
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
            </div>
          </div>

          {/* TABLE CONTROLS BAR: REVISION INFO, CONTINGENCIES, OVERHEAD, & TAX */}
          <div className="flex flex-wrap justify-between items-center bg-slate-50 border-t border-slate-200 px-4 py-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Active Revision:
              </span>
              <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-mono text-xs font-bold border border-slate-300">
                {currentActiveRev}
              </span>
              <span className="text-xs text-slate-400 font-medium">({activeRevision.name})</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <label>Contingencies (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(Number(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded focus:border-indigo-500 focus:outline-none bg-white text-center font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <label>Overhead (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overheadProfitPercent}
                  onChange={(e) => setOverheadProfitPercent(Number(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded focus:border-indigo-500 focus:outline-none bg-white text-center font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <label>Pajak:</label>
                <select
                  value={usePpn ? "PPN" : "NON-PPN"}
                  onChange={(e) => setUsePpn(e.target.value === "PPN")}
                  className="px-2 py-1 border border-slate-300 rounded focus:border-indigo-500 focus:outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="PPN">PPN 11%</option>
                  <option value="NON-PPN">Non-PPN</option>
                </select>
              </div>
            </div>
          </div>

          {/* HIGH DENSITY TABLE FOOTER (SLATE-900) */}
          <div className="bg-slate-900 text-white p-4 flex flex-wrap justify-between items-center gap-4 rounded-b-lg">
            <div className="flex gap-8">
              <div>
                <div className="text-[10px] uppercase text-slate-400 tracking-wider">
                  Total Items
                </div>
                <div className="text-base font-bold font-mono">
                  {totalItemsCount} Items
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 tracking-wider">
                  Contingency + Overhead
                </div>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {combinedMarkupPercent}%
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400 italic tracking-wider">
                Grand Total Estimate ({usePpn ? 'incl. PPN' : 'excl. PPN'})
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                IDR {grandTotalInclPpn.toLocaleString("id-ID", {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ADD NEW SECTION BUTTON */}
        <button onClick={addSection} className="flex items-center gap-2 px-6 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-bold hover:bg-white hover:text-emerald-600 hover:border-emerald-300 transition cursor-pointer text-xs">
          <Plus className="w-4 h-4" /> ADD NEW SECTION (E.g. MEP, ARCHITECT, CUSTOM CABINET)
        </button>

        {/* COST SUMMARY STATISTICS BREAKDOWN */}
        <div className="mt-6 max-w-xl">
          <div className="bg-slate-800 text-white border border-slate-700 rounded-lg p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">
              Cost Summary Statistics Breakdown
            </h4>
            <div className="space-y-2 relative z-10 text-xs">
              {/* Dynamic Section Breakdown from RAB Table */}
              {sections.length > 0 ? (
                sections.map((sec, idx) => {
                  const secTotal = calcSectionSubtotal(sec);
                  return (
                    <div key={sec.id} className="flex justify-between items-center py-0.5">
                      <span className="text-slate-300 truncate max-w-[65%]" title={sec.sectionName}>
                        {sec.sectionName.trim() || `Section ${idx + 1}`}
                      </span>
                      <span className="font-mono text-slate-200">
                        IDR {secTotal.toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-400 italic py-1 text-center">
                  Belum ada seksi pekerjaan
                </div>
              )}

              {/* Subtotal (excl. PPN), Overhead & Contingency, Profit / Margin */}
              <div className="border-t border-slate-700 pt-2 mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">Subtotal (excl. PPN):</span>
                  <span className="font-mono text-slate-100 font-bold">
                    IDR {grandTotalExclPpn.toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Overhead &amp; Contingency ({combinedMarkupPercent}%):
                  </span>
                  <span className="font-mono text-amber-400">
                    IDR {overheadContingenciesValue.toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold">
                    Profit / Margin:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    IDR {profitMargin.toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              {/* PPN (11%) */}
              <div className="border-t border-slate-700 pt-2 mt-2 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className={usePpn ? "text-blue-300" : "text-slate-400"}>
                    PPN ({usePpn ? "11%" : "Non-PPN"}):
                  </span>
                  <span className={`font-mono ${usePpn ? "text-blue-300" : "text-slate-400"}`}>
                    IDR {taxAmount.toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE AS (NEW REVISION) POPUP MODAL */}
      {isSaveAsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-600 rounded-md text-white">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Save As - Buat Revisi Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Membuat salinan snapshot draft revisi baru ke dalam database SQLite
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveAsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveAs} className="p-6 space-y-4">
              {/* Revision Sequence Pill Banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Auto-Assigned Sequence
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-600">Draft Aktif:</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-mono text-xs font-semibold">
                      {currentActiveRev}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-bold shadow-xs">
                      {nextRevSeq} (New Draft)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Total Work Items</span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {totalItemsCount} Items
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama / Label Revisi (Revision File Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={saveAsTitle}
                  onChange={(e) => setSaveAsTitle(e.target.value)}
                  placeholder={`e.g. Revisi ${nextRevSeq} - Negosiasi Harga Material`}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan / Keterangan Revisi (Revision Notes)
                </label>
                <textarea
                  rows={3}
                  value={saveAsNotes}
                  onChange={(e) => setSaveAsNotes(e.target.value)}
                  placeholder="e.g. Update estimasi volume partisi dan penyesuaian markup overhead profit 10%."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Revisi baru akan secara otomatis diurutkan secara sekuensial (<strong>{nextRevSeq}</strong>), mempertahankan seluruh item pekerjaan, dan ditetapkan sebagai draft revisi aktif proyek.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaveAsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Sebagai {nextRevSeq}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <datalist id="spec-db">
        {specDatabase.map((spec, idx) => (
          <option key={idx} value={spec.name}>{spec.name}</option>
        ))}
      </datalist>
    </div>
  );
};
