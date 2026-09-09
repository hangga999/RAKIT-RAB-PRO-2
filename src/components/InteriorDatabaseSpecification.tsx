import React, { useState, useMemo } from "react";
import { InteriorSpecification, InteriorSpecCategory } from "../types";
import { Database, Plus, Search, Trash2, Filter } from "lucide-react";

interface Props {
  specDB: InteriorSpecification[];
  onUpdateDB: (newDB: InteriorSpecification[]) => void;
}

const CATEGORIES: InteriorSpecCategory[] = [
  "Base Material",
  "Finishing Material",
  "Hardware",
  "Accessories",
  "Others"
];

export const InteriorDatabaseSpecification: React.FC<Props> = ({ specDB, onUpdateDB }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredDB = useMemo(() => {
    return specDB.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const catA = a.category || "Others";
      const catB = b.category || "Others";
      if (catA !== catB) return catA.localeCompare(catB);
      return a.name.localeCompare(b.name);
    });
  }, [specDB, searchTerm, selectedCategory]);

  const handleAdd = () => {
    onUpdateDB([...specDB, {
      id: `spc-${Date.now()}`,
      category: "Base Material",
      name: "New Specification",
      baseCost: 0,
      unit: "m2",
      notes: ""
    }]);
  };

  const updateItem = (id: string, field: keyof InteriorSpecification, value: any) => {
    onUpdateDB(specDB.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteItem = (id: string) => {
    onUpdateDB(specDB.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            Database Specification
          </h2>
          <p className="text-sm text-slate-500">Isolated catalog specifically for the Interior Master reactive formulas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search specifications..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200 w-48">Category</th>
                <th className="p-4 font-bold border-b border-slate-200">Specification Name</th>
                <th className="p-4 font-bold border-b border-slate-200 w-24">Unit</th>
                <th className="p-4 font-bold border-b border-slate-200 w-48 text-right">Base Cost (Rp)</th>
                <th className="p-4 font-bold border-b border-slate-200">Notes</th>
                <th className="p-4 font-bold border-b border-slate-200 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDB.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <select
                      value={item.category || "Others"}
                      onChange={e => updateItem(item.id, "category", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none text-slate-700 text-sm"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <input type="text" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none font-semibold text-slate-800" />
                  </td>
                  <td className="p-4">
                    <input type="text" value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none text-slate-600" />
                  </td>
                  <td className="p-4">
                    <input type="number" value={item.baseCost || ""} onChange={e => updateItem(item.id, "baseCost", Number(e.target.value))} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none text-right font-bold text-slate-900" />
                  </td>
                  <td className="p-4">
                    <input type="text" value={item.notes || ""} onChange={e => updateItem(item.id, "notes", e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none text-slate-500 text-sm" />
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteItem(item.id)} className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-md transition cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDB.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No specifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
