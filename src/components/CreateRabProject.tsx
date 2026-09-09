import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Info,
  ChevronDown,
  Check,
  Search,
  BookOpen,
  ArrowRight,
  PackagePlus,
  Copy,
  GitBranch,
  X,
  FileText,
  FolderPlus,
  Layers,
  Edit3,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  MasterCostItem,
  Project,
  ProjectRequirements,
  RabItemEntry,
} from "../types";
import { AddWorkItemModal } from "./AddWorkItemModal";
import { ExportDropdown } from "./ExportDropdown";
import { DualScrollTable } from "./DualScrollTable";
import { exportRabToExcel } from "../utils/excelExport";
import { exportRabToPdf } from "../utils/pdfExport";

interface CreateRabProjectProps {
  masterItems: MasterCostItem[];
  onSaveProject: (project: Project) => void;
  onSaveAsRevision?: (
    project: Project,
    revisionTitle: string,
    revisionNotes: string
  ) => void;
  onNavigateToProjects?: () => void;
  editingProject?: Project | null;
}

export const CreateRabProject: React.FC<CreateRabProjectProps> = ({
  masterItems,
  onSaveProject,
  onSaveAsRevision,
  onNavigateToProjects,
  editingProject,
}) => {
  // 1. General Project Details
  const [projectCode, setProjectCode] = useState("PRJ-2026-001");
  const [projectName, setProjectName] = useState(
    "Lobby & Interior Architecture Renovation",
  );
  const [projectDesc, setProjectDesc] = useState(
    "Renovasi interior, partisi gypsum, lantai granit, drop ceiling, & finishing",
  );
  const [ownerName, setOwnerName] = useState("PT. Global Digital Nusantara");
  const [location, setLocation] = useState("SCBD Sudirman, Jakarta Selatan");

  // 2. Architectural & Interior Requirements (AI Analyzed Fields for BoQ)
  const [landArea, setLandArea] = useState<number>(350);
  const [buildingArea, setBuildingArea] = useState<number>(450);
  const [floorsCount, setFloorsCount] = useState<number>(2);
  const [ceilingHeight, setCeilingHeight] = useState<number>(3.5);
  const [designStyle, setDesignStyle] =
    useState<ProjectRequirements["designStyle"]>("Modern Minimalist");
  const [structuralSystem, setStructuralSystem] = useState<
    ProjectRequirements["structuralSystem"]
  >("Beton Bertulang (Reinforced Concrete)");
  const [finishingGrade, setFinishingGrade] =
    useState<ProjectRequirements["finishingGrade"]>("Deluxe (Medium)");
  const [estimatedDurationWeeks, setEstimatedDurationWeeks] =
    useState<number>(12);

  // Active dropdown search query per row
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(
    null,
  );
  const [searchFilter, setSearchFilter] = useState("");

  // Add Work Item Popup Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetRowId, setModalTargetRowId] = useState<string | null>(null);

  // Header Section State
  const [sectionList, setSectionList] = useState<string[]>([
    "Lantai 1",
    "Lantai 2",
  ]);
  const [targetModalSection, setTargetModalSection] = useState<string>("Lantai 1");
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isTableMaximized, setIsTableMaximized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTableMaximized) {
        setIsTableMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTableMaximized]);

  const handleOpenAddModal = () => {
    setTargetModalSection(sectionList[0] || "Lantai 1");
    setModalTargetRowId(null);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModalForSection = (secName: string) => {
    setTargetModalSection(secName);
    setModalTargetRowId(null);
    setIsAddModalOpen(true);
  };

  const handleOpenRowPicker = (rowId: string) => {
    setModalTargetRowId(rowId);
    setIsAddModalOpen(true);
  };

  const handleAddItemFromModal = (newItem: RabItemEntry) => {
    setRabRows((prev) => [
      ...prev,
      {
        ...newItem,
        sectionName: newItem.sectionName || targetModalSection || "Lantai 1",
      },
    ]);
  };

  const handleUpdateRowFromModal = (
    rowId: string,
    updatedFields: Partial<RabItemEntry>,
  ) => {
    setRabRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...updatedFields } : row)),
    );
  };

  // 3. RAB Entry Items Table with Section Support
  const [rabRows, setRabRows] = useState<RabItemEntry[]>([
    {
      id: "row-1",
      sectionName: "Lantai 1",
      masterItemId: masterItems[0]?.id || "",
      workCategory:
        masterItems[0]?.category || "Structural Works",
      itemName: "Pondasi Batu Kali 1:4 (Site Preparation & Struktur)",
      unit: "m3",
      volumeReal: 45.0, wasteFactor: 0, volume: 45.0,
      unitPrice: 1095000,
      totalPrice: 45.0 * 1095000,
      notes: "Pondasi lajur bangunan",
    },
    {
      id: "row-2",
      sectionName: "Lantai 1",
      masterItemId: masterItems[1]?.id || "",
      workCategory:
        masterItems[1]?.category || "Structural Works",
      itemName: "Beton Bertulang Kolom & Balok K-250 (Pekerjaan Besi & Cor)",
      unit: "m3",
      volumeReal: 32.0, wasteFactor: 0, volume: 32.0,
      unitPrice: 5280000,
      totalPrice: 32.0 * 5280000,
      notes: "Kolom praktis dan balok lantai 1 & 2",
    },
    {
      id: "row-3",
      sectionName: "Lantai 1",
      masterItemId: masterItems[3]?.id || "",
      workCategory: masterItems[3]?.category || "Wall Finishes",
      itemName: "Pasangan Dinding Bata Ringan (Hebel) t=10cm + Mortar",
      unit: "m2",
      volumeReal: 380.0, wasteFactor: 0, volume: 380.0,
      unitPrice: 140000,
      totalPrice: 380.0 * 140000,
      notes: "Dinding pembatas ruang utama",
    },
    {
      id: "row-4",
      sectionName: "Lantai 2",
      masterItemId: masterItems[5]?.id || "",
      workCategory:
        masterItems[5]?.category || "Flooring & Floor Finishes",
      itemName: "Pasangan Lantai Homogeneous Tile (Granit) 60x60 cm Polished",
      unit: "m2",
      volumeReal: 240.0, wasteFactor: 0, volume: 240.0,
      unitPrice: 300000,
      totalPrice: 240.0 * 300000,
      notes: "Area lobby & hallway",
    },
    {
      id: "row-5",
      sectionName: "Lantai 2",
      masterItemId: masterItems[11]?.id || "",
      workCategory: masterItems[11]?.category || "Painting & Coatings",
      itemName: "Pengecatan Dinding Interior Acrylic Premium (Jotun Majestic)",
      unit: "m2",
      volumeReal: 420.0, wasteFactor: 0, volume: 420.0,
      unitPrice: 48000,
      totalPrice: 420.0 * 48000,
      notes: "Matte off-white finish",
    },
  ]);

  // Tax & Overhead Markup controls
  const [contingencyPercent, setContingencyPercent] = useState<number>(5.0);
  const [overheadProfitPercent, setOverheadProfitPercent] = useState<number>(10.0);
  const [isPpnApplied, setIsPpnApplied] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCostColumns, setShowCostColumns] = useState(true);

  // Active unique sections maintaining user order
  const allActiveSections = useMemo(() => {
    const list = [...sectionList];
    rabRows.forEach((r) => {
      const s = r.sectionName?.trim() || "Lantai 1";
      if (!list.includes(s)) {
        list.push(s);
      }
    });
    return list.length > 0 ? list : ["Lantai 1"];
  }, [sectionList, rabRows]);

  React.useEffect(() => {
    if (editingProject) {
      setProjectCode(editingProject.projectCode);
      setProjectName(editingProject.name);
      setProjectDesc(editingProject.description);
      setOwnerName(editingProject.ownerName);
      setLocation(editingProject.location);

      setLandArea(editingProject.requirements.landArea);
      setBuildingArea(editingProject.requirements.buildingArea);
      setFloorsCount(editingProject.requirements.floorsCount);
      setCeilingHeight(editingProject.requirements.ceilingHeight);
      setDesignStyle(editingProject.requirements.designStyle);
      if (editingProject.requirements.structuralSystem) {
        setStructuralSystem(editingProject.requirements.structuralSystem);
      }
      setFinishingGrade(editingProject.requirements.finishingGrade);
      if (editingProject.requirements.estimatedDurationWeeks) {
        setEstimatedDurationWeeks(editingProject.requirements.estimatedDurationWeeks);
      }

      // Extract sections while preserving order
      const extractedSections: string[] = [];
      const loadedRows = (editingProject.items || []).map((it) => {
        const sec = it.sectionName?.trim() || "Lantai 1";
        if (!extractedSections.includes(sec)) {
          extractedSections.push(sec);
        }
        return {
          ...it,
          sectionName: sec,
        };
      });
      setSectionList(extractedSections.length > 0 ? extractedSections : ["Lantai 1"]);
      setRabRows(loadedRows);

      setContingencyPercent(editingProject.contingencyPercent ?? 5.0);
      setOverheadProfitPercent(editingProject.overheadProfitPercent ?? 10.0);
      setIsPpnApplied(editingProject.taxPercent === undefined || editingProject.taxPercent > 0);
    }
  }, [editingProject]);
  const [categoryMargins, setCategoryMargins] = useState<
    Record<string, number>
  >({
    "Structural Works": 10,
    "Wall Finishes": 10,
    "Flooring & Floor Finishes": 15,
    "Ceilings & Partitions": 15,
    "Doors & Windows": 15,
    "Painting & Coatings": 15,
    "Interior Fit-Out": 25,
    "Mechanical & Electrical (M&E)": 20,
  });
  const [showMarginConfig, setShowMarginConfig] = useState(false);

  // CORE LOGIC: Handler when user picks an item from the Master Database dropdown
  const handleItemSelect = (
    rowId: string,
    matchedMaster: MasterCostItem,
    spec: any,
  ) => {
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const margin = categoryMargins[matchedMaster.category] || 0;
          const costPrice = spec.unitPrice;
          const sellingPrice = costPrice * (1 + margin / 100);

          return {
            ...row,
            masterItemId: matchedMaster.id,
            specId: spec.id,
            itemName: matchedMaster.itemName,
            specification: spec.specName,
            workCategory: matchedMaster.category,
            unit: spec.unit,
            volumeReal: 1,
            wasteFactor: 0,
            volume: 1,
            costPrice: costPrice,
            unitPrice: sellingPrice,
            totalPrice: 1 * sellingPrice,
            isCustom: false,
          };
        }
        return row;
      }),
    );
    setActiveDropdownRowId(null);
    setSearchFilter("");
  };

  const handleSpecSelect = (rowId: string, spec: any, margin: number) => {
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const costPrice = spec.unitPrice;
          const sellingPrice = costPrice * (1 + margin / 100);
          return {
            ...row,
            specId: spec.id,
            specification: spec.specName,
            unit: spec.unit,
            volumeReal: 1,
            wasteFactor: 0,
            volume: 1,
            costPrice: costPrice,
            unitPrice: sellingPrice,
            totalPrice: 1 * sellingPrice,
            isCustom: false,
          };
        }
        return row;
      }),
    );
  };

  const handleVolumeRealChange = (rowId: string, newVol: number) => {
    const validVol = isNaN(newVol) || newVol < 0 ? 0 : newVol;
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const calcVol = validVol * (1 + (row.wasteFactor || 0) / 100);
          return {
            ...row,
            volumeReal: validVol,
            volume: calcVol,
            totalPrice: calcVol * row.unitPrice,
          };
        }
        return row;
      }),
    );
  };

  const handleWasteFactorChange = (rowId: string, newWaste: number) => {
    const validWaste = isNaN(newWaste) || newWaste < 0 ? 0 : newWaste;
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const calcVol = (row.volumeReal || 0) * (1 + validWaste / 100);
          return {
            ...row,
            wasteFactor: validWaste,
            volume: calcVol,
            totalPrice: calcVol * row.unitPrice,
          };
        }
        return row;
      }),
    );
  };

  const handleCostPriceChange = (rowId: string, newCost: number) => {
    const validCost = isNaN(newCost) || newCost < 0 ? 0 : newCost;
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          // Reactive Pricing Engine: Recalculate Selling Unit Price based on Category Margin
          const margin = categoryMargins[row.workCategory] || 0;
          const newSellingPrice = validCost * (1 + margin / 100);

          return {
            ...row,
            costPrice: validCost,
            unitPrice: newSellingPrice,
            totalPrice: (row.volume || 0) * newSellingPrice
          };
        }
        return row;
      }),
    );
  };

  const handleUnitPriceChange = (rowId: string, newPrice: number) => {
    const validPrice = isNaN(newPrice) || newPrice < 0 ? 0 : newPrice;
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            unitPrice: validPrice,
            totalPrice: row.volume * validPrice,
            isCustom: true,
          };
        }
        return row;
      }),
    );
  };

  const handleItemNameChange = (rowId: string, name: string) => {
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          return { ...row, itemName: name, isCustom: true };
        }
        return row;
      }),
    );
    setSearchFilter(name);
  };

  const handleSpecificationChange = (rowId: string, specName: string) => {
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          return { ...row, specification: specName, isCustom: true };
        }
        return row;
      }),
    );
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent,
    rowId: string,
    activeItems: MasterCostItem[],
  ) => {
    if (e.key === "Tab" && activeItems.length > 0) {
      e.preventDefault();
      const firstMatch = activeItems[0];
      const firstSpec = firstMatch.specifications[0];
      if (firstSpec) {
        handleItemSelect(rowId, firstMatch, firstSpec);
      }
    }
  };

  // Section Action Handlers
  const handleAddSection = (name?: string) => {
    const finalName = (name || newSectionName).trim();
    if (!finalName) return;
    if (sectionList.includes(finalName)) {
      alert(`Seksi "${finalName}" sudah ada dalam daftar.`);
      return;
    }
    setSectionList((prev) => [...prev, finalName]);
    // Create an initial row in this new section
    const defaultMaster = masterItems[0];
    const newRow: RabItemEntry = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sectionName: finalName,
      masterItemId: defaultMaster?.id || "",
      specId: defaultMaster?.specifications?.[0]?.id || "",
      workCategory: defaultMaster?.category || "Structural Works",
      itemName: defaultMaster?.itemName || "Pekerjaan Baru",
      specification: defaultMaster?.specifications?.[0]?.specName || "",
      unit: defaultMaster?.specifications?.[0]?.unit || "m2",
      volumeReal: 1,
      wasteFactor: 0,
      volume: 1,
      unitPrice: defaultMaster?.specifications?.[0]?.unitPrice || 0,
      totalPrice: defaultMaster?.specifications?.[0]?.unitPrice || 0,
      isCustom: true,
    };
    setRabRows((prev) => [...prev, newRow]);
    setNewSectionName("");
    setIsAddSectionModalOpen(false);
  };

  const handleRenameSection = (oldName: string, nextName: string) => {
    if (!nextName.trim()) return;
    setSectionList((prev) => prev.map((s) => (s === oldName ? nextName : s)));
    setRabRows((prev) =>
      prev.map((r) =>
        (r.sectionName || "Lantai 1") === oldName
          ? { ...r, sectionName: nextName }
          : r
      )
    );
  };

  const handleDeleteSection = (secName: string) => {
    const itemsInSec = rabRows.filter(
      (r) => (r.sectionName || "Lantai 1") === secName
    );
    if (itemsInSec.length > 0) {
      if (
        !window.confirm(
          `Hapus seksi "${secName}" beserta ${itemsInSec.length} item pekerjaan di dalamnya?`
        )
      ) {
        return;
      }
    }
    setSectionList((prev) => prev.filter((s) => s !== secName));
    setRabRows((prev) =>
      prev.filter((r) => (r.sectionName || "Lantai 1") !== secName)
    );
  };

  const handleAddRowToSection = (secName: string) => {
    const defaultMaster = masterItems[0];
    const newRow: RabItemEntry = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sectionName: secName,
      masterItemId: defaultMaster?.id || "",
      specId: defaultMaster?.specifications?.[0]?.id || "",
      workCategory: defaultMaster?.category || "Structural Works",
      itemName: defaultMaster?.itemName || "Item Pekerjaan",
      specification: defaultMaster?.specifications?.[0]?.specName || "",
      unit: defaultMaster?.specifications?.[0]?.unit || "m2",
      volumeReal: 1,
      wasteFactor: 0,
      volume: 1,
      unitPrice: defaultMaster?.specifications?.[0]?.unitPrice || 0,
      totalPrice: defaultMaster?.specifications?.[0]?.unitPrice || 0,
      isCustom: true,
    };
    setRabRows((prev) => [...prev, newRow]);
  };

  const handleAddRow = () => {
    const defaultMaster = masterItems[0];
    const targetSec = allActiveSections[0] || "Lantai 1";
    const newRow: RabItemEntry = {
      id: `row-${Date.now()}`,
      sectionName: targetSec,
      masterItemId: defaultMaster?.id || "",
      specId: defaultMaster?.specifications?.[0]?.id || "",
      workCategory: defaultMaster?.category || "Structural Works",
      itemName: defaultMaster?.itemName || "Pilih Pekerjaan dari Master DB...",
      specification: defaultMaster?.specifications?.[0]?.specName || "",
      unit: defaultMaster?.specifications?.[0]?.unit || "m2",
      volumeReal: 10,
      wasteFactor: 0,
      volume: 10,
      unitPrice: defaultMaster?.specifications?.[0]?.unitPrice || 0,
      totalPrice: (defaultMaster?.specifications?.[0]?.unitPrice || 0) * 10,
      notes: "",
    };
    setRabRows([...rabRows, newRow]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rabRows.length <= 1) {
      alert("Minimal 1 baris item pekerjaan dalam tabel RAB.");
      return;
    }
    setRabRows(rabRows.filter((r) => r.id !== rowId));
  };

  const handleAddSpecRow = (rowId: string) => {
    setRabRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentSpecs = r.specRows || [];
        const newSpec = {
          id: `spec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          specName: "",
        };
        return { ...r, specRows: [...currentSpecs, newSpec] };
      }),
    );
  };

  const handleUpdateSpecRow = (rowId: string, specId: string, val: string) => {
    setRabRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentSpecs = r.specRows || [];
        return {
          ...r,
          specRows: currentSpecs.map((s) =>
            s.id === specId ? { ...s, specName: val } : s,
          ),
        };
      }),
    );
  };

  const handleRemoveSpecRow = (rowId: string, specId: string) => {
    setRabRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentSpecs = r.specRows || [];
        return {
          ...r,
          specRows: currentSpecs.filter((s) => s.id !== specId),
        };
      }),
    );
  };

  // Financial Calculations
  const subtotal = rabRows.reduce((sum, item) => sum + item.totalPrice, 0);

  // Material vs Labor cost estimation breakdown (68% / 32% rule of thumb)
  const estimatedMaterialCost = subtotal * 0.68;
  const estimatedLaborCost = subtotal * 0.32;

  // Subtotal / Grand Total Estimate (excl. PPN) = Material Cost + Labor Wages
  const grandTotalExclPpn = estimatedMaterialCost + estimatedLaborCost;

  // Overhead / Contingencies Value = Grand Total Estimate (excl. PPN) * (Contingencies % / 100)
  const combinedMarkupPercent = contingencyPercent + overheadProfitPercent;
  const contingencyAmount = grandTotalExclPpn * (contingencyPercent / 100);
  const overheadProfitAmount = grandTotalExclPpn * (overheadProfitPercent / 100);
  const overheadContingenciesValue = grandTotalExclPpn * (combinedMarkupPercent / 100);

  // Profit / Margin = Grand Total Estimate (excl. PPN) - Overhead / Contingencies Value
  const profitMargin = grandTotalExclPpn - overheadContingenciesValue;

  // PPN 11% = (Material Cost + Labor Wages) * 0.11 [Applied ONLY if PPN is toggled ON; set to 0 if Non-PPN]
  const taxAmount = isPpnApplied ? grandTotalExclPpn * 0.11 : 0;

  // Grand Total Estimate (incl. PPN) = Material Cost + Labor Wages + PPN 11%
  const grandTotal = grandTotalExclPpn + taxAmount;

  // "Save As" Modal dialog state
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState("");
  const [saveAsNotes, setSaveAsNotes] = useState("");

  // Calculate next sequential revision string (e.g. Rev.02, Rev.03)
  const currentRevisions = editingProject?.revisions || [];
  let maxRevisionNum = 0;
  currentRevisions.forEach((r) => {
    const match = r.revisionNumber.match(/Rev\.(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxRevisionNum) maxRevisionNum = n;
    }
  });
  if (maxRevisionNum === 0) maxRevisionNum = currentRevisions.length || 1;
  const nextRevSeq = `Rev.${String(maxRevisionNum + 1).padStart(2, "0")}`;
  const currentActiveRev = editingProject?.activeRevisionNumber || "Rev.01";

  // 1. "Save": Directly overwrites and updates current active RAB draft record in SQLite without incrementing revision sequence number
  const handleSave = () => {
    if (!projectName.trim() || !ownerName.trim()) {
      alert("Mohon lengkapi Nama Proyek dan Nama Klien.");
      return;
    }

    const currentProjectSnapshot: Project = {
      ...(editingProject || {
        id: `prj-${Date.now()}`,
        projectCode: projectCode || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: "On Tender",
        createdAt: new Date().toISOString().split("T")[0],
        revisions: [],
        activeRevisionNumber: "Rev.01",
      }),
      name: projectName,
      description: projectDesc,
      ownerName: ownerName,
      location: location,
      requirements: {
        landArea,
        buildingArea,
        floorsCount,
        ceilingHeight,
        designStyle,
        structuralSystem,
        finishingGrade,
        scopeOfWork: editingProject?.requirements.scopeOfWork || ["Struktur", "Arsitektur", "Interior Fit-Out", "MEP"],
        estimatedDurationWeeks,
      },
      items: rabRows,
      contingencyPercent,
      overheadProfitPercent,
      taxPercent: isPpnApplied ? 11 : 0,
      subtotal,
      grandTotal,
    };

    onSaveProject(currentProjectSnapshot);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  // 2. "Save As": Generates a new revision record in SQLite, automatically incrementing revision sequence
  const handleConfirmSaveAs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !ownerName.trim()) {
      alert("Mohon lengkapi data proyek terlebih dahulu.");
      return;
    }

    const currentProjectSnapshot: Project = {
      ...(editingProject || {
        id: `prj-${Date.now()}`,
        projectCode: projectCode || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: "On Tender",
        createdAt: new Date().toISOString().split("T")[0],
        revisions: [],
        activeRevisionNumber: "Rev.01",
      }),
      name: projectName,
      description: projectDesc,
      ownerName: ownerName,
      location: location,
      requirements: {
        landArea,
        buildingArea,
        floorsCount,
        ceilingHeight,
        designStyle,
        structuralSystem,
        finishingGrade,
        scopeOfWork: editingProject?.requirements.scopeOfWork || ["Struktur", "Arsitektur", "Interior Fit-Out", "MEP"],
        estimatedDurationWeeks,
      },
      items: rabRows,
      contingencyPercent,
      overheadProfitPercent,
      taxPercent: isPpnApplied ? 11 : 0,
      subtotal,
      grandTotal,
    };

    const finalTitle = saveAsTitle.trim() || `Revisi ${nextRevSeq}`;
    const finalNotes = saveAsNotes.trim() || `Disimpan sebagai ${nextRevSeq} dari ${currentActiveRev}`;

    if (onSaveAsRevision) {
      onSaveAsRevision(currentProjectSnapshot, finalTitle, finalNotes);
    } else {
      onSaveProject(currentProjectSnapshot);
    }

    setIsSaveAsModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const currentCategories: string[] = Array.from(new Set(rabRows.map((r) => r.workCategory))).filter((c): c is string => Boolean(c));

  const getCurrentProjectForExport = (): Project => ({
    id: editingProject?.id || "temp-rab-id",
    projectCode: projectCode || "PRJ-TEMP",
    name: projectName || "Proyek RAB",
    description: projectDesc || "",
    ownerName: ownerName || "-",
    location: location || "-",
    status: editingProject?.status || "On Tender",
    activeRevisionNumber: currentActiveRev || "Rev.01",
    grandTotal: grandTotal,
    items: rabRows,
    requirements: {
      landArea,
      buildingArea,
      floorsCount,
      ceilingHeight,
      designStyle,
      structuralSystem,
      finishingGrade,
      scopeOfWork: editingProject?.requirements?.scopeOfWork || ["Struktur", "Arsitektur"],
      estimatedDurationWeeks,
    },
    contingencyPercent,
    overheadProfitPercent,
    taxPercent: isPpnApplied ? 11 : 0,
    subtotal,
    createdAt: editingProject?.createdAt || new Date().toISOString().split("T")[0],
  });

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* High Density Sub-Header Bar */}
      <header className="h-12 sm:h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Project /</span>
          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
            {projectCode || "PRJ-NEW"}
          </span>
          <span className="font-semibold text-slate-800">
            {projectName || "New Project RAB"}
          </span>
          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
            {currentActiveRev}
          </span>
          {saveSuccess && (
            <span className="ml-3 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium flex items-center gap-1 animate-fade-in">
              <Check className="w-3 h-3" /> Tersimpan ke SQLite Database
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* + Add Work Item Popup Trigger */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Buka Popup Katalog AHS & Tambah Item"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Work Item</span>
          </button>

          {/* DEDICATED "Save" ACTION BUTTON (In-place overwrite) */}
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Simpan langsung perubahan ke draft revisi aktif ini tanpa menaikkan nomor revisi"
          >
            <Save className="w-3.5 h-3.5 text-slate-300" />
            <span>Save</span>
          </button>

          {/* DEDICATED "Save As" ACTION BUTTON (New sequential revision) */}
          <button
            type="button"
            onClick={() => {
              setSaveAsTitle(`Revisi ${nextRevSeq} - Penyesuaian BoQ`);
              setSaveAsNotes("");
              setIsSaveAsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Simpan sebagai revisi baru dengan nomor urut berikutnya"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-200" />
            <span>Save As...</span>
          </button>

          {/* UNIVERSAL EXPORT (Active Formulas Excel & RAKITCO Kop Surat PDF) */}
          <ExportDropdown
            label="Export RAB"
            onExportExcel={() => exportRabToExcel(getCurrentProjectForExport(), rabRows, currentCategories)}
            onExportPdf={() => exportRabToPdf(getCurrentProjectForExport(), rabRows, currentCategories)}
            menuTitle="RAB BoQ Document Export"
          />
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <div className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col overflow-y-auto min-h-0">
        {/* COMPACT PROJECT METADATA STRIP (Redundancy Removed from RAB screen) */}
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Client:</span>
              <span className="font-semibold text-slate-800">{ownerName || "-"}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Site Location:</span>
              <span className="font-medium text-slate-700">{location || "-"}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Build Area:</span>
              <span className="font-mono text-slate-700">{buildingArea} m² ({floorsCount} Floors)</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tier / Style:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">{finishingGrade} • {designStyle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMarginConfig(!showMarginConfig)}
              className="text-[11px] bg-slate-50 border border-slate-300 px-2.5 py-1 rounded text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer"
            >
              {showMarginConfig ? "Hide Profit Margins" : "⚙️ Category Margins"}
            </button>
          </div>
        </div>

        {/* IN-RAB CATEGORY PROFIT MARGIN CONFIGURATION */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-xs p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Category Profit Margins (Project Override)
            </h4>
            <button
              onClick={() => setShowMarginConfig(!showMarginConfig)}
              className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              {showMarginConfig ? "Hide Settings" : "Adjust Margins"}
            </button>
          </div>

          {showMarginConfig && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
              {Object.entries(categoryMargins).map(([category, margin]) => (
                <div
                  key={category}
                  className="bg-white p-2 rounded border border-slate-200 flex flex-col"
                >
                  <span
                    className="text-[9px] text-slate-500 font-bold uppercase truncate mb-1"
                    title={category}
                  >
                    {category.replace("Pekerjaan ", "")}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={margin}
                      onChange={(e) => {
                        const newMargin = parseFloat(e.target.value) || 0;
                        setCategoryMargins((prev) => ({
                          ...prev,
                          [category]: newMargin,
                        }));
                        // Dynamically recalculate all non-custom items in this category
                        setRabRows((prevRows) =>
                          prevRows.map((row) => {
                            if (
                              row.workCategory === category &&
                              row.costPrice !== undefined &&
                              !row.isCustom
                            ) {
                              const newSellingPrice =
                                row.costPrice * (1 + newMargin / 100);
                              return {
                                ...row,
                                unitPrice: newSellingPrice,
                                totalPrice: row.volume * newSellingPrice,
                              };
                            }
                            return row;
                          }),
                        );
                      }}
                      className="w-16 border border-slate-300 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HIGH DENSITY RAB ENTRY TABLE */}
        <div className="flex justify-end mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-slate-600">
              Show Cost & Real Volume
            </span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={showCostColumns}
                onChange={() => setShowCostColumns(!showCostColumns)}
              />
              <div
                className={`block w-10 h-6 rounded-full ${showCostColumns ? "bg-blue-500" : "bg-slate-300"}`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${showCostColumns ? "translate-x-4" : ""}`}
              ></div>
            </div>
          </label>
        </div>
        <div className={
          isTableMaximized
            ? "fixed inset-0 z-50 bg-white flex flex-col overflow-hidden shadow-2xl"
            : "bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col"
        }>
          {/* Table Header Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-xs uppercase tracking-tight text-slate-700 flex items-center gap-2">
                <span>RAB Entry Table (Cost Breakdown Structure)</span>
                {isTableMaximized && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    FULL-SCREEN MODE (ESC TO MINIMIZE)
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                ({allActiveSections.length} Seksi Header / {rabRows.length} Total Item)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isTableMaximized && (
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded border border-slate-200 text-xs text-slate-700 font-medium shadow-2xs mr-1">
                  <span>Show Cost (HPP)</span>
                  <input
                    type="checkbox"
                    checked={showCostColumns}
                    onChange={() => setShowCostColumns(!showCostColumns)}
                    className="cursor-pointer"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={() => setIsAddSectionModalOpen(true)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Tambah Header Seksi baru (contoh: Lantai 1, Lantai 2, Ruangan A)"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Header Seksi</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="Buka Popup Katalog Master DB untuk memilih item pekerjaan"
              >
                <Plus className="w-3 h-3" />
                <span>+ Tambah Item (Katalog)</span>
              </button>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-xs font-medium cursor-pointer transition"
                title="Tambah baris kosong baru"
              >
                + Baris Cepat
              </button>

              <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block"></div>

              {/* Maximize / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsTableMaximized(!isTableMaximized)}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs border ${
                  isTableMaximized
                    ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
                title={isTableMaximized ? "Minimize (Kembali ke tampilan normal - Esc)" : "Maximize (Buka layar penuh untuk editing luas)"}
              >
                {isTableMaximized ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Minimize</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Maximize</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Body - DualScrollTable Container */}
          <DualScrollTable className={isTableMaximized ? "flex-1 w-full border-t border-slate-200 overflow-auto" : "max-h-[620px] w-full border-t border-slate-200"}>
            <table className={`w-full text-left border-collapse ${showCostColumns ? "min-w-[1400px]" : "min-w-[1120px]"}`}>
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 align-top w-14 text-center bg-slate-50 whitespace-nowrap">No</th>
                  <th className="py-2.5 px-3 align-top min-w-[320px] bg-slate-50 whitespace-nowrap">
                    Work Item Description &amp; Seksi
                  </th>
                  <th className="py-2.5 px-3 align-top min-w-[240px] bg-slate-50 whitespace-nowrap">Specification</th>
                  <th className="py-2.5 px-3 align-top w-20 text-center bg-slate-50 whitespace-nowrap">Unit</th>
                  {showCostColumns && (
                    <>
                      <th className="py-2.5 px-3 align-top w-24 text-right bg-slate-50 whitespace-nowrap">Vol Real</th>
                      <th className="py-2.5 px-3 align-top w-24 text-right bg-slate-50 whitespace-nowrap">Waste/SF %</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 align-top w-24 text-right font-bold text-blue-700 bg-slate-50 whitespace-nowrap">Vol</th>
                  {showCostColumns && (
                    <>
                      <th className="py-2.5 px-3 align-top w-36 text-right text-rose-700 bg-rose-50 whitespace-nowrap">Cost Unit Price</th>
                      <th className="py-2.5 px-3 align-top w-40 text-right text-rose-700 bg-rose-50 whitespace-nowrap">Total Cost</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 align-top w-36 text-right text-emerald-800 bg-slate-50 whitespace-nowrap">Unit Price</th>
                  <th className="py-2.5 px-3 align-top w-40 text-right text-emerald-800 bg-slate-50 whitespace-nowrap">Total Price</th>
                  <th className="py-2.5 px-3 align-top w-12 text-center bg-slate-50 whitespace-nowrap">Del</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {allActiveSections.map((secName, secIdx) => {
                  const itemsInSec = rabRows.filter(
                    (r) => (r.sectionName?.trim() || "Lantai 1") === secName,
                  );
                  const secTotal = itemsInSec.reduce(
                    (sum, r) => sum + (r.totalPrice || 0),
                    0,
                  );
                  const secCostTotal = itemsInSec.reduce(
                    (sum, r) => sum + (r.costPrice || 0) * (r.volume || 0),
                    0,
                  );

                  return (
                    <React.Fragment key={`sec-group-${secName}`}>
                      {/* Section Header Row */}
                      <tr className="bg-slate-800 text-white border-y border-slate-700 select-none">
                        <td
                          colSpan={showCostColumns ? 12 : 8}
                          className="py-2 px-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-slate-700/80 px-2.5 py-1 rounded border border-slate-600 focus-within:border-blue-400">
                                <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <input
                                  type="text"
                                  value={secName}
                                  onChange={(e) =>
                                    handleRenameSection(secName, e.target.value)
                                  }
                                  className="bg-transparent text-xs font-bold text-white focus:outline-none min-w-[200px]"
                                  placeholder="Nama Seksi (contoh: Lantai 1, Ruang Tamu)..."
                                  title="Klik untuk mengubah nama seksi"
                                />
                                <Edit3 className="w-3 h-3 text-slate-400" />
                              </div>
                              <span className="text-[11px] text-slate-300 font-medium bg-slate-700/60 px-2 py-0.5 rounded">
                                {itemsInSec.length} Item
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-semibold text-slate-400">
                                  Subtotal:
                                </span>
                                <span className="text-xs font-bold text-emerald-400 font-mono">
                                  Rp {secTotal.toLocaleString("id-ID")}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {allActiveSections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSection(secName)}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded cursor-pointer transition ml-1"
                                    title={`Hapus seksi ${secName}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Empty state if section has no items */}
                      {itemsInSec.length === 0 ? (
                        <tr className="bg-slate-50/60">
                          <td
                            colSpan={showCostColumns ? 12 : 8}
                            className="py-4 text-center text-xs text-slate-400 italic"
                          >
                            Belum ada item di seksi &ldquo;{secName}&rdquo;. Klik{" "}
                            <button
                              type="button"
                              onClick={() => handleOpenAddModalForSection(secName)}
                              className="text-blue-600 font-semibold underline hover:text-blue-700 cursor-pointer"
                            >
                              + Item (Katalog)
                            </button>{" "}
                            atau{" "}
                            <button
                              type="button"
                              onClick={() => handleAddRowToSection(secName)}
                              className="text-slate-700 font-semibold underline hover:text-slate-900 cursor-pointer"
                            >
                              + Baris Cepat
                            </button>{" "}
                            untuk menambahkan pekerjaan.
                          </td>
                        </tr>
                      ) : (
                        itemsInSec.map((row, itemIdx) => {
                          const isDropdownActive = activeDropdownRowId === row.id;
                          const matchingMasterItems = masterItems.filter(
                            (m) =>
                              m.itemName
                                .toLowerCase()
                                .includes(searchFilter.toLowerCase()) ||
                              m.itemCode
                                .toLowerCase()
                                .includes(searchFilter.toLowerCase()),
                          );

                          return (
                            <React.Fragment key={row.id}>
                              <tr
                                className={`hover:bg-slate-50 transition-colors ${isDropdownActive ? "bg-blue-50/50" : ""}`}
                              >
                              <td className="p-3 align-top break-words whitespace-normal text-center text-slate-500 font-mono font-bold text-[11px]">
                                {secIdx + 1}.{itemIdx + 1}
                              </td>

                              {/* Work Item Searchable Dropdown */}
                              <td className="p-3 align-top break-words whitespace-normal relative">
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {row.workCategory}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-400 font-medium">Seksi:</span>
                                    <select
                                      value={row.sectionName || secName}
                                      onChange={(e) => {
                                        const targetSec = e.target.value;
                                        setRabRows((prev) =>
                                          prev.map((r) =>
                                            r.id === row.id
                                              ? { ...r, sectionName: targetSec }
                                              : r,
                                          ),
                                        );
                                      }}
                                      className="text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer"
                                      title="Pindahkan item ke seksi lain"
                                    >
                                      {allActiveSections.map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={row.itemName}
                              onFocus={() => {
                                setActiveDropdownRowId(row.id);
                                setSearchFilter("");
                              }}
                              onChange={(e) =>
                                handleItemNameChange(row.id, e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleTabKeyDown(e, row.id, matchingMasterItems)
                              }
                              placeholder="Ketik atau pilih item..."
                              className="w-full border border-slate-300 bg-white rounded-l px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownRowId(
                                  isDropdownActive ? null : row.id,
                                );
                                setSearchFilter("");
                              }}
                              className="bg-slate-100 border border-l-0 border-slate-300 px-1.5 py-1 text-slate-500 hover:bg-slate-200"
                              title="Pilih dari daftar cepat"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownRowId(null);
                                handleOpenRowPicker(row.id);
                              }}
                              className="bg-blue-50 border border-l-0 border-blue-200 rounded-r px-2 py-1 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1 transition"
                              title="Buka Popup Katalog Master AHS untuk memilih item ini"
                            >
                              <Search className="w-3 h-3 text-blue-600" />
                              <span className="hidden lg:inline text-[10px]">Katalog</span>
                            </button>
                          </div>

                          {/* Dropdown Menu Popup */}
                          {isDropdownActive && (
                            <div className="absolute top-8 left-0 w-full min-w-[360px] bg-white border border-slate-300 shadow-2xl z-30 p-1.5 rounded-lg max-h-64 overflow-y-auto">
                              <div className="flex items-center justify-between px-1.5 pb-1 mb-1 border-b border-slate-100">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">
                                  {matchingMasterItems.length} Item Tersedia
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownRowId(null);
                                    handleOpenRowPicker(row.id);
                                  }}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <PackagePlus className="w-3 h-3" />
                                  <span>Buka Popup Lengkap</span>
                                </button>
                              </div>
                              {matchingMasterItems.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-xs">
                                  <p>Tidak ada item yang cocok dengan "{searchFilter}".</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownRowId(null);
                                      handleOpenRowPicker(row.id);
                                    }}
                                    className="mt-1 text-blue-600 font-semibold hover:underline block mx-auto text-[11px] cursor-pointer"
                                  >
                                    Cari di Popup Katalog AHS
                                  </button>
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                  {matchingMasterItems.flatMap((m) =>
                                    m.specifications.map((spec) => (
                                      <div
                                        key={`${m.id}-${spec.id}`}
                                        onClick={() =>
                                          handleItemSelect(row.id, m, spec)
                                        }
                                        className="p-1.5 hover:bg-blue-600 hover:text-white rounded cursor-pointer text-xs transition border-b border-slate-100 last:border-b-0 group"
                                      >
                                        <div className="font-semibold text-slate-800 group-hover:text-white">
                                          {m.itemName}
                                        </div>
                                        <div className="text-[10px] text-slate-500 group-hover:text-blue-100 flex justify-between mt-0.5">
                                          <span className="truncate pr-2">
                                            [{m.itemCode}] {spec.specName} ({spec.unit})
                                          </span>
                                          <span className="font-mono font-semibold shrink-0 text-slate-700 group-hover:text-white">
                                            Rp{" "}
                                            {spec.unitPrice.toLocaleString(
                                              "id-ID",
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    )),
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Specification (Dynamic Dropdown) */}
                      <td className="p-3 align-top break-words whitespace-normal text-slate-600 text-[10px] relative">
                        {(() => {
                          const parentMaster = masterItems.find(
                            (m) => m.id === row.masterItemId,
                          );
                          return (
                            <div className="relative">
                              {parentMaster &&
                              parentMaster.specifications.length > 0 ? (
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    value={row.specification || ""}
                                    onChange={(e) =>
                                      handleSpecificationChange(
                                        row.id,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full border border-slate-300 bg-white rounded-l px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-slate-700"
                                    placeholder="Custom spec..."
                                  />
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const spec =
                                        parentMaster.specifications.find(
                                          (s) => s.id === e.target.value,
                                        );
                                      if (spec)
                                        handleSpecSelect(
                                          row.id,
                                          spec,
                                          categoryMargins[
                                            parentMaster.category
                                          ] || 0,
                                        );
                                    }}
                                    className="w-6 border border-l-0 border-slate-300 bg-slate-100 rounded-r py-1 text-[10px] focus:outline-none text-transparent"
                                    style={{ backgroundImage: "none" }}
                                  >
                                    <option value="">▼</option>
                                    {parentMaster.specifications.map((s) => (
                                      <option
                                        key={s.id}
                                        value={s.id}
                                        className="text-slate-800"
                                      >
                                        {s.specName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={row.specification || ""}
                                  onChange={(e) =>
                                    handleSpecificationChange(
                                      row.id,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-slate-300 bg-white rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 text-slate-700"
                                  placeholder="Custom spec..."
                                />
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      {/* Unit (Auto-filled) */}
                      <td className="p-3 align-top break-words whitespace-normal text-center text-slate-600 italic font-mono font-semibold">
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) => {
                            setRabRows((prevRows) =>
                              prevRows.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      unit: e.target.value,
                                      isCustom: true,
                                    }
                                  : r,
                              ),
                            );
                          }}
                          className="w-12 bg-transparent text-center focus:outline-none focus:border-b focus:border-blue-500 border-b border-transparent"
                        />
                      </td>

                      {showCostColumns && (
                        <>
                          {/* Volume Real */}
                          <td className="p-3 align-top break-words whitespace-normal text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={row.volumeReal || 0}
                              onChange={e => handleVolumeRealChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-full border-b border-slate-300 bg-transparent text-right font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          {/* Waste Factor */}
                          <td className="p-3 align-top break-words whitespace-normal text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={row.wasteFactor || 0}
                              onChange={e => handleWasteFactorChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-full border-b border-slate-300 bg-transparent text-right font-mono font-semibold text-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                        </>
                      )}
                      {/* Calculated Volume */}
                      <td className="p-3 align-top break-words whitespace-normal text-right font-bold text-blue-700 font-mono">
                        {(row.volume || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      {/* Cost Price Columns (Toggleable) */}
                      {showCostColumns && (
                        <>
                          <td className="p-3 align-top break-words whitespace-normal text-right bg-rose-50/20">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-rose-400 text-[10px]">
                                Rp
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={row.costPrice || 0}
                                onChange={(e) =>
                                  handleCostPriceChange(
                                    row.id,
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-24 border border-rose-200 rounded px-1.5 py-1 text-right font-mono font-semibold text-rose-800 focus:outline-none focus:border-rose-500 bg-white"
                              />
                            </div>
                          </td>
                          <td className="p-3 align-top break-words whitespace-normal text-right font-semibold text-rose-700 font-mono bg-rose-50/20">
                            Rp{" "}
                            {((row.costPrice || 0) * row.volume).toLocaleString(
                              "id-ID",
                            )}
                          </td>
                        </>
                      )}

                      {/* Selling Unit Price (Editable with Markup) */}
                      <td className="p-3 align-top break-words whitespace-normal text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 text-[10px]">Rp</span>
                          <input
                            type="number"
                            min="0"
                            value={row.unitPrice}
                            onChange={(e) =>
                              handleUnitPriceChange(
                                row.id,
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-24 border border-slate-300 rounded px-1.5 py-1 text-right font-mono font-semibold text-emerald-700 focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </td>
                      {/* Selling Total Price */}
                      <td className="p-3 align-top break-words whitespace-normal text-right font-semibold text-emerald-700 font-mono">
                        Rp {row.totalPrice.toLocaleString("id-ID")}
                      </td>
                      {/* Del button */}
                      <td className="p-3 align-top break-words whitespace-normal text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                            </tr>

                            {/* Additional Sub-Spec Rows */}
                            {row.specRows &&
                              row.specRows.map((spc, spcIdx) => (
                                <tr
                                  key={spc.id}
                                  className="bg-slate-50/70 border-b border-dashed border-slate-200"
                                >
                                  <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                                    {secIdx + 1}.{itemIdx + 1}.{spcIdx + 1}
                                  </td>
                                  <td className="p-1.5 pl-6 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveSpecRow(row.id, spc.id)
                                      }
                                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer inline-flex items-center gap-1 text-[10px]"
                                      title="Hapus Sub-Row Spec"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                      <span className="text-[9px] text-slate-400 hover:text-red-600">
                                        Hapus
                                      </span>
                                    </button>
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={spc.specName}
                                      onChange={(e) =>
                                        handleUpdateSpecRow(
                                          row.id,
                                          spc.id,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Tulis spesifikasi tambahan / material / merk..."
                                      className="w-full border border-slate-300 bg-white rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-2xs"
                                    />
                                  </td>
                                  <td className="p-2 text-center text-slate-300">
                                    -
                                  </td>
                                  {showCostColumns && (
                                    <>
                                      <td className="p-2 text-center text-slate-300">
                                        -
                                      </td>
                                      <td className="p-2 text-center text-slate-300">
                                        -
                                      </td>
                                      <td className="p-2 text-center text-slate-300">
                                        -
                                      </td>
                                      <td className="p-2 text-center text-slate-300">
                                        -
                                      </td>
                                    </>
                                  )}
                                  <td className="p-2 text-center text-slate-300">
                                    -
                                  </td>
                                  <td className="p-2 text-center text-slate-300">
                                    -
                                  </td>
                                  <td className="p-2 text-center text-slate-300">
                                    -
                                  </td>
                                  <td className="p-2"></td>
                                </tr>
                              ))}

                            {/* Row action bar with + ADD SPEC ROW matching Interior RAB Draft */}
                            <tr className="bg-white border-b border-slate-200">
                              <td
                                colSpan={showCostColumns ? 12 : 8}
                                className="py-1.5 px-4 pl-12 bg-slate-50/30"
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleAddSpecRow(row.id)}
                                    className="text-[10px] font-bold text-slate-500 bg-white hover:bg-slate-100 hover:text-emerald-700 border border-slate-200 px-3 py-1 rounded transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Tambah baris spesifikasi tambahan pada item ini"
                                  >
                                    <Plus className="w-3 h-3 text-emerald-600" />{" "}
                                    + ADD SPEC ROW
                                  </button>
                                  <div className="w-px h-3.5 bg-slate-200" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(row.id)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition cursor-pointer flex items-center gap-1"
                                    title="Hapus item pekerjaan ini"
                                  >
                                    <Trash2 className="w-3 h-3" /> HAPUS ITEM
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                    )}

                    {/* Section Action Bar: + ADD NEW WORK ITEM mengacu pada RAB Draft Interior */}
                    <tr className="bg-slate-50/60 border-b border-slate-200">
                      <td
                        colSpan={showCostColumns ? 12 : 8}
                        className="py-2.5 px-4 pl-12"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAddModalForSection(secName)}
                            className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-700 px-4 py-2 rounded transition cursor-pointer flex items-center gap-1.5 border border-slate-300 shadow-xs"
                            title={`Tambah item pekerjaan ke ${secName}`}
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-600" /> + ADD
                            NEW WORK ITEM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddRowToSection(secName)}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-white px-3 py-2 rounded transition cursor-pointer flex items-center gap-1 border border-transparent hover:border-slate-300"
                            title={`Tambah baris kosong ke ${secName}`}
                          >
                            + Baris Kosong
                          </button>
                        </div>
                      </td>
                    </tr>

                      {/* Section Subtotal Row */}
                      <tr className="bg-slate-100/90 border-b-2 border-slate-300 font-semibold text-xs">
                        <td
                          colSpan={showCostColumns ? 7 : 5}
                          className="py-2 px-3 text-right text-slate-600 font-semibold"
                        >
                          Subtotal {secName}:
                        </td>
                        {showCostColumns && (
                          <>
                            <td className="py-2 px-3 text-right text-xs font-mono text-slate-400 bg-rose-50/30">
                              -
                            </td>
                            <td className="py-2 px-3 text-right text-xs font-mono font-bold text-rose-700 bg-rose-50/30">
                              Rp {secCostTotal.toLocaleString("id-ID")}
                            </td>
                          </>
                        )}
                        <td className="py-2 px-3 text-right text-xs font-mono text-slate-400">
                          -
                        </td>
                        <td className="py-2 px-3 text-right text-xs font-mono font-bold text-emerald-700">
                          Rp {secTotal.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3"></td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </DualScrollTable>

          {/* Table Bottom Action Toolbar */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Active Revision:
              </span>
              <span className="px-2 py-0.5 rounded bg-white text-blue-700 font-mono text-xs font-bold border border-slate-300">
                {currentActiveRev}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({editingProject?.title || "RAB Project Draft"})
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <label>Contingencies (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(Number(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label>Overhead (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overheadProfitPercent}
                  onChange={(e) => setOverheadProfitPercent(Number(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label>Pajak:</label>
                <select
                  value={isPpnApplied ? "PPN" : "NON-PPN"}
                  onChange={(e) => setIsPpnApplied(e.target.value === "PPN")}
                  className="px-2 py-1 border border-slate-300 rounded focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="PPN">PPN 11%</option>
                  <option value="NON-PPN">Non-PPN</option>
                </select>
              </div>
            </div>
          </div>

          {/* HIGH DENSITY TABLE FOOTER (SLATE-900) */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center rounded-b-lg">
            <div className="flex gap-8">
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  Total Items
                </div>
                <div className="text-base font-bold font-mono">
                  {rabRows.length} Items
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  AHS Verified
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  100%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  Contingency + Overhead
                </div>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {combinedMarkupPercent}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400 italic">
                Grand Total Estimate ({isPpnApplied ? 'incl. PPN' : 'excl. PPN'})
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-400 font-mono">
                IDR{" "}
                {grandTotal.toLocaleString("id-ID", {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ADD NEW SECTION BUTTON mengacu pada RAB Draft Interior */}
        <button
          type="button"
          onClick={() => setIsAddSectionModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-bold hover:bg-white hover:text-blue-600 hover:border-blue-400 transition cursor-pointer text-xs shadow-2xs"
        >
          <Plus className="w-4 h-4" /> ADD NEW SECTION (E.g. Lantai 1, Lantai 2, MEP, Interior)
        </button>

        {/* HIGH DENSITY BOTTOM WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Projected S-Curve Widget */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase">
                Projected S-Curve (Progress Target)
              </h4>
              <span className="text-[10px] text-blue-600 font-semibold font-mono">
                Duration: {estimatedDurationWeeks} Weeks
              </span>
            </div>
            <div className="w-full h-24 flex items-end gap-1.5 px-2 bg-slate-50 rounded p-1 border border-slate-100">
              <div
                className="w-full bg-blue-200 rounded-t h-[8%] hover:opacity-80 transition"
                title="W1: 8%"
              ></div>
              <div
                className="w-full bg-blue-300 rounded-t h-[16%] hover:opacity-80 transition"
                title="W2: 16%"
              ></div>
              <div
                className="w-full bg-blue-400 rounded-t h-[28%] hover:opacity-80 transition"
                title="W3: 28%"
              ></div>
              <div
                className="w-full bg-blue-500 rounded-t h-[46%] hover:opacity-80 transition"
                title="W4: 46%"
              ></div>
              <div
                className="w-full bg-blue-600 rounded-t h-[68%] hover:opacity-80 transition"
                title="W5: 68%"
              ></div>
              <div
                className="w-full bg-blue-700 rounded-t h-[84%] hover:opacity-80 transition"
                title="W6: 84%"
              ></div>
              <div
                className="w-full bg-blue-800 rounded-t h-[94%] hover:opacity-80 transition"
                title="W7: 94%"
              ></div>
              <div
                className="w-full bg-blue-900 rounded-t h-[100%] hover:opacity-80 transition"
                title="W8: 100%"
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-400 uppercase tracking-tighter font-bold font-mono">
              <span>W1</span>
              <span>W2</span>
              <span>W3</span>
              <span>W4</span>
              <span>W5</span>
              <span>W6</span>
              <span>W7</span>
              <span>W8</span>
            </div>
          </div>

          {/* Cost Summary Statistics Widget */}
          <div className="bg-slate-800 text-white border border-slate-700 rounded-lg p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">
              Cost Summary Statistics Breakdown
            </h4>
            <div className="space-y-2 relative z-10 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Material Cost:</span>
                <span className="font-mono text-slate-200">
                  IDR{" "}
                  {estimatedMaterialCost.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Labor Wages:</span>
                <span className="font-mono text-slate-200">
                  IDR{" "}
                  {estimatedLaborCost.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700 pt-1">
                <span className="text-slate-300 font-bold">Subtotal (Excl. PPN):</span>
                <span className="font-mono text-slate-100 font-bold">
                  IDR{" "}
                  {grandTotalExclPpn.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">
                  Overhead &amp; Contingency ({combinedMarkupPercent}%):
                </span>
                <span className="font-mono text-yellow-400">
                  IDR{" "}
                  {overheadContingenciesValue.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold">
                  Profit / Margin:
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  IDR{" "}
                  {profitMargin.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              {isPpnApplied && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-700 font-bold">
                  <span className="text-blue-300">PPN (11%):</span>
                  <span className="font-mono text-blue-300">
                    IDR{" "}
                    {taxAmount.toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Work Item Popup Modal Dialog */}
      <AddWorkItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalTargetRowId(null);
        }}
        masterItems={masterItems}
        categoryMargins={categoryMargins}
        onAddItem={handleAddItemFromModal}
        targetRowId={modalTargetRowId}
        targetSectionName={targetModalSection}
        onUpdateRowItem={handleUpdateRowFromModal}
      />

      {/* ADD SECTION POPUP MODAL DIALOG */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-600 rounded-md text-white">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Tambah Header Seksi</h3>
                  <p className="text-[11px] text-slate-400">
                    Kelompokkan item pekerjaan (contoh: Lantai 1, Lantai 2, Ruangan A)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSectionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Cepat Nama Seksi Standar:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  {[
                    "Lantai 1",
                    "Lantai 2",
                    "Lantai 3",
                    "Lantai Dasar & Basement",
                    "Area Ruang Tamu & Foyer",
                    "Area Kamar Tidur Utama",
                    "Area Kamar Tidur Anak",
                    "Area Dapur & Pantry",
                    "Area Kamar Mandi & Toilet",
                    "Area Ruang Kerja / Kantor",
                    "Pekerjaan Façade & Eksterior",
                    "Balkon & Rooftop",
                    "Landscape & Taman",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setNewSectionName(preset);
                      }}
                      className={`px-2 py-1 rounded text-xs transition cursor-pointer font-medium ${
                        newSectionName === preset
                          ? "bg-blue-600 text-white font-semibold shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Header Seksi:
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Contoh: Lantai 1 atau Ruang Tamu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSection();
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection()}
                  disabled={!newSectionName.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Seksi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVE AS (NEW REVISION) POPUP DIALOG */}
      {isSaveAsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-600 rounded-md text-white">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Save As - Buat Revisi Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Membuat salinan snapshot draft revisi baru ke dalam database SQLite
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveAsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveAs} className="p-6 space-y-4">
              {/* Revision Sequence Pill Banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Auto-Assigned Sequence
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-600">Draft Aktif:</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-mono text-xs font-semibold">
                      {currentActiveRev}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-bold shadow-xs">
                      {nextRevSeq} (New Draft)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Total Work Items</span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {rabRows.length} Items
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama / Label Revisi (Revision File Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={saveAsTitle}
                  onChange={(e) => setSaveAsTitle(e.target.value)}
                  placeholder={`e.g. Revisi ${nextRevSeq} - Negosiasi Harga Material`}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan / Keterangan Revisi (Revision Notes)
                </label>
                <textarea
                  rows={3}
                  value={saveAsNotes}
                  onChange={(e) => setSaveAsNotes(e.target.value)}
                  placeholder="e.g. Update estimasi volume partisi dan penyesuaian markup overhead profit 10%."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Revisi baru akan secara otomatis diurutkan secara sekuensial (<strong>{nextRevSeq}</strong>), mempertahankan seluruh item pekerjaan, dan ditetapkan sebagai draft revisi aktif proyek.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaveAsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Sebagai {nextRevSeq}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
