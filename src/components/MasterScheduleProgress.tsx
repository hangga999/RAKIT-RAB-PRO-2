import React, { useState } from "react";
import {
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Layers,
  Activity,
  Sliders,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { Project, ScheduleItem, WeeklyProgressPoint } from "../types";
import {
  INITIAL_SCHEDULE_ITEMS,
  INITIAL_S_CURVE_DATA,
} from "../data/initialData";

interface MasterScheduleProgressProps {
  selectedProject: Project | null;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
}

export const MasterScheduleProgress: React.FC<MasterScheduleProgressProps> = ({
  selectedProject,
  allProjects,
  onSelectProject,
}) => {
  const currentProject = selectedProject || allProjects[0];

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(
    INITIAL_SCHEDULE_ITEMS,
  );
  const [sCurvePoints, setSCurvePoints] =
    useState<WeeklyProgressPoint[]>(INITIAL_S_CURVE_DATA);
  const [currentWeek, setCurrentWeek] = useState<number>(5);

  // Overall schedule calculations
  const totalWeight = scheduleItems.reduce(
    (sum, item) => sum + item.weightPercent,
    0,
  );
  const overallTarget = scheduleItems.reduce(
    (sum, item) =>
      sum + (item.weightPercent * item.targetProgressPercent) / 100,
    0,
  );
  const overallActual = scheduleItems.reduce(
    (sum, item) =>
      sum + (item.weightPercent * item.actualProgressPercent) / 100,
    0,
  );
  const scheduleVariance = overallActual - overallTarget;
  const spi =
    overallTarget > 0 ? (overallActual / overallTarget).toFixed(2) : "1.00";

  // Handle actual progress change per item
  const handleActualChange = (itemId: string, newActual: number) => {
    const valid = Math.max(0, Math.min(100, newActual));
    setScheduleItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          let status: ScheduleItem["status"] = "On Track";
          if (valid === 100) status = "Completed";
          else if (valid < item.targetProgressPercent - 5) status = "Delayed";
          else if (valid === 0) status = "Not Started";

          return {
            ...item,
            actualProgressPercent: valid,
            status,
          };
        }
        return item;
      }),
    );

    // Update current week actual in S-curve
    setSCurvePoints((prev) =>
      prev.map((pt) => {
        if (pt.week === currentWeek) {
          return {
            ...pt,
            actualCumulative: Math.round(overallActual * 10) / 10,
          };
        }
        return pt;
      }),
    );
  };

  // SVG dimensions for S-Curve Chart
  const svgWidth = 850;
  const svgHeight = 280;
  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxWeeks = sCurvePoints.length;
  const getX = (weekIndex: number) =>
    paddingLeft + (weekIndex / (maxWeeks - 1)) * chartWidth;
  const getY = (percentage: number) =>
    paddingTop + chartHeight - (percentage / 100) * chartHeight;

  // Build target line path
  const targetPath = sCurvePoints
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.targetCumulative)}`,
    )
    .join(" ");

  // Build actual line path (only for points where actualCumulative != null)
  const actualPointsWithData = sCurvePoints.filter(
    (p) => p.actualCumulative !== null,
  );
  const actualPath = actualPointsWithData
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${getX(p.week - 1)} ${getY(p.actualCumulative!)}`,
    )
    .join(" ");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Master Schedule &amp; Progress (Kurva-S &amp; Time Schedule)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan timeline proyek, kurva S akumulatif rencana vs realisasi,
            dan deviasi bobot pekerjaan WBS
          </p>
        </div>

        {/* Project Dropdown Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">
            Pilih Proyek:
          </span>
          <select
            value={currentProject.id}
            onChange={(e) => {
              const found = allProjects.find((p) => p.id === e.target.value);
              if (found) onSelectProject(found);
            }}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards: Project Progress Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rencana Kumulatif (Target)
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
            {overallTarget.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Posisi Target Minggu ke-{currentWeek}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Realisasi Fisik (Actual)
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {overallActual.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Berdasarkan opname progress lapangan
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Deviasi Jadwal (Variance)
          </div>
          <div
            className={`text-2xl font-bold mt-1 font-mono ${scheduleVariance >= 0 ? "text-emerald-600" : "text-amber-600"}`}
          >
            {scheduleVariance >= 0
              ? `+${scheduleVariance.toFixed(2)}%`
              : `${scheduleVariance.toFixed(2)}%`}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {scheduleVariance >= 0
              ? "Pekerjaan Ahead of Schedule"
              : "Keterlambatan fisik terdeteksi"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Schedule Performance (SPI)
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {spi}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {parseFloat(spi) >= 1.0
              ? "Kinerja waktu optimal (SPI >= 1.0)"
              : "Perlu percepatan (Catch-up plan)"}
          </div>
        </div>
      </div>

      {/* S-CURVE CHART VISUALIZATION */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              S-Curve Progress Diagram (Matplotlib Qt Integration Engine)
            </h3>
            <p className="text-[11px] text-slate-500">
              Grafik kurva S standar manajemen konstruksi: Akumulasi Bobot
              Rencana (Biru) vs Realisasi Fisik Lapangan (Merah)
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-1 bg-blue-600 rounded-full inline-block"></span>
              <span className="text-slate-700">Target Plan (Rencana)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-1 bg-rose-500 border border-rose-600 rounded-full inline-block"></span>
              <span className="text-slate-700">Actual (Realisasi)</span>
            </div>
          </div>
        </div>

        {/* SVG Rendered S-Curve */}
        <div className="w-full overflow-x-auto bg-slate-900 rounded-lg p-2 border border-slate-800">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[700px]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {/* Gridlines */}
            {[0, 20, 40, 60, 80, 100].map((pct) => {
              const y = getY(pct);
              return (
                <g key={pct}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Week Vertical Lines */}
            {sCurvePoints.map((p, i) => {
              const x = getX(i);
              return (
                <g key={p.week}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={svgHeight - paddingBottom}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={svgHeight - paddingBottom + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}

            {/* Cutoff vertical line for Current Week (Week 5) */}
            <line
              x1={getX(currentWeek - 1)}
              y1={paddingTop}
              x2={getX(currentWeek - 1)}
              y2={svgHeight - paddingBottom}
              stroke="#64748b"
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />
            <text
              x={getX(currentWeek - 1)}
              y={paddingTop - 10}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="10"
              fontWeight="bold"
            >
              Current Week ({currentWeek})
            </text>

            {/* TARGET PLAN S-CURVE (Blue) */}
            <path
              d={targetPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
            />
            {sCurvePoints.map((p, i) => (
              <circle
                key={`tgt-${p.week}`}
                cx={getX(i)}
                cy={getY(p.targetCumulative)}
                r="3.5"
                fill="#3b82f6"
                stroke="#1d4ed8"
                strokeWidth="1.5"
              />
            ))}

            {/* ACTUAL PROGRESS S-CURVE (Rose / Reddish-orange) */}
            <path
              d={actualPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray="4,3"
            />
            {actualPointsWithData.map((p) => (
              <circle
                key={`act-${p.week}`}
                cx={getX(p.week - 1)}
                cy={getY(p.actualCumulative!)}
                r="4.5"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* WBS DATA TABLE: PROGRESS % (TARGET VS ACTUAL) PER WORK ITEM */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Tabel Progres Pekerjaan (WBS Tracking: Target vs. Actual)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Input dan pantau capaian opname fisik per divisi pekerjaan. Nilai
              deviasi dihitung secara langsung.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Bobot:{" "}
            <span className="font-mono font-bold text-slate-800">
              {totalWeight.toFixed(1)}%
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-16">Kode WBS</th>
                <th className="py-2.5 px-3 min-w-[240px]">
                  Divisi &amp; Uraian Pekerjaan
                </th>
                <th className="py-2.5 px-3 w-28 text-right">Bobot (%)</th>
                <th className="py-2.5 px-3 w-32 text-right">
                  Target Rencana (%)
                </th>
                <th className="py-2.5 px-3 w-36 text-right">
                  Realisasi Fisik (%)
                </th>
                <th className="py-2.5 px-3 w-28 text-right">Deviasi (%)</th>
                <th className="py-2.5 px-3 w-28 text-center">Periode Kerja</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scheduleItems.map((item) => {
                const deviasi =
                  item.actualProgressPercent - item.targetProgressPercent;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {item.wbsCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">
                        {item.taskName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.category}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                      {item.weightPercent.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-600">
                      {item.targetProgressPercent}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="flex items-center justify-end space-x-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.actualProgressPercent}
                          onChange={(e) =>
                            handleActualChange(
                              item.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-16 px-1.5 py-0.5 text-right font-mono bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          deviasi >= 0 ? "text-emerald-600" : "text-rose-600"
                        }
                      >
                        {deviasi >= 0 ? `+${deviasi}%` : `${deviasi}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px] text-slate-500 font-mono">
                      {item.startDate} s/d {item.endDate}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === "Completed"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : item.status === "Delayed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : item.status === "On Track"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <tr>
                <td colSpan={2} className="py-2.5 px-3 text-right">
                  TOTAL PROGRESS KUMULATIF:
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {totalWeight.toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-600">
                  {overallTarget.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                  {overallActual.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  <span
                    className={
                      scheduleVariance >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  >
                    {scheduleVariance >= 0
                      ? `+${scheduleVariance.toFixed(2)}%`
                      : `${scheduleVariance.toFixed(2)}%`}
                  </span>
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
