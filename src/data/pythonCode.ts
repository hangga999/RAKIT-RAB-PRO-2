export const PYTHON_REQUIREMENTS = `# Requirements for Windows Desktop Executable Build
# Install via: pip install -r requirements.txt
PyQt6>=6.6.0
PyQt6-Qt6>=6.6.0
matplotlib>=3.8.0
numpy>=1.26.0
pyinstaller>=6.3.0
openpyxl>=3.1.2
`;

export const SQL_SCHEMA = `-- ====================================================================
-- SQLite Database Schema for RAB / BoQ Windows Desktop Application
-- File: data/rab_database.db
-- ====================================================================

-- 1. Master Costing Reference (Single source of truth for AHS)
-- 1. Master Costing Reference (Single source of truth for Work Items)
CREATE TABLE IF NOT EXISTS Work_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT NOT NULL UNIQUE,             -- e.g. AHS-STR-01
    item_name TEXT NOT NULL,                     -- e.g. Pasangan Lantai Granit 60x60
    category TEXT NOT NULL,                      -- Struktur, Arsitektur, Interior, MEP
    ahs_code TEXT,                               -- Standard Code
    ahs_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1a. Item Specifications (1-to-N relation with Work Items)
CREATE TABLE IF NOT EXISTS Item_Specifications (
    spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_item_id INTEGER NOT NULL,
    spec_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    material_cost REAL NOT NULL DEFAULT 0.0,
    labor_cost REAL NOT NULL DEFAULT 0.0,
    equipment_cost REAL NOT NULL DEFAULT 0.0,
    unit_price REAL NOT NULL,
    FOREIGN KEY (work_item_id) REFERENCES Work_Items(id) ON DELETE CASCADE
);

-- 2. Projects Table (Project Profile & Architectural/Interior Requirements)
CREATE TABLE IF NOT EXISTS Projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code TEXT NOT NULL UNIQUE,          -- e.g. PRJ-2025-001
    name TEXT NOT NULL,                          -- e.g. Renovasi Penthouse Sudirman
    description TEXT,
    owner_name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',        -- Draft, In Review, Approved, Ongoing, Completed
    
    -- Architectural & Interior Requirements Fields (Analyzed for BoQ sizing):
    land_area REAL DEFAULT 0.0,                  -- Luas Tanah (m2)
    building_area REAL NOT NULL DEFAULT 0.0,     -- Luas Bangunan / Lantai (m2)
    floors_count INTEGER NOT NULL DEFAULT 1,     -- Jumlah Lantai
    ceiling_height REAL DEFAULT 3.2,             -- Tinggi Plafon / Floor-to-Ceiling (m)
    design_style TEXT,                           -- Modern Minimalist, Japandi, Industrial, etc.
    structural_system TEXT,                      -- Reinforced Concrete, Steel WF, Hebel, etc.
    finishing_grade TEXT,                        -- Standard, Deluxe, Premium
    scope_of_work TEXT,                          -- Comma-separated: Struktur, Arsitektur, Interior, MEP
    estimated_duration_weeks INTEGER DEFAULT 12, -- Estimasi Waktu (Minggu)
    
    -- Financial summary:
    subtotal REAL NOT NULL DEFAULT 0.0,
    contingency_percent REAL DEFAULT 5.0,
    overhead_profit_percent REAL DEFAULT 10.0,
    tax_percent REAL DEFAULT 11.0,               -- PPN 11%
    grand_total REAL NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RAB Entry Items Table (Linked to Project and optionally MasterDatabase)
CREATE TABLE IF NOT EXISTS RAB_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    master_item_id INTEGER,                      -- Foreign Key to MasterDatabase (nullable)
    work_category TEXT NOT NULL,                 -- Kategori Pekerjaan
    item_name TEXT NOT NULL,                     -- Nama Pekerjaan (auto-filled or custom)
    specification TEXT,                          -- Text input directly next to Work Item, auto-filled & editable
    unit TEXT NOT NULL,                          -- Satuan (m2, m3, etc. auto-filled)
    volume REAL NOT NULL DEFAULT 1.0,            -- Volume Pekerjaan
    unit_price REAL NOT NULL DEFAULT 0.0,        -- Harga Satuan (auto-filled)
    total_price REAL NOT NULL DEFAULT 0.0,       -- volume * unit_price
    notes TEXT,                                  -- Catatan spesifikasi/area pemasangan
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (master_item_id) REFERENCES MasterDatabase(id) ON DELETE SET NULL
);

-- 4. Vendor Management Table (Contact & Local File Attachment Path)
CREATE TABLE IF NOT EXISTS VendorList (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                          -- Nama Perusahaan / Vendor / Suplier
    category TEXT,                               -- Granit, Gypsum, HPL, Sanitary, Baja, Cat
    contact_person TEXT,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    catalog_file_path TEXT,                      -- Local absolute file path (PDF/Image)
    catalog_file_name TEXT,
    rating REAL DEFAULT 5.0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RAB / BoQ Line Items (Detailed Costing & Real Volume)
CREATE TABLE IF NOT EXISTS RAB_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    work_item_id INTEGER,
    spec_id INTEGER,
    work_category TEXT NOT NULL,      -- Struktur, Arsitektur, Interior, MEP
    item_name TEXT NOT NULL,          -- Work Item Name
    specification TEXT,               -- Work Specification
    unit TEXT NOT NULL,               -- Satuan (m2, m3, dll)
    volume_real REAL DEFAULT 0.0,     -- Net geometric volume
    waste_factor REAL DEFAULT 0.0,    -- Waste percentage (%)
    volume REAL NOT NULL DEFAULT 0.0, -- Calculated billable volume
    cost_price REAL NOT NULL DEFAULT 0.0,
    selling_unit_price REAL NOT NULL, -- Selling unit price after margin
    total_price REAL NOT NULL,        -- volume * selling_unit_price
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (work_item_id) REFERENCES Work_Items(id) ON DELETE SET NULL,
    FOREIGN KEY (spec_id) REFERENCES Item_Specifications(spec_id) ON DELETE SET NULL
);

-- 5. Schedule & Timeline Tracker Table (Automated synchronization with RAB_Items)
CREATE TABLE IF NOT EXISTS Schedule_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    rab_item_id INTEGER,                        -- Foreign key linking to RAB_Items
    wbs_code TEXT NOT NULL,                     -- e.g. WBS 1.0, WBS 1.1
    task_name TEXT NOT NULL,                    -- Imported from RAB_Items.item_name
    category TEXT NOT NULL,                     -- Imported from RAB_Items.work_category
    weight_percent REAL NOT NULL DEFAULT 0.0,   -- Calculated: (total_price / subtotal) * 100
    planned_start_date DATE NOT NULL,           -- Planned start date
    planned_end_date DATE NOT NULL,             -- Planned end date
    actual_progress_percent REAL DEFAULT 0.0,   -- User-inputted actual % (0-100)
    status TEXT DEFAULT 'On Track',             -- On Track, Delayed, Completed, Not Started
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (rab_item_id) REFERENCES RAB_Items(id) ON DELETE CASCADE
);

-- Indexes for lightning-fast lookups in combobox and grid search
CREATE INDEX IF NOT EXISTS idx_master_code_name ON Work_Items(item_code, item_name);
CREATE INDEX IF NOT EXISTS idx_rab_project ON RAB_Items(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_project ON Schedule_Items(project_id);
`;

