-- interior_schema.sql
-- Completely decoupled schema for Interior Master Module

CREATE TABLE IF NOT EXISTS Interior_Projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    client_name TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Interior_Specifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    specification_name TEXT NOT NULL,
    base_cost REAL DEFAULT 0.0,
    unit TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS Interior_RAB_Sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    section_name TEXT NOT NULL, -- e.g., "PRELIMINARIES", "INTERIOR WORK"
    profit_margin_percent REAL DEFAULT 32.5, 
    display_order INTEGER NOT NULL,
    FOREIGN KEY(project_id) REFERENCES Interior_Projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Interior_RAB_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    item_description TEXT NOT NULL,
    quantity REAL DEFAULT 1.0,
    unit TEXT DEFAULT 'set',
    display_order INTEGER NOT NULL,
    FOREIGN KEY(section_id) REFERENCES Interior_RAB_Sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Interior_Item_Specifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    specification_id INTEGER, -- FK to Interior_Specifications (optional if manual)
    manual_spec_name TEXT,
    length_l REAL,
    width_w REAL,
    height_h REAL,
    factor REAL DEFAULT 1.0,
    system_model TEXT,
    base_cost_unit_price REAL DEFAULT 0.0,
    display_order INTEGER NOT NULL,
    FOREIGN KEY(item_id) REFERENCES Interior_RAB_Items(id) ON DELETE CASCADE,
    FOREIGN KEY(specification_id) REFERENCES Interior_Specifications(id) ON DELETE SET NULL
);
