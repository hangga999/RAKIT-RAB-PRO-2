import React, { useState } from "react";
import {
  Database,
  Search,
  Plus,
  Filter,
  Trash2,
  Pencil,
  Download,
  Info,
  X,
  AlertCircle
} from "lucide-react";
import { MasterCostItem, WorkCategory, ItemSpecification } from "../types";
import { ExportDropdown } from "./ExportDropdown";
import { exportMasterDatabaseToExcel } from "../utils/excelExport";
import { exportMasterDatabaseToPdf } from "../utils/pdfExport";
import { DualScrollTable } from "./DualScrollTable";

interface MasterDatabaseProps {
  masterItems: MasterCostItem[];
  onAddItem: (newItem: MasterCostItem) => void;
  onUpdateItem: (updated: MasterCostItem) => void;
  onDeleteItem: (id: string) => void;
  categories: string[];
}

export const MasterDatabase: React.FC<MasterDatabaseProps> = ({
  masterItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  categories,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCostItem | null>(null);
  
  // Info and Delete states
  const [infoItem, setInfoItem] = useState<MasterCostItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MasterCostItem | null>(null);

  // New Item Form State
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<WorkCategory>(
    "Pekerjaan Persiapan & Struktur",
  );
  const [ahsCode, setAhsCode] = useState("");

  // Dynamic Specifications State
  const [specifications, setSpecifications] = useState<ItemSpecification[]>([
    {
      id: "spec-1",
      specName: "",
      unit: "m2",
      materialCost: 0,
      laborCost: 0,
      equipmentCost: 0,
      unitPrice: 0,
    },
  ]);

  const handleAddSpecificationRow = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        id: `spec-${Date.now()}`,
        specName: "",
        unit: "m2",
        materialCost: 0,
        laborCost: 0,
        equipmentCost: 0,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveSpecificationRow = (id: string) => {
    if (specifications.length > 1) {
      setSpecifications((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updateSpec = (
    id: string,
    field: keyof ItemSpecification,
    value: any,
  ) => {
    setSpecifications((prev) =>
      prev.map((spec) => {
        if (spec.id === id) {
          const updated = { ...spec, [field]: value };
          if (
            field === "materialCost" ||
            field === "laborCost" ||
            field === "equipmentCost"
          ) {
            updated.unitPrice =
              (updated.materialCost || 0) +
              (updated.laborCost || 0) +
              (updated.equipmentCost || 0);
          }
          return updated;
        }
        return spec;
      }),
    );
  };

  // Filtered items
  const filteredItems = masterItems.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specifications.some((spec) =>
        spec.specName.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      (item.ahsCode &&
        item.ahsCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (item: MasterCostItem) => {
    setItemCode(item.itemCode);
    setItemName(item.itemName);
    setCategory(item.category);
    setAhsCode(item.ahsCode);
    setSpecifications([...item.specifications]);
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleInfoClick = (item: MasterCostItem) => {
    setInfoItem(item);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteItem(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setItemCode("");
    setItemName("");
    setAhsCode("");
    setSpecifications([
      {
        id: "spec-1",
        specName: "",
        unit: "m2",
        materialCost: 0,
        laborCost: 0,
        equipmentCost: 0,
        unitPrice: 0,
      },
    ]);
    setEditingItem(null);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim()) {
      alert("Kode dan Nama Pekerjaan wajib diisi.");
      return;
    }

    const validSpecs = specifications.filter(
      (s) => s.specName.trim() !== "" && s.unit.trim() !== "",
    );
    if (validSpecs.length === 0) {
      alert(
        "Minimal harus ada 1 Spesifikasi dengan nama dan satuan yang valid.",
      );
      return;
    }

    const newItem: MasterCostItem = {
      id: editingItem ? editingItem.id : `mst-${Date.now()}`,
      itemCode: itemCode.trim().toUpperCase(),
      itemName: itemName.trim(),
      category,
      specifications: validSpecs,
      ahsCode: ahsCode.trim() || "SNI / PUPR",
      ahsDescription: validSpecs[0].specName,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    if (editingItem) {
      onUpdateItem(newItem);
    } else {
      onAddItem(newItem);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-100 font-sans text-slate-800">
      {/* Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Master Data /</span>
          <span className="font-semibold text-slate-800">
            Costing Reference (AHS Single Source of Truth)
          </span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-mono font-medium ml-2">
            {masterItems.length} Items in SQLite
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            label="Export AHS Database"
            onExportExcel={() => exportMasterDatabaseToExcel(masterItems)}
            onExportPdf={() => exportMasterDatabaseToPdf(masterItems)}
            menuTitle="Master Database AHS Export"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert New AHS Item</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* Search & Filter Bar */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, item name, or material spec..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 focus:bg-white text-slate-800 font-medium"
            >
              <option value="ALL">All Categories ({masterItems.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High Density Master Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-tight text-slate-700 flex items-center gap-2">
              <span>Standard Pricing &amp; AHS Reference Records</span>
              <span className="text-slate-400 font-normal">
                (Linked automatically to the "Create New RAB Project" dropdown)
              </span>
            </h3>
          </div>

          <DualScrollTable className="flex-1">
            <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 align-top w-28 whitespace-nowrap">Item Code</th>
                  <th className="py-2.5 px-3 align-top min-w-[240px]">Work Item Name</th>
                  <th className="py-2.5 px-3 align-top min-w-[280px]">
                    Specification / Variant
                  </th>
                  <th className="py-2.5 px-3 align-top w-36 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3 align-top w-16 text-center whitespace-nowrap">Unit</th>
                  <th className="py-2.5 px-3 align-top w-28 text-right whitespace-nowrap">Material (Rp)</th>
                  <th className="py-2.5 px-3 align-top w-28 text-right whitespace-nowrap">Worker Wage (Rp)</th>
                  <th className="py-2.5 px-3 align-top w-32 text-right whitespace-nowrap">
                    Total Cost Price (Modal)
                  </th>
                  <th className="py-2.5 px-3 align-top w-24 text-center whitespace-nowrap">AHS Code</th>
                  <th className="py-2.5 px-3 align-top w-20 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No costing reference items matched your filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.flatMap((item) =>
                    item.specifications.map((spec, index) => (
                      <tr
                        key={`${item.id}-${spec.id}`}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {index === 0 ? (
                          <>
                            <td
                              className="py-2.5 px-3 align-top font-mono font-bold text-blue-600 whitespace-nowrap"
                              rowSpan={item.specifications.length}
                            >
                              {item.itemCode}
                            </td>
                            <td
                              className="py-2.5 px-3 align-top font-semibold text-slate-900 break-words leading-relaxed"
                              rowSpan={item.specifications.length}
                            >
                              {item.itemName}
                            </td>
                          </>
                        ) : null}

                        <td className="py-2.5 px-3 align-top break-words whitespace-normal text-slate-600 text-[11px] leading-relaxed border-l border-slate-100">
                          {spec.specName}
                        </td>

                        {index === 0 ? (
                          <td
                            className="py-2.5 px-3 align-top text-slate-500 whitespace-nowrap"
                            rowSpan={item.specifications.length}
                          >
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] border border-slate-200">
                              {item.category.replace("Pekerjaan ", "")}
                            </span>
                          </td>
                        ) : null}

                        <td className="py-2.5 px-3 align-top break-words whitespace-normal text-center font-mono font-semibold text-slate-700">
                          {spec.unit}
                        </td>
                        <td className="py-2.5 px-3 align-top break-words whitespace-normal text-right font-mono text-slate-600">
                          {spec.materialCost.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 align-top break-words whitespace-normal text-right font-mono text-slate-600">
                          {spec.laborCost.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 align-top break-words whitespace-normal text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                          {spec.unitPrice.toLocaleString("id-ID")}
                        </td>

                        {index === 0 ? (
                          <>
                            <td
                              className="py-2.5 px-3 align-top text-center font-mono text-[10px] text-slate-500 whitespace-nowrap"
                              rowSpan={item.specifications.length}
                            >
                              {item.ahsCode}
                            </td>
                            <td
                              className="py-2.5 px-3 align-top text-center"
                              rowSpan={item.specifications.length}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleInfoClick(item)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                                  title="Item Info"
                                >
                                  <Info className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                  title="Edit Master Item"
                                >
                                  <Pencil className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(item)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Delete Master Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : null}
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </DualScrollTable>

          {/* Table summary bar */}
          <div className="bg-slate-900 text-white p-3 px-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">
              Showing {filteredItems.length} of {masterItems.length} AHS
              reference entries
            </span>
            <span className="font-mono text-emerald-400 text-xs font-semibold">
              Live Database Synchronization: Enabled
            </span>
          </div>
        </div>
      </div>

      {/* INSERT NEW AHS ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                {editingItem
                  ? "Edit Master Costing Reference (AHS)"
                  : "Add New Master Costing Reference (AHS)"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveNewItem}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Item Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      placeholder="e.g. AHS-INT-09"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Work Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. Partisi Kaca Tempered 10mm Rangka Aluminium"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      AHS Ref Code
                    </label>
                    <input
                      type="text"
                      value={ahsCode}
                      onChange={(e) => setAhsCode(e.target.value)}
                      placeholder="SNI 2008"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <hr className="border-slate-200 my-4" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      Specifications &amp; Variants{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSpecificationRow}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      Add Specification
                    </button>
                  </div>

                  <div className="space-y-3">
                    {specifications.map((spec, index) => (
                      <div
                        key={spec.id}
                        className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-500">
                            Variant #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSpecificationRow(spec.id)
                            }
                            className="text-slate-400 hover:text-red-500"
                            title="Remove variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-12 sm:col-span-5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                              Description (e.g. Cat Dulux)
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={spec.specName}
                              onChange={(e) =>
                                updateSpec(spec.id, "specName", e.target.value)
                              }
                              placeholder="Rincian material..."
                              className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs"
                            />
                          </div>

                          <div className="col-span-4 sm:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              required
                              value={spec.unit}
                              onChange={(e) =>
                                updateSpec(spec.id, "unit", e.target.value)
                              }
                              placeholder="m2"
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono text-center"
                            />
                          </div>

                          <div className="col-span-8 sm:col-span-5 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                                Material (Rp)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={spec.materialCost || ""}
                                onChange={(e) =>
                                  updateSpec(
                                    spec.id,
                                    "materialCost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono text-right"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                                Wage (Rp)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={spec.laborCost || ""}
                                onChange={(e) =>
                                  updateSpec(
                                    spec.id,
                                    "laborCost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono text-right"
                              />
                            </div>
                            <div className="col-span-2 flex items-center justify-between bg-blue-50/50 border border-blue-100 px-2 py-1 rounded">
                              <span className="text-[9px] font-bold text-blue-600 uppercase">
                                Unit Price:
                              </span>
                              <span className="font-mono font-bold text-blue-700">
                                Rp {spec.unitPrice.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save to Master DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* INFO MODAL */}
      {infoItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-600 rounded-md text-white">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Master Item Detail</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {infoItem.itemCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInfoItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Item Name</div>
                  <div className="text-sm font-semibold text-slate-800">{infoItem.itemName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Category</div>
                  <div className="text-sm font-medium text-slate-700 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">{infoItem.category}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">AHS Code</div>
                  <div className="text-sm font-mono text-slate-700">{infoItem.ahsCode}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Last Updated</div>
                  <div className="text-sm text-slate-700">{infoItem.updatedAt}</div>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 uppercase mb-3 pb-2 border-b border-slate-200">
                Specifications ({infoItem.specifications.length})
              </div>
              
              <div className="space-y-4">
                {infoItem.specifications.map((spec, i) => (
                  <div key={spec.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Spec #{i + 1}</div>
                        <div className="text-sm font-semibold text-slate-800">{spec.specName || "Standard Specification"}</div>
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 font-mono font-bold text-xs rounded border border-blue-200">
                        {spec.unit}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-2 rounded border border-slate-100 shadow-sm text-right">
                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Material Cost</div>
                        <div className="font-mono font-medium text-slate-700">Rp {(spec.materialCost || 0).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-100 shadow-sm text-right">
                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Labor Cost</div>
                        <div className="font-mono font-medium text-slate-700">Rp {(spec.laborCost || 0).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded border border-blue-100 shadow-sm text-right">
                        <div className="text-[9px] text-blue-500 uppercase font-bold mb-1">Total Unit Price</div>
                        <div className="font-mono font-bold text-blue-700">Rp {(spec.unitPrice || 0).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Master Item?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-700">{deleteConfirm.itemCode} - {deleteConfirm.itemName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
