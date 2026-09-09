import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { InteriorProject, InteriorRABRevision, InteriorRABSection } from "../types";
import { drawRakitcoLetterhead, attachPageNumbersAndFooter } from "./pdfExport";
import { setupAptosFont } from "./aptosFont";

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

// ---------------- EXCEL EXPORT STYLES & HELPERS ----------------
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E293B" }, // Slate 800
};

const HEADER_INTERNAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF334155" }, // Slate 700
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
  fgColor: { argb: "FFFEF3C7" }, // Amber 100
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

// ---------------- EXCEL EXPORT ----------------
export async function exportInteriorToExcel(
  project: InteriorProject,
  revision: InteriorRABRevision,
  includeInternal: boolean
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO Construction Engine";
  workbook.created = new Date();

  const sheetName = includeInternal ? "RAB Interior (Analisis HPP)" : "RAB Interior (Penawaran)";
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  const lastColLetter = includeInternal ? "P" : "G";
  const numCols = includeInternal ? 16 : 7;

  // 1. Title Block
  sheet.mergeCells(`A1:${lastColLetter}1`);
  sheet.getCell("A1").value = "RENCANA ANGGARAN BIAYA (RAB) - INTERIOR FIT-OUT";
  sheet.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF0F172A" } };

  sheet.mergeCells(`A2:${lastColLetter}2`);
  sheet.getCell("A2").value = includeInternal 
    ? "RAKITCO Interior Architecture • Analisis HPP & Margin Aktif (Dynamic Formulas)"
    : "RAKITCO Interior Architecture • Rincian Penawaran Klien (Active Formulas)";
  sheet.getCell("A2").font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF64748B" } };

  // 2. Metadata Block
  const rightColKey = includeInternal ? "J" : "E";
  const rightValKey = includeInternal ? "K" : "F";

  sheet.getCell("A4").value = "Proyek:";
  sheet.getCell("B4").value = project.name;
  sheet.getCell(`${rightColKey}4`).value = "Kode Proyek:";
  sheet.getCell(`${rightValKey}4`).value = project.projectCode;

  sheet.getCell("A5").value = "Klien / Pemilik:";
  sheet.getCell("B5").value = project.ownerName || "-";
  sheet.getCell(`${rightColKey}5`).value = "Tanggal Dokumen:";
  sheet.getCell(`${rightValKey}5`).value = revision.date || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  sheet.getCell("A6").value = "Lokasi Proyek:";
  sheet.getCell("B6").value = project.location || "-";
  sheet.getCell(`${rightColKey}6`).value = "Revisi / Status:";
  sheet.getCell(`${rightValKey}6`).value = `${revision.name || "Rev.01"} (${project.status || "Draft"})`;

  ["A4", "A5", "A6", `${rightColKey}4`, `${rightColKey}5`, `${rightColKey}6`].forEach((c) => {
    sheet.getCell(c).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF475569" } };
  });

  // 3. Table Headers
  const headerRowIdx = 8;
  const headers = includeInternal
    ? [
        "No",
        "Item Description",
        "Specification",
        "Unit",
        "Qty",
        "Unit Price (Sell)",
        "Amount (Sell)",
        "Length (L)",
        "Width (W)",
        "Height (H)",
        "Factor",
        "Model",
        "Base Cost / Unit",
        "Base Amount",
        "Total Base (HPP)",
        "% Profit",
      ]
    : [
        "No",
        "Item Description",
        "Specification",
        "Unit",
        "Qty",
        "Unit Price",
        "Total Amount",
      ];

  const headerRow = sheet.getRow(headerRowIdx);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = idx >= 7 && idx <= 13 ? HEADER_INTERNAL_FILL : HEADER_FILL;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: idx === 0 || idx === 3 ? "center" : idx >= 4 ? "right" : "left",
    };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 24;

  let currentRowIdx = 9;
  const sectionSubtotalRows: { rowIdx: number; secName: string }[] = [];

  revision.sections.forEach((sec, sIdx) => {
    const startSectionRow = currentRowIdx;
    const itemParentRows: number[] = [];

    // Section Header Row
    const secRow = sheet.getRow(currentRowIdx);
    if (includeInternal) {
      sheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);
      secRow.getCell(1).value = sec.sectionName.toUpperCase();
      secRow.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };
      secRow.getCell(1).fill = CATEGORY_FILL;
      secRow.getCell(1).border = THIN_BORDER;
    } else {
      sheet.mergeCells(`A${currentRowIdx}:F${currentRowIdx}`);
      secRow.getCell(1).value = sec.sectionName.toUpperCase();
      secRow.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };
      secRow.getCell(1).fill = CATEGORY_FILL;
      secRow.getCell(1).border = THIN_BORDER;
    }
    currentRowIdx++;

    sec.items.forEach((item, iIdx) => {
      const parentRowIdx = currentRowIdx;
      itemParentRows.push(parentRowIdx);
      const row = sheet.getRow(parentRowIdx);

      const firstSpec = item.specs[0] || {
        id: "spc-0",
        specName: "-",
        length_l: 0,
        width_w: 0,
        height_h: 0,
        factor: 1,
        model: "-",
        baseCostUnitPrice: 0,
      };

      const itemMargin = item.profitMarginPercent !== undefined ? item.profitMarginPercent : (sec.profitMarginPercent || 30);
      const parentQty = Number(item.qty) || 1;

      // Col A: No
      row.getCell(1).value = `${sIdx + 1}.${iIdx + 1}`;
      row.getCell(1).alignment = { horizontal: "center" };

      // Col B: Description
      row.getCell(2).value = item.description;

      // Col C: Spec
      row.getCell(3).value = firstSpec.specName;

      // Col D: Unit
      row.getCell(4).value = item.unit;
      row.getCell(4).alignment = { horizontal: "center" };

      // Col E: Qty
      row.getCell(5).value = parentQty;
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(5).alignment = { horizontal: "right" };

      if (includeInternal) {
        // Internal Specs for Spec 0
        // Col H: Length
        row.getCell(8).value = Number(firstSpec.length_l) || 0;
        row.getCell(8).numFmt = "#,##0.00";
        row.getCell(8).alignment = { horizontal: "right" };

        // Col I: Width
        row.getCell(9).value = Number(firstSpec.width_w) || 0;
        row.getCell(9).numFmt = "#,##0.00";
        row.getCell(9).alignment = { horizontal: "right" };

        // Col J: Height
        row.getCell(10).value = Number(firstSpec.height_h) || 0;
        row.getCell(10).numFmt = "#,##0.00";
        row.getCell(10).alignment = { horizontal: "right" };

        // Col K: Factor
        row.getCell(11).value = Number(firstSpec.factor) || 1.0;
        row.getCell(11).numFmt = "#,##0.00";
        row.getCell(11).alignment = { horizontal: "right" };

        // Col L: Model
        row.getCell(12).value = firstSpec.model || "-";
        row.getCell(12).alignment = { horizontal: "center" };

        // Col M: Base Cost / Unit
        const baseCost0 = Number(firstSpec.baseCostUnitPrice) || 0;
        row.getCell(13).value = baseCost0;
        row.getCell(13).numFmt = '"Rp "#,##0';
        row.getCell(13).alignment = { horizontal: "right" };

        // Col N: Base Amount (DYNAMIC FORMULA: =IF(AND(H>0,J>0), H*J*K*M, E*K*M))
        const isVol0 = (firstSpec.length_l || 0) > 0 && (firstSpec.height_h || 0) > 0;
        const calcBaseAmt0 = isVol0
          ? firstSpec.length_l * firstSpec.height_h * firstSpec.factor * baseCost0
          : parentQty * firstSpec.factor * baseCost0;

        row.getCell(14).value = {
          formula: `IF(AND(H${parentRowIdx}>0,J${parentRowIdx}>0),H${parentRowIdx}*J${parentRowIdx}*K${parentRowIdx}*M${parentRowIdx},E${parentRowIdx}*K${parentRowIdx}*M${parentRowIdx})`,
          result: calcBaseAmt0,
        };
        row.getCell(14).numFmt = '"Rp "#,##0';
        row.getCell(14).alignment = { horizontal: "right" };

        currentRowIdx++;

        // Any additional spec rows for this item
        const additionalSpecs = item.specs.slice(1);
        const allSpecRowIndices = [parentRowIdx];

        additionalSpecs.forEach((spc) => {
          const subRowIdx = currentRowIdx;
          allSpecRowIndices.push(subRowIdx);
          const subRow = sheet.getRow(subRowIdx);

          subRow.getCell(1).value = "";
          subRow.getCell(2).value = `  ↳ ${spc.specName}`;
          subRow.getCell(2).font = { name: "Segoe UI", size: 8, italic: true, color: { argb: "FF64748B" } };

          subRow.getCell(3).value = spc.specName;
          subRow.getCell(4).value = "-";
          subRow.getCell(4).alignment = { horizontal: "center" };
          subRow.getCell(5).value = "-";
          subRow.getCell(5).alignment = { horizontal: "center" };

          subRow.getCell(6).value = "-";
          subRow.getCell(7).value = "-";

          // Col H: Length
          subRow.getCell(8).value = Number(spc.length_l) || 0;
          subRow.getCell(8).numFmt = "#,##0.00";
          subRow.getCell(8).alignment = { horizontal: "right" };

          // Col I: Width
          subRow.getCell(9).value = Number(spc.width_w) || 0;
          subRow.getCell(9).numFmt = "#,##0.00";
          subRow.getCell(9).alignment = { horizontal: "right" };

          // Col J: Height
          subRow.getCell(10).value = Number(spc.height_h) || 0;
          subRow.getCell(10).numFmt = "#,##0.00";
          subRow.getCell(10).alignment = { horizontal: "right" };

          // Col K: Factor
          subRow.getCell(11).value = Number(spc.factor) || 1.0;
          subRow.getCell(11).numFmt = "#,##0.00";
          subRow.getCell(11).alignment = { horizontal: "right" };

          // Col L: Model
          subRow.getCell(12).value = spc.model || "-";
          subRow.getCell(12).alignment = { horizontal: "center" };

          // Col M: Base Cost / Unit
          const spcBaseCost = Number(spc.baseCostUnitPrice) || 0;
          subRow.getCell(13).value = spcBaseCost;
          subRow.getCell(13).numFmt = '"Rp "#,##0';
          subRow.getCell(13).alignment = { horizontal: "right" };

          // Col N: Base Amount (DYNAMIC FORMULA referencing parent Qty at E${parentRowIdx})
          const isVolSub = (spc.length_l || 0) > 0 && (spc.height_h || 0) > 0;
          const calcBaseAmtSub = isVolSub
            ? spc.length_l * spc.height_h * spc.factor * spcBaseCost
            : parentQty * spc.factor * spcBaseCost;

          subRow.getCell(14).value = {
            formula: `IF(AND(H${subRowIdx}>0,J${subRowIdx}>0),H${subRowIdx}*J${subRowIdx}*K${subRowIdx}*M${subRowIdx},E$${parentRowIdx}*K${subRowIdx}*M${subRowIdx})`,
            result: calcBaseAmtSub,
          };
          subRow.getCell(14).numFmt = '"Rp "#,##0';
          subRow.getCell(14).alignment = { horizontal: "right" };

          subRow.getCell(15).value = "-";
          subRow.getCell(16).value = "-";

          for (let c = 1; c <= 16; c++) {
            subRow.getCell(c).border = THIN_BORDER;
            subRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
          currentRowIdx++;
        });

        // Now set Col O, P, F, G on the Parent Row
        // Col O: Total Base (HPP) = SUM(N{firstSpec}:N{lastSpec})
        const baseHppSumFormula = `SUM(N${allSpecRowIndices[0]}:N${allSpecRowIndices[allSpecRowIndices.length - 1]})`;
        const expectedBaseTotal = item.specs.reduce((sum, spc) => {
          const isVol = (spc.length_l || 0) > 0 && (spc.height_h || 0) > 0;
          const effQty = isVol ? spc.length_l * spc.height_h * spc.factor : parentQty * spc.factor;
          return sum + effQty * (spc.baseCostUnitPrice || 0);
        }, 0);

        row.getCell(15).value = {
          formula: baseHppSumFormula,
          result: expectedBaseTotal,
        };
        row.getCell(15).numFmt = '"Rp "#,##0';
        row.getCell(15).alignment = { horizontal: "right" };
        row.getCell(15).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFB45309" } }; // Amber 700

        // Col P: % Profit
        row.getCell(16).value = itemMargin;
        row.getCell(16).numFmt = '0.0"%"';
        row.getCell(16).alignment = { horizontal: "right" };
        row.getCell(16).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF047857" } };

        // Col F: Unit Price (Sell) (DYNAMIC FORMULA: =O{parentRowIdx}*(1+P{parentRowIdx}/100))
        const expectedUnitSell = expectedBaseTotal * (1 + itemMargin / 100);
        row.getCell(6).value = {
          formula: `O${parentRowIdx}*(1+P${parentRowIdx}/100)`,
          result: expectedUnitSell,
        };
        row.getCell(6).numFmt = '"Rp "#,##0';
        row.getCell(6).alignment = { horizontal: "right" };

        // Col G: Amount (Sell) (DYNAMIC FORMULA: =E{parentRowIdx}*F{parentRowIdx})
        const expectedAmountSell = parentQty * expectedUnitSell;
        row.getCell(7).value = {
          formula: `E${parentRowIdx}*F${parentRowIdx}`,
          result: expectedAmountSell,
        };
        row.getCell(7).numFmt = '"Rp "#,##0';
        row.getCell(7).alignment = { horizontal: "right" };
        row.getCell(7).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF047857" } };

        for (let c = 1; c <= 16; c++) {
          row.getCell(c).border = THIN_BORDER;
          if (c !== 7 && c !== 15) {
            row.getCell(c).font = { name: "Segoe UI", size: 9 };
          }
        }
      } else {
        // Client View (No Internal Costing)
        const expectedBaseTotal = item.specs.reduce((sum, spc) => {
          const isVol = (spc.length_l || 0) > 0 && (spc.height_h || 0) > 0;
          const effQty = isVol ? spc.length_l * spc.height_h * spc.factor : parentQty * spc.factor;
          return sum + effQty * (spc.baseCostUnitPrice || 0);
        }, 0);
        const expectedUnitSell = expectedBaseTotal * (1 + itemMargin / 100);
        const expectedAmountSell = parentQty * expectedUnitSell;

        // Col F: Unit Price
        row.getCell(6).value = expectedUnitSell;
        row.getCell(6).numFmt = '"Rp "#,##0';
        row.getCell(6).alignment = { horizontal: "right" };

        // Col G: Total Amount (DYNAMIC FORMULA: =E{parentRowIdx}*F{parentRowIdx})
        row.getCell(7).value = {
          formula: `E${parentRowIdx}*F${parentRowIdx}`,
          result: expectedAmountSell,
        };
        row.getCell(7).numFmt = '"Rp "#,##0';
        row.getCell(7).alignment = { horizontal: "right" };
        row.getCell(7).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF047857" } };

        for (let c = 1; c <= 7; c++) {
          row.getCell(c).border = THIN_BORDER;
          if (c !== 7) {
            row.getCell(c).font = { name: "Segoe UI", size: 9 };
          }
        }
        currentRowIdx++;

        // Sub specs for client view
        if (item.specs.length > 1) {
          item.specs.slice(1).forEach((spc) => {
            const subRow = sheet.getRow(currentRowIdx);
            subRow.getCell(1).value = "";
            subRow.getCell(2).value = `  ↳ ${spc.specName}`;
            subRow.getCell(2).font = { name: "Segoe UI", size: 8, italic: true, color: { argb: "FF64748B" } };
            subRow.getCell(3).value = spc.specName;
            subRow.getCell(4).value = "-";
            subRow.getCell(4).alignment = { horizontal: "center" };
            subRow.getCell(5).value = "-";
            subRow.getCell(5).alignment = { horizontal: "center" };
            subRow.getCell(6).value = "-";
            subRow.getCell(7).value = "-";

            for (let c = 1; c <= 7; c++) {
              subRow.getCell(c).border = THIN_BORDER;
              subRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
            }
            currentRowIdx++;
          });
        }
      }
    });

    // Section Subtotal Row (DYNAMIC FORMULA)
    const subRow = sheet.getRow(currentRowIdx);
    if (includeInternal) {
      sheet.mergeCells(`A${currentRowIdx}:F${currentRowIdx}`);
      subRow.getCell(1).value = `SUBTOTAL ${sec.sectionName.toUpperCase()}:`;
      subRow.getCell(1).alignment = { horizontal: "right" };
      subRow.getCell(1).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF334155" } };

      // Subtotal Selling (Col G)
      const sellFormula = itemParentRows.length > 0 ? itemParentRows.map((r) => `G${r}`).join("+") : "0";
      const expectedSecSell = sec.items.reduce((sum, it) => {
        const m = it.profitMarginPercent !== undefined ? it.profitMarginPercent : (sec.profitMarginPercent || 30);
        const b = it.specs.reduce((acc, s) => {
          const isVol = (s.length_l || 0) > 0 && (s.height_h || 0) > 0;
          return acc + (isVol ? s.length_l * s.height_h * s.factor : it.qty * s.factor) * (s.baseCostUnitPrice || 0);
        }, 0);
        return sum + it.qty * b * (1 + m / 100);
      }, 0);

      subRow.getCell(7).value = {
        formula: sellFormula,
        result: expectedSecSell,
      };
      subRow.getCell(7).numFmt = '"Rp "#,##0';
      subRow.getCell(7).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
      subRow.getCell(7).alignment = { horizontal: "right" };

      for (let c = 8; c <= 14; c++) {
        subRow.getCell(c).value = "-";
        subRow.getCell(c).alignment = { horizontal: "center" };
        subRow.getCell(c).font = { color: { argb: "FF94A3B8" } };
      }

      // Subtotal HPP (Col O)
      const hppFormula = itemParentRows.length > 0 ? itemParentRows.map((r) => `O${r}`).join("+") : "0";
      const expectedSecHpp = sec.items.reduce((sum, it) => {
        return sum + it.specs.reduce((acc, s) => {
          const isVol = (s.length_l || 0) > 0 && (s.height_h || 0) > 0;
          return acc + (isVol ? s.length_l * s.height_h * s.factor : it.qty * s.factor) * (s.baseCostUnitPrice || 0);
        }, 0);
      }, 0);

      subRow.getCell(15).value = {
        formula: hppFormula,
        result: expectedSecHpp,
      };
      subRow.getCell(15).numFmt = '"Rp "#,##0';
      subRow.getCell(15).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFB45309" } };
      subRow.getCell(15).alignment = { horizontal: "right" };

      subRow.getCell(16).value = `${sec.profitMarginPercent || 30}%`;
      subRow.getCell(16).alignment = { horizontal: "center" };
      subRow.getCell(16).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF64748B" } };

      for (let c = 1; c <= 16; c++) {
        subRow.getCell(c).fill = SUMMARY_FILL;
        subRow.getCell(c).border = THIN_BORDER;
      }
    } else {
      sheet.mergeCells(`A${currentRowIdx}:F${currentRowIdx}`);
      subRow.getCell(1).value = `SUBTOTAL ${sec.sectionName.toUpperCase()}:`;
      subRow.getCell(1).alignment = { horizontal: "right" };
      subRow.getCell(1).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF334155" } };

      const sellFormula = itemParentRows.length > 0 ? itemParentRows.map((r) => `G${r}`).join("+") : "0";
      const expectedSecSell = sec.items.reduce((sum, it) => {
        const m = it.profitMarginPercent !== undefined ? it.profitMarginPercent : (sec.profitMarginPercent || 30);
        const b = it.specs.reduce((acc, s) => {
          const isVol = (s.length_l || 0) > 0 && (s.height_h || 0) > 0;
          return acc + (isVol ? s.length_l * s.height_h * s.factor : it.qty * s.factor) * (s.baseCostUnitPrice || 0);
        }, 0);
        return sum + it.qty * b * (1 + m / 100);
      }, 0);

      subRow.getCell(7).value = {
        formula: sellFormula,
        result: expectedSecSell,
      };
      subRow.getCell(7).numFmt = '"Rp "#,##0';
      subRow.getCell(7).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
      subRow.getCell(7).alignment = { horizontal: "right" };

      for (let c = 1; c <= 7; c++) {
        subRow.getCell(c).fill = SUMMARY_FILL;
        subRow.getCell(c).border = THIN_BORDER;
      }
    }

    sectionSubtotalRows.push({ rowIdx: currentRowIdx, secName: sec.sectionName });
    currentRowIdx++;
  });

  // Empty separator
  currentRowIdx++;

  // 4. REKAPITULASI & FINANCIAL SUMMARY BLOCK (DYNAMIC ACTIVE FORMULAS)
  const recapColSpan = includeInternal ? "O" : "F";
  const recapTargetCol = includeInternal ? "P" : "G";
  const numRecapCols = includeInternal ? 16 : 7;

  // 1. Subtotal Nilai Pekerjaan (Selling)
  sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
  sheet.getCell(`A${currentRowIdx}`).value = "TOTAL NILAI PEKERJAAN (PENJUALAN):";
  sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const totalSellFormula = sectionSubtotalRows.length > 0 ? sectionSubtotalRows.map((s) => `G${s.rowIdx}`).join("+") : "0";
  const totalSellExpected = revision.sections.reduce((sum, sec) => {
    return sum + sec.items.reduce((itemSum, it) => {
      const m = it.profitMarginPercent !== undefined ? it.profitMarginPercent : (sec.profitMarginPercent || 30);
      const b = it.specs.reduce((acc, s) => {
        const isVol = (s.length_l || 0) > 0 && (s.height_h || 0) > 0;
        return acc + (isVol ? s.length_l * s.height_h * s.factor : it.qty * s.factor) * (s.baseCostUnitPrice || 0);
      }, 0);
      return itemSum + it.qty * b * (1 + m / 100);
    }, 0);
  }, 0);

  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
    formula: totalSellFormula,
    result: totalSellExpected,
  };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1D4ED8" } };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= numRecapCols; c++) {
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const sellRowIdx = currentRowIdx;
  currentRowIdx++;

  // If includeInternal, show HPP and Profit rows
  if (includeInternal) {
    // 2. Subtotal HPP
    sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
    sheet.getCell(`A${currentRowIdx}`).value = "TOTAL BIAYA MODAL (HPP):";
    sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB45309" } };
    sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

    const totalHppFormula = sectionSubtotalRows.length > 0 ? sectionSubtotalRows.map((s) => `O${s.rowIdx}`).join("+") : "0";
    const totalHppExpected = revision.sections.reduce((sum, sec) => {
      return sum + sec.items.reduce((itemSum, it) => {
        return itemSum + it.specs.reduce((acc, s) => {
          const isVol = (s.length_l || 0) > 0 && (s.height_h || 0) > 0;
          return acc + (isVol ? s.length_l * s.height_h * s.factor : it.qty * s.factor) * (s.baseCostUnitPrice || 0);
        }, 0);
      }, 0);
    }, 0);

    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
      formula: totalHppFormula,
      result: totalHppExpected,
    };
    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB45309" } };
    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

    for (let c = 1; c <= numRecapCols; c++) {
      sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
      sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
    }
    const hppRowIdx = currentRowIdx;
    currentRowIdx++;

    // 3. Estimasi Margin Kotor
    sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
    sheet.getCell(`A${currentRowIdx}`).value = "ESTIMASI MARGIN KOTOR (GROSS PROFIT):";
    sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
    sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
      formula: `${recapTargetCol}${sellRowIdx}-${recapTargetCol}${hppRowIdx}`,
      result: totalSellExpected - totalHppExpected,
    };
    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
    sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

    for (let c = 1; c <= numRecapCols; c++) {
      sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
      sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
    }
    currentRowIdx++;
  }

  // Contingencies
  const contPct = revision.contingencyPercent ?? 5.0;
  sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
  sheet.getCell(`A${currentRowIdx}`).value = `CONTINGENCIES (${contPct}%):`;
  sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const contVal = totalSellExpected * (contPct / 100);
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
    formula: `${recapTargetCol}${sellRowIdx}*${contPct / 100}`,
    result: contVal,
  };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= numRecapCols; c++) {
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const contRowIdx = currentRowIdx;
  currentRowIdx++;

  // Overhead & Profit
  const overheadPct = revision.overheadProfitPercent ?? 10.0;
  sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
  sheet.getCell(`A${currentRowIdx}`).value = `OVERHEAD & PROFIT (${overheadPct}%):`;
  sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const overheadVal = totalSellExpected * (overheadPct / 100);
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
    formula: `${recapTargetCol}${sellRowIdx}*${overheadPct / 100}`,
    result: overheadVal,
  };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= numRecapCols; c++) {
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const overheadRowIdx = currentRowIdx;
  currentRowIdx++;

  // Total Sebelum PPN
  sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
  sheet.getCell(`A${currentRowIdx}`).value = "TOTAL SEBELUM PPN:";
  sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const preTaxExpected = totalSellExpected + contVal + overheadVal;
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
    formula: `${recapTargetCol}${sellRowIdx}+${recapTargetCol}${contRowIdx}+${recapTargetCol}${overheadRowIdx}`,
    result: preTaxExpected,
  };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= numRecapCols; c++) {
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const preTaxRowIdx = currentRowIdx;
  currentRowIdx++;

  // PPN 11%
  const isPpn = revision.usePpn !== false;
  sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
  sheet.getCell(`A${currentRowIdx}`).value = `PPN 11% (${isPpn ? "TERAPKAN" : "NON-PPN"}):`;
  sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  const ppnVal = isPpn ? preTaxExpected * 0.11 : 0;
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
    formula: isPpn ? `${recapTargetCol}${preTaxRowIdx}*0.11` : "0",
    result: ppnVal,
  };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 10, bold: true };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= numRecapCols; c++) {
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = SUMMARY_FILL;
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }
  const ppnRowIdx = currentRowIdx;
  currentRowIdx++;

  // GRAND TOTAL
  sheet.mergeCells(`A${currentRowIdx}:${recapColSpan}${currentRowIdx}`);
  sheet.getCell(`A${currentRowIdx}`).value = "GRAND TOTAL PENAWARAN (ESTIMATE):";
  sheet.getCell(`A${currentRowIdx}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0F172A" } };
  sheet.getCell(`A${currentRowIdx}`).alignment = { horizontal: "right" };

  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).value = {
    formula: `${recapTargetCol}${preTaxRowIdx}+${recapTargetCol}${ppnRowIdx}`,
    result: preTaxExpected + ppnVal,
  };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).numFmt = '"Rp "#,##0';
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFB45309" } };
  sheet.getCell(`${recapTargetCol}${currentRowIdx}`).alignment = { horizontal: "right" };

  for (let c = 1; c <= numRecapCols; c++) {
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).fill = GRAND_TOTAL_FILL;
    sheet.getCell(`${String.fromCharCode(64 + c)}${currentRowIdx}`).border = THIN_BORDER;
  }

  // Column Widths
  sheet.columns = includeInternal
    ? [
        { width: 7 },  // No
        { width: 32 }, // Item Description
        { width: 28 }, // Specification
        { width: 10 }, // Unit
        { width: 10 }, // Qty
        { width: 18 }, // Unit Price (Sell)
        { width: 20 }, // Amount (Sell)
        { width: 12 }, // Length
        { width: 12 }, // Width
        { width: 12 }, // Height
        { width: 10 }, // Factor
        { width: 14 }, // Model
        { width: 18 }, // Base Cost / Unit
        { width: 18 }, // Base Amount
        { width: 20 }, // Total Base (HPP)
        { width: 12 }, // % Profit
      ]
    : [
        { width: 7 },  // No
        { width: 36 }, // Item Description
        { width: 32 }, // Specification
        { width: 10 }, // Unit
        { width: 12 }, // Qty
        { width: 22 }, // Unit Price
        { width: 24 }, // Total Amount
      ];

  downloadWorkbook(workbook, `RAB_Interior_${project.projectCode}_${revision.name || "Rev.01"}.xlsx`);
}

// ---------------- PDF EXPORT ----------------
export async function exportInteriorToPdf(
  project: InteriorProject,
  revision: InteriorRABRevision,
  includeInternal: boolean = false
) {
  const orientation = includeInternal ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  await setupAptosFont(doc);

  const startY = await drawRakitcoLetterhead(
    doc,
    {
      title: "Rencana Anggaran Biaya (RAB) - Interior",
      projectCode: project.projectCode,
      projectName: project.name,
      clientName: project.ownerName,
      date: revision.date || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      revision: revision.name || "Rev.01",
      location: project.location,
      status: project.status,
    },
    orientation
  );

  const tableBody: any[] = [];
  let subtotalSelling = 0;
  let globalItemNo = 1;

  if (includeInternal) {
    // Landscape HPP Analysis View
    const head = [
      ["No", "Uraian Pekerjaan", "Rincian Spesifikasi", "Sat", "Qty", "Harga Jual", "Total Jual", "P (m)", "L (m)", "T (m)", "Fac", "Model", "HPP Satuan", "Subtotal HPP", "Total HPP Item", "Margin"]
    ];

    revision.sections.forEach((sec, sIdx) => {
      tableBody.push([
        { 
          content: sec.sectionName.toUpperCase(), 
          colSpan: 16, 
          styles: { 
            fillColor: [241, 245, 249], 
            fontStyle: "bold", 
            textColor: [15, 23, 42],
            fontSize: 7,
            cellPadding: 1.8
          } 
        }
      ]);

      let secTotal = 0;

      sec.items.forEach((item) => {
        const baseTotal = item.specs.reduce((sum, spc) => {
          const isVol = spc.length_l > 0 && spc.height_h > 0;
          const effectiveQty = isVol ? (spc.length_l * spc.height_h * spc.factor) : (item.qty * spc.factor);
          return sum + (effectiveQty * spc.baseCostUnitPrice);
        }, 0);
        const itemMargin = item.profitMarginPercent !== undefined ? item.profitMarginPercent : (sec.profitMarginPercent || 0);
        const costPerUnit = item.qty > 0 ? (baseTotal / item.qty) : baseTotal;
        const sellUnit = costPerUnit * (1 + itemMargin / 100);
        const sellAmount = sellUnit * item.qty;

        secTotal += sellAmount;
        subtotalSelling += sellAmount;

        tableBody.push([
          { content: globalItemNo++, styles: { halign: "center", fontStyle: "bold" } },
          { content: item.description, styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
          { content: "", styles: {} },
          { content: item.unit, styles: { halign: "center" } },
          { content: item.qty.toLocaleString("id-ID"), styles: { halign: "right" } },
          { content: `Rp ${sellUnit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right" } },
          { content: `Rp ${sellAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42] } },
          "", "", "", "", "", "", "",
          { content: `Rp ${baseTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [71, 85, 105] } },
          { content: `${itemMargin}%`, styles: { halign: "center", fontStyle: "bold", textColor: [37, 99, 235] } }
        ]);

        item.specs.forEach((spc) => {
          const isVol = spc.length_l > 0 && spc.height_h > 0;
          const spcQty = isVol ? (spc.length_l * spc.height_h * spc.factor) : (item.qty * spc.factor);
          const spcBaseAmt = spcQty * spc.baseCostUnitPrice;
          tableBody.push([
            "", "", 
            { content: `• ${spc.specName}`, styles: { textColor: [71, 85, 105], fontSize: 6 } }, 
            "", "", "", "",
            { content: spc.length_l ? spc.length_l.toString() : "-", styles: { halign: "right", fontSize: 6 } },
            { content: spc.width_w ? spc.width_w.toString() : "-", styles: { halign: "right", fontSize: 6 } },
            { content: spc.height_h ? spc.height_h.toString() : "-", styles: { halign: "right", fontSize: 6 } },
            { content: spc.factor ? spc.factor.toString() : "1", styles: { halign: "center", fontSize: 6 } },
            { content: spc.model || "-", styles: { fontSize: 6 } },
            { content: `Rp ${spc.baseCostUnitPrice.toLocaleString("id-ID")}`, styles: { halign: "right", fontSize: 6 } },
            { content: `Rp ${spcBaseAmt.toLocaleString("id-ID")}`, styles: { halign: "right", fontSize: 6 } },
            "", ""
          ]);
        });
      });

      // Section subtotal
      tableBody.push([
        {
          content: `Subtotal ${sec.sectionName}`,
          colSpan: 6,
          styles: { halign: "right", fontStyle: "bold", textColor: [51, 65, 85], fillColor: [248, 250, 252], fontSize: 6.8 },
        },
        {
          content: `Rp ${secTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
          styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42], fillColor: [248, 250, 252], fontSize: 6.8 },
        },
        { content: "", colSpan: 9, styles: { fillColor: [248, 250, 252] } }
      ]);
    });

    const contingencyPercent = revision.contingencyPercent || 0;
    const overheadProfitPercent = revision.overheadProfitPercent || 0;
    const combinedMarkupPercent = contingencyPercent + overheadProfitPercent;
    const overheadContingenciesValue = subtotalSelling * (combinedMarkupPercent / 100);
    const grandTotalExclPpn = subtotalSelling + overheadContingenciesValue;
    const taxAmount = revision.usePpn ? grandTotalExclPpn * 0.11 : 0;
    const grandTotalInclPpn = grandTotalExclPpn + taxAmount;

    // Recap rows
    tableBody.push([
      { content: "SUBTOTAL (EXCL. PPN)", colSpan: 6, styles: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59], fillColor: [241, 245, 249], fontSize: 7 } },
      { content: `Rp ${grandTotalExclPpn.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42], fillColor: [241, 245, 249], fontSize: 7 } },
      { content: "", colSpan: 9, styles: { fillColor: [241, 245, 249] } }
    ]);

    if (combinedMarkupPercent > 0) {
      tableBody.push([
        { content: `OVERHEAD & KONTINJENSI (${combinedMarkupPercent}%)`, colSpan: 6, styles: { halign: "right", fontStyle: "bold", textColor: [146, 64, 14], fillColor: [255, 251, 235], fontSize: 7 } },
        { content: `Rp ${overheadContingenciesValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [146, 64, 14], fillColor: [255, 251, 235], fontSize: 7 } },
        { content: "", colSpan: 9, styles: { fillColor: [255, 251, 235] } }
      ]);
    }

    if (revision.usePpn) {
      tableBody.push([
        { content: "PAJAK PERTAMBAHAN NILAI (PPN 11%)", colSpan: 6, styles: { halign: "right", fontStyle: "bold", textColor: [71, 85, 105], fillColor: [248, 250, 252], fontSize: 7 } },
        { content: `Rp ${taxAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42], fillColor: [248, 250, 252], fontSize: 7 } },
        { content: "", colSpan: 9, styles: { fillColor: [248, 250, 252] } }
      ]);
    }

    tableBody.push([
      { content: `GRAND TOTAL PENAWARAN (${revision.usePpn ? "TERMASUK PPN" : "EXCL. PPN"})`, colSpan: 6, styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255], fillColor: [15, 23, 42], fontSize: 7.5 } },
      { content: `Rp ${grandTotalInclPpn.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255], fillColor: [15, 23, 42], fontSize: 7.5 } },
      { content: "", colSpan: 9, styles: { fillColor: [15, 23, 42] } }
    ]);

    autoTable(doc, {
      startY: startY + 2,
      head,
      body: tableBody,
      theme: "plain",
      styles: { fontSize: 6.2, cellPadding: 1.4, lineColor: [226, 232, 240], lineWidth: 0.1, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.6, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [253, 254, 255] },
      columnStyles: {
        0: { halign: "center", cellWidth: 7 },
        1: { halign: "left", cellWidth: 36 },
        2: { halign: "left", cellWidth: 32 },
        3: { halign: "center", cellWidth: 9 },
        4: { halign: "right", cellWidth: 11 },
        5: { halign: "right", cellWidth: 19 },
        6: { halign: "right", cellWidth: 21 },
        7: { halign: "right", cellWidth: 9 },
        8: { halign: "right", cellWidth: 9 },
        9: { halign: "right", cellWidth: 9 },
        10: { halign: "center", cellWidth: 9 },
        11: { halign: "left", cellWidth: 18 },
        12: { halign: "right", cellWidth: 18 },
        13: { halign: "right", cellWidth: 20 },
        14: { halign: "right", cellWidth: 21 },
        15: { halign: "center", cellWidth: 10 },
      },
      margin: { left: 14, right: 14, bottom: 20 },
    });
  } else {
    // Client Proposal View (Refined Executive Portrait Architecture)
    const head = [
      ["No", "Uraian Pekerjaan", "Spesifikasi & Material", "Sat", "Volume", "Harga Satuan", "Total Harga"]
    ];

    revision.sections.forEach((sec, sIdx) => {
      tableBody.push([
        {
          content: sec.sectionName.toUpperCase(),
          colSpan: 7,
          styles: {
            fillColor: [241, 245, 249],
            fontStyle: "bold",
            textColor: [15, 23, 42],
            fontSize: 7.5,
            cellPadding: 2.2,
            halign: "left",
          },
        },
      ]);

      let secTotal = 0;

      sec.items.forEach((item) => {
        const baseTotal = item.specs.reduce((sum, spc) => {
          const isVol = spc.length_l > 0 && spc.height_h > 0;
          const effectiveQty = isVol ? (spc.length_l * spc.height_h * spc.factor) : (item.qty * spc.factor);
          return sum + (effectiveQty * spc.baseCostUnitPrice);
        }, 0);
        const itemMargin = item.profitMarginPercent !== undefined ? item.profitMarginPercent : (sec.profitMarginPercent || 0);
        const costPerUnit = item.qty > 0 ? (baseTotal / item.qty) : baseTotal;
        const sellUnit = costPerUnit * (1 + itemMargin / 100);
        const sellAmount = sellUnit * item.qty;

        secTotal += sellAmount;
        subtotalSelling += sellAmount;

        const specText = item.specs.length > 0 
          ? item.specs.map(s => s.specName).filter(Boolean).join("; ") 
          : "-";

        tableBody.push([
          { content: globalItemNo++, styles: { halign: "center", fontStyle: "normal" } },
          { content: item.description, styles: { halign: "left", fontStyle: "bold", textColor: [15, 23, 42] } },
          { content: specText, styles: { halign: "left", textColor: [71, 85, 105], fontSize: 6.8 } },
          { content: item.unit, styles: { halign: "center" } },
          { content: item.qty.toLocaleString("id-ID"), styles: { halign: "right" } },
          { content: `Rp ${sellUnit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right" } },
          { content: `Rp ${sellAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42] } },
        ]);
      });

      // Section subtotal row
      tableBody.push([
        {
          content: `Subtotal ${sec.sectionName}`,
          colSpan: 6,
          styles: {
            halign: "right",
            fontStyle: "bold",
            textColor: [51, 65, 85],
            fillColor: [248, 250, 252],
            fontSize: 7,
          },
        },
        {
          content: `Rp ${secTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
          styles: {
            halign: "right",
            fontStyle: "bold",
            textColor: [15, 23, 42],
            fillColor: [248, 250, 252],
            fontSize: 7,
          },
        },
      ]);
    });

    const contingencyPercent = revision.contingencyPercent || 0;
    const overheadProfitPercent = revision.overheadProfitPercent || 0;
    const combinedMarkupPercent = contingencyPercent + overheadProfitPercent;
    const overheadContingenciesValue = subtotalSelling * (combinedMarkupPercent / 100);
    const grandTotalExclPpn = subtotalSelling + overheadContingenciesValue;
    const taxAmount = revision.usePpn ? grandTotalExclPpn * 0.11 : 0;
    const grandTotalInclPpn = grandTotalExclPpn + taxAmount;

    // RECAP SUMMARY ROWS (Executive High-Contrast Layout)
    tableBody.push([
      {
        content: "TOTAL NILAI PEKERJAAN (SUBTOTAL)",
        colSpan: 6,
        styles: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59], fillColor: [241, 245, 249], fontSize: 7.5 },
      },
      {
        content: `Rp ${subtotalSelling.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
        styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42], fillColor: [241, 245, 249], fontSize: 7.5 },
      },
    ]);

    if (combinedMarkupPercent > 0) {
      tableBody.push([
        {
          content: `OVERHEAD & KONTINJENSI (${combinedMarkupPercent}%)`,
          colSpan: 6,
          styles: { halign: "right", fontStyle: "bold", textColor: [146, 64, 14], fillColor: [255, 251, 235], fontSize: 7.5 },
        },
        {
          content: `Rp ${overheadContingenciesValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
          styles: { halign: "right", fontStyle: "bold", textColor: [146, 64, 14], fillColor: [255, 251, 235], fontSize: 7.5 },
        },
      ]);
    }

    if (revision.usePpn) {
      tableBody.push([
        {
          content: "PAJAK PERTAMBAHAN NILAI (PPN 11%)",
          colSpan: 6,
          styles: { halign: "right", fontStyle: "bold", textColor: [71, 85, 105], fillColor: [248, 250, 252], fontSize: 7.5 },
        },
        {
          content: `Rp ${taxAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
          styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42], fillColor: [248, 250, 252], fontSize: 7.5 },
        },
      ]);
    }

    tableBody.push([
      {
        content: `GRAND TOTAL PENAWARAN (${revision.usePpn ? "TERMASUK PPN" : "EXCL. PPN"})`,
        colSpan: 6,
        styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255], fillColor: [15, 23, 42], fontSize: 8 },
      },
      {
        content: `Rp ${grandTotalInclPpn.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
        styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255], fillColor: [15, 23, 42], fontSize: 8 },
      },
    ]);

    autoTable(doc, {
      startY: startY + 2,
      head,
      body: tableBody,
      theme: "plain",
      styles: {
        fontSize: 7,
        cellPadding: 2.0,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.4,
      },
      alternateRowStyles: {
        fillColor: [252, 253, 254],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", cellWidth: 55 },
        2: { halign: "left", cellWidth: 42 },
        3: { halign: "center", cellWidth: 11 },
        4: { halign: "right", cellWidth: 16 },
        5: { halign: "right", cellWidth: 24 },
        6: { halign: "right", cellWidth: 26 },
      },
      margin: { left: 14, right: 14, bottom: 20 },
    });

    // Executive Signature & Formal Authorization Block
    const finalY = (doc as any).lastAutoTable?.finalY ?? startY + 50;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    let sigY = finalY + 8;
    if (sigY + 36 > pageHeight - 16) {
      doc.addPage();
      sigY = 22;
    }

    const marginX = 14;
    const colWidth = (pageWidth - marginX * 2 - 24) / 2;

    // Left Signature: Estimator / Project Architect
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text("Diajukan Oleh:", marginX, sigY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text("PT RAKIT KREASI ABADI", marginX, sigY + 4.5);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, sigY + 23, marginX + colWidth, sigY + 23);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text("Estimator & Interior Project Manager", marginX, sigY + 27);

    // Right Signature: Client / Owner
    const clientX = marginX + colWidth + 24;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text("Disetujui & Dikonfirmasi Oleh:", clientX, sigY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(project.ownerName ? project.ownerName.toUpperCase() : "KLIEN / PEMILIK PROYEK", clientX, sigY + 4.5);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(clientX, sigY + 23, clientX + colWidth, sigY + 23);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text("Klien / Pemberi Tugas", clientX, sigY + 27);
  }

  attachPageNumbersAndFooter(doc);
  doc.save(`RAB_Interior_${project.projectCode}_${revision.name.replace(/\s+/g, "_")}.pdf`);
}