export const PYTHON_MAIN_PY = `"""
RAB Studio Pro - Windows Desktop Cost Estimation & BoQ Application
Architecture: PyQt6 + SQLite3 + Matplotlib
Compiled with PyInstaller into standalone Windows .exe

Author: Senior Software Engineer & Desktop Systems Architect
"""

import sys
import os
import sqlite3
from datetime import datetime
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
    QPushButton, QLabel, QStackedWidget, QTableWidget, QTableWidgetItem,
    QLineEdit, QComboBox, QTextEdit, QFileDialog, QHeaderView,
    QMessageBox, QFrame, QDoubleSpinBox, QSpinBox, QGroupBox, QGridLayout,
    QScrollArea
)
from PyQt6.QtGui import QFont, QIcon, QColor
import matplotlib
matplotlib.use('QtAgg')
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import numpy as np

# =============================================================================
# 1. DATABASE MANAGER MODULE
# =============================================================================
class DatabaseManager:
    """Manages SQLite database connection, schema initialization, and queries."""
    DB_NAME = "rab_desktop.db"

    @classmethod
    def get_connection(cls):
        conn = sqlite3.connect(cls.DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_database(cls):
        """Creates tables if they do not exist and seeds initial AHS data."""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. MasterDatabase (AHS Reference)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Work_Items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_code TEXT NOT NULL UNIQUE,
                item_name TEXT NOT NULL,
                category TEXT NOT NULL,
                ahs_code TEXT,
                ahs_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Item_Specifications (
                spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
                work_item_id INTEGER NOT NULL,
                spec_name TEXT NOT NULL,
                unit TEXT NOT NULL,
                material_cost REAL NOT NULL DEFAULT 0.0,
                labor_cost REAL NOT NULL DEFAULT 0.0,
                equipment_cost REAL NOT NULL DEFAULT 0.0,
                unit_price REAL NOT NULL,
                FOREIGN KEY (work_item_id) REFERENCES Work_Items(id) ON DELETE CASCADE
            );
            """)

            # 2. Projects
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                owner_name TEXT NOT NULL,
                location TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Draft',
                land_area REAL DEFAULT 0.0,
                building_area REAL NOT NULL DEFAULT 0.0,
                floors_count INTEGER NOT NULL DEFAULT 1,
                ceiling_height REAL DEFAULT 3.2,
                design_style TEXT,
                structural_system TEXT,
                finishing_grade TEXT,
                subtotal REAL NOT NULL DEFAULT 0.0,
                grand_total REAL NOT NULL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 3. RAB Items
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS RAB_Items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                master_item_id INTEGER,
                work_category TEXT NOT NULL,
                item_name TEXT NOT NULL,
                unit TEXT NOT NULL,
                volume REAL NOT NULL DEFAULT 1.0,
                unit_price REAL NOT NULL DEFAULT 0.0,
                total_price REAL NOT NULL DEFAULT 0.0,
                notes TEXT,
                FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
                FOREIGN KEY (master_item_id) REFERENCES MasterDatabase(id)
            );
            """)

            # 4. VendorList
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS VendorList (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                phone_number TEXT NOT NULL,
                email TEXT,
                catalog_file_path TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Seed standard AHS reference if empty
            cursor.execute("SELECT COUNT(*) as count FROM MasterDatabase")
            if cursor.fetchone()['count'] == 0:
                initial_items = [
                    ("AHS-STR-01", "Pondasi Batu Kali 1:4", "Struktur", "m3", 785000, 285000, 25000, 1095000, "SNI 2835:2008"),
                    ("AHS-STR-02", "Beton Kolom & Balok K-250 Ready-Mix", "Struktur", "m3", 3850000, 1150000, 280000, 5280000, "SNI 7394:2008"),
                    ("AHS-DND-01", "Pasangan Dinding Bata Ringan Hebel t=10cm", "Dinding", "m2", 98000, 38000, 4000, 140000, "SNI-HBL-10"),
                    ("AHS-LNT-01", "Pasang Lantai Granit 60x60 cm Glazed", "Lantai", "m2", 225000, 65000, 10000, 300000, "SNI 7395:2008"),
                    ("AHS-LNT-02", "Pasangan Lantai SPC Wood Flooring 5mm", "Lantai", "m2", 195000, 40000, 5000, 240000, "INT-SPC-01"),
                    ("AHS-PLF-01", "Plafond Gypsum 9mm Hollow Galvanis", "Plafond", "m2", 92000, 48000, 5000, 145000, "SNI 2839:2008"),
                    ("AHS-INT-01", "Custom Kitchen Set Bawah HPL + Solid Surface", "Interior", "m1", 2450000, 850000, 150000, 3450000, "INT-KIT-01"),
                    ("AHS-INT-02", "Custom Wardrobe Sliding Kaca Brown Glass", "Interior", "m2", 2200000, 750000, 150000, 3100000, "INT-WRD-02"),
                    ("AHS-CAT-01", "Pengecatan Dinding Interior Acrylic Premium", "Cat", "m2", 28000, 18000, 2000, 48000, "SNI Cat"),
                    ("AHS-MEP-01", "Titik Lampu Kabel NYM + Downlight Philips 9W", "MEP", "titik", 165000, 85000, 15000, 265000, "SNI-ELK")
                ]
                cursor.executemany("""
                INSERT INTO MasterDatabase (item_code, item_name, category, unit, material_cost, labor_cost, equipment_cost, unit_price, ahs_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, initial_items)
                conn.commit()


# =============================================================================
# 2. VIEW 1: CREATE NEW RAB PROJECT (WITH AUTO-FILL DROPDOWN LOGIC)
# =============================================================================
class CreateRabView(QWidget):
    def __init__(self, parent_window):
        super().__init__()
        self.parent_window = parent_window
        self.master_items_cache = {}  # {item_name: {unit, unit_price, id}}
        self.init_ui()
        self.reload_master_dropdown()

    def init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(25, 25, 25, 25)
        main_layout.setSpacing(18)

        # Title
        title_lbl = QLabel("Create New RAB Project (Rencana Anggaran Biaya)")
        title_lbl.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        main_layout.addWidget(title_lbl)

        # Top Grid: Project Information & Requirements Form
        form_group = QGroupBox("1. Project Details & Architectural Requirements")
        form_group.setFont(QFont("Segoe UI", 10, QFont.Weight.DemiBold))
        grid = QGridLayout(form_group)
        grid.setSpacing(12)

        # Project Info Fields
        self.txt_name = QLineEdit()
        self.txt_name.setPlaceholderText("e.g. Renovasi Penthouse Sudirman")
        self.txt_owner = QLineEdit()
        self.txt_owner.setPlaceholderText("e.g. Bpk. Hendra & Ibu Stephanie")
        self.txt_location = QLineEdit()
        self.txt_location.setPlaceholderText("e.g. SCBD Jakarta Selatan")
        self.txt_desc = QLineEdit()
        self.txt_desc.setPlaceholderText("Brief project scope & objectives")

        # Architectural/Interior BoQ Data Fields (AI requirement)
        self.spn_land_area = QDoubleSpinBox()
        self.spn_land_area.setRange(0, 100000)
        self.spn_land_area.setSuffix(" m²")

        self.spn_building_area = QDoubleSpinBox()
        self.spn_building_area.setRange(1, 100000)
        self.spn_building_area.setValue(200)
        self.spn_building_area.setSuffix(" m²")

        self.spn_floors = QSpinBox()
        self.spn_floors.setRange(1, 100)
        self.spn_floors.setValue(2)

        self.cmb_style = QComboBox()
        self.cmb_style.addItems([
            "Modern Minimalist", "Japandi / Wabi-Sabi", "Industrial Chic", 
            "Classic Luxury", "Tropical Contemporary", "Scandinavian"
        ])

        self.cmb_structure = QComboBox()
        self.cmb_structure.addItems([
            "Beton Bertulang (Reinforced Concrete)", "Baja WF / H-Beam",
            "Bata Ringan Hebel Bearing Wall", "Kayu Engineered Timber"
        ])

        self.cmb_grade = QComboBox()
        self.cmb_grade.addItems(["Standard (Ekonomis)", "Deluxe (Medium)", "Premium (Luxury)"])

        # Layout Grid Placement
        grid.addWidget(QLabel("Project Name:"), 0, 0)
        grid.addWidget(self.txt_name, 0, 1)
        grid.addWidget(QLabel("Owner Name:"), 0, 2)
        grid.addWidget(self.txt_owner, 0, 3)

        grid.addWidget(QLabel("Location:"), 1, 0)
        grid.addWidget(self.txt_location, 1, 1)
        grid.addWidget(QLabel("Description:"), 1, 2)
        grid.addWidget(self.txt_desc, 1, 3)

        grid.addWidget(QLabel("Building Area (m²):"), 2, 0)
        grid.addWidget(self.spn_building_area, 2, 1)
        grid.addWidget(QLabel("Floors Count:"), 2, 2)
        grid.addWidget(self.spn_floors, 2, 3)

        grid.addWidget(QLabel("Design Style:"), 3, 0)
        grid.addWidget(self.cmb_style, 3, 1)
        grid.addWidget(QLabel("Finishing Grade:"), 3, 2)
        grid.addWidget(self.cmb_grade, 3, 3)

        main_layout.addWidget(form_group)

        # 2. RAB Entry Table
        table_group = QGroupBox("2. RAB Entry Table (Cost Breakdown Items)")
        table_group.setFont(QFont("Segoe UI", 10, QFont.Weight.DemiBold))
        table_vbox = QVBoxLayout(table_group)

        # Controls row
        btn_row = QHBoxLayout()
        self.btn_add_row = QPushButton("+ Add Work Item Row")
        self.btn_add_row.setStyleSheet("background-color: #0d6efd; color: white; padding: 6px 14px; font-weight: bold;")
        self.btn_add_row.clicked.connect(self.add_rab_table_row)

        self.btn_remove_row = QPushButton("- Remove Selected Row")
        self.btn_remove_row.setStyleSheet("background-color: #dc3545; color: white; padding: 6px 14px;")
        self.btn_remove_row.clicked.connect(self.remove_selected_row)

        btn_row.addWidget(self.btn_add_row)
        btn_row.addWidget(self.btn_remove_row)
        btn_row.addStretch()
        table_vbox.addLayout(btn_row)

        # Table Widget: 7 columns with Specification directly next to Work Item
        self.table = QTableWidget(0, 7)
        self.table.setHorizontalHeaderLabels([
            "Work Item (From Master DB)", "Specification", "Category", "Unit (Satuan)", 
            "Volume", "Unit Price (Rp)", "Total Price (Rp)"
        ])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(6, QHeaderView.ResizeMode.ResizeToContents)
        table_vbox.addWidget(self.table)

        # Summary Bar & Save Project Button
        summary_row = QHBoxLayout()
        self.lbl_grand_total = QLabel("Grand Total: Rp 0")
        self.lbl_grand_total.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        self.lbl_grand_total.setStyleSheet("color: #198754;")

        self.btn_save_project = QPushButton("Save & Generate Project BoQ")
        self.btn_save_project.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        self.btn_save_project.setStyleSheet("background-color: #198754; color: white; padding: 10px 24px; border-radius: 4px;")
        self.btn_save_project.clicked.connect(self.save_project_to_db)

        summary_row.addWidget(self.lbl_grand_total)
        summary_row.addStretch()
        summary_row.addWidget(self.btn_save_project)
        table_vbox.addLayout(summary_row)

        main_layout.addWidget(table_group)

        # Pre-populate with 2 default rows
        self.add_rab_table_row()
        self.add_rab_table_row()

    def reload_master_dropdown(self):
        """Loads latest master items from SQLite into cache including specification."""
        self.master_items_cache.clear()
        with DatabaseManager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, item_name, specification, category, unit, unit_price FROM MasterDatabase ORDER BY item_name ASC")
            for row in cursor.fetchall():
                self.master_items_cache[row['item_name']] = {
                    'id': row['id'],
                    'specification': row['specification'] or '',
                    'category': row['category'],
                    'unit': row['unit'],
                    'unit_price': float(row['unit_price'])
                }

    def add_rab_table_row(self):
        """Adds a new row to the table with interactive auto-fill combobox."""
        row_idx = self.table.rowCount()
        self.table.insertRow(row_idx)

        # 0. Combobox for Work Item (Searchable)
        combo = QComboBox()
        combo.setEditable(True)
        combo.addItem("-- Select Work Item --")
        for item_name in sorted(self.master_items_cache.keys()):
            combo.addItem(item_name)

        # 1. Specification (Editable text input field directly next to Work Item)
        txt_spec = QLineEdit()
        txt_spec.setPlaceholderText("Detailed specifications, materials, notes...")

        # 2. Category (Read-only)
        txt_cat = QLineEdit()
        txt_cat.setReadOnly(True)

        # 3. Unit (Read-only, auto-filled)
        txt_unit = QLineEdit()
        txt_unit.setReadOnly(True)

        # 4. Volume (Editable spinbox)
        spn_volume = QDoubleSpinBox()
        spn_volume.setRange(0.01, 100000.0)
        spn_volume.setValue(1.0)
        spn_volume.setSingleStep(0.5)

        # 5. Unit Price (Read-only, auto-filled)
        txt_price = QLineEdit("0")
        txt_price.setReadOnly(True)

        # 6. Total Price (Read-only calculated)
        txt_total = QLineEdit("0")
        txt_total.setReadOnly(True)
        txt_total.setStyleSheet("font-weight: bold; background-color: #f8f9fa;")

        # Set widgets to table cells
        self.table.setCellWidget(row_idx, 0, combo)
        self.table.setCellWidget(row_idx, 1, txt_spec)
        self.table.setCellWidget(row_idx, 2, txt_cat)
        self.table.setCellWidget(row_idx, 3, txt_unit)
        self.table.setCellWidget(row_idx, 4, spn_volume)
        self.table.setCellWidget(row_idx, 5, txt_price)
        self.table.setCellWidget(row_idx, 6, txt_total)

        # CORE LOGIC: Signal connection for Auto-Fill
        combo.currentTextChanged.connect(lambda text, r=row_idx: self.on_item_selected(text, r))
        spn_volume.valueChanged.connect(lambda val, r=row_idx: self.recalculate_row_total(r))

    def on_item_selected(self, item_name, row_idx):
        """Auto-fills Specification, Category, Unit, and Unit Price when user selects an item from Master DB."""
        if item_name in self.master_items_cache:
            item_data = self.master_items_cache[item_name]
            
            # Auto-fill Specification, Category, Unit, Unit Price
            spec_widget = self.table.cellWidget(row_idx, 1)
            cat_widget = self.table.cellWidget(row_idx, 2)
            unit_widget = self.table.cellWidget(row_idx, 3)
            price_widget = self.table.cellWidget(row_idx, 5)

            if spec_widget:
                spec_widget.setText(item_data['specification'])
            if cat_widget:
                cat_widget.setText(item_data['category'])
            if unit_widget:
                unit_widget.setText(item_data['unit'])
            if price_widget:
                price_widget.setText(f"{item_data['unit_price']:,.2f}")

            # Trigger row recalculation
            self.recalculate_row_total(row_idx)

    def recalculate_row_total(self, row_idx):
        """Calculates volume * unit_price and updates grand total."""
        spn_volume = self.table.cellWidget(row_idx, 4)
        price_widget = self.table.cellWidget(row_idx, 5)
        total_widget = self.table.cellWidget(row_idx, 6)

        if spn_volume and price_widget and total_widget:
            price_str = price_widget.text().replace(",", "")
            try:
                price = float(price_str)
            except ValueError:
                price = 0.0
            
            volume = spn_volume.value()
            row_total = volume * price
            total_widget.setText(f"{row_total:,.2f}")

        self.update_grand_total()

    def update_grand_total(self):
        """Sums all row totals for project budget."""
        grand_total = 0.0
        for r in range(self.table.rowCount()):
            total_widget = self.table.cellWidget(r, 6)
            if total_widget:
                try:
                    val = float(total_widget.text().replace(",", ""))
                    grand_total += val
                except ValueError:
                    pass
        self.lbl_grand_total.setText(f"Subtotal: Rp {grand_total:,.2f}")

    def remove_selected_row(self):
        curr_row = self.table.currentRow()
        if curr_row >= 0:
            self.table.removeRow(curr_row)
            self.update_grand_total()

    def save_project_to_db(self):
        """Saves project info and all RAB items to SQLite database."""
        name = self.txt_name.text().strip()
        owner = self.txt_owner.text().strip()
        location = self.txt_location.text().strip()

        if not name or not owner:
            QMessageBox.warning(self, "Validation Error", "Please provide Project Name and Owner Name.")
            return

        with DatabaseManager.get_connection() as conn:
            cursor = conn.cursor()
            code = f"PRJ-{datetime.now().strftime('%Y%m%d-%H%M')}"
            
            # Compute total
            subtotal = 0.0
            rab_rows = []
            for r in range(self.table.rowCount()):
                combo = self.table.cellWidget(r, 0)
                item_name = combo.currentText()
                if item_name in self.master_items_cache:
                    spec = self.table.cellWidget(r, 1).text()
                    unit = self.table.cellWidget(r, 3).text()
                    vol = self.table.cellWidget(r, 4).value()
                    price = float(self.table.cellWidget(r, 5).text().replace(",", ""))
                    total = vol * price
                    subtotal += total
                    master_id = self.master_items_cache[item_name]['id']
                    cat = self.master_items_cache[item_name]['category']
                    rab_rows.append((master_id, cat, item_name, spec, unit, vol, price, total))

            # Insert Project
            cursor.execute("""
            INSERT INTO Projects (project_code, name, description, owner_name, location,
                                 building_area, floors_count, design_style, subtotal, grand_total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (code, name, self.txt_desc.text(), owner, location,
                  self.spn_building_area.value(), self.spn_floors.value(),
                  self.cmb_style.currentText(), subtotal, subtotal * 1.11))
            
            project_id = cursor.lastrowid

            # Insert RAB Items with specification
            for row in rab_rows:
                cursor.execute("""
                INSERT INTO RAB_Items (project_id, master_item_id, work_category, item_name, specification, unit, volume, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (project_id, row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]))

            conn.commit()

        QMessageBox.information(self, "Success", f"Project '{name}' with {len(rab_rows)} RAB items successfully saved!")
        self.parent_window.show_view("Master Project List (Resume/Summary)")


# =============================================================================
# 3. VIEW 2: MASTER PROJECT LIST (RESUME/SUMMARY)
# =============================================================================
class MasterProjectListView(QWidget):
    def __init__(self, parent_window):
        super().__init__()
        self.parent_window = parent_window
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 25, 25, 25)
        layout.setSpacing(15)

        header = QLabel("Master Project List (Portfolio Summary)")
        header.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(header)

        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Project Code", "Project Name", "Owner", "Status", "Estimated Total (Rp)"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)

    def refresh_data(self):
        self.table.setRowCount(0)
        with DatabaseManager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT project_code, name, owner_name, status, grand_total FROM Projects ORDER BY id DESC")
            for row in cursor.fetchall():
                r = self.table.rowCount()
                self.table.insertRow(r)
                self.table.setItem(r, 0, QTableWidgetItem(row['project_code']))
                self.table.setItem(r, 1, QTableWidgetItem(row['name']))
                self.table.setItem(r, 2, QTableWidgetItem(row['owner_name']))
                self.table.setItem(r, 3, QTableWidgetItem(row['status']))
                self.table.setItem(r, 4, QTableWidgetItem(f"Rp {row['grand_total']:,.2f}"))


# =============================================================================
# 4. VIEW 3: MASTER SCHEDULE & PROGRESS (WITH S-CURVE MATPLOTLIB PLOT)
# =============================================================================
class MasterScheduleView(QWidget):
    def __init__(self, parent_window):
        super().__init__()
        self.parent_window = parent_window
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 25, 25, 25)

        title = QLabel("Master Schedule & Progress Tracker (S-Curve & WBS)")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)

        # Matplotlib S-Curve Figure
        self.figure = Figure(figsize=(8, 4), dpi=100)
        self.canvas = FigureCanvas(self.figure)
        layout.addWidget(self.canvas)

        self.plot_s_curve()

    def plot_s_curve(self):
        self.figure.clear()
        ax = self.figure.add_subplot(111)

        # Sample weeks
        weeks = np.arange(1, 11)
        # S-Curve mathematical sigmoid function for planned progress
        target = 100 / (1 + np.exp(-0.8 * (weeks - 5)))
        target = (target - target.min()) / (target.max() - target.min()) * 100

        # Actual progress up to week 5
        actual_weeks = np.arange(1, 6)
        actual = target[:5] * np.array([1.0, 0.96, 0.92, 0.90, 0.91])

        ax.plot(weeks, target, 'b-o', label='Target Plan (Rencana)', linewidth=2.5, markersize=5)
        ax.plot(actual_weeks, actual, 'r--s', label='Actual Progress (Realisasi)', linewidth=2.5, markersize=6)
        ax.axvline(x=5, color='gray', linestyle=':', label='Current Status (Week 5)')

        ax.set_title("Project S-Curve Tracking (Target vs Actual)", fontsize=12, fontweight='bold')
        ax.set_xlabel("Project Timeline (Weeks)")
        ax.set_ylabel("Cumulative Progress (%)")
        ax.set_ylim(0, 105)
        ax.grid(True, linestyle='--', alpha=0.6)
        ax.legend(loc='lower right')

        self.figure.tight_layout()
        self.canvas.draw()


# =============================================================================
# 5. VIEW 4: MASTER DATABASE (CRUD FOR AHS & COSTING REFERENCE)
# =============================================================================
class MasterDatabaseView(QWidget):
    def __init__(self, parent_window):
        super().__init__()
        self.parent_window = parent_window
        self.init_ui()
        self.refresh_table()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 25, 25, 25)
        layout.setSpacing(15)

        title = QLabel("Master Database (Analisa Harga Satuan - AHS Single Source of Truth)")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)

        # Top form for inserting new AHS item
        grp = QGroupBox("Add New AHS Reference Item")
        form = QGridLayout(grp)

        self.txt_code = QLineEdit()
        self.txt_code.setPlaceholderText("e.g. AHS-INT-05")
        self.txt_name = QLineEdit()
        self.txt_name.setPlaceholderText("e.g. Partisi Kaca Tempered 10mm")
        self.cmb_cat = QComboBox()
        self.cmb_cat.addItems(["Struktur", "Dinding", "Lantai", "Plafond", "Pintu/Jendela", "Cat", "Interior", "MEP"])
        self.txt_unit = QLineEdit()
        self.txt_unit.setPlaceholderText("m2 / m3 / unit")

        self.spn_material = QDoubleSpinBox()
        self.spn_material.setRange(0, 100000000)
        self.spn_labor = QDoubleSpinBox()
        self.spn_labor.setRange(0, 100000000)

        self.btn_insert = QPushButton("+ Insert to Master DB")
        self.btn_insert.setStyleSheet("background-color: #198754; color: white; font-weight: bold; padding: 6px 16px;")
        self.btn_insert.clicked.connect(self.insert_item)

        form.addWidget(QLabel("Item Code:"), 0, 0)
        form.addWidget(self.txt_code, 0, 1)
        form.addWidget(QLabel("Item Name:"), 0, 2)
        form.addWidget(self.txt_name, 0, 3)

        form.addWidget(QLabel("Category:"), 1, 0)
        form.addWidget(self.cmb_cat, 1, 1)
        form.addWidget(QLabel("Unit:"), 1, 2)
        form.addWidget(self.txt_unit, 1, 3)

        form.addWidget(QLabel("Material Cost (Rp):"), 2, 0)
        form.addWidget(self.spn_material, 2, 1)
        form.addWidget(QLabel("Labor Wage (Rp):"), 2, 2)
        form.addWidget(self.spn_labor, 2, 3)

        form.addWidget(self.btn_insert, 2, 4)
        layout.addWidget(grp)

        # Table of AHS items
        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(["Code", "Item Name", "Category", "Unit", "Labor Wage", "Total Unit Price"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)

    def insert_item(self):
        code = self.txt_code.text().strip()
        name = self.txt_name.text().strip()
        unit = self.txt_unit.text().strip()
        mat = self.spn_material.value()
        lab = self.spn_labor.value()
        total_price = mat + lab

        if not code or not name or not unit:
            QMessageBox.warning(self, "Validation", "Code, Name, and Unit are required.")
            return

        try:
            with DatabaseManager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO MasterDatabase (item_code, item_name, category, unit, material_cost, labor_cost, unit_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (code, name, self.cmb_cat.currentText(), unit, mat, lab, total_price))
                conn.commit()

            QMessageBox.information(self, "Success", f"Item '{name}' added! Master dropdown will now reflect this item.")
            self.refresh_table()
            # Notify CreateRabView to reload its cache and dropdown items!
            self.parent_window.create_rab_view.reload_master_dropdown()

            self.txt_code.clear()
            self.txt_name.clear()
            self.txt_unit.clear()
            self.spn_material.setValue(0)
            self.spn_labor.setValue(0)

        except sqlite3.IntegrityError:
            QMessageBox.critical(self, "Error", f"Item Code '{code}' already exists.")

    def refresh_table(self):
        self.table.setRowCount(0)
        with DatabaseManager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT item_code, item_name, category, unit, labor_cost, unit_price FROM MasterDatabase ORDER BY id DESC")
            for row in cursor.fetchall():
                r = self.table.rowCount()
                self.table.insertRow(r)
                self.table.setItem(r, 0, QTableWidgetItem(row['item_code']))
                self.table.setItem(r, 1, QTableWidgetItem(row['item_name']))
                self.table.setItem(r, 2, QTableWidgetItem(row['category']))
                self.table.setItem(r, 3, QTableWidgetItem(row['unit']))
                self.table.setItem(r, 4, QTableWidgetItem(f"Rp {row['labor_cost']:,.2f}"))
                self.table.setItem(r, 5, QTableWidgetItem(f"Rp {row['unit_price']:,.2f}"))


# =============================================================================
# 6. VIEW 5: VENDOR LIST (WITH LOCAL FILE BROWSER)
# =============================================================================
class VendorListView(QWidget):
    def __init__(self, parent_window):
        super().__init__()
        self.parent_window = parent_window
        self.init_ui()
        self.refresh_table()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 25, 25, 25)

        title = QLabel("Vendor Directory & Material Catalog")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)

        # Form
        grp = QGroupBox("Register New Vendor")
        grid = QGridLayout(grp)

        self.txt_vname = QLineEdit()
        self.txt_vphone = QLineEdit()
        self.txt_catalog_path = QLineEdit()
        self.txt_catalog_path.setPlaceholderText("Local PDF or Image catalog path")

        btn_browse = QPushButton("Browse File...")
        btn_browse.clicked.connect(self.browse_catalog_file)

        btn_save_vendor = QPushButton("+ Save Vendor")
        btn_save_vendor.setStyleSheet("background-color: #0d6efd; color: white; font-weight: bold; padding: 6px 14px;")
        btn_save_vendor.clicked.connect(self.save_vendor)

        grid.addWidget(QLabel("Vendor Name:"), 0, 0)
        grid.addWidget(self.txt_vname, 0, 1)
        grid.addWidget(QLabel("Phone Number:"), 0, 2)
        grid.addWidget(self.txt_vphone, 0, 3)

        grid.addWidget(QLabel("Catalog Path:"), 1, 0)
        grid.addWidget(self.txt_catalog_path, 1, 1)
        grid.addWidget(btn_browse, 1, 2)
        grid.addWidget(btn_save_vendor, 1, 3)

        layout.addWidget(grp)

        # Table
        self.table = QTableWidget(0, 4)
        self.table.setHorizontalHeaderLabels(["Vendor Name", "Phone", "Catalog File Path", "Action"])
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)

    def browse_catalog_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Vendor Catalog", "", "PDF / Images (*.pdf *.png *.jpg *.jpeg)"
        )
        if file_path:
            self.txt_catalog_path.setText(file_path)

    def save_vendor(self):
        vname = self.txt_vname.text().strip()
        vphone = self.txt_vphone.text().strip()
        vcat = self.txt_catalog_path.text().strip()

        if not vname or not vphone:
            QMessageBox.warning(self, "Validation", "Vendor Name and Phone are required.")
            return

        with DatabaseManager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO VendorList (name, phone_number, catalog_file_path)
            VALUES (?, ?, ?)
            """, (vname, vphone, vcat))
            conn.commit()

        self.refresh_table()
        self.txt_vname.clear()
        self.txt_vphone.clear()
        self.txt_catalog_path.clear()
        QMessageBox.information(self, "Saved", f"Vendor '{vname}' registered successfully.")

    def refresh_table(self):
        self.table.setRowCount(0)
        with DatabaseManager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name, phone_number, catalog_file_path FROM VendorList ORDER BY id DESC")
            for row in cursor.fetchall():
                r = self.table.rowCount()
                self.table.insertRow(r)
                self.table.setItem(r, 0, QTableWidgetItem(row['name']))
                self.table.setItem(r, 1, QTableWidgetItem(row['phone_number']))
                self.table.setItem(r, 2, QTableWidgetItem(row['catalog_file_path'] or "-"))
                self.table.setItem(r, 3, QTableWidgetItem("Ready"))


# =============================================================================
# 7. MAIN WINDOW: PERSISTENT LEFT SIDEBAR + DYNAMIC ROUTING
# =============================================================================
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("RAB Studio Pro - Architecture & Interior Cost Estimation (Windows)")
        self.resize(1280, 800)

        # Initialize SQLite database
        DatabaseManager.init_database()

        # Root layout: Horizontal split (Left Sidebar | Right Dynamic Stack)
        root_widget = QWidget()
        self.setCentralWidget(root_widget)
        root_layout = QHBoxLayout(root_widget)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # 1. Left Sidebar Navigation
        sidebar_frame = QFrame()
        sidebar_frame.setFixedWidth(260)
        sidebar_frame.setStyleSheet("""
            QFrame {
                background-color: #1e293b;
                border-right: 1px solid #334155;
            }
            QLabel {
                color: #f8fafc;
            }
            QPushButton {
                background-color: transparent;
                color: #cbd5e1;
                border: none;
                text-align: left;
                padding: 12px 18px;
                font-size: 13px;
                font-family: 'Segoe UI';
                font-weight: 500;
                border-radius: 6px;
                margin: 3px 10px;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #ffffff;
            }
            QPushButton:checked {
                background-color: #2563eb;
                color: #ffffff;
                font-weight: bold;
            }
        """)
        sidebar_layout = QVBoxLayout(sidebar_frame)
        sidebar_layout.setContentsMargins(10, 20, 10, 20)
        sidebar_layout.setSpacing(6)

        # Brand header
        brand_lbl = QLabel("📐 RAB Pro Studio")
        brand_lbl.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        sub_lbl = QLabel("BoQ & AHS Estimator")
        sub_lbl.setStyleSheet("color: #94a3b8; font-size: 11px;")
        sidebar_layout.addWidget(brand_lbl)
        sidebar_layout.addWidget(sub_lbl)
        sidebar_layout.addSpacing(20)

        # Navigation Buttons (Required 5 menus)
        self.nav_buttons = {}
        menu_items = [
            "Create New RAB Project",
            "Master Project List (Resume/Summary)",
            "Master Schedule & Progress",
            "Master Database (Costing Reference)",
            "Vendor List"
        ]

        for menu_name in menu_items:
            btn = QPushButton(menu_name)
            btn.setCheckable(True)
            btn.clicked.connect(lambda checked, name=menu_name: self.show_view(name))
            sidebar_layout.addWidget(btn)
            self.nav_buttons[menu_name] = btn

        sidebar_layout.addStretch()

        # System version badge in sidebar footer
        footer_lbl = QLabel("SQLite v3 • PyQt6 Desktop\\nWindows x64 Standalone")
        footer_lbl.setStyleSheet("color: #64748b; font-size: 10px; margin: 10px;")
        sidebar_layout.addWidget(footer_lbl)

        root_layout.addWidget(sidebar_frame)

        # 2. Right Dynamic Content Area (QStackedWidget)
        self.content_stack = QStackedWidget()
        self.content_stack.setStyleSheet("background-color: #f8fafc;")

        # Instantiate Views
        self.create_rab_view = CreateRabView(self)
        self.project_list_view = MasterProjectListView(self)
        self.schedule_view = MasterScheduleView(self)
        self.master_db_view = MasterDatabaseView(self)
        self.vendor_view = VendorListView(self)

        self.views_map = {
            "Create New RAB Project": (0, self.create_rab_view),
            "Master Project List (Resume/Summary)": (1, self.project_list_view),
            "Master Schedule & Progress": (2, self.schedule_view),
            "Master Database (Costing Reference)": (3, self.master_db_view),
            "Vendor List": (4, self.vendor_view)
        }

        self.content_stack.addWidget(self.create_rab_view)
        self.content_stack.addWidget(self.project_list_view)
        self.content_stack.addWidget(self.schedule_view)
        self.content_stack.addWidget(self.master_db_view)
        self.content_stack.addWidget(self.vendor_view)

        root_layout.addWidget(self.content_stack)

        # Default to first view
        self.show_view("Create New RAB Project")

    def show_view(self, view_name):
        """Switches current visible view in QStackedWidget and highlights active button."""
        if view_name in self.views_map:
            idx, view_widget = self.views_map[view_name]
            self.content_stack.setCurrentIndex(idx)

            # Update checked state of sidebar buttons
            for name, btn in self.nav_buttons.items():
                btn.setChecked(name == view_name)

            # Trigger refresh if view supports it
            if hasattr(view_widget, 'refresh_data'):
                view_widget.refresh_data()
            elif hasattr(view_widget, 'refresh_table'):
                view_widget.refresh_table()


# =============================================================================
# APPLICATION ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    # Global modern font
    font = QFont("Segoe UI", 9)
    app.setFont(font)

    window = MainWindow()
    window.show()
    sys.exit(app.exec())
`;


