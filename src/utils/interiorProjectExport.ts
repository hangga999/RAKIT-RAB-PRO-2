import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InteriorProject } from "../types";
import { getRakitcoLogoPngDataUrl } from "./rakitcoLogo";

function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
}

export async function exportInteriorProjectListToExcel(projects: InteriorProject[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Interior Projects");
  
  sheet.columns = [
    { header: "No", width: 5 },
    { header: "Project Code", width: 20 },
    { header: "Name", width: 40 },
    { header: "Owner", width: 30 },
    { header: "Location", width: 30 }
  ];

  projects.forEach((proj, i) => {
    sheet.addRow([i + 1, proj.projectCode, proj.name, proj.ownerName, proj.location]);
  });
  
  downloadWorkbook(workbook, `RAKITCO_Interior_Projects.xlsx`);
}

export async function exportInteriorProjectListToPdf(projects: InteriorProject[]) {
  const doc = new jsPDF("portrait", "mm", "a4");
  const marginX = 14;

  try {
    const logoData = await getRakitcoLogoPngDataUrl();
    doc.addImage(logoData, "PNG", marginX, 10, 40, 12);
  } catch(e) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INTERIOR PROJECT LIST", marginX, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated Date: ${new Date().toLocaleDateString('id-ID')}`, marginX, 42);

  const head = [["No", "Project Code", "Name", "Owner", "Location"]];
  const body = projects.map((p, i) => [i + 1, p.projectCode, p.name, p.ownerName, p.location]);

  autoTable(doc, {
    startY: 48,
    head: head,
    body: body,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59] }
  });

  doc.save(`RAKITCO_Interior_Projects.pdf`);
}
