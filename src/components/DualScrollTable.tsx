import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DualScrollTableProps {
  children: React.ReactNode;
  className?: string;
  showQuickNavButtons?: boolean;
}

export const DualScrollTable: React.FC<DualScrollTableProps> = ({
  children,
  className = "",
  showQuickNavButtons = true,
}) => {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isSyncingTop = useRef(false);
  const isSyncingBottom = useRef(false);

  const updateDimensions = useCallback(() => {
    if (contentScrollRef.current) {
      setScrollWidth(contentScrollRef.current.scrollWidth);
      setClientWidth(contentScrollRef.current.clientWidth);
      setScrollLeft(contentScrollRef.current.scrollLeft);
    }
  }, []);

  useEffect(() => {
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (contentScrollRef.current) {
      resizeObserver.observe(contentScrollRef.current);
      const firstChild = contentScrollRef.current.firstElementChild;
      if (firstChild) {
        resizeObserver.observe(firstChild);
      }
    }

    window.addEventListener("resize", updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions]);

  // Handle Top Scroll -> Bottom Sync
  const handleTopScroll = () => {
    if (isSyncingTop.current) return;
    isSyncingBottom.current = true;
    if (topScrollRef.current && contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      setScrollLeft(topScrollRef.current.scrollLeft);
    }
    requestAnimationFrame(() => {
      isSyncingBottom.current = false;
    });
  };

  // Handle Bottom Scroll -> Top Sync
  const handleContentScroll = () => {
    if (isSyncingBottom.current) return;
    isSyncingTop.current = true;
    if (topScrollRef.current && contentScrollRef.current) {
      topScrollRef.current.scrollLeft = contentScrollRef.current.scrollLeft;
      setScrollLeft(contentScrollRef.current.scrollLeft);
    }
    requestAnimationFrame(() => {
      isSyncingTop.current = false;
    });
  };

  const scrollByAmount = (delta: number) => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  const isOverflowing = scrollWidth > clientWidth + 5;
  const canScrollLeft = scrollLeft > 5;
  const canScrollRight = scrollLeft + clientWidth < scrollWidth - 5;

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Top scrollbar & navigation controls - Visible when content overflows */}
      {isOverflowing && (
        <div className="bg-slate-100/90 border border-slate-300 rounded-t-lg p-1.5 flex items-center gap-2 sticky top-0 z-30 shadow-xs backdrop-blur-xs">
          {showQuickNavButtons && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => scrollByAmount(-350)}
                disabled={!canScrollLeft}
                className={`p-1 rounded border text-xs font-semibold flex items-center gap-0.5 transition cursor-pointer ${
                  canScrollLeft
                    ? "bg-white text-slate-700 hover:bg-slate-200 border-slate-300 shadow-2xs"
                    : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                }`}
                title="Geser tabel ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Kiri</span>
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(350)}
                disabled={!canScrollRight}
                className={`p-1 rounded border text-xs font-semibold flex items-center gap-0.5 transition cursor-pointer ${
                  canScrollRight
                    ? "bg-white text-slate-700 hover:bg-slate-200 border-slate-300 shadow-2xs"
                    : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                }`}
                title="Geser tabel ke kanan"
              >
                <span className="hidden sm:inline text-[11px]">Kanan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Synced top scrollbar */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden h-4 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200 rounded"
            style={{ minHeight: "16px" }}
          >
            <div style={{ width: `${scrollWidth}px`, height: "1px" }} />
          </div>

          <div className="text-[10px] font-mono text-slate-500 font-semibold px-1.5 shrink-0 hidden md:block">
            {Math.round(scrollLeft)} / {Math.max(0, scrollWidth - clientWidth)} px
          </div>
        </div>
      )}

      {/* Primary table scroll container */}
      <div
        ref={contentScrollRef}
        onScroll={handleContentScroll}
        className={`overflow-x-auto ${isOverflowing ? "border-t-0" : ""}`}
      >
        {children}
      </div>

      {/* Sticky Bottom Scroll Helper - Always visible in viewport without scrolling down */}
      {isOverflowing && (
        <div className="sticky bottom-0 left-0 right-0 z-20 bg-slate-800/90 text-white backdrop-blur-xs px-3 py-1.5 border-t border-slate-700 flex items-center justify-between text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-medium">
              Tabel Melebihi Layar — Geser horizontal untuk melihat semua kolom
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByAmount(-350)}
              disabled={!canScrollLeft}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-0.5 border ${
                canScrollLeft
                  ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-600 cursor-pointer"
                  : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Geser Kiri</span>
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(350)}
              disabled={!canScrollRight}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-0.5 border ${
                canScrollRight
                  ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-600 cursor-pointer"
                  : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
              }`}
            >
              <span>Geser Kanan</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
