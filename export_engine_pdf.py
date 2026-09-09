"""
=============================================================================
RAKITCO DESKTOP AUTOMATION ARCHITECTURE: REPORTLAB PDF EXPORT ENGINE
=============================================================================
Senior Software Engineer & Document Automation Architect Specification.
Demonstrates:
  1. Standardized Corporate Letterhead Header (Kop Surat):
     - Brand Name: "RAKITCO" in bold executive typography
     - Company Logo: Vectorized architectural house monogram & PNG image fallback
     - Corporate Metadata: Project Name, Project Code, Client, Date, Revision status
     - Dual-accent executive divider line
  2. Custom PageTemplate & NumberedCanvas:
     - Two-pass canvas for dynamic total page counting ("Page X of Y")
     - Standard running headers & confidential legal disclaimers
  3. Executive High-Resolution Data Tables:
     - Zebra-striping, custom alignments, and formatted IDR currency
  4. Embedded S-Curve Progress Chart:
     - Programmatic vector Drawing with Target vs Actual progress polyline
"""

import os
from typing import List, Dict, Any, Tuple
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, PolyLine, Circle, String, Group


# ---------------------------------------------------------------------------
# COLOR PALETTE
# ---------------------------------------------------------------------------
COLOR_SLATE_900 = colors.HexColor("#0F172A")
COLOR_SLATE_800 = colors.HexColor("#1E293B")
COLOR_SLATE_700 = colors.HexColor("#334155")
COLOR_SLATE_600 = colors.HexColor("#475569")
COLOR_SLATE_500 = colors.HexColor("#64748B")
COLOR_SLATE_200 = colors.HexColor("#E2E8F0")
COLOR_SLATE_100 = colors.HexColor("#F1F5F9")
COLOR_SLATE_50 = colors.HexColor("#F8FAFC")

COLOR_BLUE_700 = colors.HexColor("#1D4ED8")
COLOR_BLUE_600 = colors.HexColor("#2563EB")
COLOR_BLUE_50 = colors.HexColor("#EFF6FF")

COLOR_EMERALD_600 = colors.HexColor("#059669")
COLOR_AMBER_700 = colors.HexColor("#B45309")
COLOR_AMBER_100 = colors.HexColor("#FEF3C7")


# ---------------------------------------------------------------------------
# TWO-PASS NUMBERED CANVAS ("PAGE X OF Y")
# ---------------------------------------------------------------------------
class RakitcoNumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accumulates total page count and writes
    running footers with accurate 'Page X of Y' pagination.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_footer(num_pages)
            super().showPage()
        super().save()

    def draw_page_footer(self, page_count: int):
        self.saveState()
        page_width, page_height = self._pagesize

        # Running Footer Divider
        self.setStrokeColor(COLOR_SLATE_200)
        self.setLineWidth(0.6)
        self.line(14 * mm, 12 * mm, page_width - 14 * mm, 12 * mm)

        # Footer Left: Legal / Document Notice
        self.setFont("Helvetica", 7)
        self.setFillColor(COLOR_SLATE_500)
        self.drawString(
            14 * mm,
            8 * mm,
            "Dokumen Resmi RAKITCO Architecture & Construction • Universal Document Automation Engine",
        )

        # Footer Right: Page X of Y
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(COLOR_SLATE_700)
        self.drawRightString(page_width - 14 * mm, 8 * mm, page_str)

        self.restoreState()


