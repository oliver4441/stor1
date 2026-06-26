import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Tag, Copy, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'free_delivery',
    discount_value: 0,
    max_uses: '',
    expires_at: '',
    is_active: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading promo codes:', error);
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_type: 'free_delivery',
      discount_value: 0,
      max_uses: '',
      expires_at: '',
      is_active: true,
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (code) => {
    setForm({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type || 'free_delivery',
      discount_value: code.discount_value || 0,
      max_uses: code.max_uses ? String(code.max_uses) : '',
      expires_at: code.expires_at ? code.expires_at.slice(0, 16) : '',
      is_active: code.is_active,
    });
    setEditingId(code.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_type === 'free_delivery' ? 0 : Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('promo_codes').update(payload).eq('id', editingId);
        if (error) throw error;
        setSuccessMsg('Promo code updated!');
      } else {
        const { error } = await supabase.from('promo_codes').insert(payload);
        if (error) throw error;
        setSuccessMsg('Promo code created!');
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) {
      alert('Error deleting: ' + error.message);
      return;
    }
    setDeleteTarget(null);
    loadData();
  };

  const toggleActive = async (id, current) => {
    await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id);
    loadData();
  };

  const copyCode = (codeStr, id) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();
  const isExhausted = (c) => c.max_uses && (c.current_uses || c.times_used || 0) >= c.max_uses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Promo Codes</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Create and manage discount codes for your customers
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#ff385c' }}
        >
          <Plus className="w-4 h-4" />
          New Promo Code
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium border"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Codes List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#ff385c' }} />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: '#e4e4e7' }}>
          <Tag className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">No promo codes yet</p>
          <p className="text-xs text-zinc-400 mt-1">Create your first promo code to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => {
            const expired = isExpired(c.expires_at);
            const exhausted = isExhausted(c);
            const inactive = !c.is_active || expired || exhausted;

            return (
              <div
                key={c.id}
                className="rounded-2xl border p-4 transition-all"
                style={{
                  borderColor: inactive ? '#e4e4e7' : '#e4e4e7',
                  backgroundColor: inactive ? '#fafafa' : '#ffffff',
                  opacity: inactive ? 0.7 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold px-2 py-0.5 rounded-lg tracking-wider"
                        style={{ backgroundColor: '#fef2f2', color: '#ff385c' }}>
                        {c.code}
                      </code>
                      <button
                        onClick={() => copyCode(c.code, c.id)}
                        className="p-1 rounded-md hover:bg-zinc-100 transition-colors"
                        title="Copy code"
                      >
                        {copiedId === c.id ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>

                      {/* Status badges */}
                      {c.discount_type === 'free_delivery' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          FREE DELIVERY
                        </span>
                      )}
                      {expired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          EXPIRED
                        </span>
                      )}
                      {exhausted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          EXHAUSTED
                        </span>
                      )}
                      {!c.is_active && !expired && !exhausted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    {c.description && (
                      <p className="text-xs text-zinc-500 mt-1">{c.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      {c.max_uses && (
                        <span>Used {c.current_uses || c.times_used || 0} / {c.max_uses} times</span>
                      )}
                      {!c.max_uses && (
                        <span>Used {c.current_uses || c.times_used || 0} times (unlimited)</span>
                      )}
                      {c.expires_at && (
                        <span>Expires {new Date(c.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                      {!c.expires_at && (
                        <span>No expiry</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(c.id, c.is_active)}
                      className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                      title={c.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {c.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-zinc-500" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); resetForm(); }} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#e4e4e7' }}>
              <h3 className="text-lg font-bold text-zinc-900">
                {editingId ? 'Edit Promo Code' : 'New Promo Code'}
              </h3>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-zinc-100">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FREESHIP50"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono tracking-wider uppercase"
                  style={{ borderColor: '#e4e4e7' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Free delivery for new customers"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: '#e4e4e7' }}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Discount Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: '#e4e4e7' }}
                >
                  <option value="free_delivery">Free Delivery</option>
                  <option value="percentage">Percentage Off (%)</option>
                  <option value="fixed">Fixed Amount Off (KES)</option>
                </select>
              </div>

              {/* Discount Value (hidden for free_delivery) */}
              {form.discount_type !== 'free_delivery' && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    {form.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount (KES)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? '10' : '500'}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: '#e4e4e7' }}
                  />
                </div>
              )}

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Usage Limit <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: '#e4e4e7' }}
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Expiry Date <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: '#e4e4e7' }}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-700">Active</p>
                  <p className="text-xs text-zinc-400">Promo code can be used when active</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className="transition-colors"
                >
                  {form.is_active ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-zinc-400" />
                  )}
                </button>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                  style={{ borderColor: '#e4e4e7' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#ff385c' }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    'Update Code'
                  ) : (
                    'Create Code'
                  )}
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
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Delete Promo Code</h3>
                <p className="text-xs text-zinc-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 mb-5">
              Are you sure you want to delete <code className="font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800">{deleteTarget.code}</code>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                style={{ borderColor: '#e4e4e7' }}
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
    </div>
  );
}
