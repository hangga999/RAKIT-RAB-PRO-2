import React, { useState, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  FolderOpen,
  CheckCircle2,
  Paperclip,
  Eye,
  Trash2,
  Pencil,
  AlertCircle
} from 'lucide-react';
import { Vendor } from '../types';
import { ExportDropdown } from './ExportDropdown';
import { exportVendorListToExcel } from '../utils/excelExport';
import { exportVendorListToPdf } from '../utils/pdfExport';

interface VendorListProps {
  vendors: Vendor[];
  categories: string[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  onAddCategory: (category: string) => void;
}

export const VendorList: React.FC<VendorListProps> = ({
  vendors,
  categories,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewVendor, setPreviewVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Vendor | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Struktur Baja & Rangka Atap');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState(4.8);
  const [notes, setNotes] = useState('');
  const [catalogFileName, setCatalogFileName] = useState('');
  const [catalogFilePath, setCatalogFilePath] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter vendors
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phoneNumber.includes(searchQuery);
    const matchesCategory = categoryFilter === 'ALL' || v.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Handle local file selection (Browse File)
  const handleBrowseLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCatalogFileName(file.name);
      // Simulate Windows local filesystem path for SQLite storage
      setCatalogFilePath(`C:\\RAB_Data\\Catalogs\\Vendors\\${file.name}`);
    }
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      alert('Nama Vendor dan Nomor Telepon wajib diisi.');
      return;
    }

    const trimmedCategory = category.trim() || 'General';
    if (!categories.includes(trimmedCategory)) {
      onAddCategory(trimmedCategory);
    }

    const vendorData: Vendor = {
      id: editingVendor ? editingVendor.id : `vnd-${Date.now()}`,
      name: name.trim(),
      category: trimmedCategory,
      contactPerson: contactPerson.trim() || 'Sales Representative',
      phoneNumber: phoneNumber.trim(),
      email: email.trim() || 'info@vendor.com',
      address: address.trim() || 'DKI Jakarta & Sekitarnya',
      catalogFileName: catalogFileName || 'Brosur_Produk_Material.pdf',
      catalogFilePath: catalogFilePath || `C:\\RAB_Data\\Catalogs\\Vendors\\${name.replace(/\s+/g, '_')}.pdf`,
      catalogFileType: catalogFileName.endsWith('.png') || catalogFileName.endsWith('.jpg') ? 'image' : 'pdf',
      rating,
      notes: notes.trim()
    };