# ---------------------------------------------------------------------------
# RAKITCO VECTOR LOGO GENERATOR (INLINE REPORTLAB DRAWING)
# ---------------------------------------------------------------------------
def create_rakitco_vector_logo(width=45, height=54) -> Drawing:
    """
    Generates a crisp, resolution-independent vector monogram of the
    RAKITCO architectural 'R' house symbol directly using ReportLab shapes.
    """
    d = Drawing(width, height)
    # Scaling factor from 500x600 coordinate base
    sx = width / 500.0
    sy = height / 600.0

    # Black Monogram 'R' Silhouette (inverted Y axis for ReportLab)
    def p(x, y):
        return x * sx, (600 - y) * sy

    # Outer black path points
    pts = [
        p(250, 45), p(410, 165), p(410, 265), p(315, 265), p(315, 190),
        p(250, 140), p(185, 190), p(185, 415), p(200, 415), p(315, 280),
        p(410, 395), p(410, 560), p(315, 560), p(315, 445), p(200, 560),
        p(90, 560), p(90, 165)
    ]
    poly_flat = [coord for pt in pts for coord in pt]
    from reportlab.graphics.shapes import Polygon
    d.add(Polygon(poly_flat, fillColor=colors.black, strokeColor=None))

    # White lower gable cut
    g_pts = [p(185, 415), p(315, 280), p(315, 560), p(185, 560)]
    g_flat = [c for pt in g_pts for c in pt]
    d.add(Polygon(g_flat, fillColor=colors.white, strokeColor=None))

    # Small 4-pane window inside lower white house
    w_w = 26 * sx
    w_h = 26 * sy
    d.add(Rect(220 * sx, (600 - 475 - 26) * sy, w_w, w_h, fillColor=colors.black, strokeColor=None))
    d.add(Rect(254 * sx, (600 - 475 - 26) * sy, w_w, w_h, fillColor=colors.black, strokeColor=None))
    d.add(Rect(220 * sx, (600 - 509 - 26) * sy, w_w, w_h, fillColor=colors.black, strokeColor=None))
    d.add(Rect(254 * sx, (600 - 509 - 26) * sy, w_w, w_h, fillColor=colors.black, strokeColor=None))

    # Upper white tower rectangular opening
    d.add(Rect(185 * sx, (600 - 190 - 225) * sy, 130 * sx, 225 * sy, fillColor=colors.white, strokeColor=None))

    return d


# ---------------------------------------------------------------------------
# S-CURVE VECTOR PROGRESS CHART GENERATOR
# ---------------------------------------------------------------------------
def create_scurve_chart_drawing(
    progress_points: List[Dict[str, Any]],
    width=520,
    height=120
) -> Drawing:
    """
    Constructs a vector S-Curve progress chart snapshot with grid lines,
    planned progress curve, and actual progress curve.
    """
    d = Drawing(width, height)

    # Background Card Box
    d.add(Rect(0, 0, width, height, fillColor=COLOR_SLATE_50, strokeColor=COLOR_SLATE_200, strokeWidth=0.5, rx=4, ry=4))

    # Title & Legend
    d.add(String(12, height - 16, "KURVA S: TARGET PROGRESS VS REALISASI LAPANGAN", fontName="Helvetica-Bold", fontSize=8.5, fillColor=COLOR_SLATE_900))

    # Legend planned
    d.add(Rect(width - 180, height - 18, 8, 4, fillColor=COLOR_BLUE_600, strokeColor=None))
    d.add(String(width - 168, height - 17, "Planned S-Curve", fontName="Helvetica", fontSize=7, fillColor=COLOR_SLATE_600))

    # Legend actual
    d.add(Rect(width - 90, height - 18, 8, 4, fillColor=COLOR_EMERALD_600, strokeColor=None))
    d.add(String(width - 78, height - 17, "Actual Progress", fontName="Helvetica", fontSize=7, fillColor=COLOR_SLATE_600))

    plot_x = 35
    plot_y = 20
    plot_w = width - 50
    plot_h = height - 45

    # Horizontal grid lines (0%, 25%, 50%, 75%, 100%)
    for pct in [0, 25, 50, 75, 100]:
        y_pos = plot_y + (pct / 100.0) * plot_h
        d.add(Rect(plot_x, y_pos, plot_w, 0.4, fillColor=COLOR_SLATE_200, strokeColor=None))
        d.add(String(plot_x - 6, y_pos - 2.5, f"{pct}%", fontName="Helvetica", fontSize=6, fillColor=COLOR_SLATE_500, textAnchor="end"))

    if not progress_points:
        return d

    n_points = len(progress_points)
    step_x = plot_w / max(n_points - 1, 1)

    # Planned points
    plan_pts = []
    for i, pt in enumerate(progress_points):
        x = plot_x + i * step_x
        y = plot_y + (pt.get("planned", 0.0) / 100.0) * plot_h
        plan_pts.append((x, y))
        d.add(Circle(x, y, 1.8, fillColor=COLOR_BLUE_600, strokeColor=None))
        # Week label
        d.add(String(x, plot_y - 10, f"W{pt.get('week', i+1)}", fontName="Helvetica", fontSize=6, fillColor=COLOR_SLATE_500, textAnchor="middle"))

    if len(plan_pts) > 1:
        poly_flat = [coord for pt in plan_pts for coord in pt]
        d.add(PolyLine(poly_flat, strokeColor=COLOR_BLUE_600, strokeWidth=1.5))

    # Actual points
    act_pts = []
    for i, pt in enumerate(progress_points):
        val = pt.get("actual")
        if val is not None:
            x = plot_x + i * step_x
            y = plot_y + (val / 100.0) * plot_h
            act_pts.append((x, y))
            d.add(Circle(x, y, 2.2, fillColor=COLOR_EMERALD_600, strokeColor=None))

    if len(act_pts) > 1:
        poly_act = [coord for pt in act_pts for coord in pt]
        d.add(PolyLine(poly_act, strokeColor=COLOR_EMERALD_600, strokeWidth=1.8))

    return d