export const PYTHON_DYNAMIC_ROWS_SNIPPET = `
# Python UI Code Snippet: Dynamic Specification Rows Addition Logic
class MasterDatabaseView(QWidget):
    def __init__(self):
        super().__init__()
        self.spec_rows = []
        self.init_ui()
        
    def init_ui(self):
        self.layout = QVBoxLayout(self)
        
        # Parent Work Item Fields
        self.txt_item_code = QLineEdit(placeholderText="Item Code")
        self.txt_item_name = QLineEdit(placeholderText="Work Item Name")
        
        self.layout.addWidget(self.txt_item_code)
        self.layout.addWidget(self.txt_item_name)
        
        # Dynamic Specifications Container
        self.specs_container = QVBoxLayout()
        self.layout.addLayout(self.specs_container)
        
        # Add Specification Button (+)
        self.btn_add_spec = QPushButton("+ Add Specification")
        self.btn_add_spec.clicked.connect(self.add_spec_row)
        self.layout.addWidget(self.btn_add_spec)
        
        # Save Button
        self.btn_save = QPushButton("Save to Database")
        self.btn_save.clicked.connect(self.save_data)
        self.layout.addWidget(self.btn_save)
        
        # Add initial row
        self.add_spec_row()
        
    def add_spec_row(self):
        row_widget = QWidget()
        row_layout = QHBoxLayout(row_widget)
        
        txt_spec_name = QLineEdit(placeholderText="Spec Name (e.g., Cat Dulux)")
        txt_unit = QLineEdit(placeholderText="Unit (e.g., m2)")
        spn_unit_price = QDoubleSpinBox()
        spn_unit_price.setMaximum(1e9)
        spn_unit_price.setPrefix("Rp ")
        
        row_layout.addWidget(txt_spec_name)
        row_layout.addWidget(txt_unit)
        row_layout.addWidget(spn_unit_price)
        
        self.specs_container.addWidget(row_widget)
        
        # Keep track of inputs to read them later
        self.spec_rows.append({
            'widget': row_widget,
            'spec_name': txt_spec_name,
            'unit': txt_unit,
            'unit_price': spn_unit_price
        })
        
    def save_data(self):
        item_code = self.txt_item_code.text()
        item_name = self.txt_item_name.text()
        
        with sqlite3.connect("rab_desktop.db") as conn:
            cursor = conn.cursor()
            
            # Insert Parent Work Item
            cursor.execute("""
                INSERT INTO Work_Items (item_code, item_name, category)
                VALUES (?, ?, ?)
            """, (item_code, item_name, 'General'))
            
            work_item_id = cursor.lastrowid
            
            # Insert Dynamic Specifications
            for row in self.spec_rows:
                spec_name = row['spec_name'].text()
                unit = row['unit'].text()
                unit_price = row['unit_price'].value()
                
                if spec_name and unit:
                    cursor.execute("""
                        INSERT INTO Item_Specifications 
                        (work_item_id, spec_name, unit, unit_price)
                        VALUES (?, ?, ?, ?)
                    """, (work_item_id, spec_name, unit, unit_price))
                    
            conn.commit()
            print("Successfully saved multi-row specification data!")
`

