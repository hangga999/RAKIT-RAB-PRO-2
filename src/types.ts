export type WorkCategory = string;

export type ProjectStatus = 'On Tender' | 'Deal' | 'On Progress' | 'Retention' | 'Done';

export interface RabRevision {
  id: string;
  projectId: string;
  revisionNumber: string; // e.g. 'Rev.01', 'Rev.02', 'Rev.03'
  title: string;          // e.g. 'Initial Tender Draft', 'Client Value Engineering', 'Final Contract BoQ'
  createdAt: string;
  isLatest: boolean;
  notes?: string;
  itemCount: number;
  subtotal: number;
  grandTotal: number;
  items?: RabItemEntry[];
}

export interface ItemSpecification {
  id: string;
  name?: string; // e.g., 'Grade A - Granit 60x60 Polished'
  specName?: string; // Support both naming styles
  description?: string;
  unit: string; // m2, m3, bh, m', ttk, ls
  unitPrice: number; // Selling Price (IDR)
  costPrice?: number; // Base contractor cost price
  materialCost?: number;
  laborCost?: number;
  equipmentCost?: number;
  vendorName?: string;
  ahsCode?: string;
}

export interface MasterCostItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: WorkCategory;
  specifications: ItemSpecification[];
  ahsCode: string;
  ahsDescription?: string;
  updatedAt: string;
}

export interface RabItemEntry {
  id: string;
  masterItemId?: string;
  specId?: string;
  sectionName?: string; // Header section e.g. 'Lantai 1', 'Lantai 2', 'Area Ruang Tamu', etc.
  workCategory: WorkCategory;
  itemName: string;
  specification?: string; // Text input directly next to Work Item, auto-filled from Master DB and editable
  unit: string;
  volumeReal?: number;
  wasteFactor?: number;
  volume: number;
  costPrice?: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  isCustom?: boolean;
  specRows?: { id: string; specName: string }[];
}

export type DesignStyle =
  | 'Modern Minimalist'
  | 'Japandi / Wabi-Sabi'
  | 'Industrial Chic'
  | 'Classic Luxury'
  | 'Tropical Contemporary'
  | 'Scandinavian';

export type FinishingGrade =
  | 'Standard (Ekonomis)'
  | 'Deluxe (Medium)'
  | 'Premium (Luxury / High-End)';

export type StructuralSystem =
  | 'Beton Bertulang (Reinforced Concrete)'
  | 'Baja WF / H-Beam (Structural Steel)'
  | 'Bata Merah / Hebel Bearing Wall'
  | 'Kayu Engineered Timber';

export interface ProjectRequirements {
  landArea: number; // m2
  buildingArea: number; // m2
  floorsCount: number; // e.g. 1, 2, 3
  ceilingHeight: number; // meters (e.g. 3.2m)
  designStyle: DesignStyle;
  structuralSystem?: StructuralSystem;
  finishingGrade: FinishingGrade;
  scopeOfWork?: ('Struktur' | 'Arsitektur' | 'Interior Fit-Out' | 'MEP' | 'Landscape' | string)[];
  estimatedDurationWeeks?: number;
}

export type InteriorSpecCategory = 'Base Material' | 'Finishing Material' | 'Hardware' | 'Accessories' | 'Others';

export interface InteriorSpecification {
  id: string;
  name: string;
  category?: InteriorSpecCategory;
  baseCost: number;
  unit: string;
  notes?: string;
}

export interface InteriorItemSpecificationRow {
  id: string;
  specName: string; // Combobox lookup or custom
  length_l: number; // Col I
  width_w: number;  // Col J
  height_h: number; // Col K
  factor: number;   // Col L
  model: string;    // Col M
  baseCostUnitPrice: number; // Col N
}

export interface InteriorRABItem {
  id: string;
  description: string;
  unit: string;
  qty: number;
  profitMarginPercent?: number;
  specs: InteriorItemSpecificationRow[];
}

export interface InteriorRABSection {
  id: string;
  sectionName: string;
  profitMarginPercent: number;
  items: InteriorRABItem[];
}

export interface InteriorRABRevision {
  id: string;
  name: string;
  date: string;
  version: number;
  isDraft: boolean;
  sections: InteriorRABSection[];
  usePpn: boolean;
  contingencyPercent?: number;
  overheadProfitPercent?: number;
  grandTotal: number;
}

export interface InteriorProject {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  ownerName: string;
  location: string;
  status?: ProjectStatus;
  createdAt?: string;
  requirements?: ProjectRequirements;
  grandTotal?: number;
  items?: any[];
  revisions: InteriorRABRevision[];
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  ownerName: string;
  location: string;
  status: ProjectStatus;
  createdAt: string;
  requirements: ProjectRequirements;
  items: RabItemEntry[];
  revisions?: RabRevision[];
  activeRevisionNumber?: string;
  scheduleItems?: ScheduleItem[];
  categoryMargins?: Record<string, number>;
  contingencyPercent: number; // e.g. 5%
  overheadProfitPercent: number; // e.g. 10%
  taxPercent: number; // PPN 11%
  subtotal: number;
  grandTotal: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  catalogFileName?: string;
  catalogFilePath?: string;
  catalogFileType?: 'pdf' | 'image' | 'doc';
  rating: number;
  notes?: string;
}

export interface WeeklyProgressPoint {
  week: number;
  date?: string;
  label?: string;
  plannedCumulative?: number;
  targetCumulative?: number;
  actualCumulative?: number;
}

export interface ScheduleItem {
  id: string;
  rabItemId?: string;
  wbsCode: string;
  taskName: string;
  specification?: string;
  category: WorkCategory;
  volume?: number;
  unit?: string;
  totalPrice?: number;
  weightPercent: number; // Percentage contribution to total project budget
  startDate?: string;
  endDate?: string;
  plannedStartDate?: string; // ISO date format YYYY-MM-DD
  plannedEndDate?: string; // ISO date format YYYY-MM-DD
  targetProgressPercent?: number;
  actualProgressPercent: number; // 0 - 100%
  status: 'Not Started' | 'On Track' | 'Delayed' | 'Completed';
  isDateInverted?: boolean;
  targetProgressDisplay?: string;
  notes?: string;
}
