import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Users, Plus, Search, X, Loader2, Check, AlertTriangle, DollarSign, Activity, Link as LinkIcon } from 'lucide-react';
import { formatKES } from '../utils/constants';
const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('affiliates');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create affiliate modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', mpesa_number: '', password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Commission calculation
  const [calcYear, setCalcYear] = useState(new Date().getFullYear());
  const [calcMonth, setCalcMonth] = useState(new Date().getMonth() + 1);
  const [calculating, setCalculating] = useState(false);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: affData } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });
      setAffiliates(affData || []);

      const { data: commData } = await supabase
        .from('monthly_commissions')
        .select('*, affiliates(full_name, email, referral_code)')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(100);
      setCommissions(commData || []);

      const { data: logData } = await supabase
        .from('affiliate_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs(logData || []);
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
      // Get auth token from the current Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_BASE}/api/admin/affiliates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          mpesa_number: form.mpesa_number || null,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showSuccess(`Affiliate created! Referral code: ${data.referral_code}`);
      setModalOpen(false);
      setForm({ full_name: '', email: '', phone: '', mpesa_number: '', password: '' });
      await loadData();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (affiliate) => {
    const newStatus = affiliate.status === 'active' ? 'inactive' : 'active';
    try {
      await supabase.from('affiliates').update({ status: newStatus }).eq('id', affiliate.id);
      showSuccess(`Affiliate ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      await loadData();
    } catch (err) {
      showError(err.message);
    }
  };

  const calculateCommissions = async () => {
    setCalculating(true);
    try {
      const { data: affiliates } = await supabase
        .from('affiliates').select('*').eq('status', 'active');

      let calculated = 0;
      for (const aff of affiliates || []) {
        const monthStart = new Date(calcYear, calcMonth - 1, 1).toISOString();
        const monthEnd = new Date(calcYear, calcMonth, 1).toISOString();

        const { data: referredUsers } = await supabase
          .from('profiles').select('id').eq('referred_by', aff.id);
        const userIds = (referredUsers || []).map(u => u.id);
        if (userIds.length === 0) continue;

        const { data: orders } = await supabase
          .from('omix_orders')
          .select('id, total_amount')
          .in('user_id', userIds)
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd)
          .in('status', ['paid', 'completed', 'delivered']);

        if (!orders || orders.length === 0) continue;
        const totalSales = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
        const orderCount = orders.length;

        const yearStart = new Date(calcYear, 0, 1).toISOString();
        const { data: yearOrders } = await supabase
          .from('omix_orders').select('id')
          .in('user_id', userIds)
          .gte('created_at', yearStart)
          .lt('created_at', monthEnd)
          .in('status', ['paid', 'completed', 'delivered']);
        const yearlyCount = (yearOrders || []).length;
        const tier = yearlyCount >= 30 ? 'gold' : 'silver';
        const rate = tier === 'gold' ? 0.10 : 0.05;

        const commissionAmount = Math.round(totalSales * rate);

        // Upsert commission record
        const { data: existing } = await supabase
          .from('monthly_commissions')
          .select('id')
          .eq('affiliate_id', aff.id)
          .eq('year', calcYear)
          .eq('month', calcMonth)
          .single();

        if (existing) {
          await supabase
            .from('monthly_commissions')
            .update({
              total_sales: totalSales,
              qualified_order_count: orderCount,
              commission_rate: rate,
              commission_amount: commissionAmount,
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('monthly_commissions')
            .insert({
              affiliate_id: aff.id,
              year: calcYear,
              month: calcMonth,
              total_sales: totalSales,
              qualified_order_count: orderCount,
              commission_rate: rate,
              commission_amount: commissionAmount,
            });
        }

        // Log
        await supabase.from('affiliate_logs').insert({
          affiliate_id: aff.id,
          event_type: 'COMMISSION_CALCULATED',
          details: { year: calcYear, month: calcMonth, totalSales, orderCount, rate, commissionAmount },
        });

        calculated++;
      }
      showSuccess(`Commissions calculated for ${calculated} affiliates`);
      await loadData();
    } catch (err) {
      showError('Calculation error: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const approveCommission = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_BASE}/api/admin/commissions/${id}/approve`, {
        method: 'PATCH', headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showSuccess('Commission approved');
      await loadData();
    } catch (err) { showError(err.message); }
  };

  const markPaid = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_BASE}/api/admin/commissions/${id}/pay`, {
        method: 'PATCH', headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showSuccess('Commission marked as paid');
      await loadData();
    } catch (err) { showError(err.message); }
  };

  const filtered = affiliates.filter(a =>
    !searchQuery || a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'affiliates', label: 'Affiliates', count: affiliates.length },
    { id: 'commissions', label: 'Commissions', count: commissions.filter(c => c.status === 'calculated' || c.status === 'approved').length },
    { id: 'logs', label: 'Audit Logs', count: logs.length },
  ];

  return (
    <div className="space-y-6">
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
            <LinkIcon className="w-5 h-5" /> Affiliates
          </h2>
          <p className="text-sm text-zinc-400">{affiliates.length} affiliates</p>
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
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-white'
            }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="text" placeholder="Search affiliates..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : activeTab === 'affiliates' ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No affiliates found</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filtered.map(a => (
                <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{a.full_name}</p>
                    <p className="text-xs text-zinc-400">{a.email} • {a.referral_code}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-zinc-500">{a.mpesa_number || 'No M-Pesa'}</span>
                    <button onClick={() => toggleStatus(a)}
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
        </div>
      ) : activeTab === 'commissions' ? (
        <div>
          {/* Calculate button */}
          <div className="flex items-center gap-3 mb-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <span className="text-sm text-zinc-400">Calculate for:</span>
            <input type="number" value={calcYear} onChange={e => setCalcYear(parseInt(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm text-center" />
            <span className="text-zinc-400">/</span>
            <input type="number" value={calcMonth} onChange={e => setCalcMonth(parseInt(e.target.value))} min={1} max={12}
              className="w-16 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm text-center" />
            <button onClick={calculateCommissions} disabled={calculating}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2">
              {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              {calculating ? 'Calculating...' : 'Calculate'}
            </button>
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
                        <p className="font-bold text-white">{c.affiliates?.full_name || 'Affiliate'}</p>
                        <p className="text-xs text-zinc-400">{c.year}-{String(c.month).padStart(2, '0')} • {c.qualified_order_count} orders • {formatKES(c.total_sales)} sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">{formatKES(c.commission_amount)}</p>
                        <span className={`text-xs font-bold ${
                          c.status === 'calculated' ? 'text-yellow-400' :
                          c.status === 'approved' ? 'text-blue-400' :
                          c.status === 'paid' ? 'text-green-400' : 'text-red-400'
                        }`}>{c.status}</span>
                      </div>
                    </div>
                    {c.status === 'calculated' && (
                      <div className="flex gap-2">
                        <button onClick={() => approveCommission(c.id)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" /> Approve
                        </button>
                      </div>
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
      ) : activeTab === 'logs' ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">No audit logs yet</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {logs.map((log, i) => (
                <div key={log.id || i} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary">{log.event_type}</span>
                    <span className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.details && (
                    <pre className="text-xs text-zinc-400 mt-1 font-mono overflow-x-auto">
                      {JSON.stringify(log.details, null, 1)}
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
                  placeholder="e.g. 254712345678"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
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