    if (editingVendor) {
      onUpdateVendor(vendorData);
    } else {
      onAddVendor(vendorData);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditClick = (vendor: Vendor) => {
    setName(vendor.name);
    setCategory(vendor.category);
    setContactPerson(vendor.contactPerson);
    setPhoneNumber(vendor.phoneNumber);
    setEmail(vendor.email);
    setAddress(vendor.address);
    setCatalogFileName(vendor.catalogFileName || '');
    setCatalogFilePath(vendor.catalogFilePath || '');
    setRating(vendor.rating);
    setNotes(vendor.notes || '');
    setEditingVendor(vendor);
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setCategory('Struktur Baja & Rangka Atap');
    setContactPerson('');
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setCatalogFileName('');
    setCatalogFilePath('');
    setNotes('');
    setEditingVendor(null);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteVendor(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-100 font-sans text-slate-800">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Vendor Directory /</span>
          <span className="font-semibold text-slate-800">Supplier &amp; Sub-Contractor Catalogs</span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-mono font-medium ml-2">
            {vendors.length} Registered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            label="Export Vendors"
            onExportExcel={() => exportVendorListToExcel(vendors)}
            onExportPdf={() => exportVendorListToPdf(vendors)}
            menuTitle="Vendor Directory Export"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Vendor</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* Search & Filter */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor name, category, or contact..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] uppercase font-bold text-slate-500">Filter Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 text-slate-800"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High Density Vendor Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-tight text-slate-700 flex items-center gap-2">
              <span>Verified Material Suppliers &amp; Workshop Partners</span>
            </h3>
            <span className="text-slate-400 text-[11px]">
              Local PDF Catalogs saved to <code className="font-mono text-slate-600">C:\RAB_Data\Catalogs</code>
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200 select-none">
                  <th className="py-3 px-3 align-top w-12 text-center whitespace-nowrap">No</th>
                  <th className="py-3 px-3.5 align-top min-w-[220px]">Vendor Name</th>
                  <th className="py-3 px-3.5 align-top w-36 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3.5 align-top min-w-[150px]">Contact Person</th>
                  <th className="py-3 px-3.5 align-top min-w-[140px] whitespace-nowrap">Phone Number</th>
                  <th className="py-3 px-3.5 align-top min-w-[240px]">Attached Catalog File (Browse Path)</th>
                  <th className="py-3 px-3.5 align-top w-24 text-center whitespace-nowrap">Rating</th>
                  <th className="py-3 px-3.5 align-top w-28 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor, index) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 align-top text-center text-slate-400 font-mono whitespace-nowrap">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-3.5 align-top break-words whitespace-normal leading-relaxed">
                      <div className="font-bold text-slate-900">{vendor.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 break-words">{vendor.address}</div>
                    </td>
                    <td className="py-3 px-3.5 align-top whitespace-nowrap text-slate-600 font-medium">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 align-top break-words whitespace-normal text-slate-800 font-medium">
                      {vendor.contactPerson}
                    </td>
                    <td className="py-3 px-3.5 align-top whitespace-nowrap font-mono text-slate-700">
                      {vendor.phoneNumber}
                    </td>
                    <td className="py-3 px-3.5 align-top break-words whitespace-normal">
                      {vendor.catalogFileName ? (
                        <div 
                          onClick={() => setPreviewVendor(vendor)}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 cursor-pointer font-mono text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded max-w-xs transition"
                          title={`Click to preview: ${vendor.catalogFilePath}`}
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0 text-red-500" />
                          <span className="truncate">{vendor.catalogFileName}</span>
                          <Eye className="w-3 h-3 ml-auto text-slate-400" />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No file attached</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 align-top text-center font-mono whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{vendor.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setPreviewVendor(vendor)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                          title="Inspect Vendor"
                        >
                          <Eye className="w-3.5 h-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleEditClick(vendor)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Pencil className="w-3.5 h-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(vendor)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-900 text-white p-3 px-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">
              Total {filteredVendors.length} active suppliers in local SQLite index
            </span>
            <span className="font-mono text-blue-400 text-[11px]">
              Schema: VendorList (id, name, phone, catalog_path)
            </span>
          </div>
        </div>
      </div>

      {/* ADD NEW VENDOR MODAL WITH BROWSE FILE CAPABILITY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Register New Supplier / Vendor
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-5 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Vendor / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. PT Mitra Baja Utama"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Specialty Category
                  </label>
                  <input
                    type="text"
                    list="vendor-categories"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Select or type new category..."
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <datalist id="vendor-categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Nama PIC / Sales"
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sales@vendor.com"
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Office / Workshop Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Jl. Raya Industri No..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs"
                />
              </div>

              {/* BROWSE FILE BUTTON FOR LOCAL PDF / IMAGES PATH */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Catalog / Price List File (PDF or Image)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleBrowseLocalFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-slate-500" />
                    <span>Browse File...</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 rounded p-2 flex items-center justify-between">
                  <span className="truncate">
                    {catalogFilePath || 'No file chosen (e.g. C:\\RAB_Data\\Catalogs\\catalog.pdf)'}
                  </span>
                  {catalogFileName && (
                    <span className="text-[10px] text-emerald-600 font-bold ml-2 shrink-0">Selected</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR CATALOG INSPECT MODAL */}
      {previewVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Catalog Inspector: {previewVendor.name}
              </h3>
              <button
                onClick={() => setPreviewVendor(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">Local Windows File Path:</div>
                <div className="font-mono text-xs text-blue-700 break-all select-all font-semibold">
                  {previewVendor.catalogFilePath}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-slate-800">{previewVendor.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-800">{previewVendor.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono font-semibold text-slate-800">{previewVendor.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-800">{previewVendor.email}</span>
                </div>
              </div>

              {previewVendor.notes && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded text-slate-700 text-[11px]">
                  <strong>Catatan Khusus:</strong> {previewVendor.notes}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setPreviewVendor(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  Close
                </button>
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
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Vendor?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-700">{deleteConfirm.name}</span>? This action cannot be undone.
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
                  Delete Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