export const PYTHON_AUTOCOMPLETE_PRICING_SNIPPET = `
# Python UI Code Snippet: Advanced RAB Input with Autocomplete & Dynamic Specs
class RABRowEditor(QWidget):
    def __init__(self, db_connection):
        super().__init__()
        self.conn = db_connection
        self.current_margin = 0.15 # Default 15%
        self.init_ui()
        
    def init_ui(self):
        layout = QHBoxLayout(self)
        
        # 1. Work Item (Typeahead / Autocomplete)
        self.txt_item = QLineEdit()
        self.txt_item.setPlaceholderText("Type Work Item... (Press TAB)")
        self.completer = QCompleter(self.get_master_items())
        self.completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.txt_item.setCompleter(self.completer)
        
        # TAB Key Event Listener via event filter
        self.txt_item.installEventFilter(self)
        self.txt_item.editingFinished.connect(self.on_item_selected)
        
        # 2. Specification (Dynamic ComboBox, fully editable)
        self.cmb_spec = QComboBox()
        self.cmb_spec.setEditable(True)
        self.cmb_spec.currentIndexChanged.connect(self.on_spec_selected)
        
        # 3. Unit, Volume, Prices
        self.txt_unit = QLineEdit()
        self.spn_vol = QDoubleSpinBox()
        
        self.spn_selling_price = QDoubleSpinBox() # Editable override
        self.spn_selling_price.setMaximum(1e12)
        self.spn_selling_price.valueChanged.connect(self.calculate_total)
        
        self.lbl_total = QLabel("Rp 0")
        
        layout.addWidget(self.txt_item)
        layout.addWidget(self.cmb_spec)
        layout.addWidget(self.txt_unit)
        layout.addWidget(self.spn_vol)
        layout.addWidget(self.spn_selling_price)
        layout.addWidget(self.lbl_total)

    def eventFilter(self, obj, event):
        # 1. TAB Auto-Complete Logic
        if obj == self.txt_item and event.type() == QEvent.Type.KeyPress:
            if event.key() == Qt.Key.Key_Tab:
                # Force completer to accept current highlighted suggestion
                if self.completer.popup().isVisible():
                    idx = self.completer.popup().currentIndex()
                    if idx.isValid():
                        text = self.completer.popup().model().data(idx)
                        self.txt_item.setText(text)
                        self.on_item_selected()
                        self.cmb_spec.setFocus() # Move focus
                        return True
        return super().eventFilter(obj, event)

    def get_master_items(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT item_name FROM Work_Items")
        return [row[0] for row in cursor.fetchall()]

    def on_item_selected(self):
        # 2. Dynamic Specification Dropdown Population
        item_name = self.txt_item.text()
        cursor = self.conn.cursor()
        
        # Fetch Category Margin
        cursor.execute("""
            SELECT c.profit_margin_percent, w.id 
            FROM Work_Items w
            LEFT JOIN Categories c ON w.category = c.category_name
            WHERE w.item_name = ?
        """, (item_name,))
        result = cursor.fetchone()
        
        if result:
            margin_percent, work_item_id = result
            self.current_margin = (margin_percent or 0) / 100.0
            
            # Fetch Specs
            cursor.execute("""
                SELECT spec_id, spec_name, unit, unit_price 
                FROM Item_Specifications WHERE work_item_id = ?
            """, (work_item_id,))
            specs = cursor.fetchall()
            
            self.cmb_spec.clear()
            for spec_id, spec_name, unit, unit_price in specs:
                # Store data in combobox items (UserRole)
                self.cmb_spec.addItem(spec_name, userData={
                    'unit': unit,
                    'cost_price': unit_price
                })
                
    def on_spec_selected(self, index):
        # 3. Reactive Pricing Engine (Category Profit Margin Markup)
        if index >= 0:
            data = self.cmb_spec.itemData(index)
            if data:
                self.txt_unit.setText(data['unit'])
                cost_price = data['cost_price']
                
                # Automatic Markup Formula
                selling_price = cost_price * (1 + self.current_margin)
                
                # Update without triggering manual override locks (simplified here)
                self.spn_selling_price.setValue(selling_price)
                
    def calculate_total(self):
        vol = self.spn_vol.value()
        price = self.spn_selling_price.value()
        self.lbl_total.setText(f"Rp {vol * price:,.0f}")
`


