import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Project, RabItemEntry, MasterCostItem, Vendor, ScheduleItem, WeeklyProgressPoint } from "../types";
import { getRakitcoLogoPngDataUrl } from "./rakitcoLogo";
import { setupAptosFont } from "./aptosFont";

export interface HeaderMetadata {
  title: string;
  projectCode?: string;
  projectName?: string;
  clientName?: string;
  date?: string;
  revision?: string;
  location?: string;
  status?: string;
}

/**
 * Standardized RAKITCO Executive Letterhead (Kop Surat) & Document Metadata Box
 */
export async function drawRakitcoLetterhead(
  doc: jsPDF,
  meta: HeaderMetadata,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  // 1. EMBED RAKITCO LOGO IMAGE (From uploaded logo)
  try {
    const logoDataUrl = await getRakitcoLogoPngDataUrl();
    if (logoDataUrl) {
      // Aspect ratio ~ 5:6
      doc.addImage(logoDataUrl, "PNG", marginX, 10, 15, 18);
    }
  } catch (err) {
    console.error("Error embedding logo", err);
  }

  // 2. BRAND TYPOGRAPHY & COMPANY IDENTITY (Refined, balanced proportions)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14); // Refined corporate sizing
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("RAKITCO", marginX + 19, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text("PT Rakit Kreasi Abadi — General Contractor & Interior Architecture", marginX + 19, 21);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Jl. Parung Panjang no.21, Legok, Tangerang | Email: admin@rakitco.com", marginX + 19, 25);

  // Right-aligned Document Classification Tag
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(meta.title.toUpperCase(), pageWidth - marginX, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Doc Ref: RKT-${meta.projectCode || "GEN"}-${new Date().getFullYear()}`, pageWidth - marginX, 21, { align: "right" });

  if (meta.revision) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text(`[ ${meta.revision} ]`, pageWidth - marginX, 25.5, { align: "right" });
  }

  // 3. EXECUTIVE DUAL-ACCENT DIVIDER LINE (Precision architectural rules)
  doc.setDrawColor(30, 41, 59); // Slate 800
  doc.setLineWidth(0.6);
  doc.line(marginX, 29, pageWidth - marginX, 29);

  doc.setDrawColor(37, 99, 235); // Blue 600 accent
  doc.setLineWidth(0.25);
  doc.line(marginX, 30.2, pageWidth - marginX, 30.2);

  // 4. METADATA SUMMARY PANEL
  let currentY = 34;
  if (meta.projectName || meta.projectCode) {
    const boxWidth = pageWidth - marginX * 2;
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, currentY, boxWidth, 16, 1.5, 1.5, "FD");

    const col1LabelX = marginX + 4;
    const col1ValX = marginX + 32;
    const col2LabelX = marginX + boxWidth * 0.52;
    const col2ValX = col2LabelX + 32;

    // Row 1: Project Name & Client / Owner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PROJECT NAME:", col1LabelX, currentY + 5.5);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.text(meta.projectName || "-", col1ValX, currentY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CLIENT / OWNER:", col2LabelX, currentY + 5.5);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.text(meta.clientName || "-", col2ValX, currentY + 5.5);

    // Row 2: Project Location & Date / Revision
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PROJECT LOCATION:", col1LabelX, currentY + 11.5);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.text(meta.location || "-", col1ValX, currentY + 11.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("DATE & REVISION:", col2LabelX, currentY + 11.5);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.text(`${meta.date || new Date().toLocaleDateString("id-ID")} • ${meta.revision || "Rev.01"}`, col2ValX, currentY + 11.5);

    currentY += 19;
  }

  return currentY;
}

/**
 * Standard Running Footer with Page Numbers ("Page X of Y") & Legal Disclaimer
 */
export function attachPageNumbersAndFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    // Footer content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text("Dokumen resmi RAKITCO Architecture & Construction. Dicetak melalui Universal Document Automation Engine.", marginX, pageHeight - 8);

    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
  }
}

/**
 * 1. EXPORT RAB TO PDF WITH CORPORATE LETTERHEAD
 */
export async function exportRabToPdf(
  project: Project,
  rabItems: RabItemEntry[],
  categoriesList: string[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Ensure identical font family across exports
  await setupAptosFont(doc);

  const startY = await drawRakitcoLetterhead(doc, {
    title: "Rencana Anggaran Biaya (RAB)",
    projectCode: project.projectCode,
    projectName: project.name,
    clientName: project.ownerName,
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    revision: project.activeRevisionNumber || "Rev.01",
    location: project.location,
    status: project.status,
  });

  // Prepare table rows grouped by Header Section (e.g. Lantai 1, Lantai 2, Area Ruang Tamu, etc.)
  const tableBody: any[] = [];
  
  // Extract ordered unique sections from rabItems
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

  let globalItemNo = 1;
  let subtotalRealCost = 0;

  const head = [
    ["No", "Uraian Pekerjaan", "Spesifikasi & Material", "Sat", "Volume", "Harga Satuan", "Total Harga"]
  ];

  sectionsInItems.forEach((secName, sIdx) => {
    const itemsInSec = rabItems.filter((i) => (i.sectionName?.trim() || "Lantai 1") === secName);
    if (itemsInSec.length === 0) return;

    // Header section bar (matching Interior RAB export font size 7.5, bold, padding 2.2)
    tableBody.push([
      {
        content: secName.toUpperCase(),
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
    itemsInSec.forEach((item) => {
      const vol = Number(item.volume) || 0;
      const price = Number(item.unitPrice) || 0;
      const lineTotal = item.totalPrice || vol * price;
      secTotal += lineTotal;
      subtotalRealCost += lineTotal;

      const specList = [
        item.specification,
        ...(item.specRows || []).map((s) => s.specName),
      ].filter(Boolean);
      const specDisplay = specList.length > 1
        ? specList.map((s, i) => `${i + 1}. ${s}`).join("\n")
        : (specList[0] || "-");

      tableBody.push([
        { content: globalItemNo++, styles: { halign: "center", fontStyle: "normal" } },
        { content: item.itemName, styles: { halign: "left", fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: specDisplay, styles: { halign: "left", textColor: [71, 85, 105], fontSize: 6.8 } },
        { content: item.unit, styles: { halign: "center" } },
        { content: vol.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
        { content: `Rp ${price.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right" } },
        { content: `Rp ${lineTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, styles: { halign: "right", fontStyle: "bold", textColor: [15, 23, 42] } },
      ]);
    });

    // Section Subtotal row (matching Interior RAB export font size 7)
    tableBody.push([
      {
        content: `Subtotal ${secName}`,
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

  // RECAP SUMMARY ROWS (Matching Interior RAB export Executive High-Contrast Layout)
  const contingencyPercent = project.contingencyPercent || 0;
  const overheadProfitPercent = project.overheadProfitPercent || 0;
  const combinedMarkupPercent = contingencyPercent + overheadProfitPercent;
  const overheadContingenciesValue = subtotalRealCost * (combinedMarkupPercent / 100);
  const grandTotalExclPpn = subtotalRealCost + overheadContingenciesValue;
  const usePpn = project.taxPercent !== undefined ? project.taxPercent > 0 : true;
  const taxAmount = usePpn ? grandTotalExclPpn * 0.11 : 0;
  const grandTotalInclPpn = grandTotalExclPpn + taxAmount;

  tableBody.push([
    {
      content: "TOTAL NILAI PEKERJAAN (SUBTOTAL)",
      colSpan: 6,
      styles: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59], fillColor: [241, 245, 249], fontSize: 7.5 },
    },
    {
      content: `Rp ${subtotalRealCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
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

  if (usePpn) {
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
      content: `GRAND TOTAL PENAWARAN (${usePpn ? "TERMASUK PPN" : "EXCL. PPN"})`,
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

  // Executive Signature & Formal Authorization Block (identical to Interior export)
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
  doc.text("Estimator & Project QS Engineer", marginX, sigY + 27);

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

  attachPageNumbersAndFooter(doc);
  doc.save(`RAB_${project.projectCode}_${project.name.replace(/\s+/g, "_")}.pdf`);
}

/**
 * 2. EXPORT MASTER DATABASE TO PDF
 */
export async function exportMasterDatabaseToPdf(masterItems: MasterCostItem[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const startY = await drawRakitcoLetterhead(doc, {
    title: "Master Database AHS Standar",
    projectName: "Single Source of Truth (Kompilasi Standar Biaya)",
    projectCode: "MDB-AHS",
    clientName: "Internal RAKITCO Estimator",
    date: new Date().toLocaleDateString("id-ID"),
    status: `${masterItems.length} Item Terdaftar`,
  });

  const body = masterItems.map((item, idx) => {
    const spec = item.specifications?.[0];
    const unit = spec?.unit || "ls";
    const price = spec?.unitPrice || 0;
    return [
      idx + 1,
      item.itemCode,
      item.ahsCode,
      item.itemName,
      item.category,
      unit,
      `Rp ${price.toLocaleString("id-ID")}`,
    ];
  });

  autoTable(doc, {
    startY: startY + 2,
    head: [["No", "Kode Item", "Kode AHS", "Nama Pekerjaan", "Kategori", "Sat", "Harga Satuan"]],
    body,
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "left", cellWidth: "auto" },
      4: { halign: "left", cellWidth: 32 },
      5: { halign: "center", cellWidth: 12 },
      6: { halign: "right", cellWidth: 26 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  attachPageNumbersAndFooter(doc);
  doc.save("RAKITCO_Master_Database_AHS.pdf");
}

/**
 * 3. EXPORT VENDOR DIRECTORY TO PDF
 */
export async function exportVendorListToPdf(vendors: Vendor[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const startY = await drawRakitcoLetterhead(doc, {
    title: "Direktori Vendor & Rekanan",
    projectName: "Daftar Supplier, Spesialis & Sub-Kontraktor",
    projectCode: "VND-DIR",
    clientName: "Procurement RAKITCO",
    date: new Date().toLocaleDateString("id-ID"),
    status: `${vendors.length} Vendor Terverifikasi`,
  });

  const body = vendors.map((v, idx) => [
    idx + 1,
    v.name,
    v.category,
    v.contactPerson,
    v.phoneNumber,
    v.email,
    v.address,
  ]);

  autoTable(doc, {
    startY: startY + 2,
    head: [["No", "Nama Vendor", "Kategori", "Contact Person", "Telepon", "Email", "Alamat"]],
    body,
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "left", cellWidth: 34 },
      2: { halign: "left", cellWidth: 30 },
      3: { halign: "left", cellWidth: 24 },
      4: { halign: "left", cellWidth: 22 },
      5: { halign: "left", cellWidth: 28 },
      6: { halign: "left", cellWidth: "auto" },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  attachPageNumbersAndFooter(doc);
  doc.save("RAKITCO_Vendor_Directory.pdf");
}

/**
 * 4. EXPORT MASTER PROJECT LIST TO PDF
 */
export async function exportProjectListToPdf(projects: Project[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPortfolio = projects.reduce((acc, p) => acc + (p.grandTotal || 0), 0);

  const startY = await drawRakitcoLetterhead(doc, {
    title: "Executive Project Portfolio",
    projectName: "Master Manajemen & Monitoring Seluruh Proyek",
    projectCode: "PRJ-PORTFOLIO",
    clientName: "Executive Board",
    date: new Date().toLocaleDateString("id-ID"),
    status: `Portfolio Total: Rp ${totalPortfolio.toLocaleString("id-ID")}`,
  });

  const body = projects.map((p, idx) => [
    idx + 1,
    p.projectCode,
    p.name,
    p.ownerName || "-",
    p.status,
    p.location || "-",
    `${p.requirements?.buildingArea || 0} m²`,
    `Rp ${(p.grandTotal || 0).toLocaleString("id-ID")}`,
  ]);

  autoTable(doc, {
    startY: startY + 2,
    head: [["No", "Kode", "Nama Proyek", "Klien", "Status", "Lokasi", "Luas", "Nilai Kontrak / BoQ"]],
    body,
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "left", cellWidth: "auto" },
      3: { halign: "left", cellWidth: 26 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "left", cellWidth: 24 },
      6: { halign: "right", cellWidth: 14 },
      7: { halign: "right", cellWidth: 32 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  attachPageNumbersAndFooter(doc);
  doc.save("RAKITCO_Master_Project_List.pdf");
}

/**
 * 4B. EXPORT RAB LIST SCREEN TO PDF (EXACT UI TABLE ALIGNMENT)
 * Mirrors the exact columns and dataset displayed on the RAB List UI screen:
 * - Kode Proyek
 * - Nama Proyek & Versi RAB Terkini (Latest)
 * - Klien / Pemilik & Lokasi
 * - Riwayat Versi (Tree Count)
 * - Work Items Count
 * - Nilai RAB Terkini (BoQ)
 */
export async function exportRabListToPdf(projects: Project[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Calculate portfolio totals
  const totalPortfolioBoQ = projects.reduce((sum, p) => {
    const revs = p.revisions && p.revisions.length > 0 ? p.revisions : [];
    const latest = revs.find((r) => r.isLatest) || revs[revs.length - 1];
    return sum + (latest?.grandTotal || p.grandTotal || 0);
  }, 0);

  const totalRevisions = projects.reduce((sum, p) => {
    return sum + (p.revisions?.length || 1);
  }, 0);

  const startY = await drawRakitcoLetterhead(doc, {
    title: "Daftar Portofolio RAB & Riwayat Revisi",
    projectName: "RAB Project Master Directory",
    projectCode: "RAB-DIR",
    clientName: "PT Rakit Kreasi Abadi",
    location: "Seluruh Wilayah Kerja Proyek",
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  });

  // KPI Summary Bar
  let currentY = startY + 2;
  const boxW = (pageWidth - 28) / 3;
  const kpis = [
    { label: "TOTAL NILAI PORTOFOLIO (BOQ)", value: `Rp ${totalPortfolioBoQ.toLocaleString("id-ID")}`, color: [29, 78, 216] },
    { label: "TOTAL PROYEK AKTIF", value: `${projects.length} Proyek`, color: [15, 23, 42] },
    { label: "TOTAL VERSI REVISI TERSIMPAN", value: `${totalRevisions} Versi RAB`, color: [79, 70, 229] },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = 14 + idx * boxW;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(kpiX, currentY, boxW - 2, 12, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 3, currentY + 4.5);

    doc.setFontSize(8.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, kpiX + 3, currentY + 9.5);
  });

  currentY += 15;

  // Build table rows mirroring the RAB List UI
  const tableBody = projects.map((p, idx) => {
    const revs = p.revisions && p.revisions.length > 0 ? p.revisions : [];
    const latest = revs.find((r) => r.isLatest) || revs[revs.length - 1];
    const revNumber = latest?.revisionNumber || "Rev.01";
    const revTitle = latest?.title || "Initial Draft BoQ";
    const revCount = revs.length || 1;
    const itemsCount = latest?.itemCount || p.items?.length || 0;
    const amount = latest?.grandTotal || p.grandTotal || 0;

    return [
      idx + 1,
      p.projectCode,
      `${p.name}\n[RAB ${revNumber} (Latest) - ${revTitle}]`,
      `${p.ownerName || "-"}\n${p.location || "-"}`,
      `${revCount} Versi`,
      `${itemsCount} item`,
      `Rp ${amount.toLocaleString("id-ID")}`,
    ];
  });

  // Summary Row at the bottom
  tableBody.push([
    "",
    "",
    "TOTAL NILAI PEKERJAAN (PORTOFOLIO BOQ)",
    "",
    `${totalRevisions} Versi`,
    "",
    `Rp ${totalPortfolioBoQ.toLocaleString("id-ID")}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["No", "Kode Proyek", "Nama Proyek & Versi Terkini (Latest)", "Klien / Lokasi", "Riwayat", "Item", "Nilai RAB (BoQ)"]],
    body: tableBody,
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2.2, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "left", cellWidth: "auto" },
      3: { halign: "left", cellWidth: 38 },
      4: { halign: "center", cellWidth: 18 },
      5: { halign: "center", cellWidth: 16 },
      6: { halign: "right", cellWidth: 32 },
    },
    didParseCell: (data) => {
      // Style the final summary row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [239, 246, 255]; // Light blue fill
        if (data.column.index === 2 || data.column.index === 6) {
          data.cell.styles.textColor = [29, 78, 216];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  attachPageNumbersAndFooter(doc);
  doc.save("RAKITCO_Daftar_RAB_List.pdf");
}

/**
 * 5. EXPORT SCHEDULE & PROGRESS TO PDF WITH EMBEDDED S-CURVE PROGRESS SNAPSHOT
 */
export async function exportScheduleToPdf(
  project: Project,
  scheduleItems: ScheduleItem[],
  progressPoints?: WeeklyProgressPoint[]
) {
  // Landscape A4 for wide Schedule WBS & S-Curve chart
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const startY = await drawRakitcoLetterhead(
    doc,
    {
      title: "Jadwal & Kurva S Progress",
      projectName: project.name,
      projectCode: project.projectCode,
      clientName: project.ownerName,
      date: new Date().toLocaleDateString("id-ID"),
      revision: project.activeRevisionNumber || "Rev.01",
      location: project.location,
      status: project.status,
    },
    "landscape"
  );

  let currentY = startY + 2;

  // EMBED S-CURVE PROGRESS CHART SNAPSHOT
  // Draw an executive programmatic S-Curve visual canvas directly onto PDF
  const weeksCount = project.requirements?.estimatedDurationWeeks || 12;
  const effectivePoints: WeeklyProgressPoint[] = progressPoints && progressPoints.length > 0
    ? progressPoints
    : Array.from({ length: weeksCount }, (_, i) => {
        const w = i + 1;
        const x = (w / weeksCount) * 10 - 5;
        const sigmoid = 1 / (1 + Math.exp(-0.85 * x));
        const planned = Math.round(sigmoid * 100);
        return {
          week: w,
          plannedCumulative: planned,
          actualCumulative: w <= Math.ceil(weeksCount * 0.4) ? Math.round(planned * 0.95) : null,
        };
      });

  if (effectivePoints.length > 0) {
    const chartX = 14;
    const chartY = currentY;
    const chartWidth = pageWidth - 28;
    const chartHeight = 44;

    // Chart Card Container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, "FD");

    // Header of chart card
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("KURVA S — TARGET PROGRESS VS REALISASI LAPANGAN", chartX + 4, chartY + 5.5);

    // Legend
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(chartX + chartWidth - 75, chartY + 2.5, 4, 2.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("Planned S-Curve (Target)", chartX + chartWidth - 69, chartY + 4.5);

    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(chartX + chartWidth - 35, chartY + 2.5, 4, 2.5, "F");
    doc.text("Actual Progress", chartX + chartWidth - 29, chartY + 4.5);

    // Chart grid axes
    const plotX = chartX + 10;
    const plotY = chartY + 8;
    const plotW = chartWidth - 16;
    const plotH = chartHeight - 14;

    // Horizontal grid lines (0%, 25%, 50%, 75%, 100%)
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    for (let p = 0; p <= 100; p += 25) {
      const yPos = plotY + plotH - (p / 100) * plotH;
      doc.line(plotX, yPos, plotX + plotW, yPos);
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(`${p}%`, plotX - 2, yPos + 1.5, { align: "right" });
    }

    // Plot Points & Connecting Lines
    const stepX = plotW / Math.max(effectivePoints.length - 1, 1);

    // Planned Line (Blue)
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    for (let i = 0; i < effectivePoints.length - 1; i++) {
      const x1 = plotX + i * stepX;
      const y1 = plotY + plotH - (effectivePoints[i].plannedCumulative / 100) * plotH;
      const x2 = plotX + (i + 1) * stepX;
      const y2 = plotY + plotH - (effectivePoints[i + 1].plannedCumulative / 100) * plotH;
      doc.line(x1, y1, x2, y2);
    }

    // Actual Line (Emerald)
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.9);
    for (let i = 0; i < effectivePoints.length - 1; i++) {
      const p1 = effectivePoints[i];
      const p2 = effectivePoints[i + 1];
      if (p1.actualCumulative === null || p2.actualCumulative === null) continue;

      const x1 = plotX + i * stepX;
      const y1 = plotY + plotH - (p1.actualCumulative / 100) * plotH;
      const x2 = plotX + (i + 1) * stepX;
      const y2 = plotY + plotH - (p2.actualCumulative / 100) * plotH;
      doc.line(x1, y1, x2, y2);
    }

    // Draw circles on data points & Week Labels
    effectivePoints.forEach((pt, i) => {
      const x = plotX + i * stepX;
      const yPlan = plotY + plotH - (pt.plannedCumulative / 100) * plotH;

      doc.setFillColor(37, 99, 235);
      doc.circle(x, yPlan, 0.7, "F");

      if (pt.actualCumulative !== null) {
        const yAct = plotY + plotH - (pt.actualCumulative / 100) * plotH;
        doc.setFillColor(16, 185, 129);
        doc.circle(x, yAct, 0.9, "F");
      }

      // X-Axis Week Label
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`W${pt.week}`, x, plotY + plotH + 4, { align: "center" });
    });

    currentY += chartHeight + 4;
  }

  // WBS DATA TABLE
  const body = scheduleItems.map((item) => {
    let durationDays = 14;
    if (item.plannedStartDate && item.plannedEndDate) {
      const diffMs = new Date(item.plannedEndDate).getTime() - new Date(item.plannedStartDate).getTime();
      durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    const planned = Number(item.targetProgressPercent) || 0;
    const actual = Number(item.actualProgressPercent) || 0;
    const dev = actual - planned;
    return [
      item.wbsCode,
      item.taskName,
      item.category,
      `${(Number(item.weightPercent) || 0).toFixed(2)}%`,
      item.plannedStartDate || item.startDate || "-",
      item.plannedEndDate || item.endDate || "-",
      `${durationDays} hr`,
      `${planned.toFixed(2)}%`,
      `${actual.toFixed(2)}%`,
      `${dev > 0 ? "+" : ""}${dev.toFixed(2)}%`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["WBS", "Uraian Pekerjaan", "Kategori", "Bobot (%)", "Tgl Mulai", "Tgl Selesai", "Durasi", "Target", "Realisasi", "Deviasi"]],
    body,
    theme: "striped",
    styles: { fontSize: 7, cellPadding: 1.8, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 14 },
      1: { halign: "left", cellWidth: "auto" },
      2: { halign: "left", cellWidth: 32 },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "center", cellWidth: 20 },
      6: { halign: "center", cellWidth: 14 },
      7: { halign: "right", cellWidth: 18 },
      8: { halign: "right", cellWidth: 18 },
      9: { halign: "right", cellWidth: 18 },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  attachPageNumbersAndFooter(doc);
  doc.save(`Schedule_${project.projectCode}_${project.name.replace(/\s+/g, "_")}.pdf`);
}
