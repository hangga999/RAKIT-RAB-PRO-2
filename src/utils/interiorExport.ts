import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { InteriorProject, InteriorRABRevision, InteriorRABSection } from "../types";
import { drawRakitcoLetterhead, attachPageNumbersAndFooter } from "./pdfExport";

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

// ---------------- EXCEL EXPORT ----------------
export async function exportInteriorToExcel(
  project: InteriorProject,
  revision: InteriorRABRevision,
  includeInternal: boolean
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RAKITCO Engine";
  const sheet = workbook.addWorksheet("Interior RAB");

  sheet.columns = includeInternal 
    ? [
        { header: "No", width: 5 },
        { header: "Item Description", width: 30 },
        { header: "Specification", width: 30 },
        { header: "Unit", width: 10 },
        { header: "Qty", width: 10 },
        { header: "Unit Price (Sell)", width: 20 },
        { header: "Amount (Sell)", width: 20 },
        { header: "Length (L)", width: 12 },
        { header: "Width (W)", width: 12 },
        { header: "Height (H)", width: 12 },
        { header: "Factor", width: 12 },
        { header: "Model", width: 15 },
        { header: "Base Cost / Unit", width: 20 },
        { header: "Base Amount", width: 20 },
        { header: "Total Base (HPP)", width: 20 },
        { header: "% Profit", width: 12 }
      ]
    : [
        { header: "No", width: 5 },
        { header: "Item Description", width: 40 },
        { header: "Specification", width: 40 },
        { header: "Unit", width: 10 },
        { header: "Qty", width: 10 },
        { header: "Unit Price", width: 25 },
        { header: "Total Amount", width: 25 }
      ];

  revision.sections.forEach((sec, sIdx) => {
    const subRow = sheet.addRow(
      includeInternal
        ? ["", sec.sectionName, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        : ["", sec.sectionName, "", "", "", "", ""]
    );
    subRow.font = { bold: true };

    sec.items.forEach((item, iIdx) => {
      // Calculate item values
      const baseTotal = item.specs.reduce((sum, spc) => sum + (spc.length_l > 0 && spc.height_h > 0 ? (spc.length_l * spc.height_h * spc.factor) : (item.qty * spc.factor)) * spc.baseCostUnitPrice, 0);
      const itemMargin = item.profitMarginPercent !== undefined ? item.profitMarginPercent : sec.profitMarginPercent;
      const sellUnit = baseTotal * (1 + itemMargin / 100);
      const sellAmount = sellUnit * item.qty;

      const mainRow = sheet.addRow(
        includeInternal
          ? [iIdx + 1, item.description, "", item.unit, item.qty, sellUnit, sellAmount, "", "", "", "", "", "", "", baseTotal, `${itemMargin}%`]
          : [iIdx + 1, item.description, "", item.unit, item.qty, sellUnit, sellAmount]
      );
      mainRow.font = { bold: true };

      item.specs.forEach((spc) => {
        const spcBaseAmt = (spc.length_l > 0 && spc.height_h > 0 ? (spc.length_l * spc.height_h * spc.factor) : (item.qty * spc.factor)) * spc.baseCostUnitPrice;
        sheet.addRow(
          includeInternal
            ? ["", "", spc.specName, "", "", "", "", spc.length_l, spc.width_w, spc.height_h, spc.factor, spc.model, spc.baseCostUnitPrice, spcBaseAmt, "", ""]
            : ["", "", spc.specName, "", "", "", ""]
        );
      });
    });
  });

  downloadWorkbook(workbook, `RAB_Interior_${project.projectCode}_${revision.name}.xlsx`);
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
          content: `SEKSI ${sIdx + 1}: ${sec.sectionName.toUpperCase()}`, 
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
          content: `SEKSI ${sIdx + 1}: ${sec.sectionName.toUpperCase()}`,
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
