import sqlite3
import customtkinter as ctk

# 1. DATABASE PIPELINE (ISOLATED)
DB_PATH = "interior_master.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Read and execute schema
    with open("interior_schema.sql", "r") as f:
        schema = f.read()
    cursor.executescript(schema)
    
    # Seed Database Specification if empty
    cursor.execute("SELECT COUNT(*) FROM Interior_Specifications")
    if cursor.fetchone()[0] == 0:
        specs = [
            ("Base Plywood BBCC - UTY OP", 750000, "set", "Standard inner paneling"),
            ("Base HMR Panel", 300000, "m2", "Moisture resistant"),
            ("Interior Fin. HPL ex. Taco", 250000, "m2", "Standard finish"),
            ("Tandem Box ex. BLUM NL=500mm", 850000, "Unit", "Premium hardware")
        ]
        cursor.executemany(
            "INSERT INTO Interior_Specifications (specification_name, base_cost, unit, notes) VALUES (?, ?, ?, ?)",
            specs
        )
    
    conn.commit()
    conn.close()

def get_specifications():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT specification_name, base_cost FROM Interior_Specifications")
    results = cursor.fetchall()
    conn.close()
    return results

# 2. REACTIVE FORMULA ENGINE & TABLE COMPONENTS
class InteriorRabDraftView(ctk.CTkFrame):
    def __init__(self, master):
        super().__init__(master, fg_color="transparent")
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)
        
        # Header
        self.lbl_header = ctk.CTkLabel(self, text="INTERIOR RAB DRAFT (Optimized Reactive Engine)", font=ctk.CTkFont(size=20, weight="bold"))
        self.lbl_header.grid(row=0, column=0, sticky="w", padx=10, pady=10)
        
        # Scrollable Canvas for horizontal/vertical scroll
        self.scroll_canvas = ctk.CTkScrollableFrame(self, orientation="horizontal")
        self.scroll_canvas.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)
        
        self.table_container = ctk.CTkFrame(self.scroll_canvas, fg_color="transparent")
        self.table_container.pack(fill="both", expand=True)
        
        self.build_table_headers()
        
        # Sections
        self.sections = []
        self.add_section("PRELIMINARIES", 0.0)
        self.add_section("INTERIOR WORK", 33.0)
        
        # Footer
        self.footer_frame = ctk.CTkFrame(self)
        self.footer_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=10)
        
        self.btn_add_section = ctk.CTkButton(self.footer_frame, text="+ Add Section", command=lambda: self.add_section("NEW SECTION", 30.0))
        self.btn_add_section.pack(side="left", padx=10)
        
        self.lbl_grand_total = ctk.CTkLabel(self.footer_frame, text="Grand Total: Rp 0", font=ctk.CTkFont(size=18, weight="bold"), text_color="#10B981")
        self.lbl_grand_total.pack(side="right", padx=20)
        
        # Trigger initial calculation
        self.recalculate()

    def build_table_headers(self):
        headers = [
            ("No", 40), ("Item Description", 200), ("Specification", 200),
            ("Unit", 50), ("Qty", 50), ("Selling Unit Price", 120),
            ("Amount", 120), ("Length (L)", 80), ("Width (W)", 80),
            ("Height (H)", 80), ("Factor", 60), ("Model", 100),
            ("Base Cost", 100), ("Base Amount", 100), ("Total Base Item", 120),
            ("% Profit", 80)
        ]
        
        hdr_frame = ctk.CTkFrame(self.table_container, fg_color="#1E293B", corner_radius=0)
        hdr_frame.pack(fill="x")
        
        for idx, (h_text, width) in enumerate(headers):
            lbl = ctk.CTkLabel(hdr_frame, text=h_text, width=width, font=ctk.CTkFont(size=11, weight="bold"), text_color="white", anchor="w")
            lbl.pack(side="left", padx=2, pady=5)

    def add_section(self, name, margin):
        sec = SectionRow(self.table_container, self, name, margin)
        sec.pack(fill="x", pady=(10, 0))
        self.sections.append(sec)
        self.recalculate()

    def recalculate(self):
        grand_total = 0.0
        for sec in self.sections:
            sec.recalculate()
            grand_total += sec.get_section_subtotal()
            
        self.lbl_grand_total.configure(text=f"Grand Total (excl. PPN): Rp {grand_total:,.0f}")


