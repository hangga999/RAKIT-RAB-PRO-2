import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  FileCode,
  Layers,
  FileText,
  ExternalLink,
  Laptop,
} from "lucide-react";
import {
  PYTHON_MAIN_PY,
  SQL_SCHEMA,
  PYTHON_REQUIREMENTS,
  PYTHON_DYNAMIC_ROWS_SNIPPET,
  PYTHON_AUTOCOMPLETE_PRICING_SNIPPET,
  PYTHON_CRUD_MODAL_SNIPPET,
  PYTHON_UI_ADVANCED_SNIPPET,
  PYTHON_SCURVE_AND_NAVIGATION_SNIPPET,
} from "../data/pythonCode";

interface SourceCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "scurve_nav"
    | "python"
    | "schema"
    | "requirements"
    | "build"
    | "dynamic_rows"
    | "rab_editor"
    | "master_crud"
    | "advanced_ui"
  >("scurve_nav");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getActiveCode = () => {
    switch (activeTab) {
      case "scurve_nav":
        return PYTHON_SCURVE_AND_NAVIGATION_SNIPPET;
      case "python":
        return PYTHON_MAIN_PY;
      case "schema":
        return SQL_SCHEMA;
      case "dynamic_rows":
        return PYTHON_DYNAMIC_ROWS_SNIPPET;
      case "rab_editor":
        return PYTHON_AUTOCOMPLETE_PRICING_SNIPPET;
      case "master_crud":
        return PYTHON_CRUD_MODAL_SNIPPET;
      case "advanced_ui":
        return PYTHON_UI_ADVANCED_SNIPPET;
      case "requirements":
        return PYTHON_REQUIREMENTS;
      case "build":
        return `# ==============================================================================
# Windows Standalone Executable (.exe) Build Instructions
# Tech Stack: Python 3.11+, PyQt6, SQLite3, Matplotlib, PyInstaller
# ==============================================================================

1. SETUP LOCAL ENVIRONMENT (Windows Command Prompt or PowerShell):
------------------------------------------------------------------
mkdir rab_desktop_app
cd rab_desktop_app

python -m venv venv
venv\\Scripts\\activate

2. INSTALL DEPENDENCIES:
------------------------
pip install PyQt6 PyQt6-Qt6 matplotlib numpy pyinstaller openpyxl

3. SAVE THE CODE FILES:
-----------------------
- Save the Python code as:   main.py
- Save the Database schema:  schema.sql (or let DatabaseManager auto-initialize)

4. RUN THE APP LOCALLY TO TEST:
-------------------------------
python main.py

5. COMPILE INTO STANDALONE WINDOWS .EXE (Single File Executable):
-----------------------------------------------------------------
pyinstaller --noconfirm --onedir --windowed \\
    --name="RAB_Studio_Pro" \\
    --icon="assets/app_icon.ico" \\
    --hidden-import="PyQt6.QtCore" \\
    --hidden-import="PyQt6.QtGui" \\
    --hidden-import="PyQt6.QtWidgets" \\
    --hidden-import="matplotlib.backends.backend_qtagg" \\
    main.py

Or for a single portable file:
pyinstaller --onefile --windowed --name="RAB_Studio_Pro" main.py

6. EXECUTABLE ARTIFACT LOCATION:
--------------------------------
The compiled Windows binary will be created in:
.\\dist\\RAB_Studio_Pro.exe

Double-click to launch! SQLite database will automatically be generated in:
%LOCALAPPDATA%\\RAB_Studio\\rab_database.db
`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeTab === "python"
        ? "main.py"
        : activeTab === "schema"
          ? "schema.sql"
          : activeTab === "requirements"
            ? "requirements.txt"
            : activeTab === "dynamic_rows"
              ? "dynamic_rows.py"
              : activeTab === "rab_editor"
                ? "rab_editor.py"
                : activeTab === "master_crud"
                  ? "master_crud.py"
                  : activeTab === "advanced_ui"
                    ? "advanced_ui.py"
                    : "BUILD_INSTRUCTIONS.txt";

    const blob = new Blob([getActiveCode()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-slate-200 text-xs">
        {/* Modal Header */}
        <div className="h-12 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              Py
            </div>
            <div>
              <span className="font-bold text-white text-sm">
                Desktop Code &amp; SQLite Architecture Hub
              </span>
              <span className="text-slate-400 text-xs ml-2">
                PyQt6 • SQLite3 • Matplotlib • PyInstaller (.exe)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition text-xs font-semibold"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? "Copied to Clipboard!" : "Copy Code"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-white transition text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-950/60 px-4 pt-2 border-b border-slate-800 flex space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("scurve_nav")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeTab === "scurve_nav"
                ? "border-emerald-500 text-emerald-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>S-Curve &amp; Navigation (PyQt6)</span>
          </button>

          <button
            onClick={() => setActiveTab("python")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "python"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>main.py (PyQt6 Desktop Engine)</span>
          </button>

          <button
            onClick={() => setActiveTab("schema")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "schema"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>schema.sql (SQLite Relational Architecture)</span>
          </button>

          <button
            onClick={() => setActiveTab("requirements")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "requirements"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>requirements.txt</span>
          </button>

          <button
            onClick={() => setActiveTab("dynamic_rows")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "dynamic_rows"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>dynamic_rows.py (UI Logic)</span>
          </button>

          <button
            onClick={() => setActiveTab("rab_editor")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "rab_editor"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>rab_editor.py (Pricing Engine)</span>
          </button>

          <button
            onClick={() => setActiveTab("master_crud")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "master_crud"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>master_crud.py (DB Modal)</span>
          </button>

          <button
            onClick={() => setActiveTab("advanced_ui")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "advanced_ui"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>advanced_ui.py (Layout/Export)</span>
          </button>

          <button
            onClick={() => setActiveTab("build")}
            className={`px-3 py-2 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "build"
                ? "border-blue-500 text-blue-400 bg-slate-900/80 rounded-t"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PyInstaller Build Guide (.exe)</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-[11px] leading-relaxed select-text text-slate-300">
          <pre className="whitespace-pre">{getActiveCode()}</pre>
        </div>

        {/* Modal Footer */}
        <div className="h-10 bg-slate-950 px-4 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              Architecture Tested: Windows 10 &amp; 11 x64 Standalone Portable
            </span>
          </div>
          <div className="text-slate-500">
            PyQt6 Desktop Layout with Dynamic QStackedWidget &amp; Matplotlib
            S-Curve
          </div>
        </div>
      </div>
    </div>
  );
};
