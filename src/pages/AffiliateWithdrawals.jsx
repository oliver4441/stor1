import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getAffiliateProfile, requestPayout, getPayoutHistory } from '../utils/affiliate_api';
import { AFFILIATE_CONFIG, formatKES } from '../config/affiliate';
import { Wallet, Send, Loader2, CheckCircle, X, Copy, ExternalLink, ChevronDown, ChevronUp, Smartphone, Building2, CreditCard, Award, Share2, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PAYOUT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', placeholder: '254712345678' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', placeholder: 'Account number' },
  { id: 'airtel', label: 'Airtel Money', icon: CreditCard, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', placeholder: '254712345678' },
];

function MethodBadge({ method }) {
  const m = PAYOUT_METHODS.find(p => p.id === method);
  if (!m) return <span className="text-xs text-zinc-400">{method}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${m.bg} ${m.color}`}>
      <m.icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

export default function AffiliateWithdrawals() {
  const [affiliate, setAffiliate] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payout form
  const [amount, setAmount] = useState(AFFILIATE_CONFIG.MIN_PAYOUT);
  const [method, setMethod] = useState('mpesa');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState('');

  // History expand
  const [showHistory, setShowHistory] = useState(false);
  const location = useLocation();

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setError('Not authenticated'); setLoading(false); return; }

      const profile = await getAffiliateProfile(session.user.id);
      if (!profile) { setError('Affiliate account not found'); setLoading(false); return; }
      setAffiliate(profile);
      setAccountNumber(profile.mpesa_number || '');

      const payoutData = await getPayoutHistory(profile.id);
      setPayouts(Array.isArray(payoutData) ? payoutData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!accountNumber.trim()) {
      setFormError('Account number is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestPayout(affiliate.id, amount, accountNumber, { 
        mpesa_name: accountName,
        payment_method: method,
        bank_name: method === 'bank' ? bankName : undefined,
      });
      setResult(res);
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const balances = {
    pending: payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0),
    paid: payouts
      .filter(p => p.status === 'paid')
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Wallet className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Withdrawals</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-500/20 via-blue-500/10 to-zinc-950 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-green-400" />
            <h1 className="text-xl font-black text-white">Withdrawals</h1>
          </div>
          <p className="text-zinc-400 text-sm mt-1">Request payouts and view history</p>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 overflow-x-auto">
          {[
            { path: '/affiliate-dashboard', label: 'Dashboard', icon: Award },
            { path: '/affiliate-referrals', label: 'Referrals', icon: Share2 },
            { path: '/affiliate-leaderboard', label: 'Leaderboard', icon: Trophy },
            { path: '/affiliate-achievements', label: 'Achievements', icon: Award },
            { path: '/affiliate-withdrawals', label: 'Withdrawals', icon: Wallet },
          ].map(tab => (
            <Link key={tab.path} to={tab.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                location.pathname === tab.path
                  ? 'bg-primary text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 mt-6">
        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="fusion-recessed-card p-5 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-black text-amber-400">{formatKES(balances.pending)}</p>
          </div>
          <div className="fusion-recessed-card p-5 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Paid</p>
            <p className="text-2xl font-black text-green-400">{formatKES(balances.paid)}</p>
          </div>
        </div>

        {/* Request Payout Form */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Request Payout
          </h3>

          {result ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Payout Requested</h4>
              <p className="text-sm text-zinc-400 mb-2">{formatKES(amount)} via {method}</p>
              <p className="text-xs text-zinc-500 mb-4">Status: {result.status || 'pending'}</p>
              <button onClick={() => { setResult(null); setAmount(AFFILIATE_CONFIG.MIN_PAYOUT); }}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover">
                Request Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Amount (KES)</label>
                <input type="number" value={amount}
                  onChange={e => setAmount(parseInt(e.target.value) || 0)}
                  min={AFFILIATE_CONFIG.MIN_PAYOUT}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm font-bold" />
                <p className="text-xs text-zinc-500 mt-1">Minimum: {formatKES(AFFILIATE_CONFIG.MIN_PAYOUT)}</p>
              </div>

              {/* Method selector */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-300">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYOUT_METHODS.map(m => (
                    <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                        method === m.id
                          ? `${m.border} ${m.bg} ${m.color}`
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                      }`}>
                      <m.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account details depend on method */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">
                  {method === 'bank' ? 'Account Number' : 'M-Pesa / Airtel Number'}
                </label>
                <input type="text" value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder={PAYOUT_METHODS.find(m => m.id === method)?.placeholder}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" />
              </div>

              {method === 'bank' && (
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-300">Bank Name</label>
                  <input type="text" value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. Equity Bank"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-300">Account Name (optional)</label>
                <input type="text" value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" />
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <button type="submit" disabled={submitting || amount < AFFILIATE_CONFIG.MIN_PAYOUT || !accountNumber}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : `Request ${formatKES(amount)}`}
              </button>
            </form>
          )}
        </div>

        {/* Payout History */}
        <div className="fusion-recessed-card overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-4 text-left">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Payout History
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{payouts.length} total</span>
              {showHistory ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </div>
          </button>
          {showHistory && (
            <div className="border-t border-zinc-800">
              {payouts.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-6">No payouts yet</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {payouts.map((p, i) => (
                    <div key={p.id || i} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{formatKES(p.amount)}</p>
                          {p.payment_method && <MethodBadge method={p.payment_method} />}
                        </div>
                        <p className="text-xs text-zinc-400">{p.mpesa_number || p.account_number}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${
                        p.status === 'paid' ? 'text-green-400' :
                        p.status === 'processing' ? 'text-blue-400' :
                        p.status === 'rejected' ? 'text-red-400' :
                        'text-amber-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
