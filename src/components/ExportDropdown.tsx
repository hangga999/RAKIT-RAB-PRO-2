import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";

interface ExportDropdownProps {
  onExportExcel: () => Promise<void> | void;
  onExportPdf: () => Promise<void> | void;
  label?: string;
  variant?: "default" | "primary" | "outline";
  className?: string;
  menuTitle?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportExcel,
  onExportPdf,
  label = "Export",
  variant = "outline",
  className = "",
  menuTitle = "Universal Document Engine",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExcel = async () => {
    try {
      setIsExporting("excel");
      await onExportExcel();
      setSuccessToast("Excel file (.xlsx) successfully generated with active formulas!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const handlePdf = async () => {
    try {
      setIsExporting("pdf");
      await onExportPdf();
      setSuccessToast("Client-ready PDF generated with RAKITCO corporate letterhead!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  // Button styling variants
  let btnClasses =
    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ";
  if (variant === "primary") {
    btnClasses += "bg-indigo-600 hover:bg-indigo-700 text-white";
  } else if (variant === "default") {
    btnClasses += "bg-slate-800 hover:bg-slate-900 text-white";
  } else {
    btnClasses +=
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400";
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting !== null}
        className={`${btnClasses} ${isExporting ? "opacity-75 cursor-not-allowed" : ""}`}
        title="Export options: Dynamic Excel (.xlsx) or Client-ready PDF (.pdf)"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          <Download className="w-3.5 h-3.5 text-current" />
        )}
        <span>{isExporting ? "Exporting..." : label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-current transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 origin-top-right">
          {/* Header */}
          <div className="bg-slate-900 px-3.5 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold tracking-wide uppercase">
                {menuTitle}
              </span>
            </div>
            <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
              RAKITCO Engine
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {/* OPTION 1: EXCEL (.xlsx) */}
            <button
              type="button"
              onClick={handleExcel}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-emerald-50/70 group text-left transition cursor-pointer border border-transparent hover:border-emerald-200"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                    Export to Excel (.xlsx)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active Formulas
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                  Format spreadsheet dengan formula dinamis aktif (=SUM, =Vol*Harga, =PPN 11%) dan styling tabel korporat.
                </p>
              </div>
            </button>

            {/* OPTION 2: PDF (.pdf) */}
            <button
              type="button"
              onClick={handlePdf}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-rose-50/70 group text-left transition cursor-pointer border border-transparent hover:border-rose-200"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-rose-900">
                    Export to PDF (.pdf)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    Kop RAKITCO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                  Dokumen cetak resmi berstandar eksekutif dengan Kop Surat RAKITCO, logo perusahaan, nomor halaman & tabel zebra.
                </p>
              </div>
            </button>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Standar Dokumen Konstruksi</span>
            <span className="font-mono text-[9px] text-slate-500">v2.4 Automate</span>
          </div>
        </div>
      )}

      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Export Selesai</div>
            <div className="text-[11px] text-slate-300">{successToast}</div>
          </div>
        </div>
      )}
    </div>
  );
};