class SectionRow(ctk.CTkFrame):
    def __init__(self, master, draft_view, name, margin):
        super().__init__(master, fg_color="#334155", corner_radius=0)
        self.draft_view = draft_view
        self.items = []
        
        # UI Row
        self.row_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.row_frame.pack(fill="x")
        
        # Col B: Bullet
        ctk.CTkLabel(self.row_frame, text="▪", width=40, font=ctk.CTkFont(size=14, weight="bold")).pack(side="left", padx=2)
        # Col C: Section Name
        self.entry_name = ctk.CTkEntry(self.row_frame, width=200, font=ctk.CTkFont(weight="bold"), fg_color="transparent", border_width=0)
        self.entry_name.insert(0, name)
        self.entry_name.pack(side="left", padx=2)
        
        # Padding for middle cols
        ctk.CTkFrame(self.row_frame, width=960, height=1, fg_color="transparent").pack(side="left")
        
        # Col Q: Margin Input
        self.entry_margin = ctk.CTkEntry(self.row_frame, width=80)
        self.entry_margin.insert(0, str(margin))
        self.entry_margin.bind("<KeyRelease>", lambda e: self.draft_view.recalculate())
        self.entry_margin.pack(side="left", padx=2)
        
        # Items Container
        self.items_container = ctk.CTkFrame(self, fg_color="transparent")
        self.items_container.pack(fill="x")
        
        self.btn_add_item = ctk.CTkButton(self, text="+ Add Item", width=100, height=24, fg_color="#475569", command=self.add_item)
        self.btn_add_item.pack(anchor="w", padx=45, pady=5)
        
        # Start with 1 item
        self.add_item()

    def add_item(self):
        idx = len(self.items) + 1
        item = ItemRow(self.items_container, self, idx)
        item.pack(fill="x")
        self.items.append(item)
        self.draft_view.recalculate()

    def get_margin(self):
        try:
            return float(self.entry_margin.get() or 0)
        except ValueError:
            return 0.0

    def recalculate(self):
        for item in self.items:
            item.recalculate()

    def get_section_subtotal(self):
        return sum(item.get_selling_amount() for item in self.items)