# ---------------------------------------------------------------------------
# MAIN REPORTLAB EXPORT ENGINE CLASS
# ---------------------------------------------------------------------------
class RakitcoPdfExportEngine:
    """
    Enterprise Document Automation Engine for Client-Ready PDFs
    utilizing ReportLab with RAKITCO Kop Surat corporate branding.
    """

    def __init__(self, output_filepath: str, orientation="portrait"):
        self.filepath = output_filepath
        self.pagesize = landscape(A4) if orientation == "landscape" else A4
        self.styles = getSampleStyleSheet()

        # Margins: 14mm
        self.margin = 14 * mm
        self.doc = BaseDocTemplate(
            output_filepath,
            pagesize=self.pagesize,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        # Usable page dimensions
        self.page_w, self.page_h = self.pagesize
        self.content_w = self.page_w - 2 * self.margin

        # Content Frame: Leave 36mm at top for Kop Surat & 14mm at bottom for footer
        self.frame_top_margin = 36 * mm
        self.frame_bottom_margin = 14 * mm
        self.frame_h = self.page_h - self.frame_top_margin - self.frame_bottom_margin

        frame = Frame(
            self.margin,
            self.frame_bottom_margin,
            self.content_w,
            self.frame_h,
            id="normal",
            topPadding=0,
            bottomPadding=0,
            leftPadding=0,
            rightPadding=0,
        )

        template = PageTemplate(id="RakitcoTemplate", frames=frame, onPage=self._draw_letterhead)
        self.doc.addPageTemplates([template])
        self.meta: Dict[str, Any] = {}

    def _draw_letterhead(self, canvas_obj: canvas.Canvas, doc_obj):
        """
        Draws the standardized RAKITCO Corporate Letterhead (Kop Surat)
        on every page of the document.
        """
        canvas_obj.saveState()
        page_w, page_h = self.pagesize

        # 1. Company Logo
        # Dynamically search candidate paths for uploaded logo PNG without scaling distortion
        logo_candidates = [
            os.path.join(os.getcwd(), "RAKITCO 2.png"),
            os.path.join(os.getcwd(), "public", "RAKITCO 2.png"),
            os.path.join(os.getcwd(), "public", "rakitco-logo.png"),
            os.path.join(os.getcwd(), "rakitco-logo.png"),
        ]
        logo_drawn = False
        for path in logo_candidates:
            if os.path.exists(path):
                try:
                    from reportlab.lib.utils import ImageReader
                    img_reader = ImageReader(path)
                    img_w, img_h = img_reader.getSize()
                    aspect = float(img_h) / max(1.0, float(img_w))
                    target_w = 16 * mm
                    target_h = target_w * aspect
                    if target_h > 20 * mm:
                        target_h = 20 * mm
                        target_w = target_h / aspect
                    canvas_obj.drawImage(
                        img_reader,
                        14 * mm,
                        page_h - 9 * mm - target_h,
                        width=target_w,
                        height=target_h,
                        mask='auto',
                        preserveAspectRatio=True,
                    )
                    logo_drawn = True
                    break
                except Exception:
                    pass

        if not logo_drawn:
            # Fallback to high-definition native ReportLab vector monogram
            logo_drawing = create_rakitco_vector_logo(width=42, height=50)
            logo_drawing.drawOn(canvas_obj, 14 * mm, page_h - 26 * mm)

        # 2. Executive Typography & Corporate Identity
        canvas_obj.setFont("Helvetica-Bold", 17)
        canvas_obj.setFillColor(COLOR_SLATE_900)
        canvas_obj.drawString(33 * mm, page_h - 17 * mm, "RAKITCO")

        canvas_obj.setFont("Helvetica-Bold", 8)
        canvas_obj.setFillColor(COLOR_SLATE_700)
        canvas_obj.drawString(33 * mm, page_h - 21.5 * mm, "PT Rakit Kreasi Abadi - General Contractor & Interior Architecture")

        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.setFillColor(COLOR_SLATE_500)
        canvas_obj.drawString(33 * mm, page_h - 26 * mm, "Jl. Parung Panjang no.21, Legok, Tangerang | Email: admin@rakitco.com")

        # Document Classification (Right-Aligned)
        title = self.meta.get("doc_title", "DOKUMEN TEKNIS PROYEK").upper()
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.setFillColor(COLOR_BLUE_700)
        canvas_obj.drawRightString(page_w - 14 * mm, page_h - 17 * mm, title)

        doc_code = self.meta.get("project_code", "GEN")
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.setFillColor(COLOR_SLATE_500)
        canvas_obj.drawRightString(page_w - 14 * mm, page_h - 22 * mm, f"Ref: RKT-{doc_code}-2026")

        # 3. Dual-Accent Executive Divider Lines
        canvas_obj.setStrokeColor(COLOR_SLATE_800)
        canvas_obj.setLineWidth(1.2)
        canvas_obj.line(14 * mm, page_h - 32 * mm, page_w - 14 * mm, page_h - 32 * mm)

        canvas_obj.setStrokeColor(COLOR_BLUE_600)
        canvas_obj.setLineWidth(0.6)
        canvas_obj.line(14 * mm, page_h - 33.5 * mm, page_w - 14 * mm, page_h - 33.5 * mm)

        canvas_obj.restoreState()

    def build_metadata_panel(self, project: Dict[str, Any]) -> Table:
        """
        Creates the standardized executive metadata block table.
        Strict 4-field specification (Project Name, Project Location, Client/Owner, Date)
        with explicit column geometry and padding to eliminate collision.
        """
        label_style = ParagraphStyle(
            "MetaLabel",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=COLOR_SLATE_500,
        )
        val_style = ParagraphStyle(
            "MetaVal",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=COLOR_SLATE_900,
        )
        val_normal_style = ParagraphStyle(
            "MetaValNormal",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=COLOR_SLATE_700,
        )

        data = [
            [
                Paragraph("PROJECT NAME:", label_style),
                Paragraph(f"{project.get('name', '-')}", val_style),
                Paragraph("CLIENT / OWNER:", label_style),
                Paragraph(f"{project.get('ownerName', '-')}", val_style),
            ],
            [
                Paragraph("PROJECT LOCATION:", label_style),
                Paragraph(f"{project.get('location', '-')}", val_normal_style),
                Paragraph("DATE:", label_style),
                Paragraph(f"{project.get('date', '-')}", val_normal_style),
            ],
        ]

        t = Table(
            data,
            colWidths=[34 * mm, 57 * mm, 34 * mm, 57 * mm],
        )
        t.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_SLATE_50),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_SLATE_200),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, COLOR_SLATE_100),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        return t

    def export_rab_report(
        self,
        project: Dict[str, Any],
        categorized_items: Dict[str, List[Dict[str, Any]]]
    ):
        """
        Builds and saves a full client-ready RAB PDF report.
        """
        self.meta = {
            "doc_title": "Rencana Anggaran Biaya (RAB)",
            "project_code": project.get("projectCode", "PRJ"),
        }

        story = []
        story.append(self.build_metadata_panel(project))
        story.append(Spacer(1, 4 * mm))

        # Table data
        headers = ["No", "Uraian Pekerjaan", "Sat", "Volume", "Harga Satuan (Rp)", "Total Harga (Rp)"]
        table_data = [headers]

        item_no = 1
        subtotal_real_cost = 0.0

        for cat_name, items in categorized_items.items():
            if not items:
                continue

            # Category Header Row (spans 6 cols)
            cat_header = [f"KATEGORI: {cat_name.upper()}", "", "", "", "", ""]
            table_data.append(cat_header)

            cat_total = 0.0
            for item in items:
                vol = float(item.get("volume", 1.0))
                price = float(item.get("unitPrice", 0.0))
                line_total = vol * price
                cat_total += line_total
                subtotal_real_cost += line_total

                table_data.append([
                    str(item_no),
                    item.get("name", ""),
                    item.get("unit", "ls"),
                    f"{vol:,.2f}",
                    f"Rp {price:,.0f}",
                    f"Rp {line_total:,.0f}",
                ])
                item_no += 1

            # Subtotal Row
            table_data.append([
                f"Subtotal {cat_name}",
                "",
                "",
                "",
                "",
                f"Rp {cat_total:,.0f}",
            ])

        # Summary Rows (Real Cost, PPN, Grand Total)
        ppn_val = subtotal_real_cost * 0.11
        grand_total = subtotal_real_cost + ppn_val

        table_data.append(["TOTAL NILAI PEKERJAAN", "", "", "", "", f"Rp {subtotal_real_cost:,.0f}"])
        table_data.append(["PAJAK PERTAMBAHAN NILAI (PPN 11%)", "", "", "", "", f"Rp {ppn_val:,.0f}"])
        table_data.append(["GRAND TOTAL PENAWARAN (TERMASUK PPN)", "", "", "", "", f"Rp {grand_total:,.0f}"])

        # Table Styling
        col_w = [10 * mm, 72 * mm, 12 * mm, 20 * mm, 32 * mm, 36 * mm]
        t = Table(table_data, colWidths=col_w, repeatRows=1)

        style_cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_SLATE_800),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("ALIGN", (0, 0), (0, -1), "CENTER"), # No
            ("ALIGN", (1, 0), (1, -1), "LEFT"),   # Name
            ("ALIGN", (2, 0), (2, -1), "CENTER"), # Unit
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"), # Numbers
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 7.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
            ("GRID", (0, 0), (-1, -1), 0.3, COLOR_SLATE_200),
        ]

        # Scan for category rows & span them
        for row_idx, r in enumerate(table_data):
            val = str(r[0])
            if val.startswith("KATEGORI:"):
                style_cmds.extend([
                    ("SPAN", (0, row_idx), (5, row_idx)),
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), COLOR_SLATE_100),
                    ("FONTNAME", (0, row_idx), (-1, row_idx), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, row_idx), (-1, row_idx), COLOR_SLATE_800),
                    ("ALIGN", (0, row_idx), (0, row_idx), "LEFT"),
                ])
            elif val.startswith("Subtotal"):
                style_cmds.extend([
                    ("SPAN", (0, row_idx), (4, row_idx)),
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), COLOR_SLATE_50),
                    ("FONTNAME", (0, row_idx), (-1, row_idx), "Helvetica-Bold"),
                    ("ALIGN", (0, row_idx), (0, row_idx), "RIGHT"),
                ])
            elif val.startswith("TOTAL NILAI PEKERJAAN"):
                style_cmds.extend([
                    ("SPAN", (0, row_idx), (4, row_idx)),
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), COLOR_BLUE_50),
                    ("TEXTCOLOR", (0, row_idx), (-1, row_idx), COLOR_BLUE_700),
                    ("FONTNAME", (0, row_idx), (-1, row_idx), "Helvetica-Bold"),
                    ("ALIGN", (0, row_idx), (0, row_idx), "RIGHT"),
                ])
            elif val.startswith("PAJAK PERTAMBAHAN NILAI"):
                style_cmds.extend([
                    ("SPAN", (0, row_idx), (4, row_idx)),
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), COLOR_SLATE_50),
                    ("FONTNAME", (0, row_idx), (-1, row_idx), "Helvetica-Bold"),
                    ("ALIGN", (0, row_idx), (0, row_idx), "RIGHT"),
                ])
            elif val.startswith("GRAND TOTAL"):
                style_cmds.extend([
                    ("SPAN", (0, row_idx), (4, row_idx)),
                    ("BACKGROUND", (0, row_idx), (-1, row_idx), COLOR_AMBER_100),
                    ("TEXTCOLOR", (0, row_idx), (-1, row_idx), COLOR_AMBER_700),
                    ("FONTNAME", (0, row_idx), (-1, row_idx), "Helvetica-Bold"),
                    ("FONTSIZE", (0, row_idx), (-1, row_idx), 8.5),
                    ("ALIGN", (0, row_idx), (0, row_idx), "RIGHT"),
                ])

        t.setStyle(TableStyle(style_cmds))
        story.append(t)

        self.doc.build(story, canvasmaker=RakitcoNumberedCanvas)
        print(f"[RakitcoPdfExportEngine] Generated client-ready PDF at: {self.filepath}")

    def export_rab_list_report(
        self,
        projects: List[Dict[str, Any]]
    ):
        """
        Builds the Master RAB List report mirroring the exact structure
        and rows displayed on the RAB List UI screen.
        """
        self.meta = {
            "doc_title": "Daftar Portofolio RAB",
            "project_code": "RAB-DIR",
        }

        story = []
        meta_info = {
            "name": "Portofolio Master RAB Proyek",
            "location": "Seluruh Wilayah Kerja Operasional",
            "ownerName": "PT Rakit Kreasi Abadi",
            "date": "07 September 2026",
        }
        story.append(self.build_metadata_panel(meta_info))
        story.append(Spacer(1, 4 * mm))

        headers = ["No", "Kode Proyek", "Nama Proyek & Versi Terkini", "Klien / Lokasi", "Riwayat", "Item", "Nilai RAB (BoQ)"]
        table_data = [headers]

        total_portfolio_boq = 0.0
        total_rev_count = 0

        for idx, p in enumerate(projects):
            revs = p.get("revisions", [])
            latest_rev = next((r for r in revs if r.get("isLatest")), revs[-1] if revs else {})
            rev_num = latest_rev.get("revisionNumber", "Rev.01")
            rev_title = latest_rev.get("title", "Initial Draft BoQ")
            rev_count = len(revs) if revs else 1
            total_rev_count += rev_count

            items_count = latest_rev.get("itemCount", len(p.get("items", [])))
            boq_amount = float(latest_rev.get("grandTotal", p.get("grandTotal", 0.0)))
            total_portfolio_boq += boq_amount

            proj_desc = f"<b>{p.get('name', '')}</b><br/><font size=6.5 color='#475569'>RAB {rev_num} (Latest) - {rev_title}</font>"
            client_loc = f"{p.get('ownerName', '-')}<br/><font size=6.5 color='#64748B'>{p.get('location', '-')}</font>"

            table_data.append([
                str(idx + 1),
                p.get("projectCode", "-"),
                Paragraph(proj_desc, self.styles["Normal"]),
                Paragraph(client_loc, self.styles["Normal"]),
                f"{rev_count} Versi",
                f"{items_count} item",
                f"Rp {boq_amount:,.0f}",
            ])

        # Summary Row (Total Nilai Pekerjaan)
        table_data.append([
            "",
            "",
            "TOTAL NILAI PEKERJAAN (PORTOFOLIO BOQ)",
            "",
            f"{total_rev_count} Versi",
            "",
            f"Rp {total_portfolio_boq:,.0f}",
        ])

        col_w = [8 * mm, 20 * mm, 62 * mm, 40 * mm, 16 * mm, 14 * mm, 22 * mm]
        t = Table(table_data, colWidths=col_w, repeatRows=1)

        summary_idx = len(table_data) - 1
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_SLATE_800),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 7.5),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (4, 0), (5, -1), "CENTER"),
            ("ALIGN", (6, 0), (6, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 7.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("GRID", (0, 0), (-1, -1), 0.3, COLOR_SLATE_200),
            # Summary Row styling
            ("SPAN", (2, summary_idx), (3, summary_idx)),
            ("BACKGROUND", (0, summary_idx), (-1, summary_idx), COLOR_BLUE_50),
            ("FONTNAME", (0, summary_idx), (-1, summary_idx), "Helvetica-Bold"),
            ("TEXTCOLOR", (2, summary_idx), (2, summary_idx), COLOR_BLUE_700),
            ("TEXTCOLOR", (6, summary_idx), (6, summary_idx), COLOR_BLUE_700),
            ("ALIGN", (2, summary_idx), (2, summary_idx), "LEFT"),
        ]))

        story.append(t)
        self.doc.build(story, canvasmaker=RakitcoNumberedCanvas)
        print(f"[RakitcoPdfExportEngine] Generated RAB List Report at: {self.filepath}")

    def export_schedule_progress_report(
        self,
        project: Dict[str, Any],
        schedule_items: List[Dict[str, Any]],
        progress_points: List[Dict[str, Any]]
    ):
        """
        Builds a landscape Progress & S-Curve Report with embedded vector chart snapshot.
        """
        self.meta = {
            "doc_title": "Laporan Progres & Kurva S",
            "project_code": project.get("projectCode", "PRJ"),
        }

        story = []
        story.append(self.build_metadata_panel(project))
        story.append(Spacer(1, 3 * mm))

        # Embed S-Curve Vector Drawing Snapshot
        chart_drawing = create_scurve_chart_drawing(progress_points, width=int(self.content_w), height=110)
        story.append(chart_drawing)
        story.append(Spacer(1, 3 * mm))

        # WBS Items Table
        headers = ["WBS", "Uraian Pekerjaan", "Kategori", "Bobot", "Tgl Mulai", "Tgl Selesai", "Durasi", "Target", "Realisasi", "Deviasi"]
        table_data = [headers]

        for it in schedule_items:
            plan = float(it.get("planned", 0))
            act = float(it.get("actual", 0))
            dev = act - plan
            table_data.append([
                it.get("wbsCode", ""),
                it.get("name", ""),
                it.get("category", ""),
                f"{float(it.get('weight', 0)):.2f}%",
                it.get("start", ""),
                it.get("end", ""),
                f"{it.get('duration', 0)} hr",
                f"{plan:.2f}%",
                f"{act:.2f}%",
                f"{'+' if dev > 0 else ''}{dev:.2f}%",
            ])

        col_w = [16 * mm, 62 * mm, 32 * mm, 18 * mm, 22 * mm, 22 * mm, 16 * mm, 20 * mm, 20 * mm, 20 * mm]
        t = Table(table_data, colWidths=col_w, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_SLATE_800),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 7.5),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (1, 0), (1, -1), "LEFT"),
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("GRID", (0, 0), (-1, -1), 0.3, COLOR_SLATE_200),
        ]))

        story.append(t)
        self.doc.build(story, canvasmaker=RakitcoNumberedCanvas)
        print(f"[RakitcoPdfExportEngine] Generated Schedule S-Curve Report at: {self.filepath}")


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
        "Pekerjaan Struktur": [
            {"name": "Galian Tanah Pondasi Footplat", "unit": "m³", "volume": 68.50, "unitPrice": 125000},
            {"name": "Beton Bertulang K-300 Kolom & Balok", "unit": "m³", "volume": 42.00, "unitPrice": 4850000},
            {"name": "Pembesian Besi Ulir D16 & D13", "unit": "kg", "volume": 2850.00, "unitPrice": 18500},
        ],
        "Pekerjaan Arsitektur": [
            {"name": "Pasangan Bata Ringan AAC 10cm", "unit": "m²", "volume": 320.00, "unitPrice": 165000},
            {"name": "Plesteran & Acian Instan", "unit": "m²", "volume": 640.00, "unitPrice": 85000},
        ],
        "Pekerjaan Finishing": [
            {"name": "Granite Tile 80x80 Glazed Polished", "unit": "m²", "volume": 185.00, "unitPrice": 425000},
            {"name": "Plafon Gypsum Board 9mm", "unit": "m²", "volume": 210.00, "unitPrice": 145000},
        ],
    }

    # Generate Portrait RAB Report
    pdf_engine = RakitcoPdfExportEngine("RAB_RAKITCO_ReportLab_Export.pdf", orientation="portrait")
    pdf_engine.export_rab_report(sample_project, sample_items)

    # Generate Landscape Schedule S-Curve Report
    sample_wbs = [
        {"wbsCode": "1.01", "name": "Pekerjaan Persiapan & Pengukuran", "category": "Persiapan", "weight": 2.5, "start": "01/08/2026", "end": "07/08/2026", "duration": 7, "planned": 100, "actual": 100},
        {"wbsCode": "2.01", "name": "Galian & Pondasi Footplat", "category": "Struktur", "weight": 12.0, "start": "08/08/2026", "end": "25/08/2026", "duration": 18, "planned": 100, "actual": 95},
        {"wbsCode": "2.02", "name": "Struktur Kolom, Balok & Plat Lantai 2", "category": "Struktur", "weight": 24.5, "start": "26/08/2026", "end": "30/09/2026", "duration": 36, "planned": 65, "actual": 60},
    ]
    sample_progress = [
        {"week": 1, "planned": 2.5, "actual": 2.5},
        {"week": 2, "planned": 6.8, "actual": 7.0},
        {"week": 3, "planned": 14.5, "actual": 13.8},
        {"week": 4, "planned": 24.0, "actual": 22.5},
        {"week": 5, "planned": 36.2, "actual": 34.0},
        {"week": 6, "planned": 51.0, "actual": 48.5},
        {"week": 7, "planned": 67.5, "actual": 64.0},
        {"week": 8, "planned": 82.0, "actual": None},
        {"week": 9, "planned": 94.0, "actual": None},
        {"week": 10, "planned": 100.0, "actual": None},
    ]

    sched_engine = RakitcoPdfExportEngine("Schedule_RAKITCO_ReportLab_Export.pdf", orientation="landscape")
    sched_engine.export_schedule_progress_report(sample_project, sample_wbs, sample_progress)
