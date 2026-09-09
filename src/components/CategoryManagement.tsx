import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, AlertCircle, Save, X, CheckCircle2 } from "lucide-react";

interface CategoryManagementProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onUpdateCategory: (oldCategory: string, newCategory: string) => void;
  onDeleteCategory: (category: string) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName("");
      setIsAddModalOpen(false);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editCategoryName.trim() &&
      editingCategory &&
      editCategoryName.trim() !== editingCategory &&
      !categories.includes(editCategoryName.trim())
    ) {
      onUpdateCategory(editingCategory, editCategoryName.trim());
      setEditingCategory(null);
      setEditCategoryName("");
    }
  };

  const confirmDelete = (category: string) => {
    onDeleteCategory(category);
    setDeleteConfirm(null);
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-screen overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Category Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage master categories for work items and vendors.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {filteredCategories.length} Categories
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-6 font-semibold w-16 text-center">No</th>
                  <th className="py-3 px-6 font-semibold">Category Name</th>
                  <th className="py-3 px-6 font-semibold w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category, index) => (
                    <tr key={category} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 text-center text-slate-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-6">
                        {editingCategory === category ? (
                          <form onSubmit={handleUpdate} className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="px-3 py-1.5 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium w-full max-w-sm"
                            />
                            <button
                              type="submit"
                              disabled={!editCategoryName.trim() || editCategoryName.trim() === category}
                              className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(null);
                                setEditCategoryName("");
                              }}
                              className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <span className="font-semibold text-slate-700">{category}</span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setEditCategoryName(category);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(category)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Add New Category</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., General Works"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim() || categories.includes(newCategoryName.trim())}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Category?</h3>
              <p className="text-slate-500 text-center text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-700">"{deleteConfirm}"</span>? This might affect existing master items and vendors using this category.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
