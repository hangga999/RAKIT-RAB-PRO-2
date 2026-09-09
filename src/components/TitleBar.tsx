import React from 'react';
import { Minus, Square, X, Code2, Download, Database, Laptop } from 'lucide-react';

interface TitleBarProps {
  onOpenCodeViewer: () => void;
  activeMenu: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenCodeViewer, activeMenu }) => {
  return (
    <div className="h-10 bg-[#1e2530] text-slate-300 flex items-center justify-between px-3 select-none border-b border-slate-700/60 text-xs shrink-0">
      {/* Left: App icon and Window title */}
      <div className="flex items-center space-x-2.5">
        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
          RAB
        </div>
        <span className="font-semibold text-slate-200">
          RAB Studio Pro v2.4 (Windows Desktop x64)
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400 truncate max-w-[300px]">{activeMenu}</span>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
          SQLite Active
        </span>
      </div>

      {/* Center/Right: Code & Export Hub */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenCodeViewer}
          className="flex items-center space-x-1.5 bg-blue-600/90 hover:bg-blue-600 text-white px-2.5 py-1 rounded text-xs font-medium transition shadow-xs cursor-pointer"
          title="Inspect Python Desktop Code, Schema & Windows .exe Build Guide"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Python &amp; Schema Source</span>
        </button>

        {/* Windows standard min, max, close buttons */}
        <div className="flex items-center ml-2 border-l border-slate-700/80 pl-2 space-x-0.5">
          <button 
            className="w-8 h-7 flex items-center justify-center hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            className="w-8 h-7 flex items-center justify-center hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition"
            title="Maximize / Restore"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            className="w-8 h-7 flex items-center justify-center hover:bg-red-600 rounded text-slate-400 hover:text-white transition"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