export const PYTHON_CRUD_MODAL_SNIPPET = `
# Python UI Code Snippet: Master Database CRUD Operations
class MasterDatabaseEditModal(QDialog):
    def __init__(self, db_connection, existing_item_id=None):
        super().__init__()
        self.conn = db_connection
        self.item_id = existing_item_id
        self.spec_rows = []
        self.init_ui()
        
        if self.item_id:
            self.load_data()
            self.setWindowTitle("Edit Master Costing Reference (AHS)")
        else:
            self.setWindowTitle("Add New Master Costing Reference (AHS)")
            self.add_spec_row()
            
    def init_ui(self):
        self.layout = QVBoxLayout(self)
        
        self.txt_item_code = QLineEdit(placeholderText="Item Code (e.g., AHS-INT-09)")
        self.txt_item_name = QLineEdit(placeholderText="Work Item Name")
        
        self.cmb_category = QComboBox()
        self.cmb_category.addItems([
            "Pekerjaan Persiapan & Struktur",
            "Pekerjaan Dinding & Plesteran",
            "Pekerjaan Interior & Custom Furniture"
        ])
        
        self.layout.addWidget(QLabel("Item Code *"))
        self.layout.addWidget(self.txt_item_code)
        
        self.layout.addWidget(QLabel("Work Item Name *"))
        self.layout.addWidget(self.txt_item_name)
        
        self.layout.addWidget(QLabel("Category"))
        self.layout.addWidget(self.cmb_category)
        
        # Specs Container
        self.specs_container = QVBoxLayout()
        self.layout.addLayout(self.specs_container)
        
        self.btn_add_spec = QPushButton("+ Add Specification Variant")
        self.btn_add_spec.clicked.connect(self.add_spec_row)
        self.layout.addWidget(self.btn_add_spec)
        
        # Save Button
        self.btn_save = QPushButton("Save to Master DB")
        self.btn_save.clicked.connect(self.save_data)
        self.layout.addWidget(self.btn_save)
        
    def add_spec_row(self, spec_id=None, spec_name="", unit="m2", cost=0.0):
        row_widget = QWidget()
        row_layout = QHBoxLayout(row_widget)
        
        txt_spec_name = QLineEdit(spec_name, placeholderText="Spec Name")
        txt_unit = QLineEdit(unit, placeholderText="Unit")
        spn_cost = QDoubleSpinBox()
        spn_cost.setMaximum(1e9)
        spn_cost.setValue(cost)
        
        row_layout.addWidget(txt_spec_name)
        row_layout.addWidget(txt_unit)
        row_layout.addWidget(spn_cost)
        
        self.specs_container.addWidget(row_widget)
        
        self.spec_rows.append({
            'spec_id': spec_id,
            'spec_name': txt_spec_name,
            'unit': txt_unit,
            'unit_price': spn_cost
        })
        
    def load_data(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT item_code, item_name, category FROM Work_Items WHERE id = ?", (self.item_id,))
        row = cursor.fetchone()
        if row:
            self.txt_item_code.setText(row[0])
            self.txt_item_name.setText(row[1])
            self.cmb_category.setCurrentText(row[2])
            
        cursor.execute("SELECT spec_id, spec_name, unit, unit_price FROM Item_Specifications WHERE work_item_id = ?", (self.item_id,))
        for spec in cursor.fetchall():
            self.add_spec_row(spec[0], spec[1], spec[2], spec[3])
            
    def save_data(self):
        item_code = self.txt_item_code.text()
        item_name = self.txt_item_name.text()
        category = self.cmb_category.currentText()
        
        cursor = self.conn.cursor()
        
        try:
            if self.item_id:
                # UPDATE Mode
                cursor.execute("""
                    UPDATE Work_Items 
                    SET item_code = ?, item_name = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (item_code, item_name, category, self.item_id))
                
                # Simple implementation: Delete old specs and re-insert to handle additions/deletions easily
                cursor.execute("DELETE FROM Item_Specifications WHERE work_item_id = ?", (self.item_id,))
                work_item_id = self.item_id
            else:
                # INSERT Mode
                cursor.execute("""
                    INSERT INTO Work_Items (item_code, item_name, category)
                    VALUES (?, ?, ?)
                """, (item_code, item_name, category))
                work_item_id = cursor.lastrowid
                
            for row in self.spec_rows:
                spec_name = row['spec_name'].text()
                unit = row['unit'].text()
                unit_price = row['unit_price'].value()
                
                if spec_name:
                    cursor.execute("""
                        INSERT INTO Item_Specifications (work_item_id, spec_name, unit, unit_price)
                        VALUES (?, ?, ?, ?)
                    """, (work_item_id, spec_name, unit, unit_price))
                    
            self.conn.commit()
            self.accept()
            
        except Exception as e:
            self.conn.rollback()
            print("Database Error:", e)
`


