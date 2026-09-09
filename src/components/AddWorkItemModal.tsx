import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Check,
  PackagePlus,
  Layers,
  Sparkles,
  Calculator,
  ChevronRight,
  Info,
  Building2,
  Tag,
  CornerDownRight,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  MasterCostItem,
  WorkCategory,
  ItemSpecification,
  RabItemEntry,
} from "../types";

interface AddWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterItems: MasterCostItem[];
  categoryMargins: Record<string, number>;
  onAddItem: (newItem: RabItemEntry) => void;
  // Optional: if editing or replacing an existing row in the table
  targetRowId?: string | null;
  onUpdateRowItem?: (rowId: string, item: Partial<RabItemEntry>) => void;
  targetSectionName?: string;
}

export const AddWorkItemModal: React.FC<AddWorkItemModalProps> = ({
  isOpen,
  onClose,
  masterItems,
  categoryMargins,
  onAddItem,
  targetRowId,
  onUpdateRowItem,
  targetSectionName,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "custom">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Selected item in catalog
  const [selectedMasterId, setSelectedMasterId] = useState<string>("");
  const [selectedSpecId, setSelectedSpecId] = useState<string>("");

  // Quantity and calculations
  const [volumeReal, setVolumeReal] = useState<number>(10);
  const [wasteFactor, setWasteFactor] = useState<number>(0);
  const [customMargin, setCustomMargin] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<string>("");

  // Custom Item Form State
  const [customItemName, setCustomItemName] = useState("");
  const [customCategory, setCustomCategory] = useState<WorkCategory>("Structural Works");
  const [customSpecName, setCustomSpecName] = useState("");
  const [customUnit, setCustomUnit] = useState("m2");
  const [customCostPrice, setCustomCostPrice] = useState<number>(100000);
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(115000);

  // Success toast indicator for "Add & Continue"
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // When modal opens or masterItems change, initialize default selected master item
  useEffect(() => {
    if (isOpen && masterItems.length > 0) {
      if (!selectedMasterId || !masterItems.some((m) => m.id === selectedMasterId)) {
        const first = masterItems[0];
        setSelectedMasterId(first.id);
        if (first.specifications && first.specifications.length > 0) {
          setSelectedSpecId(first.specifications[0].id);
        }
      }
    }
  }, [isOpen, masterItems, selectedMasterId]);

  // Find currently selected master item & specification
  const currentMasterItem = useMemo(() => {
    return masterItems.find((m) => m.id === selectedMasterId) || masterItems[0] || null;
  }, [masterItems, selectedMasterId]);

  const currentSpecification = useMemo(() => {
    if (!currentMasterItem || !currentMasterItem.specifications) return null;
    const found = currentMasterItem.specifications.find((s) => s.id === selectedSpecId);
    return found || currentMasterItem.specifications[0] || null;
  }, [currentMasterItem, selectedSpecId]);

  // When master item selection changes, update specId and margin default
  const handleSelectMaster = (master: MasterCostItem) => {
    setSelectedMasterId(master.id);
    if (master.specifications && master.specifications.length > 0) {
      setSelectedSpecId(master.specifications[0].id);
    }
    setCustomMargin(null); // reset to category default
  };

  // Categories available
  const categories = useMemo(() => {
    const set = new Set<string>();
    masterItems.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [masterItems]);

  // Filtered master items
  const filteredMasterItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return masterItems.filter((item) => {
      const matchCat =
        selectedCategory === "ALL" || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;

      const inName = item.itemName.toLowerCase().includes(q);
      const inCode = item.itemCode.toLowerCase().includes(q);
      const inAhs = (item.ahsCode || "").toLowerCase().includes(q);
      const inSpecs = item.specifications.some(
        (s) =>
          (s.specName || "").toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q)
      );
      return inName || inCode || inAhs || inSpecs;
    });
  }, [masterItems, searchQuery, selectedCategory]);

  // Calculations for catalog item
  const effectiveMargin = useMemo(() => {
    if (customMargin !== null && !isNaN(customMargin)) return customMargin;
    if (!currentMasterItem) return 10;
    return categoryMargins[currentMasterItem.category] ?? 10;
  }, [customMargin, currentMasterItem, categoryMargins]);

  const calculatedVolume = useMemo(() => {
    const vr = Math.max(0, volumeReal || 0);
    const wf = Math.max(0, wasteFactor || 0);
    return Math.round(vr * (1 + wf / 100) * 100) / 100;
  }, [volumeReal, wasteFactor]);

  const costUnitPrice = useMemo(() => {
    return currentSpecification?.unitPrice || 0;
  }, [currentSpecification]);

  const sellingUnitPrice = useMemo(() => {
    return Math.round(costUnitPrice * (1 + effectiveMargin / 100));
  }, [costUnitPrice, effectiveMargin]);

  const calculatedTotalPrice = useMemo(() => {
    return Math.round(calculatedVolume * sellingUnitPrice);
  }, [calculatedVolume, sellingUnitPrice]);

  // Build the new RabItemEntry from current selections
  const buildEntryFromCatalog = (): RabItemEntry | null => {
    if (!currentMasterItem || !currentSpecification) return null;
    return {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sectionName: targetSectionName || "Lantai 1",
      masterItemId: currentMasterItem.id,
      specId: currentSpecification.id,
      workCategory: currentMasterItem.category,
      itemName: currentMasterItem.itemName,
      specification: currentSpecification.specName || currentSpecification.name || "",
      unit: currentSpecification.unit || "m2",
      volumeReal: volumeReal,
      wasteFactor: wasteFactor,
      volume: calculatedVolume,
      costPrice: costUnitPrice,
      unitPrice: sellingUnitPrice,
      totalPrice: calculatedTotalPrice,
      notes: customNotes.trim(),
      isCustom: false,
    };
  };

  const buildEntryFromCustom = (): RabItemEntry => {
    const vr = Math.max(0, volumeReal || 0);
    const wf = Math.max(0, wasteFactor || 0);
    const calcVol = Math.round(vr * (1 + wf / 100) * 100) / 100;
    const price = customUnitPrice || 0;
    return {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sectionName: targetSectionName || "Lantai 1",
      workCategory: customCategory,
      itemName: customItemName.trim() || "Pekerjaan Kustom",
      specification: customSpecName.trim(),
      unit: customUnit.trim() || "ls",
      volumeReal: vr,
      wasteFactor: wf,
      volume: calcVol,
      costPrice: customCostPrice,
      unitPrice: price,
      totalPrice: Math.round(calcVol * price),
      notes: customNotes.trim(),
      isCustom: true,
    };
  };

  const handleConfirmAdd = (keepOpen: boolean = false) => {
    let entry: RabItemEntry | null = null;
    if (activeTab === "catalog") {
      entry = buildEntryFromCatalog();
    } else {
      entry = buildEntryFromCustom();
    }

    if (!entry) return;

    if (targetRowId && onUpdateRowItem) {
      onUpdateRowItem(targetRowId, {
        masterItemId: entry.masterItemId,
        specId: entry.specId,
        workCategory: entry.workCategory,
        itemName: entry.itemName,
        specification: entry.specification,
        unit: entry.unit,
        volumeReal: entry.volumeReal,
        wasteFactor: entry.wasteFactor,
        volume: entry.volume,
        costPrice: entry.costPrice,
        unitPrice: entry.unitPrice,
        totalPrice: entry.totalPrice,
        notes: entry.notes,
        isCustom: entry.isCustom,
      });
      onClose();
      return;
    }

    onAddItem(entry);

    if (keepOpen) {
      setAddedToast(`"${entry.itemName.slice(0, 24)}..." berhasil ditambahkan!`);
      setTimeout(() => setAddedToast(null), 2500);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {targetRowId ? "Pilih / Ganti Item Pekerjaan" : "Tambah Item Pekerjaan ke RAB"}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AHS SNI &amp; Custom BoQ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pilih dari Master Database Analisa Harga Satuan atau masukkan pekerjaan kustom
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Toast */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-2 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === "catalog"
                  ? "border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Katalog Master Database ({masterItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("custom")}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === "custom"
                  ? "border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Item Pekerjaan Custom (Non-AHS)</span>
            </button>
          </div>

          {addedToast && (
            <div className="mb-2 px-2.5 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{addedToast}</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {activeTab === "catalog" ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Search & Item List */}
              <div className="w-full md:w-5/12 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                {/* Search Bar & Category Filter */}
                <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari nama item, kode AHS, atau spek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    <button
                      onClick={() => setSelectedCategory("ALL")}
                      className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === "ALL"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      Semua ({masterItems.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {cat.replace("Pekerjaan ", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Master Items Scrollable List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredMasterItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Tidak ada item yang sesuai pencarian "{searchQuery}"
                    </div>
                  ) : (
                    filteredMasterItems.map((item) => {
                      const isSelected = item.id === selectedMasterId;
                      const specCount = item.specifications?.length || 0;
                      const minPrice =
                        specCount > 0
                          ? Math.min(...item.specifications.map((s) => s.unitPrice))
                          : 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectMaster(item)}
                          className={`p-3 cursor-pointer transition flex items-start justify-between gap-2 ${
                            isSelected
                              ? "bg-blue-50/80 border-l-4 border-blue-600"
                              : "hover:bg-slate-50 border-l-4 border-transparent"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                {item.itemCode}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate">
                                {item.category}
                              </span>
                            </div>
                            <h4
                              className={`text-xs font-semibold leading-snug line-clamp-2 ${
                                isSelected ? "text-blue-900" : "text-slate-800"
                              }`}
                            >
                              {item.itemName}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                              <span>{specCount} Spek tersedia</span>
                              {item.ahsCode && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{item.ahsCode}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-slate-400">Mulai</div>
                            <div className="font-mono font-bold text-xs text-slate-800">
                              Rp {minPrice.toLocaleString("id-ID")}
                            </div>
                            <ChevronRight
                              className={`w-3.5 h-3.5 ml-auto mt-1 ${
                                isSelected ? "text-blue-600" : "text-slate-300"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Active Item Configuration & Volume/Price Calculator */}
              <div className="w-full md:w-7/12 flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50">
                {currentMasterItem ? (
                  <>
                    {/* Item Details Card */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {currentMasterItem.itemCode}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {currentMasterItem.category}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {currentMasterItem.itemName}
                          </h3>
                        </div>

                        {currentMasterItem.ahsCode && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Standar AHS
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {currentMasterItem.ahsCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {currentMasterItem.ahsDescription && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                          <span className="font-semibold text-slate-700">Analisa Bahan &amp; Upah: </span>
                          {currentMasterItem.ahsDescription}
                        </p>
                      )}
                    </div>

                    {/* Specification Selector */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center justify-between">
                        <span>Pilih Spesifikasi &amp; Merk ({currentMasterItem.specifications?.length || 0})</span>
                        <span className="text-[10px] text-slate-400 normal-case font-normal">
                          Klik untuk memilih spek yang diinginkan
                        </span>
                      </label>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {currentMasterItem.specifications?.map((spec) => {
                          const isSpecSelected = spec.id === currentSpecification?.id;
                          return (
                            <div
                              key={spec.id}
                              onClick={() => setSelectedSpecId(spec.id)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                                isSpecSelected
                                  ? "border-blue-500 bg-blue-50/70 shadow-2xs"
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSpecSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isSpecSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <div className="truncate">
                                  <div className="font-semibold text-slate-800 truncate">
                                    {spec.specName || spec.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Satuan: <span className="font-bold">{spec.unit}</span>
                                    {spec.materialCost ? (
                                      <span> • Bahan: Rp {spec.materialCost.toLocaleString("id-ID")}</span>
                                    ) : null}
                                    {spec.laborCost ? (
                                      <span> • Upah: Rp {spec.laborCost.toLocaleString("id-ID")}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-[10px] text-slate-400">Harga Pokok</div>
                                <div className="font-mono font-bold text-slate-800">
                                  Rp {spec.unitPrice.toLocaleString("id-ID")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Real-time Volume & Dynamic Pricing Calculator */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-blue-600" />
                          <span>Kalkulator Volume &amp; Harga Satuan (BoQ)</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Satuan: <strong className="font-mono text-slate-700">{currentSpecification?.unit || "m2"}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Real Volume */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Volume Real / Netto
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={volumeReal}
                              onChange={(e) => setVolumeReal(parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400">
                              {currentSpecification?.unit || "m2"}
                            </span>
                          </div>
                        </div>

                        {/* Waste Factor */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Waste / Safety Factor (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max="100"
                              value={wasteFactor}
                              onChange={(e) => setWasteFactor(parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-amber-500"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Calculated Volume (Bruto) */}
                        <div>
                          <label className="text-[11px] font-semibold text-blue-700 block mb-1">
                            Total Volume Dihitung
                          </label>
                          <div className="border border-blue-200 bg-blue-50/50 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-blue-800 flex justify-between items-center">
                            <span>{calculatedVolume.toLocaleString("id-ID")}</span>
                            <span className="text-[10px] font-normal text-blue-600">
                              {currentSpecification?.unit || "m2"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Tier & Margin Override */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Cost Price */}
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-1">
                            Harga Pokok (AHS Base)
                          </span>
                          <div className="font-mono text-xs font-bold text-slate-700">
                            Rp {costUnitPrice.toLocaleString("id-ID")}
                          </div>
                        </div>

                        {/* Margin % */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-500">Margin Kategori</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Default: {categoryMargins[currentMasterItem.category] ?? 10}%
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={effectiveMargin}
                              onChange={(e) => setCustomMargin(parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Selling Unit Price */}
                        <div>
                          <span className="text-[10px] text-emerald-700 font-bold block mb-1">
                            Harga Satuan Jual (RAB)
                          </span>
                          <div className="font-mono text-xs font-bold text-emerald-700">
                            Rp {sellingUnitPrice.toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>

                      {/* Notes optional */}
                      <div className="pt-2 border-t border-slate-100">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Catatan / Lokasi Penempatan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={customNotes}
                          onChange={(e) => setCustomNotes(e.target.value)}
                          placeholder="cth: Area Lobby Lantai 1, koridor barat..."
                          className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Pilih item dari daftar di sebelah kiri untuk melihat rincian
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Custom Work Item Form */
            <div className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Gunakan form ini untuk memasukkan item pekerjaan khusus / borongan yang tidak ada dalam daftar AHS standar.
                </span>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori Pekerjaan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as WorkCategory)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Structural Works">Structural Works (Struktur)</option>
                    <option value="Wall Finishes">Wall Finishes (Dinding &amp; Plesteran)</option>
                    <option value="Flooring & Floor Finishes">Flooring &amp; Floor Finishes (Lantai)</option>
                    <option value="Ceilings & Partitions">Ceilings &amp; Partitions (Plafon &amp; Partisi)</option>
                    <option value="Doors & Windows">Doors &amp; Windows (Pintu &amp; Jendela)</option>
                    <option value="Painting & Coatings">Painting &amp; Coatings (Pengecatan)</option>
                    <option value="Interior Fit-Out">Interior Fit-Out (Interior &amp; Furnitur)</option>
                    <option value="Mechanical & Electrical (M&E)">Mechanical &amp; Electrical (M&amp;E / MEP)</option>
                    <option value="Plumbing & Sanitary">Plumbing &amp; Sanitary</option>
                    <option value="Preparatory Works">Preparatory Works (Persiapan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Item Pekerjaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="cth: Pembuatan Partisi Kaca Tempered Frameless 12mm"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Spesifikasi &amp; Merk Bahan
                  </label>
                  <input
                    type="text"
                    value={customSpecName}
                    onChange={(e) => setCustomSpecName(e.target.value)}
                    placeholder="cth: Kaca Asahi 12mm tempered, aksesoris Dekkson, sealant Dow Corning"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Satuan (Unit)
                    </label>
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="m2">m2 (Meter Persegi)</option>
                      <option value="m3">m3 (Meter Kubik)</option>
                      <option value="m'">m' (Meter Lari)</option>
                      <option value="bh">bh (Buah / Pcs)</option>
                      <option value="unit">unit (Unit)</option>
                      <option value="ttk">ttk (Titik Instalasi)</option>
                      <option value="ls">ls (Lump Sum / Borong)</option>
                      <option value="kg">kg (Kilogram)</option>
                      <option value="set">set (Set)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Volume Real
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={volumeReal}
                      onChange={(e) => setVolumeReal(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Waste Factor %
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={wasteFactor}
                      onChange={(e) => setWasteFactor(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Harga Pokok Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customCostPrice}
                      onChange={(e) => setCustomCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-700 block mb-1">
                      Harga Satuan Jual RAB (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customUnitPrice}
                      onChange={(e) => setCustomUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-emerald-300 bg-emerald-50/40 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">
                Estimasi Nilai Item (Subtotal)
              </span>
              <span className="font-mono font-bold text-base text-blue-700">
                Rp{" "}
                {activeTab === "catalog"
                  ? calculatedTotalPrice.toLocaleString("id-ID")
                  : Math.round(
                      (volumeReal * (1 + wasteFactor / 100)) * (customUnitPrice || 0)
                    ).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[260px]">
              {activeTab === "catalog"
                ? currentMasterItem?.itemName || "-"
                : customItemName || "Item Baru"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>

            {!targetRowId && (
              <button
                type="button"
                onClick={() => handleConfirmAdd(true)}
                className="px-3.5 py-2 rounded-md bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
                title="Tambahkan item ini dan tetap buka modal untuk menambah item berikutnya"
              >
                <span>+ Tambah &amp; Lanjut</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleConfirmAdd(false)}
              className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{targetRowId ? "Terapkan ke Baris Ini" : "+ Tambahkan ke RAB"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
