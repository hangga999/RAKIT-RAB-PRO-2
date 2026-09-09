import ExcelJS from "exceljs";
import { Project, RabItemEntry, MasterCostItem, Vendor, ScheduleItem, WeeklyProgressPoint } from "../types";

/**
 * Trigger browser file download from Blob
 */
function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E293B" }, // Slate 800
};

const CATEGORY_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE2E8F0" }, // Slate 200
};

const SUMMARY_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF1F5F9" }, // Slate 100
};

const GRAND_TOTAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFEF08A" }, // Amber 200
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

/**
 * 1. EXPORT RAB WORKSPACE / DRAFT TO EXCEL WITH NATIVE ACTIVE FORMULAS
 */
export async function exportRabToExcel(
  project: Project,
  rabItems: RabItemEntry[],
  categoriesList: string[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO Construction Engine";
  workbook.created = new Date();

  // Sheet 1: Detailed BoQ (Rencana Anggaran Biaya)
  const ws = workbook.addWorksheet("RAB Detail (Active Formulas)", {
    views: [{ showGridLines: true }],
  });

  // Title & Metadata
  ws.mergeCells("A1:K1");
  ws.getCell("A1").value = "RENCANA ANGGARAN BIAYA (RAB) & BILL OF QUANTITIES";
  ws.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF0F172A" } };

  ws.mergeCells("A2:K2");
  ws.getCell("A2").value = "RAKITCO Architecture & Construction Management • Active Dynamic Formulas";
  ws.getCell("A2").font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF64748B" } };

  // Metadata block
  ws.getCell("A4").value = "Proyek:";
  ws.getCell("B4").value = project.name;
  ws.getCell("G4").value = "Kode Proyek:";
  ws.getCell("H4").value = project.projectCode;

  ws.getCell("A5").value = "Klien / Pemilik:";
  ws.getCell("B5").value = project.ownerName || "-";
  ws.getCell("G5").value = "Tanggal Dokumen:";
  ws.getCell("H5").value = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  ws.getCell("A6").value = "Lokasi Proyek:";
  ws.getCell("B6").value = project.location || "-";
  ws.getCell("G6").value = "Revisi / Status:";
  ws.getCell("H6").value = `${project.activeRevisionNumber || "Rev.01"} (${project.status || "Draft"})`;

  ["A4", "A5", "A6", "G4", "G5", "G6"].forEach((c) => {
    ws.getCell(c).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF475569" } };
  });

  // Table Headers matching App RAB CBS Table
  const headerRowIdx = 8;
  const headers = [
    "No",
    "Uraian Pekerjaan",
    "Spesifikasi / Kategori",
    "Satuan",
    "Vol Real",
    "Waste (%)",
    "Volume RAB",
    "HPP Satuan (Rp)",
    "Subtotal HPP (Rp)",
    "Harga Satuan (Rp)",
    "Total Harga (Rp)"
  ];
  const headerRow = ws.getRow(headerRowIdx);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: i >= 4 ? "right" : i === 0 || i === 3 ? "center" : "left" };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 24;

  let currentRowIdx = 9;
  let itemCounter = 1;
  const categorySubtotalRows: { rowIdx: number; secName: string }[] = [];

  // Group items by Section Header (e.g. Lantai 1, Lantai 2)
  const sectionsInItems: string[] = [];
  rabItems.forEach((it) => {
    const sec = it.sectionName?.trim() || "Lantai 1";
    if (!sectionsInItems.includes(sec)) {
      sectionsInItems.push(sec);
    }
  });
  if (sectionsInItems.length === 0) {
    sectionsInItems.push("Lantai 1");
  }

  sectionsInItems.forEach((secName, secIdx) => {
    const itemsInSec = rabItems.filter((i) => (i.sectionName?.trim() || "Lantai 1") === secName);
    if (itemsInSec.length === 0) return;

    // Section Header Row
    const catRow = ws.getRow(currentRowIdx);
    ws.mergeCells(`A${currentRowIdx}:K${currentRowIdx}`);
    catRow.getCell(1).value = secName.toUpperCase();
    catRow.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };
    catRow.getCell(1).fill = CATEGORY_FILL;
    catRow.getCell(1).border = THIN_BORDER;
    currentRowIdx++;

    const itemRowIndices: number[] = [];

    itemsInSec.forEach((item, itemIdx) => {
      const parentRowIdx = currentRowIdx;
      itemRowIndices.push(parentRowIdx);
      const row = ws.getRow(parentRowIdx);

      // Col A: No
      row.getCell(1).value = `${secIdx + 1}.${itemIdx + 1}`;
      row.getCell(1).alignment = { horizontal: "center" };

      // Col B: Item Name
      row.getCell(2).value = item.itemName;

      // Col C: Primary Spec / Work Category
      row.getCell(3).value = item.specification || item.workCategory || "-";

      // Col D: Unit
      row.getCell(4).value = item.unit || "ls";
      row.getCell(4).alignment = { horizontal: "center" };

      // Col E: Vol Real
      const volReal = Number(item.volumeReal ?? item.volume ?? 1);
      row.getCell(5).value = volReal;
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(5).alignment = { horizontal: "right" };

      // Col F: Waste (%)
      const waste = Number(item.wasteFactor ?? 0);
      row.getCell(6).value = waste;
      row.getCell(6).numFmt = '0.0"%"';
      row.getCell(6).alignment = { horizontal: "right" };

      // Col G: Volume RAB (DYNAMIC FORMULA: =VolReal * (1 + Waste/100))
      const volRabResult = volReal * (1 + waste / 100);
      row.getCell(7).value = {
        formula: `E${parentRowIdx}*(1+F${parentRowIdx}/100)`,
        result: volRabResult,
      };
      row.getCell(7).numFmt = "#,##0.00";
      row.getCell(7).alignment = { horizontal: "right" };
      row.getCell(7).font = { bold: true };

      // Col H: HPP Satuan (Cost Price)
      const hppSatuan = Number(item.costPrice ?? (item.unitPrice ? item.unitPrice * 0.8 : 0));
      row.getCell(8).value = hppSatuan;
      row.getCell(8).numFmt = '"Rp "#,##0';
      row.getCell(8).alignment = { horizontal: "right" };

      // Col I: Subtotal HPP (DYNAMIC FORMULA: =VolumeRAB * HPP Satuan)
      const subtotalHppResult = volRabResult * hppSatuan;
      row.getCell(9).value = {
        formula: `G${parentRowIdx}*H${parentRowIdx}`,
        result: subtotalHppResult,
      };
      row.getCell(9).numFmt = '"Rp "#,##0';
      row.getCell(9).alignment = { horizontal: "right" };
      row.getCell(9).font = { color: { argb: "FFBE123C" } }; // Rose 700

      // Col J: Harga Satuan Jual
      const hargaSatuan = Number(item.unitPrice || 0);
      row.getCell(10).value = hargaSatuan;
      row.getCell(10).numFmt = '"Rp "#,##0';
      row.getCell(10).alignment = { horizontal: "right" };

      // Col K: Total Harga Jual (DYNAMIC FORMULA: =VolumeRAB * HargaSatuan)
      const totalJualResult = volRabResult * hargaSatuan;
      row.getCell(11).value = {
        formula: `G${parentRowIdx}*J${parentRowIdx}`,
        result: totalJualResult,
      };
      row.getCell(11).numFmt = '"Rp "#,##0';
      row.getCell(11).alignment = { horizontal: "right" };
      row.getCell(11).font = { bold: true, color: { argb: "FF047857" } }; // Emerald 700

      for (let c = 1; c <= 11; c++) {
        row.getCell(c).border = THIN_BORDER;
        if (c !== 7 && c !== 11) {
          row.getCell(c).font = { name: "Segoe UI", size: 9 };
        }
      }
      currentRowIdx++;

      // Sub-Spec Rows if available
      if (item.specRows && item.specRows.length > 0) {
        item.specRows.forEach((spc, spcIdx) => {
          const subRow = ws.getRow(currentRowIdx);
          subRow.getCell(1).value = `${secIdx + 1}.${itemIdx + 1}.${spcIdx + 1}`;
          subRow.getCell(1).alignment = { horizontal: "center" };
          subRow.getCell(1).font = { name: "Segoe UI", size: 8, color: { argb: "FF64748B" } };

          subRow.getCell(2).value = "  ↳ Sub-Spesifikasi";
          subRow.getCell(2).font = { name: "Segoe UI", size: 8, italic: true, color: { argb: "FF64748B" } };

          subRow.getCell(3).value = spc.specName;
          subRow.getCell(3).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF334155" } };

          for (let c = 4; c <= 11; c++) {
            subRow.getCell(c).value = "-";
            subRow.getCell(c).alignment = { horizontal: "center" };
            subRow.getCell(c).font = { name: "Segoe UI", size: 8, color: { argb: "FF94A3B8" } };
          }
          for (let c = 1; c <= 11; c++) {
            subRow.getCell(c).border = THIN_BORDER;
            subRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
          currentRowIdx++;
        });
      }
    });

    // Section Subtotal Row (DYNAMIC FORMULAS)
    const subtotalRow = ws.getRow(currentRowIdx);
    ws.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
    subtotalRow.getCell(1).value = `SUBTOTAL ${secName.toUpperCase()}:`;
    subtotalRow.getCell(1).alignment = { horizontal: "right" };
    subtotalRow.getCell(1).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF334155" } };

    // Subtotal HPP Formula
    const hppFormula = itemRowIndices.map((r) => `I${r}`).join("+");
    const hppSumResult = itemsInSec.reduce(
      (acc, i) => acc + (i.volumeReal || i.volume || 1) * (1 + (i.wasteFactor || 0) / 100) * (i.costPrice || i.unitPrice * 0.8 || 0),
      0
    );
    subtotalRow.getCell(9).value = {
      formula: hppFormula,
      result: hppSumResult,
    };
    subtotalRow.getCell(9).numFmt = '"Rp "#,##0';
    subtotalRow.getCell(9).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFBE123C" } };
    subtotalRow.getCell(9).alignment = { horizontal: "right" };

    subtotalRow.getCell(10).value = "-";
    subtotalRow.getCell(10).alignment = { horizontal: "center" };
    subtotalRow.getCell(10).font = { color: { argb: "FF94A3B8" } };

    // Subtotal Jual Formula
    const jualFormula = itemRowIndices.map((r) => `K${r}`).join("+");
    const jualSumResult = itemsInSec.reduce(
      (acc, i) => acc + (i.totalPrice || (i.volumeReal || i.volume || 1) * (1 + (i.wasteFactor || 0) / 100) * i.unitPrice),
      0
    );
    subtotalRow.getCell(11).value = {
      formula: jualFormula,
      result: jualSumResult,
    };
    subtotalRow.getCell(11).numFmt = '"Rp "#,##0';
    subtotalRow.getCell(11).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
    subtotalRow.getCell(11).alignment = { horizontal: "right" };

    for (let c = 1; c <= 11; c++) {
      subtotalRow.getCell(c).fill = SUMMARY_FILL;
      subtotalRow.getCell(c).border = THIN_BORDER;
    }

    categorySubtotalRows.push({ rowIdx: currentRowIdx, secName });
    currentRowIdx++;
  });

  // Empty separator row
  currentRowIdx++;

  // RECAP / SUMMARY SECTION (WITH ACTIVE DYNAMIC FORMULAS)
  const recapStartRow = currentRowIdx;

  // 1. Total Nilai Penawaran (Selling)
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = "TOTAL NILAI PEKERJAAN (PENJUALAN):";
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const subtotalJualFormula = categorySubtotalRows.length > 0
    ? categorySubtotalRows.map((c) => `K${c.rowIdx}`).join("+")
    : `SUM(K9:K${currentRowIdx - 2})`;
  const subtotalRealCost = rabItems.reduce((acc, i) => acc + (i.totalPrice || i.volume * i.unitPrice), 0);

  ws.getCell(`K${currentRowIdx}`).value = {
    formula: subtotalJualFormula,
    result: subtotalRealCost,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1D4ED8" } };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const totalJualRowIdx = currentRowIdx;
  currentRowIdx++;

  // 2. Total Biaya Modal (HPP)
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = "TOTAL BIAYA MODAL (HPP):";
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFBE123C" } };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const subtotalHppFormula = categorySubtotalRows.length > 0
    ? categorySubtotalRows.map((c) => `I${c.rowIdx}`).join("+")
    : `SUM(I9:I${currentRowIdx - 3})`;
  const totalHppResult = rabItems.reduce(
    (acc, i) => acc + (i.volumeReal || i.volume || 1) * (1 + (i.wasteFactor || 0) / 100) * (i.costPrice || i.unitPrice * 0.8 || 0),
    0
  );

  ws.getCell(`K${currentRowIdx}`).value = {
    formula: subtotalHppFormula,
    result: totalHppResult,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFBE123C" } };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const totalHppRowIdx = currentRowIdx;
  currentRowIdx++;

  // 3. Estimasi Margin Kotor
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = "ESTIMASI MARGIN KOTOR (GROSS PROFIT):";
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  ws.getCell(`K${currentRowIdx}`).value = {
    formula: `K${totalJualRowIdx}-K${totalHppRowIdx}`,
    result: subtotalRealCost - totalHppResult,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  currentRowIdx++;

  // 4. Contingencies
  const contPercent = project.contingencyPercent ?? 5.0;
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = `CONTINGENCIES (${contPercent}%):`;
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const contVal = subtotalRealCost * (contPercent / 100);
  ws.getCell(`K${currentRowIdx}`).value = {
    formula: `K${totalJualRowIdx}*${contPercent / 100}`,
    result: contVal,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const contRowIdx = currentRowIdx;
  currentRowIdx++;

  // 5. Overhead & Profit
  const overheadPercent = project.overheadProfitPercent ?? 10.0;
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = `OVERHEAD & PROFIT (${overheadPercent}%):`;
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const overheadVal = subtotalRealCost * (overheadPercent / 100);
  ws.getCell(`K${currentRowIdx}`).value = {
    formula: `K${totalJualRowIdx}*${overheadPercent / 100}`,
    result: overheadVal,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const overheadRowIdx = currentRowIdx;
  currentRowIdx++;

  // 6. Subtotal Sebelum Pajak
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = "TOTAL SEBELUM PPN:";
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const subtotalPreTaxVal = subtotalRealCost + contVal + overheadVal;
  ws.getCell(`K${currentRowIdx}`).value = {
    formula: `K${totalJualRowIdx}+K${contRowIdx}+K${overheadRowIdx}`,
    result: subtotalPreTaxVal,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const preTaxRowIdx = currentRowIdx;
  currentRowIdx++;

  // 7. PPN (11% if taxPercent > 0)
  const isPpn = project.taxPercent === undefined || project.taxPercent > 0;
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = `PPN 11% (${isPpn ? "TERAPKAN" : "NON-PPN"}):`;
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const ppnVal = isPpn ? subtotalPreTaxVal * 0.11 : 0;
  ws.getCell(`K${currentRowIdx}`).value = {
    formula: isPpn ? `K${preTaxRowIdx}*0.11` : "0",
    result: ppnVal,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const ppnRowIdx = currentRowIdx;
  currentRowIdx++;

  // 8. GRAND TOTAL (Pre-Tax + PPN)
  ws.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`);
  ws.getCell(`A${currentRowIdx}`).value = "GRAND TOTAL PENAWARAN (ESTIMATE):";
  ws.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0F172A" } };
  ws.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  ws.getCell(`K${currentRowIdx}`).value = {
    formula: `K${preTaxRowIdx}+K${ppnRowIdx}`,
    result: subtotalPreTaxVal + ppnVal,
  };
  ws.getCell(`K${currentRowIdx}`).numFmt = '"Rp "#,##0';
  ws.getCell(`K${currentRowIdx}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFB45309" } };
  ws.getCell(`K${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = GRAND_TOTAL_FILL;
    ws.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }

  // Auto-fit column widths
  ws.columns = [
    { width: 8 },  // No
    { width: 36 }, // Uraian Pekerjaan
    { width: 30 }, // Spesifikasi / Kategori
    { width: 10 }, // Satuan
    { width: 12 }, // Vol Real
    { width: 12 }, // Waste (%)
    { width: 15 }, // Volume RAB
    { width: 18 }, // HPP Satuan
    { width: 22 }, // Subtotal HPP
    { width: 18 }, // Harga Satuan
    { width: 24 }, // Total Harga
  ];

  downloadWorkbook(workbook, `RAB_${project.projectCode}_${project.name.replace(/\s+/g, "_")}.xlsx`);
}

/**
 * 2. EXPORT MASTER COST DATABASE TO EXCEL
 */
export async function exportMasterDatabaseToExcel(masterItems: MasterCostItem[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO";
  const ws = workbook.addWorksheet("Master Database AHS", { views: [{ showGridLines: true }] });

  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = "MASTER DATABASE ANALISA HARGA SATUAN (AHS)";
  ws.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true };

  ws.mergeCells("A2:G2");
  ws.getCell("A2").value = "RAKITCO Single Source of Truth • Standar Estimasi Proyek";
  ws.getCell("A2").font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };

  const headerRowIdx = 4;
  const headers = ["No", "Kode Item", "Kode AHS", "Nama Pekerjaan", "Kategori", "Satuan", "Total Harga Satuan (Rp)"];
  const headerRow = ws.getRow(headerRowIdx);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 || i === 1 || i === 2 || i === 5 ? "center" : i === 6 ? "right" : "left" };
    cell.border = THIN_BORDER;
  });

  let rowIdx = 5;
  masterItems.forEach((item, index) => {
    const row = ws.getRow(rowIdx);
    const spec = item.specifications?.[0];
    const unit = spec?.unit || "ls";
    const price = spec?.unitPrice || 0;

    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.itemCode;
    row.getCell(3).value = item.ahsCode;
    row.getCell(4).value = item.itemName;
    row.getCell(5).value = item.category;
    row.getCell(6).value = unit;
    row.getCell(7).value = price;
    row.getCell(7).numFmt = '"Rp "#,##0';

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(6).alignment = { horizontal: "center" };
    row.getCell(7).alignment = { horizontal: "right" };

    for (let c = 1; c <= 7; c++) {
      row.getCell(c).border = THIN_BORDER;
      row.getCell(c).font = { name: "Segoe UI", size: 9 };
    }
    rowIdx++;
  });

  ws.columns = [
    { width: 6 },
    { width: 14 },
    { width: 16 },
    { width: 36 },
    { width: 26 },
    { width: 10 },
    { width: 22 },
  ];

  downloadWorkbook(workbook, "RAKITCO_Master_Database_AHS.xlsx");
}

/**
 * 3. EXPORT VENDOR LIST TO EXCEL
 */
export async function exportVendorListToExcel(vendors: Vendor[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO";
  const ws = workbook.addWorksheet("Vendor Directory", { views: [{ showGridLines: true }] });

  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = "RAKITCO VENDOR & SUB-KONTRAKTOR DIRECTORY";
  ws.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true };

  const headers = ["No", "Nama Vendor / Supplier", "Kategori Spesialisasi", "Contact Person", "Nomor Telepon", "Email", "Alamat & Catatan"];
  const headerRow = ws.getRow(3);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = THIN_BORDER;
  });

  vendors.forEach((v, index) => {
    const row = ws.getRow(4 + index);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = v.name;
    row.getCell(3).value = v.category;
    row.getCell(4).value = v.contactPerson;
    row.getCell(5).value = v.phoneNumber;
    row.getCell(6).value = v.email;
    row.getCell(7).value = `${v.address} - ${v.notes || ""}`;

    row.getCell(1).alignment = { horizontal: "center" };
    for (let c = 1; c <= 7; c++) {
      row.getCell(c).border = THIN_BORDER;
      row.getCell(c).font = { name: "Segoe UI", size: 9 };
    }
  });

  ws.columns = [
    { width: 6 },
    { width: 28 },
    { width: 24 },
    { width: 20 },
    { width: 18 },
    { width: 24 },
    { width: 36 },
  ];

  downloadWorkbook(workbook, "RAKITCO_Vendor_Directory.xlsx");
}

/**
 * 4. EXPORT MASTER PROJECT LIST TO EXCEL
 */
export async function exportProjectListToExcel(projects: Project[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO";
  const ws = workbook.addWorksheet("Master Project List", { views: [{ showGridLines: true }] });

  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = "RAKITCO MASTER PROJECT PORTFOLIO";
  ws.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true };

  const headers = ["No", "Kode Proyek", "Nama Proyek", "Klien", "Status", "Lokasi", "Luas (m²)", "Nilai Kontrak / BoQ (Rp)"];
  const headerRow = ws.getRow(3);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = THIN_BORDER;
  });

  projects.forEach((p, index) => {
    const row = ws.getRow(4 + index);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = p.projectCode;
    row.getCell(3).value = p.name;
    row.getCell(4).value = p.ownerName || "-";
    row.getCell(5).value = p.status;
    row.getCell(6).value = p.location || "-";
    row.getCell(7).value = Number(p.requirements?.buildingArea) || 0;
    row.getCell(8).value = Number(p.grandTotal) || 0;

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(7).alignment = { horizontal: "right" };
    row.getCell(8).alignment = { horizontal: "right" };
    row.getCell(8).numFmt = '"Rp "#,##0';

    for (let c = 1; c <= 8; c++) {
      row.getCell(c).border = THIN_BORDER;
      row.getCell(c).font = { name: "Segoe UI", size: 9 };
    }
  });

  ws.columns = [
    { width: 6 },
    { width: 14 },
    { width: 32 },
    { width: 22 },
    { width: 16 },
    { width: 24 },
    { width: 12 },
    { width: 26 },
  ];

  downloadWorkbook(workbook, "RAKITCO_Master_Project_List.xlsx");
}

/**
 * 4B. EXPORT RAB LIST SCREEN TO EXCEL (EXACT UI TABLE ALIGNMENT & DYNAMIC FORMULAS)
 * Mirrors the exact structure and dataset currently displayed on the RAB List UI screen:
 * - Kode Proyek
 * - Nama Proyek & Versi Terkini (Latest)
 * - Klien / Pemilik
 * - Lokasi Proyek
 * - Riwayat Versi (Count)
 * - Jumlah Work Items
 * - Nilai RAB Terkini (BoQ) with dynamic portfolio SUM formula
 */
export async function exportRabListToExcel(projects: Project[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PT Rakit Kreasi Abadi";
  workbook.created = new Date();

  // Sheet 1: Master RAB List (Mirroring UI Screen)
  const ws = workbook.addWorksheet("RAB Projects & Revisions", { views: [{ showGridLines: true }] });

  // Corporate Header
  ws.mergeCells("A1:K1");
  ws.getCell("A1").value = "DAFTAR PORTOFOLIO RAB & HISTORI REVISI PROYEK";
  ws.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF0F172A" } };

  ws.mergeCells("A2:K2");
  ws.getCell("A2").value = "PT Rakit Kreasi Abadi - General Contractor & Interior Architecture | Jl. Parung Panjang no.21, Legok, Tangerang | Email: admin@rakitco.com";
  ws.getCell("A2").font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };

  const headers = [
    "No",
    "Kode Proyek",
    "Nama Proyek",
    "Versi RAB Terkini",
    "Judul Revisi",
    "Tanggal Update",
    "Klien / Pemilik",
    "Lokasi Proyek",
    "Total Riwayat Revisi",
    "Jumlah Work Items",
    "Nilai RAB Terkini (BoQ)",
  ];

  const headerRowIdx = 4;
  const headerRow = ws.getRow(headerRowIdx);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = THIN_BORDER;
    cell.alignment = {
      vertical: "middle",
      horizontal: i === 0 || i === 1 || i === 3 || i === 5 || i === 8 || i === 9 ? "center" : i === 10 ? "right" : "left",
    };
  });

  const startDataRow = 5;
  projects.forEach((p, index) => {
    const rowIdx = startDataRow + index;
    const row = ws.getRow(rowIdx);

    const revs = p.revisions && p.revisions.length > 0 ? p.revisions : [];
    const latest = revs.find((r) => r.isLatest) || revs[revs.length - 1];
    const revNumber = latest?.revisionNumber || "Rev.01";
    const revTitle = latest?.title || "Initial Draft BoQ";
    const revDate = latest?.createdAt || p.createdAt || "-";
    const revCount = revs.length || 1;
    const itemsCount = latest?.itemCount || p.items?.length || 0;
    const amount = latest?.grandTotal || p.grandTotal || 0;

    row.getCell(1).value = index + 1;
    row.getCell(2).value = p.projectCode;
    row.getCell(3).value = p.name;
    row.getCell(4).value = `${revNumber} (Latest)`;
    row.getCell(5).value = revTitle;
    row.getCell(6).value = revDate;
    row.getCell(7).value = p.ownerName || "-";
    row.getCell(8).value = p.location || "-";
    row.getCell(9).value = `${revCount} Versi`;
    row.getCell(10).value = itemsCount;
    row.getCell(11).value = Number(amount) || 0;

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(6).alignment = { horizontal: "center" };
    row.getCell(9).alignment = { horizontal: "center" };
    row.getCell(10).alignment = { horizontal: "center" };
    row.getCell(11).alignment = { horizontal: "right" };
    row.getCell(11).numFmt = '"Rp "#,##0';

    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = THIN_BORDER;
      row.getCell(c).font = { name: "Segoe UI", size: 9 };
    }
  });

  const endDataRow = startDataRow + projects.length - 1;
  const summaryRowIdx = endDataRow + 1;
  const summaryRow = ws.getRow(summaryRowIdx);

  ws.mergeCells(`A${summaryRowIdx}:J${summaryRowIdx}`);
  summaryRow.getCell(1).value = "TOTAL NILAI PEKERJAAN (PORTOFOLIO BOQ)";
  summaryRow.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
  summaryRow.getCell(1).alignment = { horizontal: "right" };

  summaryRow.getCell(11).value = {
    formula: `SUM(K${startDataRow}:K${endDataRow})`,
    result: projects.reduce((sum, p) => {
      const revs = p.revisions && p.revisions.length > 0 ? p.revisions : [];
      const latest = revs.find((r) => r.isLatest) || revs[revs.length - 1];
      return sum + (latest?.grandTotal || p.grandTotal || 0);
    }, 0),
  };
  summaryRow.getCell(11).numFmt = '"Rp "#,##0';
  summaryRow.getCell(11).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1D4ED8" } };
  summaryRow.getCell(11).alignment = { horizontal: "right" };

  for (let c = 1; c <= 11; c++) {
    summaryRow.getCell(c).fill = GRAND_TOTAL_FILL;
    summaryRow.getCell(c).border = THIN_BORDER;
  }

  // Column widths
  ws.columns = [
    { width: 6 },  // No
    { width: 14 }, // Kode
    { width: 32 }, // Nama
    { width: 18 }, // Versi Terkini
    { width: 28 }, // Judul Revisi
    { width: 16 }, // Tanggal
    { width: 22 }, // Klien
    { width: 22 }, // Lokasi
    { width: 18 }, // Riwayat
    { width: 16 }, // Item
    { width: 26 }, // Nilai BoQ
  ];

  // Sheet 2: Detailed Tree of all Revisions
  const wsRevs = workbook.addWorksheet("Riwayat Detail Semua Revisi", { views: [{ showGridLines: true }] });
  wsRevs.mergeCells("A1:H1");
  wsRevs.getCell("A1").value = "HISTORI LENGKAP POHON REVISI RAB SETIAP PROYEK";
  wsRevs.getCell("A1").font = { name: "Segoe UI", size: 13, bold: true };

  const revHeaders = ["Kode Proyek", "Nama Proyek", "Revisi", "Status Versi", "Judul / Catatan Revisi", "Tanggal Buat", "Work Items", "Nilai Revisi (BoQ)"];
  const revHeaderRow = wsRevs.getRow(3);
  revHeaders.forEach((h, i) => {
    const c = revHeaderRow.getCell(i + 1);
    c.value = h;
    c.fill = HEADER_FILL;
    c.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    c.border = THIN_BORDER;
    c.alignment = { vertical: "middle", horizontal: i === 0 || i === 2 || i === 3 || i === 5 || i === 6 ? "center" : i === 7 ? "right" : "left" };
  });

  let rIdx = 4;
  projects.forEach((p) => {
    const revs = p.revisions && p.revisions.length > 0 ? p.revisions : [];
    revs.forEach((rev) => {
      const r = wsRevs.getRow(rIdx);
      r.getCell(1).value = p.projectCode;
      r.getCell(2).value = p.name;
      r.getCell(3).value = rev.revisionNumber;
      r.getCell(4).value = rev.isLatest ? "Latest (Aktif)" : "Arsip Riwayat";
      r.getCell(5).value = rev.title || rev.notes || "-";
      r.getCell(6).value = rev.createdAt || "-";
      r.getCell(7).value = rev.itemCount || 0;
      r.getCell(8).value = Number(rev.grandTotal) || 0;

      r.getCell(1).alignment = { horizontal: "center" };
      r.getCell(3).alignment = { horizontal: "center" };
      r.getCell(4).alignment = { horizontal: "center" };
      r.getCell(6).alignment = { horizontal: "center" };
      r.getCell(7).alignment = { horizontal: "center" };
      r.getCell(8).alignment = { horizontal: "right" };
      r.getCell(8).numFmt = '"Rp "#,##0';

      for (let col = 1; col <= 8; col++) {
        r.getCell(col).border = THIN_BORDER;
        r.getCell(col).font = { name: "Segoe UI", size: 9 };
      }
      rIdx++;
    });
  });

  wsRevs.columns = [
    { width: 14 },
    { width: 30 },
    { width: 14 },
    { width: 16 },
    { width: 32 },
    { width: 16 },
    { width: 14 },
    { width: 24 },
  ];

  downloadWorkbook(workbook, "RAKITCO_Daftar_RAB_List.xlsx");
}

/**
 * 5. EXPORT SCHEDULE & PROGRESS TO EXCEL (WITH ACTIVE FORMULAS)
 */
export async function exportScheduleToExcel(
  project: Project,
  scheduleItems: ScheduleItem[],
  progressPoints?: WeeklyProgressPoint[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO";
  const ws = workbook.addWorksheet("Schedule & Progress", { views: [{ showGridLines: true }] });

  ws.mergeCells("A1:J1");
  ws.getCell("A1").value = `JADWAL PELAKSANAAN & LAPORAN PROGRESS (KURVA S) - ${project.name.toUpperCase()}`;
  ws.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true };

  const headers = ["WBS", "Uraian Pekerjaan", "Kategori", "Bobot (%)", "Mulai Rencana", "Selesai Rencana", "Durasi (Hari)", "Rencana (%)", "Realisasi (%)", "Deviasi (%)"];
  const headerRow = ws.getRow(3);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: i >= 3 ? "right" : i === 0 ? "center" : "left" };
  });

  scheduleItems.forEach((item, index) => {
    const rowIdx = 4 + index;
    const row = ws.getRow(rowIdx);
    
    // Calculate duration in days if start and end dates exist
    let durationDays = 14;
    if (item.plannedStartDate && item.plannedEndDate) {
      const diffMs = new Date(item.plannedEndDate).getTime() - new Date(item.plannedStartDate).getTime();
      durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    const planned = Number(item.targetProgressPercent) || 0;
    const actual = Number(item.actualProgressPercent) || 0;

    row.getCell(1).value = item.wbsCode;
    row.getCell(2).value = item.taskName;
    row.getCell(3).value = item.category;
    row.getCell(4).value = Number(item.weightPercent) || 0;
    row.getCell(5).value = item.plannedStartDate || item.startDate || "-";
    row.getCell(6).value = item.plannedEndDate || item.endDate || "-";
    row.getCell(7).value = durationDays;
    row.getCell(8).value = planned;
    row.getCell(9).value = actual;

    // Col J: DEVIASI (FORMULA: =Actual - Planned)
    row.getCell(10).value = {
      formula: `I${rowIdx}-H${rowIdx}`,
      result: actual - planned,
    };

    row.getCell(1).alignment = { horizontal: "center" };
    [4, 7, 8, 9, 10].forEach((col) => {
      row.getCell(col).alignment = { horizontal: "right" };
      row.getCell(col).numFmt = "0.00";
    });

    for (let c = 1; c <= 10; c++) {
      row.getCell(c).border = THIN_BORDER;
      row.getCell(c).font = { name: "Segoe UI", size: 9 };
    }
  });

  ws.columns = [
    { width: 10 },
    { width: 34 },
    { width: 22 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  downloadWorkbook(workbook, `Schedule_${project.projectCode}_${project.name.replace(/\s+/g, "_")}.xlsx`);
}
