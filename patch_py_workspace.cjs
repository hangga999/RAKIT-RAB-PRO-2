const fs = require('fs');
let code = fs.readFileSync('src/data/pythonCode.ts', 'utf8');

code = code.replace(
  /CREATE TABLE Projects \(/,
  `CREATE TABLE Projects (
    id TEXT PRIMARY KEY,
    project_code TEXT UNIQUE NOT NULL,`
);

code = code.replace(
  /export const PYTHON_UI_ADVANCED_SNIPPET = \\\`[\s\S]*?\\\`;/,
  `export const PYTHON_UI_ADVANCED_SNIPPET = \\\`
# Python UI Advanced Snippet: Project Workspace Hub & Reactive Pricing

import sys
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QStackedWidget, QTableWidget, QTableWidgetItem, QLineEdit, QLabel
)
from PyQt6.QtCore import QPropertyAnimation

# 1. Project Workspace Hub (Tabbed Container)
class ProjectWorkspace(QWidget):
    def __init__(self, project_data=None):
        super().__init__()
        self.project_data = project_data
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Header: Project Code & Tabs
        header_layout = QHBoxLayout()
        self.lbl_code = QLabel(f"Project Code: {self.project_data.get('project_code', 'NEW')}")
        header_layout.addWidget(self.lbl_code)
        
        self.btn_rab = QPushButton("RAB (BoQ & Pricing)")
        self.btn_schedule = QPushButton("Schedule (Timelines)")
        self.btn_scurve = QPushButton("S-Curve & Statistics")
        
        header_layout.addWidget(self.btn_rab)
        header_layout.addWidget(self.btn_schedule)
        header_layout.addWidget(self.btn_scurve)
        header_layout.addStretch()
        
        # Stacked Widget for Tab Views
        self.stack = QStackedWidget()
        self.rab_view = RABTableWidget({}) # View 1
        self.schedule_view = QWidget()     # View 2 (Placeholder)
        self.scurve_view = QWidget()       # View 3 (Placeholder)
        
        self.stack.addWidget(self.rab_view)
        self.stack.addWidget(self.schedule_view)
        self.stack.addWidget(self.scurve_view)
        
        # Tab Connections
        self.btn_rab.clicked.connect(lambda: self.stack.setCurrentIndex(0))
        self.btn_schedule.clicked.connect(lambda: self.stack.setCurrentIndex(1))
        self.btn_scurve.clicked.connect(lambda: self.stack.setCurrentIndex(2))
        
        layout.addLayout(header_layout)
        layout.addWidget(self.stack)

# 2. Master Project List - Edit RAB Handler
class MasterProjectList(QWidget):
    def __init__(self):
        super().__init__()
        self.table = QTableWidget(0, 3)
        self.table.setHorizontalHeaderLabels(["Project Code", "Name", "Action"])
        # In a real app, populate table here...
        
    def add_project_row(self, row, project_code, name, project_dict):
        self.table.setItem(row, 0, QTableWidgetItem(project_code))
        self.table.setItem(row, 1, QTableWidgetItem(name))
        
        # Explicit Edit RAB Button
        btn_edit = QPushButton("Edit RAB")
        btn_edit.clicked.connect(lambda: self.open_project_workspace(project_dict))
        self.table.setCellWidget(row, 2, btn_edit)
        
    def open_project_workspace(self, project_dict):
        # Instantiate and transition to the Project Workspace Hub
        self.workspace = ProjectWorkspace(project_data=project_dict)
        self.workspace.show()

# 3. RAB Reactive Volume & Cost-to-Selling Pricing Engine (PyQt6)
class RABTableWidget(QTableWidget):
    def __init__(self, category_margins):
        super().__init__()
        self.category_margins = category_margins 
        self.itemChanged.connect(self.on_cell_changed)
        
    def on_cell_changed(self, item):
        row = item.row()
        col = item.column()
        if col in [3, 4, 6]: # Vol Real, Waste, Cost Price
            self.recalculate_row(row)
            
    def recalculate_row(self, row):
        self.itemChanged.disconnect(self.on_cell_changed)
        try:
            vol_real = float(self.item(row, 3).text() or 0)
            waste_percent = float(self.item(row, 4).text() or 0)
            calc_volume = vol_real * (1 + (waste_percent / 100.0))
            self.setItem(row, 5, QTableWidgetItem(f"{calc_volume:,.2f}"))
            
            cost_price = float(self.item(row, 6).text() or 0)
            category = self.item(row, 1).text()
            margin_percent = self.category_margins.get(category, 0)
            
            selling_price = cost_price * (1 + (margin_percent / 100.0))
            self.setItem(row, 7, QTableWidgetItem(f"{calc_volume * cost_price:,.0f}"))
            self.setItem(row, 8, QTableWidgetItem(f"{selling_price:,.0f}"))
            self.setItem(row, 9, QTableWidgetItem(f"{calc_volume * selling_price:,.0f}"))
        except ValueError:
            pass
        finally:
            self.itemChanged.connect(self.on_cell_changed)
\\\`;`
);

fs.writeFileSync('src/data/pythonCode.ts', code);
