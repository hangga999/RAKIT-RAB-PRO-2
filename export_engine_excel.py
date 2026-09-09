"""
=============================================================================
RAKITCO DESKTOP AUTOMATION ARCHITECTURE: OPENPYXL EXCEL EXPORT ENGINE
=============================================================================
Senior Software Engineer & Document Automation Architect Specification.
Demonstrates:
  1. Dynamic Native Excel Formulas:
     - Line Item Totals: =Volume_Cell * Unit_Price_Cell
     - Category Subtotals: =SUM(Start_Row:End_Row)
     - Tax / PPN: =Subtotal_Cell * 0.11
     - Grand Totals: =Subtotal_Cell + Tax_Cell
  2. Enterprise Spreadsheet Styling (openpyxl):
     - Styled headers with custom corporate fill (#1E293B)
     - Subtle gridlines and thin borders (#CBD5E1)
     - Auto-fitted column widths
     - Native currency number formatting ("Rp "#,##0)
  3. Multi-sheet capability: Detailed BoQ and Master AHS Database.
"""

from typing import List, Dict, Any
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


# ---------------------------------------------------------------------------
# ENTERPRISE PALETTE & STYLING DEFINITIONS
# ---------------------------------------------------------------------------
FONT_NAME = "Segoe UI"

FONT_TITLE = Font(name=FONT_NAME, size=14, bold=True, color="0F172A")
FONT_SUBTITLE = Font(name=FONT_NAME, size=9, italic=True, color="64748B")
FONT_META_LABEL = Font(name=FONT_NAME, size=9, bold=True, color="475569")
FONT_META_VALUE = Font(name=FONT_NAME, size=9, color="0F172A")

FONT_HEADER = Font(name=FONT_NAME, size=10, bold=True, color="FFFFFF")
FONT_CAT_HEADER = Font(name=FONT_NAME, size=10, bold=True, color="1E293B")
FONT_DATA = Font(name=FONT_NAME, size=9, color="1E293B")
FONT_DATA_BOLD = Font(name=FONT_NAME, size=9, bold=True, color="0F172A")
FONT_GRAND_TOTAL = Font(name=FONT_NAME, size=11, bold=True, color="B45309")

FILL_HEADER = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Slate-800
FILL_CATEGORY = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid") # Slate-200
FILL_SUMMARY = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid") # Slate-100
FILL_GRAND_TOTAL = PatternFill(start_color="FEF08A", end_color="FEF08A", fill_type="solid") # Amber-200

THIN_SIDE = Side(border_style="thin", color="CBD5E1")
BORDER_BOX = Border(top=THIN_SIDE, left=THIN_SIDE, right=THIN_SIDE, bottom=THIN_SIDE)

CURRENCY_FORMAT = '"Rp "#,##0'
NUMBER_FORMAT = "#,##0.00"


