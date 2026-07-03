import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Users, Plus, Search, X, Loader2, Check, AlertTriangle, DollarSign, Activity, Link as LinkIcon, Filter, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { formatKES, AFFILIATE_CONFIG } from '../config/affiliate';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      token = stored?.currentSession?.access_token || stored?.access_token;
    } catch {}
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiGet(url) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers, credentials: 'include' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

async function apiPost(url, body = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    method: 'POST', headers, credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

async function apiPatch(url, body = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    method: 'PATCH', headers, credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('affiliates');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create affiliate modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', mpesa_number: '', password: '', status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  // Commission calculation
  const [calcPeriod, setCalcPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calculating, setCalculating] = useState(false);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [affData, commData, logData, payoutData] = await Promise.all([
        apiGet(`${API_BASE}/api/admin/affiliates`),
        apiGet(`${API_BASE}/api/admin/commissions?limit=100`),
        apiGet(`${API_BASE}/api/admin/audit-logs?limit=50`),
        apiGet(`${API_BASE}/api/admin/payouts?limit=50`),
      ]);
      setAffiliates(Array.isArray(affData) ? affData : []);
      setCommissions(Array.isArray(commData) ? commData : []);
      setLogs(Array.isArray(logData) ? logData : []);
      setPayouts(Array.isArray(payoutData) ? payoutData : []);
    } catch (err) {
      showError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiPost(`${API_BASE}/api/admin/affiliates`, form);
      showSuccess(`Affiliate created! Code: ${res.referral_code}`);
      setModalOpen(false);
      setForm({ full_name: '', email: '', phone: '', mpesa_number: '', password: '', status: 'active' });
      await loadData();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (affiliateId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await apiPatch(`${API_BASE}/api/admin/affiliates/${affiliateId}/status`, { status: newStatus });
      showSuccess(`Affiliate ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      await loadData();
    } catch (err) {
      showError(err.message);
    }
  };

  const calculateCommissions = async () => {
    setCalculating(true);
    try {
      const [year, month] = calcPeriod.split('-').map(Number);
      const res = await apiPost(`${API_BASE}/api/admin/commissions/calculate`, { year, month });
      showSuccess(`Commissions calculated for ${res.count || 0} affiliates`);
      await loadData();
    } catch (err) {
      showError('Calculation error: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const approveCommission = async (id) => {
    try {
      await apiPatch(`${API_BASE}/api/admin/commissions/${id}/approve`);
      showSuccess('Commission approved');
      await loadData();
    } catch (err) { showError(err.message); }
  };

  const markPaid = async (id) => {
    try {
      await apiPatch(`${API_BASE}/api/admin/commissions/${id}/pay`);
      showSuccess('Commission marked as paid');
      await loadData();
    } catch (err) { showError(err.message); }
  };

  const triggerPayout = async (payoutId) => {
    try {
      await apiPost(`${API_BASE}/api/admin/payouts/${payoutId}/process`);
      showSuccess('Payout processing triggered');
      await loadData();
    } catch (err) { showError(err.message); }
  };

  // Filters
  const filteredAffiliates = affiliates.filter(a => {
    if (searchQuery && !a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.email?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (tierFilter !== 'all' && a.tier !== tierFilter) return false;
    return true;
  });

  const pendingCommissions = commissions.filter(c =>
    c.status === 'calculated' || c.status === 'pending'
  );
  const approvedPending = commissions.filter(c => c.status === 'approved');
  const paidCommissions = commissions.filter(c => c.status === 'paid');

  const pendingPayouts = payouts.filter(p => p.status === 'pending');

  const tabs = [
    { id: 'affiliates', label: 'Affiliates', count: affiliates.length },
    { id: 'commissions', label: 'Commissions', count: pendingCommissions.length, badge: 'text-amber-400' },
    { id: 'payouts', label: 'Payouts', count: pendingPayouts.length, badge: 'text-green-400' },
    { id: 'logs', label: 'Audit Logs' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="fixed top-28 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold">{errorMsg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" /> Affiliates
          </h2>
          <p className="text-sm text-zinc-400">{affiliates.length} registered affiliates</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-hover transition-all">
          <Plus className="w-4 h-4" /> Create Affiliate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-white'
            }`}>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs ${tab.badge || 'text-zinc-500'}`}>({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filters (affiliates tab) */}
      {activeTab === 'affiliates' && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search by name, email, or code..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white" />
          </div>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white">
            <option value="all">All Tiers</option>
            {AFFILIATE_CONFIG.TIERS.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : activeTab === 'affiliates' ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {filteredAffiliates.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No affiliates found</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredAffiliates.map(a => (
                <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white truncate">{a.full_name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        a.tier === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                        a.tier === 'silver' ? 'bg-zinc-600/20 text-zinc-300' :
                        'bg-zinc-600/20 text-zinc-300'
                      }`}>
                        {a.tier || 'silver'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {a.email} | {a.referral_code}
                      {a.mpesa_number && ` | M-Pesa: ${a.mpesa_number}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-zinc-500">{formatKES(a.total_earned || 0)} earned</span>
                    <button onClick={() => toggleStatus(a.id, a.status)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        a.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                      {a.status}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-500">
            {filteredAffiliates.length} of {affiliates.length} affiliates
          </div>
        </div>
      ) : activeTab === 'commissions' ? (
        <div>
          {/* Calculate controls */}
          <div className="flex items-center gap-3 mb-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <span className="text-sm text-zinc-400">Calculate for:</span>
            <input type="month" value={calcPeriod} onChange={e => setCalcPeriod(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm" />
            <button onClick={calculateCommissions} disabled={calculating}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2">
              {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              {calculating ? 'Calculating...' : 'Calculate'}
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 text-center">
              <p className="text-lg font-black text-yellow-400">{pendingCommissions.length}</p>
              <p className="text-xs text-zinc-400">Pending</p>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 text-center">
              <p className="text-lg font-black text-blue-400">{approvedPending.length}</p>
              <p className="text-xs text-zinc-400">Approved</p>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 text-center">
              <p className="text-lg font-black text-green-400">{paidCommissions.length}</p>
              <p className="text-xs text-zinc-400">Paid</p>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {commissions.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">No commission records</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {commissions.map(c => (
                  <div key={c.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-white">{c.affiliate_name || c.affiliates?.full_name || 'Affiliate'}</p>
                        <p className="text-xs text-zinc-400">
                          {c.year}-{String(c.month).padStart(2, '0')} | {c.qualified_order_count || 0} orders | {formatKES(c.total_sales || 0)} sales
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">{formatKES(c.commission_amount)}</p>
                        <span className={`text-xs font-bold ${
                          c.status === 'calculated' ? 'text-yellow-400' :
                          c.status === 'pending' ? 'text-yellow-400' :
                          c.status === 'approved' ? 'text-blue-400' :
                          c.status === 'paid' ? 'text-green-400' : 'text-red-400'
                        }`}>{c.status}</span>
                      </div>
                    </div>
                    {c.status === 'calculated' && (
                      <button onClick={() => approveCommission(c.id)}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Approve Commission
                      </button>
                    )}
                    {c.status === 'approved' && (
                      <button onClick={() => markPaid(c.id)}
                        className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1">
                        <DollarSign className="w-3 h-3" /> Mark as Paid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'payouts' ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {payouts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">No payout requests yet</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {payouts.map(p => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-white">{p.affiliate_name || p.affiliates?.full_name || 'Affiliate'}</p>
                      <p className="text-xs text-zinc-400">{p.mpesa_number} | {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{formatKES(p.amount)}</p>
                      <span className={`text-xs font-bold ${
                        p.status === 'pending' ? 'text-yellow-400' :
                        p.status === 'processing' ? 'text-blue-400' :
                        p.status === 'paid' ? 'text-green-400' : 'text-red-400'
                      }`}>{p.status}</span>
                    </div>
                  </div>
                  {p.status === 'pending' && (
                    <button onClick={() => triggerPayout(p.id)}
                      className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" /> Process Payout (M-Pesa)
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'logs' ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">No audit logs yet</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {logs.map((log, i) => (
                <div key={log.id || i} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-primary" />
                      <span className="text-xs font-mono text-primary">{log.event_type}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.details && (
                    <pre className="text-xs text-zinc-400 mt-1 font-mono overflow-x-auto whitespace-pre-wrap">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 1)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Create Affiliate</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Full Name *</label>
                <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">M-Pesa Number (payout)</label>
                <input value={form.mpesa_number} onChange={e => setForm({...form, mpesa_number: e.target.value})}
                  placeholder="254712345678"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Password *</label>
                <input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Generate and share securely"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
              </div>
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Send credentials to the affiliate manually after creation.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? 'Creating...' : 'Create Affiliate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