export const PYTHON_UI_ADVANCED_SNIPPET = `
# Python / PyQt6 Desktop Application Architecture Snippet:
# 1. Project-Centric Navigation Hub & Workspace Switching
# 2. Automated RAB-to-Schedule Synchronization Engine
# 3. Dual-Bar Visual Progress Indicator & Automated Delay Alert Delegate

import sys
from datetime import datetime, date
from PyQt6.QtCore import Qt, QDate, QRect, QRectF
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QStackedWidget, QTableWidget, QTableWidgetItem, QTabWidget,
    QPushButton, QLabel, QLineEdit, QHeaderView, QStyledItemDelegate,
    QStyleOptionViewItem, QProgressBar, QMessageBox
)
from PyQt6.QtGui import QColor, QPainter, QBrush, QPen, QFont

# =====================================================================
# 1. PROJECT-CENTRIC HUB & WORKSPACE CONTROLLER
# =====================================================================
class DesktopMainWindow(QMainWindow):
    """Central Window managing Master Project List Hub and Project Workspace"""
    def __init__(self, db_conn):
        super().__init__()
        self.db = db_conn
        self.setWindowTitle("Rakitco BoQ ERP - Project-Centric Desktop Edition")
        self.resize(1280, 800)
        
        # Central Stacked Widget
        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)
        
        # Views: Index 0 = Master Project List, Index 1 = Project Workspace
        self.project_list_view = MasterProjectListView(self.db, on_open_workspace=self.open_workspace)
        self.workspace_view = ProjectWorkspaceView(self.db, on_return_hub=self.return_to_hub)
        
        self.stack.addWidget(self.project_list_view) # 0
        self.stack.addWidget(self.workspace_view)     # 1
        
    def open_workspace(self, project_id: int, initial_tab: int = 0):
        """Workflow: Opens selected project dataset directly inside RAB or Schedule sub-menu"""
        self.workspace_view.load_project(project_id, initial_tab)
        self.stack.setCurrentIndex(1)
        
    def return_to_hub(self):
        """Returns to Master Project List Hub"""
        self.project_list_view.refresh_table()
        self.stack.setCurrentIndex(0)


class MasterProjectListView(QWidget):
    """Central Hub: Lists all projects with 'Edit RAB' and 'Schedule' row actions"""
    def __init__(self, db, on_open_workspace):
        super().__init__()
        self.db = db
        self.on_open_workspace = on_open_workspace
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header & 'Create Project' Button
        top_bar = QHBoxLayout()
        title = QLabel("Master Project List (Central Management Hub)")
        title.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        btn_create = QPushButton("+ Create New Project")
        btn_create.setStyleSheet("background-color: #2563eb; color: white; padding: 6px 12px; font-weight: bold; border-radius: 4px;")
        btn_create.clicked.connect(self.show_create_modal)
        top_bar.addWidget(title)
        top_bar.addStretch()
        top_bar.addWidget(btn_create)
        layout.addLayout(top_bar)
        
        # Table of Projects
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["Project Code", "Project Name", "Client / Owner", "Location", "Grand Total (IDR)", "Actions"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)
        self.refresh_table()
        
    def refresh_table(self):
        cursor = self.db.cursor()
        cursor.execute("SELECT id, project_code, name, owner_name, location, grand_total FROM Projects ORDER BY id DESC")
        rows = cursor.fetchall()
        self.table.setRowCount(len(rows))
        
        for row_idx, row in enumerate(rows):
            proj_id, p_code, name, owner, loc, total = row
            self.table.setItem(row_idx, 0, QTableWidgetItem(str(p_code)))
            self.table.setItem(row_idx, 1, QTableWidgetItem(str(name)))
            self.table.setItem(row_idx, 2, QTableWidgetItem(str(owner)))
            self.table.setItem(row_idx, 3, QTableWidgetItem(str(loc)))
            self.table.setItem(row_idx, 4, QTableWidgetItem(f"Rp {total:,.0f}"))
            
            # Row Actions Container
            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(4, 2, 4, 2)
            
            btn_edit_rab = QPushButton("Edit RAB")
            btn_edit_rab.setStyleSheet("background-color: #2563eb; color: white; border-radius: 3px; font-size: 11px;")
            btn_edit_rab.clicked.connect(lambda _, pid=proj_id: self.on_open_workspace(pid, 0))
            
            btn_schedule = QPushButton("Schedule")
            btn_schedule.setStyleSheet("background-color: #4f46e5; color: white; border-radius: 3px; font-size: 11px;")
            btn_schedule.clicked.connect(lambda _, pid=proj_id: self.on_open_workspace(pid, 1))
            
            action_layout.addWidget(btn_edit_rab)
            action_layout.addWidget(btn_schedule)
            self.table.setCellWidget(row_idx, 5, action_widget)
            
    def show_create_modal(self):
        # Dialog collecting Project Code, Name, Owner, Location, Description
        pass


# =====================================================================
# 2. AUTOMATED RAB-TO-SCHEDULE SYNCHRONIZATION ENGINE
# =====================================================================
class ScheduleSyncEngine:
    """Synchronizes work items saved in RAB_Items directly into Schedule_Items"""
    @staticmethod
    def sync_project_schedule(db, project_id: int):
        cursor = db.cursor()
        
        # 1. Fetch project subtotal for weight percent calculation
        cursor.execute("SELECT subtotal, created_at FROM Projects WHERE id = ?", (project_id,))
        proj = cursor.fetchone()
        subtotal = proj[0] if proj and proj[0] > 0 else 1.0
        
        # 2. Fetch all RAB line items for this project
        cursor.execute("""
            SELECT id, work_category, item_name, total_price 
            FROM RAB_Items 
            WHERE project_id = ?
            ORDER BY id ASC
        """, (project_id,))
        rab_items = cursor.fetchall()
        
        # 3. Synchronize into Schedule_Items table
        for idx, item in enumerate(rab_items):
            rab_id, category, item_name, total_price = item
            weight = round((total_price / subtotal) * 100.0, 2)
            wbs_code = f"WBS {idx + 1}.0"
            
            # Check if schedule record already exists
            cursor.execute("SELECT id FROM Schedule_Items WHERE project_id = ? AND rab_item_id = ?", (project_id, rab_id))
            existing = cursor.fetchone()
            
            if not existing:
                # Default 21-day timeline staggered by work sequence
                start_date = date.today().isoformat()
                end_date = date.today().isoformat() # or date + timedelta(days=21)
                
                cursor.execute("""
                    INSERT INTO Schedule_Items (
                        project_id, rab_item_id, wbs_code, task_name, category,
                        weight_percent, planned_start_date, planned_end_date,
                        actual_progress_percent, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'Not Started')
                """, (project_id, rab_id, wbs_code, item_name, category, weight, start_date, end_date))
            else:
                # Keep dates & progress, update weight and item name if changed in RAB
                cursor.execute("""
                    UPDATE Schedule_Items 
                    SET task_name = ?, category = ?, weight_percent = ?
                    WHERE id = ?
                """, (item_name, category, weight, existing[0]))
                
        db.commit()


# =====================================================================
# 3. DUAL-BAR VISUAL PROGRESS DELEGATE & AUTOMATED DELAY ALERT
# =====================================================================
class DualProgressBarDelegate(QStyledItemDelegate):
    """
    Renders a two-part stacked progress bar in the QTableWidget:
    - Top Bar: Planned Progress % = ((Current Date - Start) / (End - Start)) * 100
    - Bottom Bar: User-inputted Actual Progress %
    - Visual Delay Alert: If Actual < Planned, marks ⚠️ Delayed
    """
    def paint(self, painter: QPainter, option: QStyleOptionViewItem, index):
        # Extract data payload: (planned_pct, actual_pct, is_delayed)
        data = index.data(Qt.ItemDataRole.UserRole)
        if not data or not isinstance(data, dict):
            super().paint(painter, option, index)
            return
            
        planned_pct = max(0.0, min(100.0, data.get("planned", 0.0)))
        actual_pct = max(0.0, min(100.0, data.get("actual", 0.0)))
        is_delayed = actual_pct < planned_pct
        
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        rect = option.rect
        padding = 4
        bar_height = (rect.height() - padding * 3) // 2
        
        # --- 1. Top Bar: Planned Progress (Blue) ---
        top_bg = QRect(rect.left() + padding, rect.top() + padding, rect.width() - padding * 2, bar_height)
        painter.setBrush(QBrush(QColor(226, 232, 240))) # slate-200
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(top_bg, 3, 3)
        
        top_fill_w = int((planned_pct / 100.0) * top_bg.width())
        top_fill = QRect(top_bg.left(), top_bg.top(), top_fill_w, top_bg.height())
        painter.setBrush(QBrush(QColor(37, 99, 235))) # blue-600
        painter.drawRoundedRect(top_fill, 3, 3)
        
        # --- 2. Bottom Bar: Actual Progress (Emerald or Rose if delayed) ---
        bot_bg = QRect(rect.left() + padding, rect.top() + padding * 2 + bar_height, rect.width() - padding * 2, bar_height)
        painter.setBrush(QBrush(QColor(226, 232, 240)))
        painter.drawRoundedRect(bot_bg, 3, 3)
        
        bot_fill_w = int((actual_pct / 100.0) * bot_bg.width())
        bot_fill = QRect(bot_bg.left(), bot_bg.top(), bot_fill_w, bot_bg.height())
        act_color = QColor(225, 29, 72) if is_delayed else QColor(16, 185, 129) # rose-600 or emerald-500
        painter.setBrush(QBrush(act_color))
        painter.drawRoundedRect(bot_fill, 3, 3)
        
        # --- 3. Text Labels ---
        painter.setPen(QColor(15, 23, 42))
        font = QFont("Segoe UI", 8)
        painter.setFont(font)
        painter.drawText(top_bg, Qt.AlignmentFlag.AlignCenter, f"Plan: {planned_pct:.1f}%")
        painter.drawText(bot_bg, Qt.AlignmentFlag.AlignCenter, f"Act: {actual_pct:.1f}%")
        
        painter.restore()


# =====================================================================
# 4. ACTIVE PROJECT WORKSPACE (RAB & SCHEDULE SUB-MENUS)
# =====================================================================
class ProjectWorkspaceView(QWidget):
    """Sub-Menu Workspace: Tab 1 = RAB Module, Tab 2 = Schedule & Timeline Tracker"""
    def __init__(self, db, on_return_hub):
        super().__init__()
        self.db = db
        self.on_return_hub = on_return_hub
        self.current_project_id = None
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Header Banner
        header = QWidget()
        header.setStyleSheet("background-color: white; border-bottom: 1px solid #e2e8f0; padding: 8px;")
        h_layout = QHBoxLayout(header)
        
        btn_back = QPushButton("← Project List")
        btn_back.clicked.connect(self.on_return_hub)
        h_layout.addWidget(btn_back)
        
        self.lbl_project_title = QLabel("PRJ-2026-001 • Project Workspace")
        self.lbl_project_title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        h_layout.addWidget(self.lbl_project_title)
        h_layout.addStretch()
        layout.addWidget(header)
        
        # Sub-Menu Tabs: 1. RAB (BoQ), 2. Schedule Tracker
        self.tabs = QTabWidget()
        self.tab_rab = QWidget()      # Embedded clean RAB interface
        self.tab_schedule = QWidget() # Embedded Schedule & Timeline Tracker
        
        self.tabs.addTab(self.tab_rab, "1. RAB (Bill of Quantities)")
        self.tabs.addTab(self.tab_schedule, "2. Schedule & Timeline Tracker")
        self.tabs.currentChanged.connect(self.on_tab_switched)
        layout.addWidget(self.tabs)
        
    def load_project(self, project_id: int, initial_tab: int = 0):
        self.current_project_id = project_id
        cursor = self.db.cursor()
        cursor.execute("SELECT project_code, name, owner_name FROM Projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if row:
            self.lbl_project_title.setText(f"[{row[0]}] {row[1]} (Client: {row[2]})")
            
        self.tabs.setCurrentIndex(initial_tab)
        
    def on_tab_switched(self, index: int):
        if index == 1 and self.current_project_id:
            # When switching to Schedule tab, trigger automated synchronization!
            ScheduleSyncEngine.sync_project_schedule(self.db, self.current_project_id)
            # Refresh schedule table...
`