class ItemRow(ctk.CTkFrame):
    def __init__(self, master, section, idx):
        super().__init__(master, fg_color="#0F172A", corner_radius=0)
        self.section = section
        self.specs = []
        
        # Item Main Row (White-ish text for main item)
        self.main_row = ctk.CTkFrame(self, fg_color="#0F172A", corner_radius=0)
        self.main_row.pack(fill="x", pady=(5, 0))
        
        # Col B: Index
        self.lbl_idx = ctk.CTkLabel(self.main_row, text=str(idx), width=40)
        self.lbl_idx.pack(side="left", padx=2)
        
        # Col C: Item Description
        self.entry_desc = ctk.CTkEntry(self.main_row, width=200, placeholder_text="Work Item")
        self.entry_desc.pack(side="left", padx=2)
        
        # Col D: Blank (Reserved for Spec)
        ctk.CTkFrame(self.main_row, width=200, height=1, fg_color="transparent").pack(side="left", padx=2)
        
        # Col F & E: Unit & Qty
        self.entry_unit = ctk.CTkEntry(self.main_row, width=50)
        self.entry_unit.insert(0, "set")
        self.entry_unit.pack(side="left", padx=2)
        
        self.entry_qty = ctk.CTkEntry(self.main_row, width=50)
        self.entry_qty.insert(0, "1.0")
        self.entry_qty.bind("<KeyRelease>", lambda e: self.section.draft_view.recalculate())
        self.entry_qty.pack(side="left", padx=2)
        
        # Col G & H: Selling Unit Price & Amount (Read-only labels)
        self.lbl_sell_price = ctk.CTkLabel(self.main_row, text="0", width=120, anchor="e")
        self.lbl_sell_price.pack(side="left", padx=2)
        self.lbl_sell_amount = ctk.CTkLabel(self.main_row, text="0", width=120, anchor="e", font=ctk.CTkFont(weight="bold"))
        self.lbl_sell_amount.pack(side="left", padx=2)
        
        # Spacer for L, W, H, Factor, Model, Base Cost, Base Amount
        ctk.CTkFrame(self.main_row, width=620, height=1, fg_color="transparent").pack(side="left", padx=2)
        
        # Col P & Q: Total Base Item Cost & % Profit
        self.lbl_total_base = ctk.CTkLabel(self.main_row, text="0", width=120, anchor="e", text_color="#F59E0B")
        self.lbl_total_base.pack(side="left", padx=2)
        self.lbl_realized_profit = ctk.CTkLabel(self.main_row, text="0%", width=80, anchor="e")
        self.lbl_realized_profit.pack(side="left", padx=2)
        
        # Specs Container
        self.specs_container = ctk.CTkFrame(self, fg_color="transparent")
        self.specs_container.pack(fill="x")
        
        self.btn_add_spec = ctk.CTkButton(self, text="+ Spec", width=60, height=20, fg_color="#1E293B", command=self.add_spec)
        self.btn_add_spec.pack(anchor="w", padx=250, pady=(2, 5))
        
        self.add_spec()

    def get_qty(self):
        try:
            return float(self.entry_qty.get() or 0)
        except ValueError:
            return 0.0

    def add_spec(self):
        spec = SpecRow(self.specs_container, self)
        spec.pack(fill="x", pady=1)
        self.specs.append(spec)
        self.section.draft_view.recalculate()

    def get_total_base_cost(self):
        return sum(spec.get_base_amount() for spec in self.specs)

    def get_selling_unit_price(self):
        margin = self.section.get_margin() / 100.0
        return self.get_total_base_cost() * (1 + margin)

    def get_selling_amount(self):
        return self.get_selling_unit_price() * self.get_qty()

    def recalculate(self):
        for spec in self.specs:
            spec.recalculate()
            
        base_total = self.get_total_base_cost()
        sell_unit = self.get_selling_unit_price()
        sell_amount = self.get_selling_amount()
        margin_pct = self.section.get_margin()
        
        self.lbl_total_base.configure(text=f"{base_total:,.0f}")
        self.lbl_sell_price.configure(text=f"{sell_unit:,.0f}")
        self.lbl_sell_amount.configure(text=f"{sell_amount:,.0f}")
        self.lbl_realized_profit.configure(text=f"{margin_pct:.0f}%" if base_total > 0 else "0%")


