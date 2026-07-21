import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, Zap, AlertTriangle, Clock,
  Calendar, Image, ToggleLeft, ToggleRight, ExternalLink, Search
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { GooeyLoader } from '@/components/ui/loader-10';

export default function AdminDeals() {
  const [deals, setDeals] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState(null);
  const [listingSearch, setListingSearch] = useState('');
  const [expandedDeal, setExpandedDeal] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    banner_url: '',
    start_at: '',
    end_at: '',
    is_active: true,
  });

  const [itemForm, setItemForm] = useState({
    listing_id: '',
    deal_price: '',
    discount_percent: '',
    max_quantity: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d, error: e } = await supabase
        .from('flash_deals')
        .select('*')
        .order('created_at', { ascending: false });
      if (e) throw e;

      // Fetch items for all deals
      const dealIds = (d || []).map(x => x.id);
      const itemsByDeal = {};
      if (dealIds.length > 0) {
        const { data: items } = await supabase
          .from('deal_items')
          .select('*')
          .in('deal_id', dealIds);
        for (const item of items || []) {
          if (!itemsByDeal[item.deal_id]) itemsByDeal[item.deal_id] = [];
          itemsByDeal[item.deal_id].push(item);
        }
      }
      for (const deal of d || []) {
        deal.items = itemsByDeal[deal.id] || [];
      }
      setDeals(d || []);
    } catch (err) {
      console.error('Error loading deals:', err);
    }
    setLoading(false);
  }, []);

  const loadListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, images, status')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error) setListings(data || []);
    } catch (err) {
      console.warn('Failed to load listings:', err.message);
    }
  }, []);

  useEffect(() => { loadData(); loadListings(); }, [loadData, loadListings]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      banner_url: '',
      start_at: '',
      end_at: '',
      is_active: true,
    });
    setEditingDealId(null);
  };

  const openCreate = () => {
    resetForm();
    setDealModalOpen(true);
  };

  const openEdit = (deal) => {
    setForm({
      title: deal.title,
      description: deal.description || '',
      banner_url: deal.banner_url || '',
      start_at: deal.start_at ? deal.start_at.slice(0, 16) : '',
      end_at: deal.end_at ? deal.end_at.slice(0, 16) : '',
      is_active: deal.is_active,
    });
    setEditingDealId(deal.id);
    setDealModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      banner_url: form.banner_url.trim() || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      is_active: form.is_active,
    };

    try {
      if (editingDealId) {
        const { error } = await supabase.from('flash_deals').update(payload).eq('id', editingDealId);
        if (error) throw error;
        setSuccessMsg('Deal updated!');
      } else {
        const { error } = await supabase.from('flash_deals').insert(payload);
        if (error) throw error;
        setSuccessMsg('Deal created!');
      }
      setDealModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('deal_items').delete().eq('deal_id', id);
    const { error } = await supabase.from('flash_deals').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    setDeleteTarget(null);
    loadData();
  };

  const toggleActive = async (id, current) => {
    await supabase.from('flash_deals').update({ is_active: !current }).eq('id', id);
    loadData();
  };

  const openAddItem = (deal) => {
    setSelectedDeal(deal);
    setItemForm({ listing_id: '', deal_price: '', discount_percent: '', max_quantity: '' });
    setItemModalOpen(true);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('deal_items').insert({
        deal_id: selectedDeal.id,
        listing_id: itemForm.listing_id,
        deal_price: itemForm.deal_price ? Number(itemForm.deal_price) : null,
        discount_percent: itemForm.discount_percent ? Number(itemForm.discount_percent) : null,
        max_quantity: itemForm.max_quantity ? Number(itemForm.max_quantity) : 0,
      });
      if (error) throw error;
      setItemModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    const { error } = await supabase.from('deal_items').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    setDeleteItemTarget(null);
    loadData();
  };

  const isDealActive = (deal) => {
    const now = new Date();
    return deal.is_active && new Date(deal.start_at) <= now && new Date(deal.end_at) >= now;
  };

  const isDealUpcoming = (deal) => {
    return deal.is_active && new Date(deal.start_at) > new Date();
  };

  const isDealEnded = (deal) => {
    return new Date(deal.end_at) < new Date();
  };

  const getStatusBadge = (deal) => {
    if (isDealActive(deal)) return { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
    if (isDealUpcoming(deal)) return { label: 'Upcoming', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (isDealEnded(deal)) return { label: 'Ended', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
    return { label: deal.is_active ? 'Active' : 'Inactive', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  };

  const filteredListings = listings.filter(l =>
    !listingSearch || l.title?.toLowerCase().includes(listingSearch.toLowerCase())
  ).slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Flash Deals</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Create and manage time-limited flash deals
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#1a5632' }}
        >
          <Plus className="w-4 h-4" />
          New Flash Deal
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium border bg-green-950/30 border-green-500/30 text-green-400">
          <Zap className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Deals List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <GooeyLoader />
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800">
          <Zap className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">No flash deals yet</p>
          <p className="text-xs text-zinc-500 mt-1">Create your first flash deal to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const status = getStatusBadge(deal);
            const isExpanded = expandedDeal === deal.id;

            return (
              <div
                key={deal.id}
                className="fusion-recessed-card overflow-hidden transition-all"
              >
                {/* Deal Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white truncate">{deal.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {deal.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{deal.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(deal.start_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-zinc-700">→</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(deal.end_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{deal.items?.length || 0} item{(deal.items?.length || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(deal.id, deal.is_active)}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        title={deal.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {deal.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-zinc-500" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(deal)}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(deal)}
                        className="p-2 rounded-lg hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <button
                        onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Toggle items"
                      >
                        <span className={`text-xs font-bold text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Section (expandable) */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-zinc-300">Deal Items</h4>
                      <button
                        onClick={() => openAddItem(deal)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        style={{ color: 'var(--seasonal-primary, #1a5632)' }}
                      >
                        <Plus className="w-3 h-3" />
                        Add Item
                      </button>
                    </div>

                    {(!deal.items || deal.items.length === 0) ? (
                      <p className="text-xs text-zinc-500 py-2">No items added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {deal.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-800"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-300 truncate">
                                Listing: {item.listing_id}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-zinc-500">
                                {item.deal_price && <span>Price: KES {Number(item.deal_price).toLocaleString()}</span>}
                                {item.discount_percent && <span>Discount: {item.discount_percent}% off</span>}
                                {item.max_quantity > 0 && <span>Max: {item.max_quantity}</span>}
                                {item.max_quantity === 0 && <span>Unlimited</span>}
                                <span>Sold: {item.sold_quantity || 0}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setDeleteItemTarget(item)}
                              className="p-1.5 rounded-lg hover:bg-red-900/20 transition-colors shrink-0"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Deal Modal */}
      {dealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setDealModalOpen(false); resetForm(); }} />
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 shadow-2xl overflow-hidden border border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingDealId ? 'Edit Flash Deal' : 'New Flash Deal'}
              </h3>
              <button onClick={() => { setDealModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-zinc-800">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Weekend Mega Sale"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this deal"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Banner Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.banner_url}
                    onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700">
                    <Image className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
              </div>

              {/* Start / End */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Start At *</label>
                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1.5">End At *</label>
                  <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-300">Active</p>
                  <p className="text-xs text-zinc-500">Deal is visible on the storefront when active</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                >
                  {form.is_active ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-zinc-500" />
                  )}
                </button>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setDealModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1a5632' }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingDealId ? (
                    'Update Deal'
                  ) : (
                    'Create Deal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setItemModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 shadow-2xl overflow-hidden border border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                Add Item to Deal
              </h3>
              <button onClick={() => setItemModalOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              {/* Listing Search */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Select Product *</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-zinc-800 rounded-xl p-1">
                  {filteredListings.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-3 text-center">No products found</p>
                  ) : (
                    filteredListings.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setItemForm({ ...itemForm, listing_id: l.id });
                          setListingSearch('');
                        }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors ${
                          itemForm.listing_id === l.id
                            ? 'bg-primary/20 text-white'
                            : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
                        style={itemForm.listing_id === l.id ? { backgroundColor: 'rgba(26,86,50,0.2)' } : {}}
                      >
                        {l.images?.[0] && (
                          <img src={l.images[0]} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                        )}
                        <span className="truncate flex-1">{l.title}</span>
                        <span className="shrink-0 font-mono">
                          KES {Number(l.price).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {itemForm.listing_id && (
                  <p className="text-[10px] text-green-500 mt-1">
                    Selected: {listings.find(l => l.id === itemForm.listing_id)?.title || 'Unknown'}
                  </p>
                )}
              </div>

              {/* Deal Price */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Deal Price (KES) <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.deal_price}
                  onChange={(e) => setItemForm({ ...itemForm, deal_price: e.target.value })}
                  placeholder="Leave empty for default price"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Discount Percent */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Discount % <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={itemForm.discount_percent}
                  onChange={(e) => setItemForm({ ...itemForm, discount_percent: e.target.value })}
                  placeholder="e.g. 20"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Max Quantity */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Max Quantity <span className="font-normal text-zinc-500">(0 = unlimited)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.max_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, max_quantity: e.target.value })}
                  placeholder="0 for unlimited"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !itemForm.listing_id}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1a5632' }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Add to Deal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Deal Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 shadow-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Flash Deal</h3>
                <p className="text-xs text-zinc-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              Are you sure you want to delete <strong className="text-white">{deleteTarget.title}</strong>?
              All associated deal items will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation */}
      {deleteItemTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteItemTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 shadow-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Deal Item</h3>
                <p className="text-xs text-zinc-500">This item will be removed from the deal</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              Are you sure you want to remove this item from the deal?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteItemTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteItemTarget.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
