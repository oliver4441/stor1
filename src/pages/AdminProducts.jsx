import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle, Loader2, Upload, Image as ImageIcon, Search, Filter, Eye } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchAllListings, createListing, updateListing, deleteListing, adminDeleteListing } from '../utils/api';
import { formatKES, CATEGORIES } from '../utils/constants';
import { uploadImage } from '../utils/api';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'For Parts'];

export default function AdminProducts() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', price: '', description: '', category: 'Electronics', condition: 'New', location: 'CBD',
    image_url: '', quantity: '1', brand: '', model: '', color: '', weight: '', sku: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const allListings = await fetchAllListings();
    setListings(allListings);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered listings
  const filteredListings = listings.filter(l => {
    const matchSearch = !searchQuery || l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'All' || l.category === filterCategory;
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const openAddModal = () => {
    setEditingId(null);
    setForm({ title: '', price: '', description: '', category: 'Electronics', condition: 'New', location: 'CBD', image_url: '', quantity: '1', brand: '', model: '', color: '', weight: '', sku: '' });
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (listing) => {
    setEditingId(listing.id);
    setForm({
      title: listing.title, price: String(listing.price), description: listing.description || '',
      category: listing.category || 'Electronics', condition: listing.condition || 'New',
      location: listing.location_city || 'CBD', image_url: listing.images?.[0] || '',
      quantity: String(listing.quantity || 1), brand: listing.brand || '', model: listing.model || '',
      color: listing.color || '', weight: listing.weight || '', sku: listing.sku || ''
    });
    setImagePreview(listing.images?.[0] || null);
    setModalOpen(true);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const result = await uploadImage(file);
    if (result.success) {
      setForm(prev => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
    } else {
      alert(result.error || 'Image upload failed');
    }
    setImageUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title, description: form.description, price: form.price,
      category: form.category, condition: form.condition, location: form.location,
      image_url: form.image_url, quantity: form.quantity, brand: form.brand,
      model: form.model, color: form.color, weight: form.weight, sku: form.sku,
    };
    const result = editingId ? await updateListing(editingId, payload) : await createListing(payload);
    if (result.success) {
      setSuccessMsg(editingId ? 'Product updated!' : 'Product added!');
      setModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert('Error: ' + result.error);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    let result = await adminDeleteListing(deleteTarget.id);
    if (!result.success) result = await deleteListing(deleteTarget.id);
    if (result.success) {
      setSuccessMsg('Product deleted!');
      setDeleteTarget(null);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert('Delete failed: ' + (result.error || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-500/20 text-sm font-bold animate-slide-in">{successMsg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Products</h2>
          <p className="text-sm text-zinc-500">{listings.length} total • {filteredListings.length} shown</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-[#ff385c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#e03150] shadow-lg shadow-[#ff385c]/20 transition-all">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text" placeholder="Search by name or SKU..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:border-[#ff385c] focus:outline-none"
          />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white appearance-none">
          <option value="All">All Categories</option>
          {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white appearance-none">
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Product</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden sm:table-cell">Stock</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-right text-xs font-bold text-zinc-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map(listing => (
                  <tr key={listing.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-zinc-400" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">{listing.title}</p>
                          {listing.sku && <p className="text-xs text-zinc-400 font-mono">{listing.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">{listing.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatKES(listing.price)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-sm font-semibold ${listing.quantity === 0 ? 'text-red-500' : listing.quantity <= 3 ? 'text-amber-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {listing.quantity || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        listing.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>{listing.status || 'active'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/listing/${listing.id}`} target="_blank" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" title="View">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => openEditModal(listing)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget({ id: listing.id, title: listing.title })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No products found</h3>
          <p className="text-sm text-zinc-500 mb-4">{searchQuery || filterCategory !== 'All' || filterStatus !== 'All' ? 'Try adjusting your filters' : 'Get started by adding your first product'}</p>
          {!searchQuery && filterCategory === 'All' && filterStatus === 'All' && (
            <button onClick={openAddModal} className="text-[#ff385c] font-bold text-sm hover:underline">Add Product →</button>
          )}
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Product Image *</label>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border-2 border-dashed border-zinc-300 dark:border-zinc-600">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50">
                      {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload Image</>}
                    </button>
                    <p className="text-xs text-zinc-500 mt-2">JPG, PNG or WebP. Max 5MB.</p>
                    {form.image_url && <p className="text-xs text-green-600 mt-1 font-medium">✓ Image uploaded</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Product Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. iPhone 13 Pro 256GB" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Price (KES) *</label>
                  <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="85000" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Condition</label>
                  <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Quantity *</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="1" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Brand</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Apple" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Model</label>
                  <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. iPhone 13 Pro" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Color</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Pacific Blue" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Weight</label>
                  <input value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 0.5kg" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">SKU</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g. IP13P-256-BLU" className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the product..." className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={submitting || !form.image_url} className="flex-1 bg-[#ff385c] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Saving...</> : (editingId ? 'Save Changes' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">This will permanently delete "{deleteTarget.title}".</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
