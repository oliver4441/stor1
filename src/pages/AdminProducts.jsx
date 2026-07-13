import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, Loader2, Upload, Image as ImageIcon, Search, Eye, CheckSquare, Square, Tag, GripVertical, Star, Percent, Package } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchAllListings, createListing, updateListing, deleteListing, adminDeleteListing, bulkUpdateListingStatus, bulkDeleteListings, saveWholesalePrices } from '../utils/api';
import { formatKES, CATEGORIES, generateSKU, COLOR_PALETTE, SIZE_PRESETS, getPresetSizes, VARIANT_REQUIRED_CATEGORIES } from '../utils/constants';
import { uploadImage } from '../utils/api';
import VariantManager from '../components/VariantManager';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'used-good', label: 'Used - Good' },
  { value: 'used-fair', label: 'Used - Fair' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'for-parts', label: 'For Parts' },
];
const MAX_IMAGES = 5;

export default function AdminProducts() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPage, setFilterPage] = useState('All');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', price: '', description: '', category: 'Electronics', condition: 'new', location: 'CBD',
    images: [], brand: '', model: '', color: '', weight: '', sku: '', status: 'active', tags: '',
    has_variants: false, variants: [], size_guide: '', product_type: 'new',
    wholesale_enabled: false, wholesale_min_qty: '', wholesale_tiers: [],
    warranty_period: '', warranty_type: 'seller',
    shipping_length: '', shipping_width: '', shipping_height: '',
    return_policy: '', stock_status_label: '', seller_response_time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [variantError, setVariantError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const successTimer = useRef(null);
  const errorTimer = useRef(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  // Quick edit state
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickEditField, setQuickEditField] = useState(null);
  const [quickEditValue, setQuickEditValue] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const allListings = await fetchAllListings();
      setListings(allListings);
    } catch (err) {
      console.error('Failed to load products:', err);
      setErrorMsg('Failed to load products. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered listings
  const filteredListings = listings.filter(l => {
    const matchSearch = !searchQuery || l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'All' || l.category === filterCategory;
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    const matchPage = filterPage === 'All' || (l.product_type || 'new') === filterPage;
    return matchSearch && matchCategory && matchStatus && matchPage;
  });

  const allFilteredSelected = filteredListings.length > 0 && filteredListings.every(l => selectedIds.includes(l.id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredListings.map(l => l.id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) return;
    }
    setProcessing(true);
    try {
      if (bulkAction === 'delete') {
        const result = await bulkDeleteListings(selectedIds);
        if (result.success) {
          setSuccessMsg(`${selectedIds.length} products deleted`);
          setSelectedIds([]);
          await loadData();
          successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          setErrorMsg('Bulk delete failed: ' + result.error);
          errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
        }
      } else {
        const result = await bulkUpdateListingStatus(selectedIds, bulkAction);
        if (result.success) {
          setSuccessMsg(`${selectedIds.length} products updated to "${bulkAction}"`);
          setSelectedIds([]);
          setBulkAction('');
          await loadData();
          successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          setErrorMsg('Bulk update failed: ' + result.error);
          errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const openAddModal = () => {
    const cat = 'Electronics';
    setEditingId(null);
    setForm({
      title: '', price: '', description: '', category: cat, condition: 'new', location: 'CBD',
      images: [], brand: '', model: '', color: '', weight: '',
      sku: generateSKU(cat), status: 'active', tags: '',
      has_variants: true, variants: [], size_guide: '', product_type: 'new',
      wholesale_enabled: false, wholesale_min_qty: '', wholesale_tiers: [],
      warranty_period: '', warranty_type: 'seller',
      shipping_length: '', shipping_width: '', shipping_height: '',
      return_policy: '', stock_status_label: '', seller_response_time: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (listing) => {
    setEditingId(listing.id);
    setForm({
      title: listing.title, price: String(listing.price), description: listing.description || '',
      category: listing.category || 'Electronics', condition: listing.condition || 'new',
      location: listing.location_city || 'CBD', images: listing.images || [],
      brand: listing.brand || '', model: listing.model || '',
      color: listing.color || '', weight: listing.weight || '', sku: listing.sku || '',
      status: listing.status || 'active', tags: listing.tags || '',
      has_variants: listing.has_variants || false,
      variants: listing.variants || [],
      size_guide: listing.size_guide || '',
      product_type: listing.product_type || 'new',
      wholesale_enabled: listing.wholesale_enabled || false,
      wholesale_min_qty: listing.wholesale_min_qty || '',
      wholesale_tiers: Array.isArray(listing.wholesale_tiers) ? listing.wholesale_tiers : [],
      warranty_period: listing.warranty_period || '',
      warranty_type: listing.warranty_type || 'seller',
      shipping_length: listing.shipping_length || '',
      shipping_width: listing.shipping_width || '',
      shipping_height: listing.shipping_height || '',
      return_policy: listing.return_policy || '',
      stock_status_label: listing.stock_status_label || '',
      seller_response_time: listing.seller_response_time || '',
    });
    setModalOpen(true);
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) { alert(`Maximum ${MAX_IMAGES} images allowed`); return; }
    const toUpload = files.slice(0, remaining);
    setImageUploading(true);
    const newUrls = [];
    let uploadError = '';
    for (const file of toUpload) {
      const result = await uploadImage(file);
      if (result.success) {
        newUrls.push(result.url);
      } else {
        uploadError = result.error || 'Upload failed';
      }
    }
    setForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
    setImageUploading(false);
    if (uploadError) {
      setErrorMsg(uploadError);
      errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
    }
    if (files.length > remaining) {
      setErrorMsg(`Only ${remaining} images added (max ${MAX_IMAGES})`);
      errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
    }
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const moveImage = (index, direction) => {
    const newImages = [...form.images];
    const target = index + direction;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
    setForm(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setVariantError('');

    // Validate variants — require at least one type with at least one value
    const variantRequiredCategory = VARIANT_REQUIRED_CATEGORIES.includes(form.category);
    if (form.has_variants || variantRequiredCategory) {
      const hasValidVariants = form.variants && typeof form.variants === 'object' && !Array.isArray(form.variants)
        ? (form.variants.types?.length > 0 && form.variants.types.some(t => t.values?.length > 0))
        : Array.isArray(form.variants) && form.variants.length > 0;
      if (!hasValidVariants) {
        const msg = variantRequiredCategory
          ? `The "${form.category}" category requires size/color variants. Please add at least one variant type with values (e.g. Size or Color) before saving.`
          : 'Please add at least one variant type with values (e.g. Size or Color) before saving.';
        setErrorMsg(msg);
        setVariantError(msg);
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      title: form.title, description: form.description, price: parseFloat(form.price) || 0,
      category: form.category, condition: form.condition, location: form.location,
      images: form.images, brand: form.brand,
      model: form.model, color: form.color, weight: form.weight, sku: form.sku,
      status: form.status, tags: form.tags,
      has_variants: form.has_variants,
      variants: form.variants,
      size_guide: form.size_guide,
      product_type: form.product_type,
      wholesale_enabled: form.wholesale_enabled,
      wholesale_min_qty: form.wholesale_enabled ? (parseInt(form.wholesale_min_qty) || null) : null,
      warranty_period: form.warranty_period || null,
      warranty_type: form.warranty_type || 'seller',
      shipping_length: form.shipping_length ? parseFloat(form.shipping_length) || null : null,
      shipping_width: form.shipping_width ? parseFloat(form.shipping_width) || null : null,
      shipping_height: form.shipping_height ? parseFloat(form.shipping_height) || null : null,
      return_policy: form.return_policy || null,
      stock_status_label: form.stock_status_label || null,
      seller_response_time: form.seller_response_time || null,
    };
    const result = editingId ? await updateListing(editingId, payload) : await createListing(payload);
    if (result.success) {
      // Save wholesale tiers if enabled
      if (form.wholesale_enabled && form.wholesale_tiers.length > 0) {
        const listingId = editingId || result.id;
        await saveWholesalePrices(listingId, form.wholesale_tiers);
      }
      setSuccessMsg(editingId ? 'Product updated!' : 'Product added!');
      setModalOpen(false);
      await loadData();
      successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg('Error: ' + result.error);
      errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      const result = await adminDeleteListing(deleteTarget.id);
      if (result.success) {
        setSuccessMsg('Product deleted!');
        setDeleteTarget(null);
        await loadData();
        successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Delete failed: ' + (result.error || 'Unknown error'));
        errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirmText !== 'DELETE ALL') return;
    setDeleteAllBusy(true);
    try {
      const allIds = listings.map(l => l.id);
      const result = await bulkDeleteListings(allIds);
      if (result.success) {
        setSuccessMsg(`All ${result.deletedCount || allIds.length} products deleted!`);
        setDeleteAllModal(false);
        setDeleteAllConfirmText('');
        setSelectedIds([]);
        await loadData();
        successTimer.current = setTimeout(() => setSuccessMsg(''), 3000);
      } else if (result.partial) {
        setSuccessMsg(`Partially deleted: ${result.deletedCount} of ${result.totalCount} products removed.`);
        setDeleteAllModal(false);
        setDeleteAllConfirmText('');
        setSelectedIds([]);
        await loadData();
        errorTimer.current = setTimeout(() => setErrorMsg('Some deletions failed: ' + (result.error || '')), 5000);
      } else {
        setErrorMsg('Delete all failed: ' + (result.error || 'Unknown error'));
        errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
      }
    } finally {
      setDeleteAllBusy(false);
    }
  };

  // Quick edit handlers
  const startQuickEdit = (id, field, value) => {
    setQuickEditId(id);
    setQuickEditField(field);
    setQuickEditValue(value);
  };

  const saveQuickEdit = async () => {
    if (!quickEditId || !quickEditField) return;
    const oldListing = listings.find(l => l.id === quickEditId);
    const oldValue = oldListing?.[quickEditField] ?? '';
    const updateData = { [quickEditField]: quickEditValue };
    if (quickEditField === 'price') updateData.price = parseFloat(quickEditValue) || 0;

    // Optimistic update
    setListings(prev => prev.map(l => l.id === quickEditId ? { ...l, [quickEditField]: quickEditValue } : l));
    setQuickEditId(null);
    setQuickEditField(null);
    setQuickEditValue('');

    const { error } = await supabase
      .from('listings')
      .update({ ...updateData })
      .eq('id', quickEditId);

    if (error) {
      console.error('Quick edit failed:', error);
      // Rollback
      setListings(prev => prev.map(l => l.id === quickEditId ? { ...l, [quickEditField]: oldValue } : l));
      setErrorMsg('Quick edit failed: ' + error.message);
      errorTimer.current = setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-500/20 text-sm font-bold">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="fixed top-28 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-red-500/20 text-sm font-bold">{errorMsg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Products</h2>
          <p className="text-sm text-zinc-400">{listings.length} total • {filteredListings.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          {listings.length > 0 && (
            <button onClick={() => { setDeleteAllModal(true); setDeleteAllConfirmText(''); }} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all">
              <Trash2 className="w-4 h-4" /> Delete All
            </button>
          )}
          <button onClick={openAddModal} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters + Bulk Actions */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text" placeholder="Search by name or SKU..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white appearance-none">
          <option value="All">All Categories</option>
          {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white appearance-none">
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
          <option value="archived">Archived</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-bold text-primary">{selectedIds.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white">
            <option value="">Bulk action...</option>
            <option value="active">Set Active</option>
            <option value="draft">Set Draft</option>
            <option value="sold">Set Sold</option>
            <option value="archived">Set Archived</option>
            <option value="inactive">Set Inactive</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleBulkAction} disabled={!bulkAction || processing}
            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-primary-hover flex items-center gap-2">
            {processing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : 'Apply'}
          </button>
          <button onClick={() => setSelectedIds([])} className="text-xs text-zinc-400 hover:text-zinc-700 ml-auto">Clear selection</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-primary">
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">Product</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden lg:table-cell">Variants</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-right text-xs font-bold text-zinc-400 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map(listing => (
                  <tr key={listing.id} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${selectedIds.includes(listing.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(listing.id)} className="text-zinc-400 hover:text-primary">
                        {selectedIds.includes(listing.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 relative">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-zinc-400" /></div>
                          )}
                          {listing.images?.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] font-bold px-1 rounded-tl-lg">
                              +{listing.images.length - 1}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          {quickEditId === listing.id && quickEditField === 'title' ? (
                            <input autoFocus value={quickEditValue} onChange={e => setQuickEditValue(e.target.value)}
                              onBlur={saveQuickEdit} onKeyDown={e => e.key === 'Enter' && saveQuickEdit()}
                              className="text-sm font-semibold text-white bg-zinc-800 border border-primary rounded px-1 py-0.5 w-full max-w-[200px]" />
                          ) : (
                            <p className="text-sm font-semibold text-white truncate max-w-[200px] cursor-pointer hover:text-primary"
                              onDoubleClick={() => startQuickEdit(listing.id, 'title', listing.title)} title="Double-click to edit">{listing.title}</p>
                          )}
                          {listing.sku && <p className="text-xs text-zinc-400 font-mono">{listing.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">{listing.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {listing.has_variants && listing.variants ? (
                        (function() {
                          // Support both old (array) and new ({types, items}) format
                          const types = listing.variants.types || [];
                          const items = listing.variants.items || (Array.isArray(listing.variants) ? listing.variants : []);
                          const hasItems = items.length > 0;
                          if (!hasItems) return <span className="text-[10px] text-zinc-500">No variants</span>;
                          return (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold text-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)]/10 px-2 py-0.5 rounded-lg inline-block w-fit">
                                {items.length} variant{items.length !== 1 ? 's' : ''}
                              </span>
                              {types.length === 0 ? (
                                /* Old format: show color swatches + size chips */
                                <>
                                  {(function() {
                                    const seen = new Set();
                                    const colors = items.filter(v => v.color && !seen.has(v.color) && seen.add(v.color));
                                    if (colors.length <= 1) return null;
                                    return (
                                      <div className="flex items-center gap-1">
                                        {colors.slice(0, 5).map((v, i) => (
                                          <div key={i} className="w-3 h-3 rounded-full border border-zinc-600"
                                            style={{ backgroundColor: v.color?.startsWith('#') ? v.color : '#ccc' }}
                                            title={v.colorName || v.color} />
                                        ))}
                                        {colors.length > 5 && <span className="text-[9px] text-zinc-400">+{colors.length - 5}</span>}
                                      </div>
                                    );
                                  })()}
                                  {(function() {
                                    const sizes = [...new Set(items.map(v => v.size).filter(Boolean))];
                                    if (sizes.length <= 1) return null;
                                    return (
                                      <div className="flex items-center gap-0.5 flex-wrap">
                                        {sizes.slice(0, 4).map((s, i) => (
                                          <span key={i} className="text-[8px] font-bold text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">{s}</span>
                                        ))}
                                        {sizes.length > 4 && <span className="text-[9px] text-zinc-400">+{sizes.length - 4}</span>}
                                      </div>
                                    );
                                  })()}
                                </>
                              ) : (
                                /* New format: show type badges */
                                <>
                                  {types.slice(0, 3).map(t => (
                                    <div key={t.id} className="flex items-center gap-1">
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase">{t.name}:</span>
                                      <span className="text-[9px] text-zinc-300 truncate max-w-[120px]">
                                        {t.values.slice(0, 3).map(v => v.label || v.value).join(', ')}
                                        {t.values.length > 3 ? ` +${t.values.length - 3}` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </>
                              )}
                              {/* Stock summary */}
                              {(() => {
                                const totalStock = items.reduce((s, v) => s + (v.quantity || 0), 0);
                                return (
                                  <span className={`text-[9px] font-bold ${totalStock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                                  </span>
                                );
                              })()}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-[10px] text-zinc-500">No variants</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {quickEditId === listing.id && quickEditField === 'price' ? (
                        <input autoFocus type="number" value={quickEditValue} onChange={e => setQuickEditValue(e.target.value)}
                          onBlur={saveQuickEdit} onKeyDown={e => e.key === 'Enter' && saveQuickEdit()}
                          className="text-sm font-bold text-white bg-zinc-800 border border-primary rounded px-1 py-0.5 w-24" />
                      ) : (
                        <span className="text-sm font-bold text-white cursor-pointer hover:text-primary"
                          onDoubleClick={() => startQuickEdit(listing.id, 'price', String(listing.price))} title="Double-click to edit">
                          {formatKES(listing.price)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        listing.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>{listing.status || 'active'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/listing/${listing.id}`} target="_blank" className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" title="View">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => openEditModal(listing)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-blue-500" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget({ id: listing.id, title: listing.title })} className="p-2 rounded-lg hover:bg-red-900/20 text-zinc-400 hover:text-red-500" title="Delete">
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
        <div className="bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 p-12 text-center">
          <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No products found</h3>
          <p className="text-sm text-zinc-400 mb-4">{searchQuery || filterCategory !== 'All' || filterStatus !== 'All' ? 'Try adjusting your filters' : 'Get started by adding your first product'}</p>
          {!searchQuery && filterCategory === 'All' && filterStatus === 'All' && (
            <button onClick={openAddModal} className="text-primary font-bold text-sm hover:underline">Add Product</button>
          )}
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Multi-Image Upload */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-300">Product Images * <span className="font-normal text-zinc-400">(up to {MAX_IMAGES}, drag to reorder)</span></label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group">
                      <div className="w-24 h-24 rounded-xl bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Cover</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1">
                        {i > 0 && (
                          <button type="button" onClick={() => moveImage(i, -1)} className="p-1 bg-white/80 rounded-lg hover:bg-white text-zinc-700" title="Move left">
                            <GripVertical className="w-3 h-3" />
                          </button>
                        )}
                        {i < form.images.length - 1 && (
                          <button type="button" onClick={() => moveImage(i, 1)} className="p-1 bg-white/80 rounded-lg hover:bg-white text-zinc-700" title="Move right">
                            <GripVertical className="w-3 h-3 rotate-180" />
                          </button>
                        )}
                        <button type="button" onClick={() => removeImage(i)} className="p-1 bg-red-500/80 rounded-lg hover:bg-red-500 text-white" title="Remove">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.images.length < MAX_IMAGES && (
                    <div className="w-24 h-24 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}>
                      {imageUploading ? (
                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                          <span className="text-[9px] text-zinc-400">Add</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                <p className="text-xs text-zinc-400 mt-2">JPG, PNG or WebP. Max 5MB each. First image is the cover.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Product Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. iPhone 13 Pro 256GB" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Price (KES) *</label>
                  <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="85000" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Category</label>
                  <select value={form.category} onChange={e => {
                    const newCat = e.target.value;
                    const needsVariants = VARIANT_REQUIRED_CATEGORIES.includes(newCat);
                    setForm(prev => ({
                      ...prev,
                      category: newCat,
                      // Auto-regenerate SKU when category changes (only for new products)
                      sku: editingId ? prev.sku : generateSKU(newCat),
                      // Auto-enable variants for apparel categories
                      has_variants: needsVariants ? true : prev.has_variants,
                    }));
                  }} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm appearance-none">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Condition</label>
                  <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm appearance-none">
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Listing Page</label>
                  <select value={form.product_type} onChange={e => setForm({...form, product_type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm appearance-none">
                    <option value="new">New Arrivals (Main Page)</option>
                    <option value="refurbished">Refurbished Deals</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">Refurbished items appear on /refurbished page only</p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm appearance-none">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="sold">Sold</option>
                    <option value="archived">Archived</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ── Brand / Model / Color ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Brand</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Apple" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Model</label>
                  <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. iPhone 13 Pro" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Color</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Pacific Blue" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Weight</label>
                  <input value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 0.5kg" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">SKU <span className="font-normal text-zinc-400">(auto-generated)</span></label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={form.sku}
                      onChange={e => setForm({...form, sku: e.target.value})}
                      placeholder="Auto-generated"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, sku: generateSKU(form.category) }))}
                      className="px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-primary hover:border-primary transition-colors text-sm font-bold"
                      title="Regenerate SKU"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Tags</label>
                  <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. iphone, apple, phone" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                </div>
              </div>

              {/* ── Warranty & Returns ── */}
              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-500" /> Warranty & Returns
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Warranty Period</label>
                    <input value={form.warranty_period} onChange={e => setForm({...form, warranty_period: e.target.value})} placeholder="e.g. 1 year, 6 months" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Warranty Type</label>
                    <select value={form.warranty_type} onChange={e => setForm({...form, warranty_type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm appearance-none">
                      <option value="seller">Seller Warranty</option>
                      <option value="manufacturer">Manufacturer Warranty</option>
                      <option value="no_warranty">No Warranty</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Return Policy</label>
                  <textarea rows="2" value={form.return_policy} onChange={e => setForm({...form, return_policy: e.target.value})} placeholder="e.g. 7-day return window for defective items. Item must be unused with original packaging." className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm resize-none" />
                </div>
              </div>

              {/* ── Shipping Dimensions ── */}
              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" /> Shipping Dimensions (cm)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Length</label>
                    <input type="number" min="0" step="0.1" value={form.shipping_length} onChange={e => setForm({...form, shipping_length: e.target.value})} placeholder="cm" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Width</label>
                    <input type="number" min="0" step="0.1" value={form.shipping_width} onChange={e => setForm({...form, shipping_width: e.target.value})} placeholder="cm" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Height</label>
                    <input type="number" min="0" step="0.1" value={form.shipping_height} onChange={e => setForm({...form, shipping_height: e.target.value})} placeholder="cm" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                  </div>
                </div>
              </div>

              {/* ── Additional Info ── */}
              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-sm font-bold text-zinc-300 mb-3">Additional Info</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Stock Status Label</label>
                    <input value={form.stock_status_label} onChange={e => setForm({...form, stock_status_label: e.target.value})} placeholder="e.g. Low stock, Pre-order" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-zinc-300">Seller Response Time</label>
                    <input value={form.seller_response_time} onChange={e => setForm({...form, seller_response_time: e.target.value})} placeholder="e.g. Within 1 hour" className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
                  </div>
                </div>
              </div>

              {/* Variant Manager — size/color variants for ALL products */}
              {form.variants.length === 0 && (
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-xl ${
                  VARIANT_REQUIRED_CATEGORIES.includes(form.category)
                    ? 'bg-red-900/30 border-red-700'
                    : 'bg-amber-900/20 border-amber-800'
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                    VARIANT_REQUIRED_CATEGORIES.includes(form.category) ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <p className={`text-xs ${
                    VARIANT_REQUIRED_CATEGORIES.includes(form.category) ? 'text-red-300 font-bold' : 'text-amber-400'
                  }`}>
                    {VARIANT_REQUIRED_CATEGORIES.includes(form.category)
                      ? `The "${form.category}" category requires size/color variants. Add at least one variant type (e.g. Size or Color) below.`
                      : 'Adding size/variant options helps customers pick exactly what they need. Add sizes in the Product Variants section below.'}
                  </p>
                </div>
              )}
              <VariantManager
                category={form.category}
                basePrice={form.price}
                baseSku={form.sku}
                value={form.variants}
                onChange={(variants) => {
                  const hasAny = variants && typeof variants === 'object' && !Array.isArray(variants)
                    ? variants.types?.length > 0 || variants.items?.length > 0
                    : Array.isArray(variants) && variants.length > 0;
                  setForm(prev => ({ ...prev, has_variants: hasAny, variants }));
                  setVariantError('');
                }}
                images={form.images}
              />
              {variantError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-xl mt-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-400">{variantError}</p>
                </div>
              )}

              {/* ── Wholesale Pricing ── */}
              <div className="border-t border-zinc-800 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <label className="text-sm font-bold text-zinc-300">Wholesale Pricing</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, wholesale_enabled: !prev.wholesale_enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.wholesale_enabled ? 'bg-emerald-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.wholesale_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {form.wholesale_enabled && (
                  <div className="space-y-4 pl-0">
                    <div>
                      <label className="block text-sm font-bold mb-1.5 text-zinc-300">Minimum Order Quantity</label>
                      <input
                        type="number" min="1"
                        value={form.wholesale_min_qty}
                        onChange={e => setForm({...form, wholesale_min_qty: e.target.value})}
                        placeholder="e.g. 10"
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm"
                      />
                      <p className="text-xs text-zinc-500 mt-1">Minimum quantity customers must order to qualify for wholesale pricing.</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-zinc-300">Wholesale Tiers <span className="font-normal text-zinc-400">(max 5)</span></label>
                        {form.wholesale_tiers.length < 5 && (
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              wholesale_tiers: [...prev.wholesale_tiers, { min_qty: '', price: '' }],
                            }))}
                            className="flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-400"
                          >
                            <Plus className="w-3 h-3" /> Add Tier
                          </button>
                        )}
                      </div>
                      {form.wholesale_tiers.length === 0 && (
                        <p className="text-xs text-zinc-500 italic">No wholesale tiers added. Add at least one tier to offer bulk pricing.</p>
                      )}
                      {form.wholesale_tiers.map((tier, i) => (
                        <div key={i} className="flex items-center gap-3 mb-2 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Min Qty</label>
                            <input
                              type="number" min="1"
                              value={tier.min_qty}
                              onChange={e => {
                                const newTiers = [...form.wholesale_tiers];
                                newTiers[i] = { ...newTiers[i], min_qty: e.target.value };
                                setForm(prev => ({ ...prev, wholesale_tiers: newTiers }));
                              }}
                              placeholder="10"
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-transparent focus:border-primary focus:outline-none text-white text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Price (KES)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={tier.price}
                              onChange={e => {
                                const newTiers = [...form.wholesale_tiers];
                                newTiers[i] = { ...newTiers[i], price: e.target.value };
                                setForm(prev => ({ ...prev, wholesale_tiers: newTiers }));
                              }}
                              placeholder="75000"
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-transparent focus:border-primary focus:outline-none text-white text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newTiers = form.wholesale_tiers.filter((_, idx) => idx !== i);
                              setForm(prev => ({ ...prev, wholesale_tiers: newTiers }));
                            }}
                            className="p-2 rounded-lg hover:bg-red-900/20 text-zinc-400 hover:text-red-500 mt-5"
                            title="Remove tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Size Guide */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Size Guide <span className="font-normal text-zinc-400">(optional)</span></label>
                <textarea rows="2" value={form.size_guide} onChange={e => setForm({...form, size_guide: e.target.value})} placeholder={'e.g. M: Chest 38-40 inch, Length 27-29 inch. Or paste a link to size chart.'} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm resize-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Description</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the product..." className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={submitting || form.images.length === 0} className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
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
          <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-zinc-400 mb-6">This will permanently delete "{deleteTarget.title}".</p>
            <div className="flex gap-3">
              <button onClick={() => !processing && setDeleteTarget(null)} disabled={processing} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={processing} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Products Confirmation */}
      {deleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleteAllBusy && setDeleteAllModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl border border-red-900/50 p-6 w-full max-w-md shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-600" /></div>
            <h3 className="text-lg font-bold text-white mb-2">Delete All Products</h3>
            <p className="text-sm text-zinc-400 mb-5">
              This will permanently delete ALL <span className="font-bold text-red-600">{listings.length}</span> products. This cannot be undone.
            </p>
            <div className="mb-5">
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 text-left">
                Type <span className="font-mono text-red-600">DELETE ALL</span> to confirm
              </label>
              <input
                type="text"
                value={deleteAllConfirmText}
                onChange={e => setDeleteAllConfirmText(e.target.value)}
                placeholder="DELETE ALL"
                disabled={deleteAllBusy}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-red-500 focus:outline-none text-white text-sm font-mono tracking-widest placeholder:text-zinc-400"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDeleteAllModal(false); setDeleteAllConfirmText(''); }} disabled={deleteAllBusy} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">Cancel</button>
              <button onClick={handleDeleteAll} disabled={deleteAllBusy || deleteAllConfirmText !== 'DELETE ALL'} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2">
                {deleteAllBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
