import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { getAffiliateProfile, getReferralLink, getYearlyStats, getLifetimeStats, getMonthlyEarnings, getRecentReferrals, getRecentAffiliateOrders } from '../utils/affiliate_api';
import { formatKES } from '../utils/constants';
import { Copy, Share2, Users, ShoppingBag, TrendingUp, Award, Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function AffiliateDashboard() {
  const [user, setUser] = useState(null);
  const [affiliate, setAffiliate] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [lifetimeStats, setLifetimeStats] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        setUser(session.user);

        // Get affiliate profile
        const profile = await getAffiliateProfile(session.user.id);
        if (!profile) {
          setError('Affiliate account not found');
          setLoading(false);
          return;
        }
        setAffiliate(profile);

        // Load stats
        const [yearStats, lifeStats, earnData, recentRefs, recentOrders] = await Promise.all([
          getYearlyStats(profile.id),
          getLifetimeStats(profile.id),
          getMonthlyEarnings(profile.id),
          getRecentReferrals(profile.id),
          getRecentAffiliateOrders(profile.id),
        ]);

        setYearlyStats(yearStats);
        setLifetimeStats(lifeStats);
        setEarnings(earnData);
        setReferrals(recentRefs);
        setOrders(recentOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const referralLink = affiliate ? getReferralLink(affiliate.referral_code) : '';
  const currentYear = new Date().getFullYear();
  const pendingCommission = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.commission, 0);
  const paidCommission = earnings
    .filter(e => e.status !== 'pending')
    .reduce((sum, e) => sum + e.commission, 0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Award className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Affiliate Dashboard</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link to="/account" className="text-primary font-bold hover:underline">Back to Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-zinc-950 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-white">Affiliate Dashboard</h1>
          <p className="text-zinc-400 text-sm">Welcome, {affiliate?.full_name || user?.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 mt-6">
        {/* Tier & Status Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${yearlyStats?.tier === 'gold' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-white capitalize">{yearlyStats?.tier || 'Silver'} Tier</p>
                <p className="text-xs text-zinc-400">
                  {yearlyStats?.tier === 'gold' ? '10% commission' : '5% commission'} • {yearlyStats?.qualifiedCount || 0}/{yearlyStats?.tier === 'gold' ? '30+' : '30'} sales this year
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${affiliate?.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {affiliate?.status || 'inactive'}
            </span>
          </div>
          {/* Tier Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Silver (0-29)</span>
              <span>Gold (30+)</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${yearlyStats?.tier === 'gold' ? 'bg-amber-500' : 'bg-zinc-600'}`}
                style={{ width: `${Math.min(100, ((yearlyStats?.qualifiedCount || 0) / 30) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">{yearlyStats?.qualifiedCount || 0} / 30 qualified sales to reach Gold</p>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Your Referral Link
          </h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover flex items-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-black text-white">{lifetimeStats?.totalReferred || 0}</p>
            <p className="text-xs text-zinc-400">Total Referrals</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <ShoppingBag className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-black text-white">{yearlyStats?.qualifiedCount || 0}</p>
            <p className="text-xs text-zinc-400">Yearly Sales</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-xl font-black text-white">{formatKES(yearlyStats?.totalSales || 0)}</p>
            <p className="text-xs text-zinc-400">Yearly Sales Value</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <Calendar className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-lg font-black text-white">{formatKES(pendingCommission)}</p>
            <p className="text-xs text-zinc-400">Pending Commission</p>
          </div>
        </div>

        {/* Earnings History */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setShowEarnings(!showEarnings)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Monthly Earnings History
            </h3>
            {showEarnings ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          {showEarnings && (
            <div className="border-t border-zinc-800">
              {earnings.length === 0 ? (
                <p className="px-5 py-6 text-sm text-zinc-500 text-center">No earnings data yet</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {earnings.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-bold text-white">{e.year}-{String(e.month).padStart(2, '0')}</p>
                        <p className="text-xs text-zinc-400">{e.qualifiedCount} orders • {formatKES(e.totalSales)} sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{formatKES(e.commission)}</p>
                        <p className={`text-xs ${e.status === 'pending' ? 'text-amber-400' : 'text-green-400'}`}>
                          {e.status === 'pending' ? 'Pending' : 'Paid'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-zinc-800 px-5 py-3 flex justify-between">
                <span className="text-sm text-zinc-400">Pending Total</span>
                <span className="text-sm font-bold text-amber-400">{formatKES(pendingCommission)}</span>
              </div>
              <div className="px-5 py-3 flex justify-between bg-zinc-800/50">
                <span className="text-sm text-zinc-400">Paid Total</span>
                <span className="text-sm font-bold text-green-400">{formatKES(paidCommission)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Referrals */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Recent Referrals
          </h3>
          {referrals.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No referrals yet. Share your link to start earning!</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-bold text-white">{r.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-zinc-400">{r.email}</p>
                  </div>
                  <span className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Qualified Orders */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Recent Qualifying Orders
          </h3>
          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No qualifying orders yet</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {orders.map((o, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-bold text-white">{o.customer_name || 'Customer'}</p>
                    <p className="text-xs text-zinc-400">
                      {o.omix_order_items?.map(item => `${item.product_name} x${item.quantity}`).join(', ') || 'Order'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatKES(o.total_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
