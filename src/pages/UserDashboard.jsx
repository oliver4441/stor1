import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package, LogOut, ShoppingBag, ArrowRight, Search, Grid3X3, List,
  ChevronDown, ChevronUp, Clock, Gift, Copy, Check, Star, ChevronRight,
  ExternalLink, Users, Bookmark, X, Bell, BellRing, BellOff,
  User, Mail, Phone, Camera, Edit2, MapPin, Plus, Trash2, AlertTriangle,
  Loader2, CheckCircle2, Shield, CreditCard, Settings, Home,
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import {
  fetchOrders, fetchListings, fetchAddresses, saveAddress, deleteAddress,
  setDefaultAddress, getReferralCode, getReferralStats, getLoyaltyPoints,
  getPointsHistory, getSavedSearches, removeSavedSearch,
  updateProfile, uploadAvatar, cancelOrderWithReason, getProfile,
} from '../utils/api';
import { formatKES, CATEGORIES } from '../utils/constants';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

// ── Tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile',   label: 'Profile',   icon: User },
  { id: 'orders',    label: 'Orders',    icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'rewards',   label: 'Rewards',   icon: Gift },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

// ── Status config ─────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending:    { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30',     label: 'Pending',    icon: Clock },
  processing: { color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-900/30',       label: 'Processing', icon: Package },
  shipped:    { color: 'text-purple-500',bg: 'bg-purple-50 dark:bg-purple-900/30',   label: 'Shipped',    icon: ShoppingBag },
  delivered:  { color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/30',label: 'Delivered',  icon: CheckCircle2 },
  cancelled:  { color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/30',         label: 'Cancelled',  icon: AlertTriangle },
};

const CANCELLABLE_STATUSES = ['pending', 'processing'];

// ── Cancel Modal ──────────────────────────────────────────────────────
function CancelModal({ order, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  const reasons = [
    'Changed my mind',
    'Found a better price',
    'Order placed by mistake',
    'Delivery takes too long',
    'Item out of stock',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Cancel Order</h3>
            <p className="text-xs text-zinc-500">#{String(order.id).slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>

        <div className="mb-4">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
            Reason (optional)
          </label>
          <div className="space-y-1.5">
            {reasons.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  reason === r
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold border border-red-200 dark:border-red-800'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === 'Other' && (
            <textarea
              value={reason === 'Other' ? reason : ''}
              onChange={e => setReason(e.target.value)}
              placeholder="Tell us why..."
              className="w-full mt-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white resize-none h-20 focus:outline-none focus:border-red-400"
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────
function OrderCard({ order, onCancel, isExpanded, onToggle }) {
  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const StatusIcon = status.icon;
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-200">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg} flex-shrink-0`}>
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
          </div>
          <div className="min-w-0">
            <span className="font-mono text-xs text-zinc-400">#{String(order.id).slice(0, 8).toUpperCase()}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-zinc-400 flex-shrink-0" />
              <p className="text-xs text-zinc-500 truncate">
                {new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${status.bg} ${status.color}`}>
            {status.label}
          </span>
          <span className="font-bold text-[var(--seasonal-primary,#ff385c)] text-sm">{formatKES(order.total_amount)}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </button>

      {/* Expanded */}
      {isExpanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 space-y-3 animate-slide-down">
          {order.omix_order_items?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Items</p>
              {order.omix_order_items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.product_name}</p>
                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white flex-shrink-0">{formatKES(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {order.customer_name && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                <span className="text-zinc-400 block">Customer</span>
                <span className="font-bold text-zinc-900 dark:text-white">{order.customer_name}</span>
              </div>
            )}
            {order.phone && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                <span className="text-zinc-400 block">Phone</span>
                <span className="font-bold text-zinc-900 dark:text-white">{order.phone}</span>
              </div>
            )}
          </div>

          {order.cancellation_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5">
              <span className="text-xs text-red-500 font-semibold block">Cancellation reason</span>
              <span className="text-xs text-red-600 dark:text-red-400">{order.cancellation_reason}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              to={`/track-order?orderId=${order.id}`}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-[var(--seasonal-primary,#ff385c)]/10 text-[var(--seasonal-primary,#ff385c)] font-bold text-sm hover:bg-[var(--seasonal-primary,#ff385c)]/20 transition-colors"
            >
              Track <ArrowRight className="w-4 h-4" />
            </Link>
            {canCancel && (
              <button
                onClick={() => onCancel(order)}
                className="py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Avatar Upload Component ───────────────────────────────────────────
function AvatarUpload({ currentUrl, userName, onUpload, busy }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleSelect = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    await onUpload(file);

    // Cleanup
    URL.revokeObjectURL(localUrl);
    setPreview(null);
    e.target.value = '';
  };

  const src = preview || currentUrl;

  return (
    <div className="relative group">
      <div
        className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 cursor-pointer relative"
        onClick={handleSelect}
      >
        {src ? (
          <img src={src} alt={userName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-full flex items-center justify-center">
          <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {busy && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={handleSelect}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--seasonal-primary,#ff385c)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  // Orders
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Referral
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Points
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);

  // Searches
  const [savedSearches, setSavedSearches] = useState([]);

  // Notifications
  const [notifStatus, setNotifStatus] = useState('loading');
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifMsg, setNotifMsg] = useState(null);

  // Products (for browsing)
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUser(user);

      const [
        profileData, userOrders, allProducts, userAddresses,
        code, stats, pts, hist, searches,
      ] = await Promise.all([
        getProfile(user.id),
        fetchOrders(user.id),
        fetchListings('All', '', 1, 100),
        fetchAddresses(user.id),
        getReferralCode(user.id),
        getReferralStats(user.id),
        getLoyaltyPoints(user.id),
        getPointsHistory(user.id),
        getSavedSearches(user.id),
      ]);

      setProfile(profileData);
      setOrders(userOrders);
      setProducts(allProducts.listings || allProducts);
      setAddresses(userAddresses);
      setReferralCode(code);
      setReferralCount(stats.count);
      setLoyaltyPoints(pts.points);
      setPointsHistory(hist);
      setSavedSearches(searches);
      setEditForm({
        full_name: profileData?.full_name || user?.user_metadata?.full_name || '',
        phone: profileData?.phone || '',
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Notification status
  useEffect(() => {
    if (!isPushSupported()) { setNotifStatus('unsupported'); return; }
    if (Notification.permission === 'granted') setNotifStatus('on');
    else if (Notification.permission === 'denied') setNotifStatus('blocked');
    else setNotifStatus('off');
  }, []);

  const handleNotifToggle = async () => {
    setNotifBusy(true);
    setNotifMsg(null);
    try {
      if (notifStatus === 'on') {
        const res = await unsubscribeFromPush();
        if (res.success) { setNotifStatus('off'); setNotifMsg({ type: 'success', text: 'Notifications turned off.' }); }
        else { setNotifMsg({ type: 'error', text: res.error || 'Failed to turn off.' }); }
      } else {
        const res = await subscribeToPush();
        if (res.success) { setNotifStatus('on'); setNotifMsg({ type: 'success', text: 'Notifications enabled!' }); }
        else {
          if (res.error?.includes('denied')) setNotifStatus('blocked');
          setNotifMsg({ type: 'error', text: res.error || 'Failed to enable.' });
        }
      }
    } catch (err) {
      setNotifMsg({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setNotifBusy(false);
      setTimeout(() => setNotifMsg(null), 4000);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  // ── Profile Save ──────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await updateProfile(user.id, editForm);
      if (res.success) {
        setProfile(res.profile);
        setEditing(false);
        setProfileMsg({ type: 'success', text: 'Profile updated!' });
      } else {
        setProfileMsg({ type: 'error', text: res.error });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  // ── Avatar Upload ─────────────────────────────────────────────────
  const handleAvatarUpload = async (file) => {
    setUploadBusy(true);
    try {
      const res = await uploadAvatar(file, user.id);
      if (res.success) {
        setProfile(prev => ({ ...prev, avatar_url: res.url }));
        setProfileMsg({ type: 'success', text: 'Profile picture updated!' });
      } else {
        setProfileMsg({ type: 'error', text: res.error });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Upload failed.' });
    } finally {
      setUploadBusy(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  // ── Order Cancel ──────────────────────────────────────────────────
  const handleCancelOrder = async (reason) => {
    setCancelBusy(true);
    try {
      const res = await cancelOrderWithReason(cancelTarget.id, reason);
      if (res.success) {
        setOrders(prev => prev.map(o =>
          o.id === cancelTarget.id
            ? { ...o, status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason }
            : o
        ));
        setCancelTarget(null);
        setProfileMsg({ type: 'success', text: 'Order cancelled.' });
      } else {
        setProfileMsg({ type: 'error', text: res.error });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to cancel order.' });
    } finally {
      setCancelBusy(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  // ── Address helpers ───────────────────────────────────────────────
  const handleSaveAddress = async (addr) => {
    const res = await saveAddress(addr);
    if (res.success) {
      setAddresses(prev => [res.address, ...prev]);
      setShowAddressForm(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    const res = await deleteAddress(id);
    if (res.success) setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const handleSetDefault = async (id) => {
    await setDefaultAddress(id);
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
  };

  // ── Filter products ───────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !searchQuery
      || p.title?.toLowerCase().includes(searchQuery.toLowerCase())
      || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[var(--seasonal-primary,#ff385c)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500">Loading your account...</p>
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || null;
  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'User';

  // ── Tab Content ───────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      // ═══════════════ PROFILE ════════════════
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <AvatarUpload
                  currentUrl={avatarUrl}
                  userName={userName}
                  onUpload={handleAvatarUpload}
                  busy={uploadBusy}
                />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{userName}</h2>
                  <p className="text-sm text-zinc-500">{user?.email}</p>
                  <p className="text-xs text-zinc-400 mt-1 capitalize">{profile?.role || 'Customer'}</p>
                </div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditing(false); setEditForm({ full_name: profile?.full_name || '', phone: profile?.phone || '' }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>

              {/* Inline Edit Form */}
              {editing && (
                <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[var(--seasonal-primary,#ff385c)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[var(--seasonal-primary,#ff385c)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-400 mt-1">Email cannot be changed here.</p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full py-3 rounded-xl bg-[var(--seasonal-primary,#ff385c)] text-white font-bold text-sm hover:bg-[var(--seasonal-secondary,#e03150)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <ShoppingBag className="w-5 h-5 text-[var(--seasonal-primary,#ff385c)] mx-auto mb-1" />
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{orders.length}</p>
                <p className="text-xs text-zinc-500">Orders</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{loyaltyPoints}</p>
                <p className="text-xs text-zinc-500">Points</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <MapPin className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{addresses.length}</p>
                <p className="text-xs text-zinc-500">Addresses</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <Gift className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{referralCount}</p>
                <p className="text-xs text-zinc-500">Referrals</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/track-order" className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between group hover:border-[var(--seasonal-primary,#ff385c)]/30 transition-colors">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">Track Order</p>
                  <p className="text-xs text-zinc-500">Check delivery status</p>
                </div>
                <Package className="w-6 h-6 text-[var(--seasonal-primary,#ff385c)] group-hover:scale-110 transition-transform" />
              </Link>
              <Link to="/wishlist" className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between group hover:border-[var(--seasonal-primary,#ff385c)]/30 transition-colors">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">Wishlist</p>
                  <p className="text-xs text-zinc-500">Saved items</p>
                </div>
                <Bookmark className="w-6 h-6 text-[var(--seasonal-primary,#ff385c)] group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        );

      // ═══════════════ ORDERS ════════════════
      case 'orders':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Order History</h2>
                <p className="text-xs text-zinc-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
              </div>
              {orders.length > 3 && (
                <button
                  onClick={() => setExpandedOrders(
                    Object.keys(expandedOrders).length === orders.length ? {} :
                    Object.fromEntries(orders.map(o => [o.id, true]))
                  )}
                  className="text-xs font-bold text-[var(--seasonal-primary,#ff385c)] hover:underline"
                >
                  {Object.keys(expandedOrders).length === orders.length ? 'Collapse all' : 'Expand all'}
                </button>
              )}
            </div>

            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isExpanded={!!expandedOrders[order.id]}
                    onToggle={() => setExpandedOrders(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                    onCancel={setCancelTarget}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No orders yet</h3>
                <p className="text-sm text-zinc-500 mb-4">When you place an order, it will appear here.</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-[var(--seasonal-primary,#ff385c)] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[var(--seasonal-secondary,#e03150)] transition-colors">
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        );

      // ═══════════════ ADDRESSES ════════════════
      case 'addresses':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Saved Addresses</h2>
              <button
                onClick={() => setShowAddressForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--seasonal-primary,#ff385c)] text-white text-xs font-bold hover:bg-[var(--seasonal-secondary,#e03150)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {showAddressForm && (
              <AddressForm
                onSave={handleSaveAddress}
                onClose={() => setShowAddressForm(false)}
              />
            )}

            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          addr.is_default ? 'bg-[var(--seasonal-primary,#ff385c)]/10 text-[var(--seasonal-primary,#ff385c)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white text-sm">{addr.label || 'Address'}</span>
                            {addr.is_default && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--seasonal-primary,#ff385c)]/10 text-[var(--seasonal-primary,#ff385c)]">Default</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{addr.area}{addr.landmark ? `, ${addr.landmark}` : ''}</p>
                          {addr.phone && <p className="text-xs text-zinc-400 mt-0.5">{addr.phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!addr.is_default && (
                          <button onClick={() => handleSetDefault(addr.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all" title="Set as default">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <MapPin className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No addresses saved</h3>
                <p className="text-sm text-zinc-500">Save your delivery addresses for faster checkout.</p>
              </div>
            )}
          </div>
        );

      // ═══════════════ REWARDS ════════════════
      case 'rewards':
        return (
          <div className="space-y-6">
            {/* Referral */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--seasonal-primary,#ff385c)] to-[var(--seasonal-secondary,#e03150)] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Refer a Friend</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Share your code and earn KES 100 per referral</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Your referral code</label>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-200 dark:border-zinc-700">
                    <span className="font-mono font-bold text-lg text-zinc-900 dark:text-white tracking-wider">{referralCode}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="ml-auto p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                    </button>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">People referred</label>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-5 py-3 border border-zinc-200 dark:border-zinc-700">
                    <Users className="w-5 h-5 text-[var(--seasonal-primary,#ff385c)]" />
                    <span className="font-bold text-xl text-zinc-900 dark:text-white">{referralCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Loyalty Points</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Earn 1 point per KES 100 spent</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{loyaltyPoints}</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Available points</p>
                </div>
              </div>
              {pointsHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {pointsHistory.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            entry.points > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {entry.points > 0 ? (
                              <Star className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{entry.description || 'Points update'}</p>
                            <p className="text-xs text-zinc-500">{new Date(entry.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${entry.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ═══════════════ SETTINGS ════════════════
      case 'settings':
        return (
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  {notifStatus === 'on' ? <BellRing className="w-5 h-5 text-white" /> : <Bell className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Notifications</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage push notification settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notifStatus === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
                    ) : notifStatus === 'on' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">Enabled</span>
                      </div>
                    ) : notifStatus === 'blocked' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">Blocked</span>
                      </div>
                    ) : notifStatus === 'unsupported' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-500">Unsupported</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-500">Off</span>
                      </div>
                    )}
                  </div>

                  {notifStatus === 'on' && (
                    <button onClick={handleNotifToggle} disabled={notifBusy}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50">
                      <BellOff className="w-3.5 h-3.5" /> {notifBusy ? '...' : 'Turn Off'}
                    </button>
                  )}
                  {notifStatus === 'off' && (
                    <button onClick={handleNotifToggle} disabled={notifBusy}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20">
                      <BellRing className="w-3.5 h-3.5" /> {notifBusy ? '...' : 'Enable'}
                    </button>
                  )}
                  {notifStatus === 'blocked' && (
                    <div className="text-xs text-zinc-500 text-right max-w-[200px]">
                      <p>Enable in browser settings</p>
                    </div>
                  )}
                  {notifStatus === 'unsupported' && (
                    <span className="text-xs text-zinc-400">Not available in this browser</span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {notifStatus === 'on'
                    ? 'You will receive notifications about order updates, new arrivals, deals, and cart reminders.'
                    : notifStatus === 'blocked'
                    ? 'Notifications are blocked in your browser. Update your site permissions to enable them.'
                    : 'Enable notifications to stay updated on order status, new products, and special offers.'}
                </p>

                {notifMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    notifMsg.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    {notifMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* Saved Searches */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--seasonal-primary,#ff385c)] to-[var(--seasonal-secondary,#e03150)] flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Saved Searches</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Quick access to your recent searches</p>
                </div>
              </div>
              {savedSearches.length > 0 ? (
                <div className="space-y-2">
                  {savedSearches.map(search => (
                    <div key={search.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <Link to={`/?search=${encodeURIComponent(search.search_term)}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{search.search_term}</span>
                      </Link>
                      <button
                        onClick={async () => { await removeSavedSearch(search.id); setSavedSearches(prev => prev.filter(s => s.id !== search.id)); }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Search className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No saved searches yet</p>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Account</h2>
              <div className="space-y-2">
                <Link to="/track-order" className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Track Order</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </Link>
                <Link to="/wishlist" className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Wishlist</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-red-500">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ═══════════════ RENDER ════════════════
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full" data-name="user-dashboard-page">
      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">My Account</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back, {userName}</p>
        </div>
      </div>

      {/* Toast Messages */}
      {profileMsg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          profileMsg.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {profileMsg.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-4 px-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {renderTabContent()}
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelOrder}
          busy={cancelBusy}
        />
      )}
    </div>
  );
}

// ── Address Form (simple inline) ──────────────────────────────────────
function AddressForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    label: '',
    area: '',
    landmark: '',
    phone: '',
    is_default: false,
  });

  const AREA_OPTIONS = ['Kericho CBD', 'Moi Junction', 'Litein', 'Kapsoit', 'Brooke', 'Sosiot', 'Kaitet', 'Awasi', 'Kipchimchim', 'Chepseon', 'Londiani', 'Kedowa', 'Kabianga', 'Kipkelion', 'Ainamoi', 'Roret', 'Fort Ternan', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.area.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Label</label>
        <div className="flex gap-2">
          {['Home', 'Work', 'Other'].map(l => (
            <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                form.label === l ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
              }`}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Area</label>
        <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--seasonal-primary,#ff385c)]">
          <option value="">Select area...</option>
          {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Landmark</label>
        <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })}
          placeholder="Nearby landmark"
          className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--seasonal-primary,#ff385c)]" />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Phone</label>
        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder="07XX XXX XXX"
          className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--seasonal-primary,#ff385c)]" />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
        <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })}
          className="rounded text-[var(--seasonal-primary,#ff385c)] focus:ring-[var(--seasonal-primary,#ff385c)]" />
        Set as default address
      </label>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-2.5 rounded-xl bg-[var(--seasonal-primary,#ff385c)] text-white text-sm font-bold hover:bg-[var(--seasonal-secondary,#e03150)] transition-colors">
          Save Address
        </button>
      </div>
    </form>
  );
}

export default UserDashboard;
