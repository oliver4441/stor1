import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { getSellerProfile, getSellerAnalytics, fetchUserListings, updateListing } from '../utils/api';
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  CheckCircle,
  Store,
  Loader2,
  AlertTriangle,
  Edit,
  Eye,
  EyeOff,
  BarChart3,
  ShoppingBag,
  Clock,
  ArrowRight,
  ChevronRight,
  Ban,
} from 'lucide-react';

// ── Helpers ──

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'KSh 0';
  return `KSh ${Number(amount).toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ── Skeleton ──

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-[#28303F]/40 rounded ${className}`} />;
}

// ── Stat Card ──

function StatCard({ icon: Icon, label, value, subtext, color = 'text-[#38B8EA]' }) {
  return (
    <div className="fusion-clay-panel fusion-recessed-card p-5 transition-all duration-300 hover:border-zinc-700 hover:bg-[#28303F]">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-[#28303F]/80 border border-zinc-700/60 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-[#4A5771] mt-1">{label}</p>
      {subtext && <p className="text-xs text-zinc-600 mt-0.5">{subtext}</p>}
    </div>
  );
}

// ── SellerDashboard ──

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [listings, setListings] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState('');
  const [togglingIds, setTogglingIds] = useState(new Set());

  // ── Redirect unauthenticated users ──
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/seller/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ── Fetch seller data ──
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const profileResult = await getSellerProfile(user.id);

      if (!profileResult?.seller) {
        setSeller(null);
        setLoading(false);
        return;
      }

      setSeller(profileResult.seller);
      const sellerId = profileResult.seller.id || profileResult.seller.user_id || user.id;

      // Fetch analytics
      getSellerAnalytics(sellerId).then((res) => {
        if (res?.analytics) setAnalytics(res.analytics);
        else if (res?.success && res.data) setAnalytics(res.data);
      }).catch(() => {});

      // Fetch listings directly from supabase
      const userListings = await fetchUserListings(user.id);
      setListings(userListings || []);

      // Fetch recent orders for this seller (via supabase omix_order_items)
      const { data: recentOrderItems, error: ordersErr } = await supabase
        .from('omix_order_items')
        .select('*, omix_orders(*)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!ordersErr) {
        setRecentOrders(recentOrderItems || []);
      } else {
        // Fallback: try listings-based order lookup
        if (userListings && userListings.length > 0) {
          const listingIds = userListings.map((l) => l.id);
          const { data: items } = await supabase
            .from('omix_order_items')
            .select('*, omix_orders(*)')
            .in('product_id', listingIds)
            .order('created_at', { ascending: false })
            .limit(10);
          setRecentOrders(items || []);
        }
      }
    } catch (err) {
      console.error('[SellerDashboard]', err);
      setError(err.message || 'Failed to load seller data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Toggle listing active/inactive status ──
  const toggleStatus = async (listing) => {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    setTogglingIds((prev) => new Set(prev).add(listing.id));

    try {
      const result = await updateListing(listing.id, {
        ...listing,
        status: newStatus,
        category: listing.category || 'Other',
      });

      if (result.success) {
        setListings((prev) =>
          prev.map((l) =>
            l.id === listing.id ? { ...l, status: newStatus } : l
          )
        );
      }
    } catch (err) {
      console.error('[ToggleStatus]', err);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(listing.id);
        return next;
      });
    }
  };

  // ── Loading state ──
  if (authLoading || (!seller && loading)) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-10 w-56" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not a seller state ──
  if (!seller) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#28303F] border border-[#353F54] mb-6">
            <Store className="w-10 h-10 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Seller Dashboard</h1>
          <p className="text-[#4A5771] text-sm mb-6">
            You need to register as a seller to access the dashboard.
          </p>
          <Link
            to="/seller/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#71717a] to-[#71717a] hover:from-[#38B8EA] hover:to-[#71717a] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#71717a]/30"
          >
            <Store className="w-4 h-4" />
            Become a Seller
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Derive data ──
  const sellerName = seller.shop_name || seller.store_name || seller.shopName || 'My Shop';
  const sellerRating = seller.rating || seller.average_rating || 0;
  const sellerScore = seller.seller_score || seller.score || 0;
  const isVerified = seller.verified || seller.is_verified || false;

  const totalOrders = analytics?.total_orders ?? 0;
  const totalRevenue = analytics?.total_revenue ?? 0;
  const completedOrders = analytics?.completed_orders ?? 0;
  const pendingOrders = analytics?.pending_orders ?? 0;

  const activeListings = listings.filter((l) => l.status === 'active').length;
  const inactiveListings = listings.filter((l) => l.status === 'inactive').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#71717a] to-[#71717a] shadow-lg shadow-[#71717a]/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{sellerName}</h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-[#71717a]/15 text-[#38B8EA] px-2.5 py-0.5 rounded-full border border-[#71717a]/30">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#4A5771]">
                {sellerRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {Number(sellerRating).toFixed(1)}
                  </span>
                )}
                {sellerScore > 0 && (
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                    Score: {sellerScore}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                  {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
                </span>
              </div>
            </div>
          </div>
          <Link
            to={`/store`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#38B8EA] hover:text-[#6CD4FF] transition-colors"
          >
            View Public Store
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ── Status Banners ── */}
        {seller.status === 'pending' && (
          <div className="flex items-start gap-3 bg-amber-900/15 border border-amber-800/30 rounded-2xl px-5 py-4 mb-6">
            <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-300 text-sm">Shop Pending Approval</p>
              <p className="text-xs text-[#4A5771] mt-0.5">
                Your shop is under review by the admin. You will be able to manage listings once approved.
              </p>
            </div>
          </div>
        )}

        {seller.status === 'rejected' && (
          <div className="flex items-start gap-3 bg-red-900/15 border border-red-800/30 rounded-2xl px-5 py-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-red-300 text-sm">Application Not Approved</p>
              <p className="text-xs text-[#4A5771] mt-0.5">
                Your seller application was not approved.
                {seller.rejection_reason && <> Reason: {seller.rejection_reason}</>}
              </p>
            </div>
          </div>
        )}

        {seller.status === 'suspended' && (
          <div className="flex items-start gap-3 bg-[#28303F]/60 border border-zinc-700 rounded-2xl px-5 py-4 mb-6">
            <Ban className="w-5 h-5 text-[#4A5771] mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-[#8E9BB5] text-sm">Shop Suspended</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Your shop has been suspended. Contact support for more information.
              </p>
            </div>
          </div>
        )}

        {/* ── Analytics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={totalOrders.toLocaleString()}
            subtext="All time"
            color="text-zinc-500"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtext="Gross sales"
            color="text-[#38B8EA]"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Orders"
            value={completedOrders.toLocaleString()}
            subtext="Delivered"
            color="text-[#38B8EA]"
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={pendingOrders.toLocaleString()}
            subtext="Awaiting fulfillment"
            color="text-amber-400"
          />
        </div>

        {/* ── Summary Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="fusion-recessed-card p-5">
            <div className="flex items-center gap-2 text-[#38B8EA] mb-2">
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Active Listings</span>
            </div>
            <p className="text-3xl font-bold text-white">{activeListings}</p>
          </div>
          <div className="fusion-recessed-card p-5">
            <div className="flex items-center gap-2 text-[#4A5771] mb-2">
              <EyeOff className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Inactive Listings</span>
            </div>
            <p className="text-3xl font-bold text-white">{inactiveListings}</p>
          </div>
          <div className="fusion-recessed-card p-5">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Conversion</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {totalOrders > 0 && listings.length > 0
                ? `${Math.round((totalOrders / listings.length) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>

        {/* ── Products List ── */}
        <div className="bg-[#28303F]/80 border border-[#353F54] rounded-3xl overflow-hidden mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#353F54]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-[#38B8EA]" />
              Your Listings
            </h2>
            <span className="text-sm text-zinc-500">{listings.length} total</span>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-[#4A5771] text-sm mb-4">No listings yet.</p>
              <Link
                to="/seller/listings/new"
                className="inline-flex items-center gap-2 bg-[#71717a] hover:bg-[#38B8EA] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#353F54] text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3 font-medium">Product</th>
                    <th className="text-left px-4 py-3 font-medium">Price</th>
                    <th className="text-center px-4 py-3 font-medium">Stock</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => {
                    const isToggling = togglingIds.has(listing.id);
                    const isActive = listing.status === 'active';
                    return (
                      <tr
                        key={listing.id}
                        className="border-b border-[#353F54]/50 hover:bg-[#28303F]/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={`/listing/${listing.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#28303F] border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                              {listing.images && listing.images[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-4 h-4 text-zinc-600" />
                              )}
                            </div>
                            <span className="text-white group-hover:text-[#38B8EA] transition-colors font-medium truncate max-w-[200px]">
                              {listing.title}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-white font-medium">
                          {formatCurrency(listing.price)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              (listing.quantity || 0) > 0
                                ? 'text-[#38B8EA]'
                                : 'text-red-400'
                            }`}
                          >
                            {(listing.quantity || 0) > 0 ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {listing.quantity ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-[#71717a]/15 text-[#38B8EA] border border-[#71717a]/30'
                                : 'bg-[#28303F] text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/listing/${listing.id}`}
                              className="p-2 rounded-lg hover:bg-[#28303F] text-[#4A5771] hover:text-white transition-colors"
                              aria-label="Edit listing"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => toggleStatus(listing)}
                              disabled={isToggling}
                              className={`p-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'hover:bg-red-900/20 text-[#4A5771] hover:text-red-400'
                                  : 'hover:bg-[#71717a]/20 text-[#4A5771] hover:text-[#38B8EA]'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              aria-label={isActive ? 'Deactivate listing' : 'Activate listing'}
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isActive ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent Orders / Sales Trend ── */}
        <div className="bg-[#28303F]/80 border border-[#353F54] rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#353F54]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#38B8EA]" />
              Sales Trend
            </h2>
            <span className="text-xs text-zinc-500">Recent orders</span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 px-6">
              <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No recent orders yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#353F54]/50">
              {recentOrders.slice(0, 8).map((item, idx) => {
                const order = item.omix_orders || {};
                const statusColor =
                  order.status === 'completed' || order.status === 'delivered'
                    ? 'text-[#38B8EA]'
                    : order.status === 'cancelled'
                      ? 'text-red-400'
                      : 'text-amber-400';
                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-[#28303F]/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#28303F] border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {item.product_name || 'Product'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(order.created_at || item.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(item.price)}
                      </p>
                      <span className={`text-[10px] font-bold uppercase ${statusColor}`}>
                        {order.status || 'pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