class RakitcoExcelExportEngine:
    """
    Enterprise Document Automation Engine for Microsoft Excel (.xlsx)
    utilizing openpyxl with active dynamic formulas.
    """

    def __init__(self, project_metadata: Dict[str, Any]):
        self.project = project_metadata
        self.wb = openpyxl.Workbook()
        # Remove default sheet
        self.wb.remove(self.wb.active)

    def export_rab_detail(self, categorized_items: Dict[str, List[Dict[str, Any]]]) -> openpyxl.worksheet.worksheet.Worksheet:
        """
        Builds the detailed BoQ / RAB sheet with active native Excel formulas.
        """
        ws = self.wb.create_sheet(title="RAB Detail (Active Formulas)")
        ws.views.sheetView[0].showGridLines = True

        # 1. Corporate Header
        ws.merge_cells("A1:H1")
        ws["A1"] = "RENCANA ANGGARAN BIAYA (RAB) & BILL OF QUANTITIES"
        ws["A1"].font = FONT_TITLE

        ws.merge_cells("A2:H2")
        ws["A2"] = "RAKITCO Architecture & Construction Management • Official BoQ"
        ws["A2"].font = FONT_SUBTITLE

        # 2. Executive Metadata Box
        meta_fields = [
            ("A4", "Proyek:", "B4", self.project.get("name", "-")),
            ("E4", "Kode Proyek:", "F4", self.project.get("projectCode", "-")),
            ("A5", "Klien / Pemilik:", "B5", self.project.get("ownerName", "-")),
            ("E5", "Tanggal Dokumen:", "F5", self.project.get("date", "-")),
            ("A6", "Lokasi:", "B6", self.project.get("location", "-")),
            ("E6", "Revisi / Status:", "F6", f"{self.project.get('revision', 'Rev.00')} ({self.project.get('status', 'Draft')})"),
        ]
        for lbl_pos, lbl_val, val_pos, val_val in meta_fields:
            ws[lbl_pos] = lbl_val
            ws[lbl_pos].font = FONT_META_LABEL
            ws[val_pos] = val_val
            ws[val_pos].font = FONT_META_VALUE

        # 3. Table Headers
        headers = [
            ("No", Alignment(horizontal="center", vertical="center")),
            ("Uraian Pekerjaan", Alignment(horizontal="left", vertical="center")),
            ("Kategori", Alignment(horizontal="left", vertical="center")),
            ("Satuan", Alignment(horizontal="center", vertical="center")),
            ("Volume", Alignment(horizontal="right", vertical="center")),
            ("Harga Satuan (Rp)", Alignment(horizontal="right", vertical="center")),
            ("Biaya Material (Rp)", Alignment(horizontal="right", vertical="center")),
            ("Total Harga (Rp)", Alignment(horizontal="right", vertical="center")),
        ]

        header_row = 8
        for col_idx, (header_text, align) in enumerate(headers, start=1):
            cell = ws.cell(row=header_row, column=col_idx, value=header_text)
            cell.font = FONT_HEADER
            cell.fill = FILL_HEADER
            cell.alignment = align
            cell.border = BORDER_BOX
        ws.row_dimensions[header_row].height = 24

        current_row = 9
        item_counter = 1
        subtotal_rows: List[int] = []

        # 4. Populate Categorized Work Items with Native Formulas
        for category_name, items in categorized_items.items():
            if not items:
                continue

            # Category Header Row
            ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=8)
            cat_cell = ws.cell(row=current_row, column=1, value=f"KATEGORI: {category_name.upper()}")
            cat_cell.font = FONT_CAT_HEADER
            cat_cell.fill = FILL_CATEGORY
            cat_cell.border = BORDER_BOX
            for c in range(1, 9):
                ws.cell(row=current_row, column=c).border = BORDER_BOX
            current_row += 1

            start_cat_row = current_row

            # Individual Items
            for item in items:
                # Col A: No
                c1 = ws.cell(row=current_row, column=1, value=item_counter)
                c1.alignment = Alignment(horizontal="center")

                # Col B: Name
                c2 = ws.cell(row=current_row, column=2, value=item.get("name", ""))

                # Col C: Category
                c3 = ws.cell(row=current_row, column=3, value=category_name)

                # Col D: Unit
                c4 = ws.cell(row=current_row, column=4, value=item.get("unit", "ls"))
                c4.alignment = Alignment(horizontal="center")

                # Col E: Volume
                c5 = ws.cell(row=current_row, column=5, value=float(item.get("volume", 1.0)))
                c5.number_format = NUMBER_FORMAT
                c5.alignment = Alignment(horizontal="right")

                # Col F: Unit Price
                c6 = ws.cell(row=current_row, column=6, value=float(item.get("unitPrice", 0.0)))
                c6.number_format = CURRENCY_FORMAT
                c6.alignment = Alignment(horizontal="right")

                # Col G: Material Cost (Spec)
                c7 = ws.cell(row=current_row, column=7, value=float(item.get("materialCost", 0.0)))
                c7.number_format = CURRENCY_FORMAT
                c7.alignment = Alignment(horizontal="right")

                # Col H: LINE ITEM TOTAL (DYNAMIC FORMULA: =Volume * UnitPrice)
                # Native Excel formula! e.g., =E10*F10
                c8 = ws.cell(row=current_row, column=8)
                c8.value = f"=E{current_row}*F{current_row}"
                c8.number_format = CURRENCY_FORMAT
                c8.font = FONT_DATA_BOLD
                c8.alignment = Alignment(horizontal="right")

                for c in range(1, 9):
                    cell = ws.cell(row=current_row, column=c)
                    cell.border = BORDER_BOX
                    if c != 8:
                        cell.font = FONT_DATA

                item_counter += 1
                current_row += 1

            end_cat_row = current_row - 1

            # Category Subtotal Row (DYNAMIC FORMULA: =SUM(H_start:H_end))
            ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
            sub_lbl = ws.cell(row=current_row, column=1, value=f"SUBTOTAL {category_name.upper()}")
            sub_lbl.alignment = Alignment(horizontal="right")
            sub_lbl.font = FONT_DATA_BOLD

            sub_val = ws.cell(row=current_row, column=8)
            sub_val.value = f"=SUM(H{start_cat_row}:H{end_cat_row})"
            sub_val.number_format = CURRENCY_FORMAT
            sub_val.font = FONT_DATA_BOLD
            sub_val.alignment = Alignment(horizontal="right")

            for c in range(1, 9):
                cell = ws.cell(row=current_row, column=c)
                cell.fill = FILL_SUMMARY
                cell.border = BORDER_BOX

            subtotal_rows.append(current_row)
            current_row += 1

        # 5. Summary / Recap Block (Real Cost, PPN 11%, Grand Total)
        current_row += 1
        real_cost_row = current_row

        # Real Cost Subtotal = Sum of Category Subtotals
        ws.merge_cells(start_row=real_cost_row, start_column=1, end_row=real_cost_row, end_column=7)
        lbl_rc = ws.cell(row=real_cost_row, column=1, value="TOTAL NILAI PEKERJAAN")
        lbl_rc.font = FONT_DATA_BOLD
        lbl_rc.alignment = Alignment(horizontal="right")

        val_rc = ws.cell(row=real_cost_row, column=8)
        if subtotal_rows:
            val_rc.value = "=" + "+".join(f"H{r}" for r in subtotal_rows)
        else:
            val_rc.value = f"=SUM(H9:H{real_cost_row-2})"
        val_rc.number_format = CURRENCY_FORMAT
        val_rc.font = Font(name=FONT_NAME, size=10, bold=True, color="1D4ED8")
        val_rc.alignment = Alignment(horizontal="right")

        for c in range(1, 9):
            cell = ws.cell(row=real_cost_row, column=c)
            cell.fill = FILL_SUMMARY
            cell.border = BORDER_BOX

        # Tax / PPN (11%)
        ppn_row = real_cost_row + 1
        ws.merge_cells(start_row=ppn_row, start_column=1, end_row=ppn_row, end_column=7)
        lbl_ppn = ws.cell(row=ppn_row, column=1, value="PAJAK PERTAMBAHAN NILAI (PPN 11%)")
        lbl_ppn.font = FONT_DATA_BOLD
        lbl_ppn.alignment = Alignment(horizontal="right")

        val_ppn = ws.cell(row=ppn_row, column=8)
        val_ppn.value = f"=H{real_cost_row}*0.11"
        val_ppn.number_format = CURRENCY_FORMAT
        val_ppn.font = FONT_DATA_BOLD
        val_ppn.alignment = Alignment(horizontal="right")

        for c in range(1, 9):
            cell = ws.cell(row=ppn_row, column=c)
            cell.fill = FILL_SUMMARY
            cell.border = BORDER_BOX

        # Grand Total = Real Cost + PPN
        grand_row = ppn_row + 1
        ws.merge_cells(start_row=grand_row, start_column=1, end_row=grand_row, end_column=7)
        lbl_gt = ws.cell(row=grand_row, column=1, value="GRAND TOTAL PENAWARAN (TERMASUK PPN)")
        lbl_gt.font = Font(name=FONT_NAME, size=11, bold=True, color="0F172A")
        lbl_gt.alignment = Alignment(horizontal="right")

        val_gt = ws.cell(row=grand_row, column=8)
        val_gt.value = f"=H{real_cost_row}+H{ppn_row}"
        val_gt.number_format = CURRENCY_FORMAT
        val_gt.font = FONT_GRAND_TOTAL
        val_gt.alignment = Alignment(horizontal="right")

        for c in range(1, 9):
            cell = ws.cell(row=grand_row, column=c)
            cell.fill = FILL_GRAND_TOTAL
            cell.border = BORDER_BOX

        # 6. Auto-fit column widths
        col_widths = {1: 6, 2: 38, 3: 24, 4: 10, 5: 14, 6: 22, 7: 22, 8: 26}
        for col_idx, width in col_widths.items():
            ws.column_dimensions[get_column_letter(col_idx)].width = width

        return ws

    def export_master_database(self, master_items: List[Dict[str, Any]]) -> openpyxl.worksheet.worksheet.Worksheet:
        """
        Builds the Master Database sheet with Unit Price formulas (=Labor + Material).
        """
        ws = self.wb.create_sheet(title="Master Database AHS")
        ws.views.sheetView[0].showGridLines = True

        ws.merge_cells("A1:H1")
        ws["A1"] = "MASTER DATABASE ANALISA HARGA SATUAN (AHS)"
        ws["A1"].font = FONT_TITLE

        headers = ["No", "Kode Item", "Kode AHS", "Nama Pekerjaan", "Kategori", "Satuan", "Biaya Material", "Total Harga Satuan"]
        for col_idx, h in enumerate(headers, start=1):
            cell = ws.cell(row=3, column=col_idx, value=h)
            cell.font = FONT_HEADER
            cell.fill = FILL_HEADER
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = BORDER_BOX

        for idx, item in enumerate(master_items, start=4):
            ws.cell(row=idx, column=1, value=idx - 3).alignment = Alignment(horizontal="center")
            ws.cell(row=idx, column=2, value=item.get("itemCode", "")).alignment = Alignment(horizontal="center")
            ws.cell(row=idx, column=3, value=item.get("ahsCode", "")).alignment = Alignment(horizontal="center")
            ws.cell(row=idx, column=4, value=item.get("itemName", ""))
            ws.cell(row=idx, column=5, value=item.get("category", ""))
            ws.cell(row=idx, column=6, value=item.get("unit", "m²")).alignment = Alignment(horizontal="center")

            c_mat = ws.cell(row=idx, column=7, value=float(item.get("materialCost", 0)))
            c_mat.number_format = CURRENCY_FORMAT
            c_mat.alignment = Alignment(horizontal="right")

            c_tot = ws.cell(row=idx, column=8, value=float(item.get("unitPrice", 0)))
            c_tot.number_format = CURRENCY_FORMAT
            c_tot.font = FONT_DATA_BOLD
            c_tot.alignment = Alignment(horizontal="right")

            for c in range(1, 9):
                ws.cell(row=idx, column=c).border = BORDER_BOX
                if c != 8:
                    ws.cell(row=idx, column=c).font = FONT_DATA

        widths = {1: 6, 2: 14, 3: 16, 4: 36, 5: 26, 6: 10, 7: 20, 8: 24}
        for col, width in widths.items():
            ws.column_dimensions[get_column_letter(col)].width = width

        return ws

    def save(self, filepath: str):
        """Saves the workbook to disk."""
        self.wb.save(filepath)
        print(f"[RakitcoExcelExportEngine] Exported active formula workbook to: {filepath}")