class SpecRow(ctk.CTkFrame):
    def __init__(self, master, item):
        super().__init__(master, fg_color="transparent")
        self.item = item
        
        # Col B, C: Blank
        ctk.CTkFrame(self, width=244, height=1, fg_color="transparent").pack(side="left")
        
        # Col D: Specification (Combobox/Entry)
        self.db_specs = {name: cost for name, cost in get_specifications()}
        spec_names = list(self.db_specs.keys())
        
        self.combo_spec = ctk.CTkComboBox(self, width=200, values=spec_names, command=self.on_spec_select)
        if spec_names:
            self.combo_spec.set(spec_names[0])
            self.current_base_cost = self.db_specs[spec_names[0]]
        else:
            self.current_base_cost = 0.0
        self.combo_spec.pack(side="left", padx=2)
        
        # Col E, F, G, H: Blank
        ctk.CTkFrame(self, width=356, height=1, fg_color="transparent").pack(side="left")
        
        # Cols I, J, K, L: L, W, H, Factor
        def trigger_calc(e): self.item.section.draft_view.recalculate()
        
        self.entry_l = ctk.CTkEntry(self, width=80)
        self.entry_l.bind("<KeyRelease>", trigger_calc)
        self.entry_l.pack(side="left", padx=2)
        
        self.entry_w = ctk.CTkEntry(self, width=80)
        self.entry_w.bind("<KeyRelease>", trigger_calc)
        self.entry_w.pack(side="left", padx=2)
        
        self.entry_h = ctk.CTkEntry(self, width=80)
        self.entry_h.bind("<KeyRelease>", trigger_calc)
        self.entry_h.pack(side="left", padx=2)
        
        self.entry_factor = ctk.CTkEntry(self, width=60)
        self.entry_factor.insert(0, "1.00")
        self.entry_factor.bind("<KeyRelease>", trigger_calc)
        self.entry_factor.pack(side="left", padx=2)
        
        # Col M: Model
        self.entry_model = ctk.CTkEntry(self, width=100, placeholder_text="Model")
        self.entry_model.pack(side="left", padx=2)
        
        # Col N: Base Cost Unit Price
        self.entry_base_price = ctk.CTkEntry(self, width=100)
        self.entry_base_price.insert(0, str(self.current_base_cost))
        self.entry_base_price.bind("<KeyRelease>", trigger_calc)
        self.entry_base_price.pack(side="left", padx=2)
        
        # Col O: Base Amount (Label)
        self.lbl_base_amount = ctk.CTkLabel(self, text="0", width=100, anchor="e", text_color="#94A3B8")
        self.lbl_base_amount.pack(side="left", padx=2)

    def on_spec_select(self, choice):
        if choice in self.db_specs:
            self.entry_base_price.delete(0, 'end')
            self.entry_base_price.insert(0, str(self.db_specs[choice]))
            self.item.section.draft_view.recalculate()

    def get_base_amount(self):
        try:
            base_price = float(self.entry_base_price.get() or 0)
            l = float(self.entry_l.get() or 0)
            h = float(self.entry_h.get() or 0)
            factor = float(self.entry_factor.get() or 1)
            
            # Optimized Calculation: 
            # If dimensions are provided, calculate volume based on L * H * Factor. 
            # Otherwise, fallback to the parent item's quantity.
            if l > 0 and h > 0:
                vol = l * h * factor
            else:
                vol = self.item.get_qty() * factor
                
            return base_price * vol
        except ValueError:
            return 0.0

    def recalculate(self):
        amt = self.get_base_amount()
        self.lbl_base_amount.configure(text=f"{amt:,.0f}")


# 3. MAIN APPLICATION ROUTING
class InteriorMasterApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Interior Master Module (Decoupled Workspace)")
        self.geometry("1400x800")
        
        # Init DB
        init_db()
        
        # Layout
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        
        # Sidebar
        self.sidebar_frame = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        
        self.logo = ctk.CTkLabel(self.sidebar_frame, text="Interior Master", font=ctk.CTkFont(size=20, weight="bold"), text_color="#F59E0B")
        self.logo.grid(row=0, column=0, padx=20, pady=20)
        
        self.btn_proj = ctk.CTkButton(self.sidebar_frame, text="Interior Projects", fg_color="transparent", anchor="w")
        self.btn_proj.grid(row=1, column=0, padx=20, pady=5, sticky="ew")
        
        self.btn_db = ctk.CTkButton(self.sidebar_frame, text="Database Specification", fg_color="transparent", anchor="w")
        self.btn_db.grid(row=2, column=0, padx=20, pady=5, sticky="ew")
        
        self.btn_rab = ctk.CTkButton(self.sidebar_frame, text="RAB Draft Table Model", command=self.show_rab_draft, anchor="w", fg_color="#475569")
        self.btn_rab.grid(row=3, column=0, padx=20, pady=5, sticky="ew")
        
        # Main Area
        self.main_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
        self.main_frame.grid_rowconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        self.current_view = None
        self.show_rab_draft()

    def show_rab_draft(self):
        if self.current_view:
            self.current_view.destroy()
        self.current_view = InteriorRabDraftView(self.main_frame)
        self.current_view.grid(row=0, column=0, sticky="nsew")

if __name__ == "__main__":
    ctk.set_appearance_mode("Dark")
    ctk.set_default_color_theme("blue")
    app = InteriorMasterApp()
    app.mainloop()
