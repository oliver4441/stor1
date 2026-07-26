import { useState, useEffect, useCallback } from 'react';
import { Package, Percent, Plus, Edit3, Trash2, X, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { getActiveBundles, createBundle, isAdmin } from '../utils/api';
import { formatKES } from '../utils/constants';
import { GooeyLoader } from '@/components/ui/loader-10';

const API_URL = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

export default function AdminBundles() {
  const [user, setUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    discount_percent: 0,
    product_ids: [],
    start_at: '',
    end_at: '',
    image_url: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const admin = await isAdmin();
        setIsAdminUser(admin);
        if (admin) loadBundles();
        else setLoading(false);
      } else {
        setLoading(false);
      }
    })();
  }, []);

  const loadBundles = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await getActiveBundles();
      if (result.success) {
        setBundles(result.bundles || []);
      } else {
        // Fallback: try to fetch directly
        const { data, error } = await supabase
          .from('bundles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBundles(data || []);
      }
    } catch (err) {
      console.error('Failed to load bundles:', err);
      setErrorMsg('Failed to load bundles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const sanitized = query.replace(/[^a-zA-Z0-9\s\-.]/g, '').trim();
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, images')
        .eq('status', 'active')
        .or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Product search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(timer);
  }, [productSearch, searchProducts]);

  const addProduct = (product) => {
    if (!form.product_ids.find(p => p.id === product.id)) {
      setForm(f => ({ ...f, product_ids: [...f.product_ids, product] }));
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const removeProduct = (productId) => {
    setForm(f => ({ ...f, product_ids: f.product_ids.filter(p => p.id !== productId) }));
  };

  const openCreateForm = () => {
    setEditingBundle(null);
    setForm({
      name: '',
      description: '',
      discount_percent: 0,
      product_ids: [],
      start_at: '',
      end_at: '',
      image_url: '',
      is_active: true,
    });
    setErrorMsg('');
    setShowForm(true);
  };

  const openEditForm = (bundle) => {
    setEditingBundle(bundle);
    setForm({
      name: bundle.name || '',
      description: bundle.description || '',
      discount_percent: bundle.discount_percent || 0,
      product_ids: bundle.products || bundle.items || bundle.product_ids || [],
      start_at: bundle.start_at ? bundle.start_at.slice(0, 16) : '',
      end_at: bundle.end_at ? bundle.end_at.slice(0, 16) : '',
      image_url: bundle.image_url || bundle.banner_url || '',
      is_active: bundle.is_active ?? true,
    });
    setErrorMsg('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBundle(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.name.trim()) {
      setErrorMsg('Bundle name is required.');
      return;
    }
    if (form.product_ids.length === 0) {
      setErrorMsg('Please add at least one product to the bundle.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        discount_percent: Number(form.discount_percent),
        product_ids: form.product_ids.map(p => p.id || p),
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
      };

      if (editingBundle) {
        // Update existing bundle via API
        const token = (await supabase.auth.getSession()).data?.session?.access_token;
        const resp = await fetch(`${API_URL}/api/bundles/${editingBundle.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const result = await resp.json();

        if (result.success) {
          setSuccessMsg('Bundle updated successfully!');
          loadBundles();
          closeForm();
        } else {
          setErrorMsg(result.error || 'Failed to update bundle.');
        }
      } else {
        const result = await createBundle(payload);
        if (result.success) {
          setSuccessMsg('Bundle created successfully!');
          loadBundles();
          closeForm();
        } else {
          setErrorMsg(result.error || 'Failed to create bundle.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBundleStatus = async (bundle) => {
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch(`${API_URL}/api/bundles/${bundle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !bundle.is_active }),
      });
      const result = await resp.json();

      if (result.success) {
        setBundles(prev =>
          prev.map(b => b.id === bundle.id ? { ...b, is_active: !b.is_active } : b)
        );
        setSuccessMsg(`Bundle ${bundle.is_active ? 'deactivated' : 'activated'}.`);
      } else {
        setErrorMsg(result.error || 'Failed to toggle status.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle status.');
    }
  };

  const deleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const resp = await fetch(`${API_URL}/api/bundles/${bundleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await resp.json();

      if (result.success) {
        setBundles(prev => prev.filter(b => b.id !== bundleId));
        setSuccessMsg('Bundle deleted.');
      } else {
        setErrorMsg(result.error || 'Failed to delete bundle.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete bundle.');
    }
  };

  // Self-clear messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <GooeyLoader />
      </div>
    );
  }

  if (!user || !isAdminUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-[#4A5771] mb-8">You need admin privileges to manage bundles.</p>
        <a href="/" className="bg-[#71717a] text-white font-bold px-8 py-3 rounded-xl inline-block">Go Home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#28303F]">
              <Package className="w-7 h-7 text-[#71717a]" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Product Bundles</h1>
              <p className="text-sm text-[#4A5771]">Create and manage discounted product bundles</p>
            </div>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#71717a] text-white font-bold text-sm transition-all hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Bundle
          </button>
        </div>

        {/* Flash messages */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-900/20 border border-emerald-800 text-emerald-400 text-sm font-medium">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Bundles List */}
        {bundles.length === 0 && !showForm ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-[#4A5771] font-medium mb-2">No bundles yet</p>
            <p className="text-xs text-[#4A5771] mb-6">Create your first product bundle to offer discounts on grouped items.</p>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#71717a] text-white font-bold text-sm transition-all hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Create Bundle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bundles.map((bundle) => {
              const products = bundle.products || bundle.items || [];
              const productCount = Array.isArray(products) ? products.length : 0;

              return (
                <div
                  key={bundle.id}
                  className={`fusion-recessed-card p-5 hover:border-[#353F54] transition-colors ${
                    !bundle.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white truncate">{bundle.name}</h3>
                        {bundle.discount_percent > 0 && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 text-[10px] font-bold">
                            <Percent className="w-3 h-3" />
                            {bundle.discount_percent}% OFF
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bundle.is_active
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {bundle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {bundle.description && (
                        <p className="text-sm text-[#8E9BB5] line-clamp-2 mb-2">{bundle.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4A5771]">
                        <span>{productCount} item{productCount !== 1 ? 's' : ''}</span>
                        {bundle.start_at && (
                          <span>Start: {new Date(bundle.start_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        )}
                        {bundle.end_at && (
                          <span>End: {new Date(bundle.end_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>

                      {/* Product preview chips */}
                      {products.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {products.slice(0, 5).map((p) => {
                            const pid = p.id || p;
                            const pname = p.title || p.name || pid;
                            return (
                              <span key={pid} className="px-2 py-0.5 rounded-md bg-[#28303F] text-[10px] text-[#8E9BB5] truncate max-w-[120px]">
                                {typeof pname === 'string' ? pname : pid?.slice(0, 8)}
                              </span>
                            );
                          })}
                          {products.length > 5 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#28303F] text-[10px] text-[#4A5771]">
                              +{products.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleBundleStatus(bundle)}
                        className="p-2 rounded-lg bg-[#28303F] text-[#4A5771] hover:text-white hover:bg-[#353F54] transition-all"
                        title={bundle.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {bundle.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditForm(bundle)}
                        className="p-2 rounded-lg bg-[#28303F] text-[#4A5771] hover:text-white hover:bg-[#353F54] transition-all"
                        title="Edit bundle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBundle(bundle.id)}
                        className="p-2 rounded-lg bg-[#28303F] text-[#4A5771] hover:text-red-400 hover:bg-red-900/20 transition-all"
                        title="Delete bundle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create/Edit Bundle Modal ── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/70">
            <div className="w-full max-w-2xl mx-4 fusion-recessed-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">
                  {editingBundle ? 'Edit Bundle' : 'Create Bundle'}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-2 rounded-lg bg-[#28303F] text-[#4A5771] hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Bundle Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Home Office Starter Kit"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771]"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what this bundle includes..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Discount %</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5771]" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.discount_percent}
                        onChange={(e) => setForm(f => ({ ...f, discount_percent: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Image URL (optional)</label>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.start_at}
                      onChange={(e) => setForm(f => ({ ...f, start_at: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={form.end_at}
                      onChange={(e) => setForm(f => ({ ...f, end_at: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-[#353F54] bg-[#1E2A3D] text-[#71717a] focus:ring-[#71717a]"
                      />
                      <span className="text-sm text-[#8E9BB5]">Active immediately</span>
                    </label>
                  </div>

                  {/* Product picker */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Products in Bundle *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5771]" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by title..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771]"
                      />
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-1 rounded-lg bg-[#1E2A3D] border border-[#353F54] max-h-40 overflow-y-auto">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#28303F] transition-colors text-left"
                          >
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover bg-[#28303F]" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-[#28303F] flex items-center justify-center">
                                <Package className="w-4 h-4 text-[#4A5771]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{product.title}</p>
                              <p className="text-[10px] text-[#4A5771]">{formatKES(product.price)}</p>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-[#71717a] flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searching && (
                      <div className="mt-1 text-xs text-[#4A5771]">Searching...</div>
                    )}

                    {/* Selected products */}
                    {form.product_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {form.product_ids.map((product) => {
                          const pid = product.id || product;
                          const pname = product.title || product.name || pid;
                          return (
                            <span
                              key={pid}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#28303F] border border-[#353F54] text-xs text-white"
                            >
                              {typeof pname === 'string' && pname.length > 25 ? pname.slice(0, 25) + '...' : pname}
                              <button
                                type="button"
                                onClick={() => removeProduct(pid)}
                                className="text-[#4A5771] hover:text-red-400 transition-colors ml-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-2.5 rounded-xl bg-[#28303F] text-[#8E9BB5] font-bold text-sm hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#71717a] text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                    {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