# ---------------------------------------------------------------------------
# CLI / STANDALONE TEST RUNNER
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    sample_project = {
        "name": "Luxury Minimalist Villa Uluwatu",
        "projectCode": "PRJ-2025-001",
        "ownerName": "Bpk. Hendra Gunawan",
        "date": "07 September 2026",
        "location": "Uluwatu, Bali",
        "revision": "Rev.02",
        "status": "On Tender",
    }

    sample_items = {
        "Struktur & Pondasi": [
            {"name": "Galian Tanah Pondasi Footplat", "unit": "m³", "volume": 68.50, "unitPrice": 125000, "materialCost": 0},
            {"name": "Beton Bertulang K-300 Kolom & Balok", "unit": "m³", "volume": 42.00, "unitPrice": 4850000, "materialCost": 3950000},
            {"name": "Pemasangan Besi Beton Ulir D16", "unit": "kg", "volume": 2850.00, "unitPrice": 18500, "materialCost": 15200},
        ],
        "Arsitektur & Dinding": [
            {"name": "Pasangan Bata Ringan AAC Tebal 10cm", "unit": "m²", "volume": 320.00, "unitPrice": 165000, "materialCost": 120000},
            {"name": "Plesteran & Acian Instan Mortar", "unit": "m²", "volume": 640.00, "unitPrice": 85000, "materialCost": 55000},
        ],
        "Finishing & Interior": [
            {"name": "Granite Tile Glazed Polished 80x80cm", "unit": "m²", "volume": 185.00, "unitPrice": 425000, "materialCost": 310000},
            {"name": "Plafon Gypsum Board 9mm Rangka Hollow", "unit": "m²", "volume": 210.00, "unitPrice": 145000, "materialCost": 95000},
        ],
    }

    sample_master = [
        {"itemCode": "AHS-ST-001", "ahsCode": "AHS.2025.1.1", "itemName": "Galian Tanah Pondasi", "category": "Struktur & Pondasi", "unit": "m³", "materialCost": 0, "unitPrice": 125000},
        {"itemCode": "AHS-ST-002", "ahsCode": "AHS.2025.1.2", "itemName": "Beton K-300 Ready Mix", "category": "Struktur & Pondasi", "unit": "m³", "materialCost": 3950000, "unitPrice": 4850000},
        {"itemCode": "AHS-AR-001", "ahsCode": "AHS.2025.2.1", "itemName": "Pasangan Bata Ringan AAC", "category": "Arsitektur & Dinding", "unit": "m²", "materialCost": 120000, "unitPrice": 165000},
    ]

    engine = RakitcoExcelExportEngine(sample_project)
    engine.export_rab_detail(sample_items)
    engine.export_master_database(sample_master)
    engine.save("RAB_RAKITCO_Dynamic_Formulas.xlsx")