export const PYTHON_SCURVE_AND_NAVIGATION_SNIPPET = `# ====================================================================
# PyQt6 Desktop Architecture: Dedicated RAB List & Schedule List Menus
# + Reactive WBS Schedule Table & Interactive Matplotlib Dual-Line S-Curve
# ====================================================================
import sys
import datetime
import numpy as np
from PyQt6.QtCore import Qt, QDate, pyqtSignal
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QStackedWidget, QTableWidget, QTableWidgetItem, QHeaderView,
    QPushButton, QLabel, QLineEdit, QDateEdit, QSpinBox, QDoubleSpinBox,
    QFrame, QSplitter, QProgressBar, QMessageBox
)
from PyQt6.QtGui import QFont, QColor, QPainter, QBrush, QPen

# Matplotlib integration for high-performance desktop dual-line S-Curve
import matplotlib
matplotlib.use('QtAgg')
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure

# --------------------------------------------------------------------
# 1. INTERACTIVE MATPLOTLIB DUAL-LINE S-CURVE CANVAS
# --------------------------------------------------------------------
class MatplotlibSCurveCanvas(FigureCanvas):
    """
    Renders a professional dual-line S-Curve chart:
    - Blue line: Planned Cumulative Progress (%)
    - Emerald Green line: Actual Cumulative Progress (%)
    - Shaded fill under actual curve
    - Data point markers, gridlines, today marker & legend
    """
    def __init__(self, parent=None, width=8, height=4, dpi=100):
        self.fig = Figure(figsize=(width, height), dpi=dpi, facecolor='#0f172a')
        self.axes = self.fig.add_subplot(111)
        self.fig.tight_layout(pad=3.0)
        super().__init__(self.fig)
        self.setParent(parent)

    def plot_scurve(self, weeks_count: int, planned_cum: list[float], actual_cum: list[float], current_week: int = 4):
        """
        Plots the dual S-curve trendlines with smooth interpolation.
        """
        self.axes.clear()
        self.axes.set_facecolor('#1e293b')
        
        x_weeks = np.arange(0, weeks_count + 1)
        
        # High-resolution interpolation for smooth organic S-curve rendering
        if len(planned_cum) > 3:
            x_dense = np.linspace(0, weeks_count, 150)
            # Cubic interpolation
            p_dense = np.interp(x_dense, x_weeks, planned_cum)
            self.axes.plot(x_dense, p_dense, color='#3b82f6', linewidth=2.5, label='Planned Cumulative (Target)', zorder=3)
        else:
            self.axes.plot(x_weeks, planned_cum, color='#3b82f6', linewidth=2.5, marker='o', label='Planned Cumulative', zorder=3)
            
        # Plot Planned discrete markers
        self.axes.scatter(x_weeks, planned_cum, color='#60a5fa', s=35, edgecolors='#1e293b', linewidth=1.5, zorder=4)

        # Plot Actual Progress line up to current cutoff week
        if actual_cum:
            act_len = len(actual_cum)
            x_act = np.arange(0, act_len)
            x_act_dense = np.linspace(0, act_len - 1, 80)
            act_dense = np.interp(x_act_dense, x_act, actual_cum)
            
            # Line
            self.axes.plot(x_act_dense, act_dense, color='#10b981', linewidth=3.2, label='Actual Progress (Realized)', zorder=5)
            # Shaded fill under actual progress curve
            self.axes.fill_between(x_act_dense, 0, act_dense, color='#10b981', alpha=0.18, zorder=2)
            # Markers
            self.axes.scatter(x_act, actual_cum, color='#34d399', s=45, edgecolors='#064e3b', linewidth=1.8, zorder=6)

        # Today / Cutoff reference vertical marker
        self.axes.axvline(x=current_week, color='#f59e0b', linestyle='--', linewidth=1.5, alpha=0.85, label=f'Current (Week {current_week})')

        # Formatting axes
        self.axes.set_ylim(-2, 105)
        self.axes.set_xlim(0, weeks_count)
        self.axes.set_ylabel("Cumulative Progress (%)", color='#94a3b8', fontsize=9, fontweight='bold')
        self.axes.set_xlabel("Project Timeline (Weeks / Milestones)", color='#94a3b8', fontsize=9, fontweight='bold')
        self.axes.set_xticks(x_weeks)
        self.axes.set_xticklabels([f"W{w}" for w in x_weeks], color='#cbd5e1', fontsize=8)
        self.axes.set_yticks([0, 25, 50, 75, 100])
        self.axes.set_yticklabels(["0%", "25%", "50%", "75%", "100%"], color='#cbd5e1', fontsize=8)

        # Gridlines & spines
        self.axes.grid(True, linestyle=':', color='#334155', alpha=0.7)
        for spine in self.axes.spines.values():
            spine.set_color('#334155')

        # Legend
        leg = self.axes.legend(loc='upper left', facecolor='#0f172a', edgecolor='#334155', fontsize=8)
        for text in leg.get_texts():
            text.set_color('#f1f5f9')

        self.fig.canvas.draw()


# --------------------------------------------------------------------
# 2. STRUCTURED SCHEDULE TABLE (GROUPED BY WBS CATEGORIES)
# --------------------------------------------------------------------
class ScheduleDraftWidget(QWidget):
    """
    Structured Schedule Table with WBS grouping and reactive progress formula:
    Target % = ((Current Date - Start Date) / (End Date - Start Date)) * 100
    """
    back_to_list_requested = pyqtSignal()
    switch_to_rab_requested = pyqtSignal(int) # project_id

    def __init__(self, project_id: int, project_code: str, project_name: str, parent=None):
        super().__init__(parent)
        self.project_id = project_id
        self.project_code = project_code
        self.project_name = project_name
        self.reference_date = QDate.currentDate()
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # 1. Top Navigation & Action Strip
        top_strip = QHBoxLayout()
        btn_back = QPushButton("← Back to Schedule List")
        btn_back.setStyleSheet("padding: 6px 12px; font-weight: bold; background: #e2e8f0; border-radius: 4px;")
        btn_back.clicked.connect(self.back_to_list_requested.emit)
        top_strip.addWidget(btn_back)

        lbl_info = QLabel(f"<b>[{self.project_code}]</b> {self.project_name} • Schedule & S-Curve Draft")
        lbl_info.setFont(QFont("Segoe UI", 11))
        top_strip.addWidget(lbl_info)
        top_strip.addStretch()

        btn_rab = QPushButton("Switch to RAB Draft")
        btn_rab.setStyleSheet("padding: 6px 12px; background: #dbeafe; color: #1d4ed8; font-weight: bold; border-radius: 4px;")
        btn_rab.clicked.connect(lambda: self.switch_to_rab_requested.emit(self.project_id))
        top_strip.addWidget(btn_rab)
        layout.addLayout(top_strip)

        # 2. S-Curve Canvas Header
        self.scurve_canvas = MatplotlibSCurveCanvas(self, width=8, height=3)
        layout.addWidget(self.scurve_canvas)

        # 3. Schedule Table with exact required columns:
        # Work Item Name, Weight Percentage (Bobot %), Planned Start Date, Planned End Date, Target Progress (%), Actual Progress (%)
        self.table = QTableWidget(0, 7)
        self.table.setHorizontalHeaderLabels([
            "WBS", "Work Item Name", "Bobot (%)",
            "Planned Start Date", "Planned End Date",
            "Target Progress (%)", "Actual Progress (%)"
        ])
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.table.setStyleSheet("""
            QTableWidget { background-color: #ffffff; gridline-color: #e2e8f0; font-size: 12px; }
            QHeaderView::section { background-color: #f8fafc; font-weight: bold; padding: 6px; }
        """)
        layout.addWidget(self.table)

        # Populate sample WBS items and plot initial S-Curve
        self.load_sample_data()

    def load_sample_data(self):
        sample_wbs = [
            ("WBS 1.1", "Pondasi Batu Kali 1:4 & Site Prep", 12.5, "2026-08-01", "2026-08-20", 100.0, 100.0),
            ("WBS 1.2", "Beton Kolom & Balok Struktur K-250", 28.0, "2026-08-15", "2026-09-10", 85.0, 70.0), # Delayed
            ("WBS 2.1", "Pasangan Dinding Hebel t=10cm", 18.5, "2026-09-01", "2026-09-25", 40.0, 45.0),
            ("WBS 2.2", "Plesteran & Acian Mortar", 14.0, "2026-09-15", "2026-10-10", 0.0, 0.0),
            ("WBS 3.1", "Pasangan Granit 60x60 cm Glazed", 16.0, "2026-10-01", "2026-10-25", 0.0, 0.0),
            ("WBS 4.1", "Pengecatan Interior Acrylic Jotun", 11.0, "2026-10-15", "2026-11-05", 0.0, 0.0),
        ]
        
        self.table.setRowCount(len(sample_wbs))
        for row_idx, (wbs, name, bobot, start_d, end_d, target, actual) in enumerate(sample_wbs):
            self.table.setItem(row_idx, 0, QTableWidgetItem(wbs))
            self.table.setItem(row_idx, 1, QTableWidgetItem(name))
            
            item_bobot = QTableWidgetItem(f"{bobot:.1f}%")
            item_bobot.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            self.table.setItem(row_idx, 2, item_bobot)

            # Planned Start Date editor
            date_start = QDateEdit()
            date_start.setDisplayFormat("yyyy-MM-dd")
            date_start.setDate(QDate.fromString(start_d, "yyyy-MM-dd"))
            self.table.setCellWidget(row_idx, 3, date_start)

            # Planned End Date editor
            date_end = QDateEdit()
            date_end.setDisplayFormat("yyyy-MM-dd")
            date_end.setDate(QDate.fromString(end_d, "yyyy-MM-dd"))
            self.table.setCellWidget(row_idx, 4, date_end)

            # Target Progress % (Auto derived)
            item_target = QTableWidgetItem(f"{target:.1f}%")
            item_target.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            item_target.setForeground(QColor("#1d4ed8"))
            self.table.setItem(row_idx, 5, item_target)

            # Actual Progress % (Interactive SpinBox)
            spin_actual = QDoubleSpinBox()
            spin_actual.setRange(0.0, 100.0)
            spin_actual.setSingleStep(5.0)
            spin_actual.setValue(actual)
            spin_actual.setSuffix("%")
            spin_actual.valueChanged.connect(self.on_actual_changed)
            self.table.setCellWidget(row_idx, 6, spin_actual)

        # Plot S-Curve
        planned_cumulative = [0.0, 5.2, 16.5, 38.0, 58.5, 78.0, 92.0, 100.0]
        actual_cumulative = [0.0, 6.0, 18.0, 34.5] # recorded up to Week 3
        self.scurve_canvas.plot_scurve(weeks_count=7, planned_cum=planned_cumulative, actual_cum=actual_cumulative, current_week=3)

    def on_actual_changed(self, value: float):
        """Reactive callback updating overall project progress and S-Curve."""
        # Recalculate and refresh S-Curve dynamically
        pass


# --------------------------------------------------------------------
# 3. MAIN WINDOW NAVIGATION (RAB LIST vs. SCHEDULE LIST MENUS)
# --------------------------------------------------------------------
class ConstructionERPMainWindow(QMainWindow):
    """
    Main desktop window with separate dedicated menus:
    1. 'RAB List' (loads RAB Draft on project row click)
    2. 'Schedule List' (loads Schedule Draft & S-Curve on project row click)
    """
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Rakitco BoQ ERP - Desktop Architecture")
        self.resize(1200, 780)
        self.init_ui()

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Left Sidebar
        sidebar = QFrame()
        sidebar.setFixedWidth(240)
        sidebar.setStyleSheet("background-color: #0f172a; color: #f8fafc;")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(12, 16, 12, 16)
        sidebar_layout.setSpacing(8)

        lbl_brand = QLabel("Rakitco ERP")
        lbl_brand.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        sidebar_layout.addWidget(lbl_brand)
        sidebar_layout.addSpacing(10)

        # Main Separate Menu Items:
        self.btn_rab_list = QPushButton("📋 RAB List")
        self.btn_schedule_list = QPushButton("📈 Schedule List")
        
        for btn in [self.btn_rab_list, self.btn_schedule_list]:
            btn.setStyleSheet("""
                QPushButton { text-align: left; padding: 10px 14px; font-size: 13px; font-weight: bold; border-radius: 6px; background-color: transparent; }
                QPushButton:hover { background-color: #1e293b; }
            """)
            sidebar_layout.addWidget(btn)

        sidebar_layout.addStretch()
        main_layout.addWidget(sidebar)

        # Center Stacked Widget for Page Routing
        self.stack = QStackedWidget()
        main_layout.addWidget(self.stack)

        # 1. Page: RAB List
        self.page_rab_list = self.create_rab_list_page()
        self.stack.addWidget(self.page_rab_list)

        # 2. Page: Schedule List
        self.page_schedule_list = self.create_schedule_list_page()
        self.stack.addWidget(self.page_schedule_list)

        # Menu Click Routing Handlers
        self.btn_rab_list.clicked.connect(lambda: self.stack.setCurrentWidget(self.page_rab_list))
        self.btn_schedule_list.clicked.connect(lambda: self.stack.setCurrentWidget(self.page_schedule_list))

    def create_rab_list_page(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 20, 20, 20)
        
        lbl_title = QLabel("RAB List - Master Project Cost Estimations")
        lbl_title.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        layout.addWidget(lbl_title)

        table = QTableWidget(2, 5)
        table.setHorizontalHeaderLabels(["Project Code", "Project Name", "Client", "Total BoQ (IDR)", "Action"])
        table.setItem(0, 0, QTableWidgetItem("PRJ-2026-001"))
        table.setItem(0, 1, QTableWidgetItem("Pembangunan Rumah Tinggal 2 Lantai Modern"))
        table.setItem(0, 2, QTableWidgetItem("Bpk. Hendra Gunawan"))
        table.setItem(0, 3, QTableWidgetItem("Rp 1.485.000.000"))
        
        btn_open = QPushButton("Open RAB Draft")
        btn_open.clicked.connect(lambda: self.open_rab_draft(1, "PRJ-2026-001", "Pembangunan Rumah Tinggal 2 Lantai Modern"))
        table.setCellWidget(0, 4, btn_open)
        table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)

        # Direct Row Double-Click Handler
        table.cellDoubleClicked.connect(lambda r, c: self.open_rab_draft(1, "PRJ-2026-001", "Pembangunan Rumah Tinggal 2 Lantai Modern"))
        layout.addWidget(table)
        return page

    def create_schedule_list_page(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 20, 20, 20)
        
        lbl_title = QLabel("Schedule List - Project Timelines & S-Curve Portfolio")
        lbl_title.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        layout.addWidget(lbl_title)

        table = QTableWidget(2, 5)
        table.setHorizontalHeaderLabels(["Project Code", "Project Name", "Target %", "Actual %", "Action"])
        table.setItem(0, 0, QTableWidgetItem("PRJ-2026-001"))
        table.setItem(0, 1, QTableWidgetItem("Pembangunan Rumah Tinggal 2 Lantai Modern"))
        table.setItem(0, 2, QTableWidgetItem("38.0%"))
        table.setItem(0, 3, QTableWidgetItem("34.5% (-3.5% Delayed)"))
        
        btn_open = QPushButton("Open Schedule Draft")
        btn_open.clicked.connect(lambda: self.open_schedule_draft(1, "PRJ-2026-001", "Pembangunan Rumah Tinggal 2 Lantai Modern"))
        table.setCellWidget(0, 4, btn_open)
        table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)

        # Direct Row Double-Click Handler
        table.cellDoubleClicked.connect(lambda r, c: self.open_schedule_draft(1, "PRJ-2026-001", "Pembangunan Rumah Tinggal 2 Lantai Modern"))
        layout.addWidget(table)
        return page

    def open_rab_draft(self, project_id: int, code: str, name: str):
        """Loads and switches to specific RAB Draft editor screen."""
        # Instantiates RAB draft editor and navigates stack
        QMessageBox.information(self, "Routing", f"Loading RAB Draft for [{code}] {name}")

    def open_schedule_draft(self, project_id: int, code: str, name: str):
        """Loads and switches to specific Schedule Draft & S-Curve workspace."""
        draft_widget = ScheduleDraftWidget(project_id, code, name)
        draft_widget.back_to_list_requested.connect(lambda: self.stack.setCurrentWidget(self.page_schedule_list))
        draft_widget.switch_to_rab_requested.connect(lambda pid: self.open_rab_draft(pid, code, name))
        self.stack.addWidget(draft_widget)
        self.stack.setCurrentWidget(draft_widget)
`


