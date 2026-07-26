import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getAffiliateProfile, getDashboardStats, getMonthlyEarnings, getRecentReferrals, getRecentAffiliateOrders, requestPayout, getPayoutHistory, removeAffiliateAccount } from '../utils/affiliate_api';
import { AFFILIATE_CONFIG, formatKES, getReferralLink } from '../config/affiliate';
import { Copy, Share2, Users, ShoppingBag, TrendingUp, Award, Wallet, Send, CheckCircle, X, Loader2, MousePointerClick, AlertTriangle, Trash2, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { GooeyLoader } from '@/components/ui/loader-10';

// ponytail: stat tile — uses plain value (count-up hook caused react #310)
function StatTile({ s, i }) {
  return (
    <div
      key={s.label}
      className={`fusion-recessed-card border-t-2 ${s.top} p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20`}
      style={{ animation: 'fadeUp .4s ease-out both', animationDelay: `${i * 50}ms` }}
    >
      <div className={`w-9 h-9 rounded-xl ${s.chip} flex items-center justify-center mb-2`}>
        <s.icon className={`w-5 h-5 ${s.color}`} />
      </div>
      <p className="text-2xl font-black text-white">{s.money ? formatKES(s.val) : s.val.toLocaleString()}</p>
      <p className="text-xs text-[#4A5771] mt-0.5">{s.label}</p>
    </div>
  );
}

const TIER_META = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-700/20',  bar: 'bg-amber-700',  iconBg: 'bg-gradient-to-br from-amber-700 to-amber-500 text-white' },
  silver:   { label: 'Silver',   color: 'text-[#8E9BB5]',   bg: 'bg-zinc-600/20',   bar: 'bg-zinc-400',   iconBg: 'bg-gradient-to-br from-zinc-500 to-zinc-200 text-white' },
  gold:     { label: 'Gold',     color: 'text-amber-400',  bg: 'bg-amber-500/20',  bar: 'bg-amber-400',  iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-300 text-white' },
  platinum: { label: 'Platinum', color: 'text-zinc-400',   bg: 'bg-zinc-500/20',   bar: 'bg-zinc-500',   iconBg: 'bg-gradient-to-br from-zinc-600 to-cyan-300 text-white' },
};

function TierBadge({ tier }) {
  const meta = TIER_META[tier] || TIER_META.silver;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function TierProgress({ currentCount, currentTier }) {
  const tiers = AFFILIATE_CONFIG.TIERS;
  const currentIdx = tiers.findIndex(t => t.id === currentTier);
  const nextTier = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null;
  const currentTierObj = tiers[currentIdx] || tiers[0];

  if (!nextTier) {
    // At platinum max
    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-[#4A5771] mb-1">
          <span>Orders: {currentCount}</span>
          <span className="text-zinc-400 font-bold">Platinum (Max Tier)</span>
        </div>
        <div className="h-2.5 bg-[#28303F] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-zinc-600" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const progress = ((currentCount - currentTierObj.min_orders) / (nextTier.min_orders - currentTierObj.min_orders)) * 100;
  const remaining = nextTier.min_orders - currentCount;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-[#4A5771] mb-1">
        <span>{currentTierObj.label}: {currentCount} orders</span>
        <span>{nextTier.label}: need {remaining} more</span>
      </div>
      <div className="h-2.5 bg-[#28303F] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${TIER_META[currentTier]?.bar || 'bg-zinc-400'}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

function PayoutModal({ isOpen, onClose, affiliate, onSuccess }) {
  const [amount, setAmount] = useState(AFFILIATE_CONFIG.MIN_PAYOUT);
  const [mpesaNumber, setMpesaNumber] = useState(affiliate?.mpesa_number || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await requestPayout(affiliate.id, amount, mpesaNumber);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#28303F] rounded-2xl border border-[#353F54] p-6 w-full max-w-sm shadow-2xl text-center">
          <CheckCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Payout Requested</h3>
          <p className="text-sm text-[#4A5771] mb-2">{formatKES(amount)} to {mpesaNumber}</p>
          <p className="text-xs text-[#4A5771] mb-4">Status: {result.status || 'pending'}</p>
          <button onClick={onClose}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#28303F] rounded-2xl border border-[#353F54] p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5" /> Request Payout
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#28303F] text-[#4A5771]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-[#8E9BB5]">Amount (KES)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              min={AFFILIATE_CONFIG.MIN_PAYOUT}
              className="w-full px-4 py-2.5 rounded-xl bg-[#28303F] border border-[#353F54] text-white text-sm font-bold"
            />
            <p className="text-xs text-[#4A5771] mt-1">Minimum: {formatKES(AFFILIATE_CONFIG.MIN_PAYOUT)}</p>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-[#8E9BB5]">M-Pesa Number</label>
            <input
              type="tel"
              value={mpesaNumber}
              onChange={e => setMpesaNumber(e.target.value)}
              placeholder="254712345678"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#28303F] border border-[#353F54] text-white text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting || amount < AFFILIATE_CONFIG.MIN_PAYOUT || !mpesaNumber}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Submitting...' : `Request ${formatKES(amount)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AffiliateDashboard() {
  const [user, setUser] = useState(null);
  const [affiliate, setAffiliate] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRemoveAffiliate, setShowRemoveAffiliate] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setError('Not authenticated'); setLoading(false); return; }
      setUser(session.user);

      const profile = await getAffiliateProfile(session.user.id);
      if (!profile) { setError('Affiliate account not found'); setLoading(false); return; }
      setAffiliate(profile);

      const [stats, earnData, recentRefs, recentOrders, payoutData] = await Promise.all([
        getDashboardStats(profile.id),
        getMonthlyEarnings(profile.id),
        getRecentReferrals(profile.id, 50),
        getRecentAffiliateOrders(profile.id),
        getPayoutHistory(profile.id),
      ]);

      setDashboardStats(stats);
      setEarnings(earnData);
      setReferrals(recentRefs);
      setOrders(recentOrders);
      setPayouts(payoutData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const referralLink = affiliate ? getReferralLink(affiliate.referral_code) : '';
  const stats = dashboardStats || { lifetime: {}, current: {} };
  const currentTier = stats.current?.tier || affiliate?.tier || 'silver';
  const qualifiedCount = stats.current?.qualifiedCount || 0;
  const commissionRate = stats.current?.commissionRate || 0.05;
  const pendingCommission = stats.pendingCommission || 0;
  const paidCommission = stats.paidCommission || 0;
  const availableForPayout = pendingCommission;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const shareData = { title: 'Shop on Omix Store', text: `Shop on Omix Store and earn rewards! Use my referral link.`, url: referralLink };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveAffiliate = async () => {
    if (!affiliate?.id) return;
    setRemoving(true);
    try {
      await removeAffiliateAccount(affiliate.id);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      setRemoving(false);
      setShowRemoveAffiliate(false);
      alert('Could not remove affiliate account: ' + (err.message || 'unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#242C3B] flex items-center justify-center">
        <GooeyLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#242C3B] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Award className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Affiliate Dashboard</h2>
          <p className="text-[#4A5771] mb-6">{error}</p>
          <Link to="/account" className="text-primary font-bold hover:underline">Back to Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242C3B]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-500/20 via-violet-500/10 to-[#242C3B] px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TierBadge tier={currentTier} />
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${affiliate?.status === 'active' ? 'bg-[#71717a]/30 text-zinc-400' : 'bg-red-900/30 text-red-400'}`}>
                {affiliate?.status || 'inactive'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white truncate">Welcome back, {affiliate?.full_name || user?.email}</h1>
            <p className="text-[#4A5771] text-sm mt-0.5">{(commissionRate * 100).toFixed(0)}% commission on every referred sale</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs text-[#4A5771] uppercase tracking-wider">Pending Commission</p>
            <p className="text-3xl font-black text-amber-400">{formatKES(Math.round(pendingCommission))}</p>
            {availableForPayout >= AFFILIATE_CONFIG.MIN_PAYOUT && (
              <button onClick={() => setShowPayoutModal(true)}
                className="mt-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" /> Request Payout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-[#28303F] rounded-xl p-1 overflow-x-auto">
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
                  : 'text-[#4A5771] hover:text-white'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 mt-6">
        {/* Tier & Status Card */}
        <div className="fusion-recessed-card p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(TIER_META[currentTier]?.iconBg) || 'bg-[#28303F] text-[#4A5771]'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {TIER_META[currentTier]?.label || 'Silver'} Tier
                </p>
                <p className="text-xs text-[#4A5771]">
                  {(commissionRate * 100).toFixed(0)}% commission on referred sales
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${affiliate?.status === 'active' ? 'bg-[#71717a]/30 text-zinc-400' : 'bg-red-900/30 text-red-400'}`}>
              {affiliate?.status || 'inactive'}
            </span>
          </div>
          <TierProgress currentCount={qualifiedCount} currentTier={currentTier} />
          {/* Commission rates for all tiers */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AFFILIATE_CONFIG.TIERS.map(t => (
              <span key={t.id} className={`text-[10px] px-2 py-0.5 rounded-full ${t.id === currentTier ? 'bg-primary/20 text-primary font-bold' : 'bg-[#28303F] text-[#4A5771]'}`}>
                {t.label} {(t.rate * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-sm font-bold text-[#8E9BB5] mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Referral Link
          </h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-[#28303F] border border-[#353F54] rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover flex items-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={shareLink}
              className="px-4 py-2.5 bg-[#28303F] text-white rounded-xl font-bold text-sm hover:bg-[#353F54] flex items-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Stats Grid — gradient tiles w/ count-up */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: MousePointerClick, color: 'text-fuchsia-400', chip: 'bg-fuchsia-500/15', top: 'border-t-fuchsia-500/40', val: stats.lifetime?.totalClicks || 0, label: 'Link Clicks' },
            { icon: Users, color: 'text-violet-400', chip: 'bg-violet-500/15', top: 'border-t-violet-500/40', val: stats.lifetime?.totalReferred || 0, label: 'Total Referrals' },
            { icon: ShoppingBag, color: 'text-zinc-500', chip: 'bg-zinc-600/15', top: 'border-t-blue-500/40', val: qualifiedCount, label: 'Qualified Sales' },
            { icon: TrendingUp, color: 'text-zinc-400', chip: 'bg-[#71717a]/15', top: 'border-t-[#71717a]/40', val: Math.round(stats.current?.totalSales || 0), label: 'Sales Value', money: true },
            { icon: Wallet, color: 'text-amber-400', chip: 'bg-amber-500/15', top: 'border-t-amber-500/40', val: Math.round(pendingCommission), label: 'Pending Commission', money: true },
          ].map((s, i) => (
            <StatTile s={s} i={i} />
          ))}
        </div>

        {/* Payout Section */}
        {availableForPayout >= AFFILIATE_CONFIG.MIN_PAYOUT && (
          <div className="bg-gradient-to-r from-amber-500/10 to-[#71717a]/10 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-400" /> Available for Payout
                </h3>
                <p className="text-2xl font-black text-zinc-400 mt-1">{formatKES(availableForPayout)}</p>
                <p className="text-xs text-[#4A5771] mt-1">Minimum payout: {formatKES(AFFILIATE_CONFIG.MIN_PAYOUT)}</p>
              </div>
              <button onClick={() => setShowPayoutModal(true)}
                className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover flex items-center gap-2 transition-all">
                <Send className="w-4 h-4" /> Request Payout
              </button>
            </div>
          </div>
        )}

        {/* Payout History */}
        {payouts.length > 0 && (
          <div className="fusion-recessed-card overflow-hidden">
            <button
              onClick={() => setShowPayouts(!showPayouts)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <h3 className="text-sm font-bold text-[#8E9BB5] flex items-center gap-2">
                <Send className="w-4 h-4" /> Payout History
              </h3>
              {showPayouts ? <ChevronUp className="w-4 h-4 text-[#4A5771]" /> : <ChevronDown className="w-4 h-4 text-[#4A5771]" />}
            </button>
            {showPayouts && (
              <div className="border-t border-[#353F54] divide-y divide-[#353F54]">
                {payouts.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{formatKES(p.amount)}</p>
                      <p className="text-xs text-[#4A5771]">{p.mpesa_number}</p>
                    </div>
                    <span className={`text-xs font-bold ${p.status === 'paid' ? 'text-zinc-400' : p.status === 'processing' ? 'text-zinc-500' : 'text-amber-400'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Monthly Earnings — inline sparkline */}
        <div className="fusion-recessed-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#8E9BB5] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Monthly Commission
            </h3>
            <span className="text-xs text-[#4A5771]">{earnings.length} months</span>
          </div>
          {earnings.length === 0 ? (
            <p className="text-sm text-[#4A5771] text-center py-4">No commission records yet</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {earnings.slice(0, 6).map((e, i) => {
                const amt = e.commission || e.commission_amount || 0;
                const max = Math.max(...earnings.map(x => x.commission || x.commission_amount || 0), 1);
                const h = Math.max(8, (amt / max) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${e.year}-${String(e.month).padStart(2, '0')}: ${formatKES(amt)}`}>
                    <span className="text-[10px] text-[#4A5771] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{formatKES(amt)}</span>
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-primary/40 to-primary group-hover:from-primary/60 transition-all" style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-[#4A5771] mt-1">{String(e.month).padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t border-[#353F54] mt-4 pt-3 flex justify-between">
            <span className="text-sm text-[#4A5771]">Pending</span>
            <span className="text-sm font-bold text-amber-400">{formatKES(pendingCommission)}</span>
          </div>
          <div className="flex justify-between bg-[#28303F]/50 -mx-5 px-5 py-3 mt-3 rounded-b-2xl">
            <span className="text-sm text-[#4A5771]">Paid</span>
            <span className="text-sm font-bold text-zinc-400">{formatKES(paidCommission)}</span>
          </div>
        </div>

        {/* Referred Users — cards */}
        <div className="fusion-recessed-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#8E9BB5] flex items-center gap-2">
              <Users className="w-4 h-4" /> People You Referred
            </h3>
            <span className="text-xs text-[#4A5771]">{referrals.length} total</span>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-[#4A5771] text-center py-4">Share your referral link to start earning. Anyone who signs up through it appears here by name.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {referrals.map((r, i) => {
                const initials = (r.full_name || r.email || 'C').split(/[\s@]+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={i} className="flex items-center gap-3 bg-[#28303F]/40 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{r.full_name || 'Customer'}</p>
                      <p className="text-xs text-[#4A5771] truncate">{r.email}</p>
                      <p className="text-[10px] text-[#4A5771] mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${r.status === 'converted' ? 'bg-[#71717a]/30 text-zinc-400' : 'bg-[#353F54]/40 text-[#4A5771]'}`}>
                      {r.status || 'pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-sm font-bold text-[#8E9BB5] mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Qualifying Orders
          </h3>
          {orders.length === 0 ? (
            <p className="text-sm text-[#4A5771] text-center py-4">No qualifying orders yet.</p>
          ) : (
            <div className="divide-y divide-[#353F54]">
              {orders.map((o, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-bold text-white">{o.customer_name || 'Customer'}</p>
                    <p className="text-xs text-[#4A5771]">
                      {o.omix_order_items?.map(item => `${item.product_name} x${item.quantity}`).join(', ') || 'Order'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatKES(o.total_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone — Remove Affiliate Account */}
        <div className="bg-red-950/20 rounded-2xl border border-red-900/40 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
          </div>
          <p className="text-xs text-[#4A5771] mb-4">
            Permanently remove your affiliate account. This deletes all your referral links, click history,
            commissions, and payout records. Your customer account stays intact and you can re-apply later. This cannot be undone.
          </p>
          <button
            onClick={() => setShowRemoveAffiliate(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600/20 border border-red-700/50 text-red-400 font-bold text-sm hover:bg-red-600/30 transition-colors"
          >
            Remove Affiliate Account
          </button>
        </div>
      </div>

      {/* Remove Affiliate Confirm Modal */}
      {showRemoveAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRemoveAffiliate(false)} />
          <div className="relative bg-[#28303F] rounded-2xl border border-red-900/40 p-6 w-full max-w-sm shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Remove Affiliate Account?</h3>
            <p className="text-sm text-[#4A5771] mb-6">
              This permanently deletes your affiliate record, referrals, clicks, and commission history. Your main login stays.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveAffiliate(false)} disabled={removing}
                className="flex-1 py-2.5 rounded-xl bg-[#28303F] text-[#8E9BB5] font-bold text-sm hover:bg-[#353F54]">
                Cancel
              </button>
              <button onClick={handleRemoveAffiliate} disabled={removing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50">
                {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {removing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      <PayoutModal
        isOpen={showPayoutModal}
        onClose={() => { setShowPayoutModal(false); loadData(); }}
        affiliate={affiliate}
        onSuccess={loadData}
      />
    </div>
  );
}
