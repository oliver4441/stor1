import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { isAdmin, getAdminSellers, approveSeller, rejectSeller } from '../utils/api';
import {
  Store,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  approved: { label: 'Approved', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  suspended: { label: 'Suspended', class: 'bg-zinc-800 text-zinc-500 border-zinc-700', icon: Ban },
};

function formatDate(dateStr) {
  if (!dateStr) return '---';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '---';
  }
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminSellers() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [sellers, setSellers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Action feedback
  const [actionMsg, setActionMsg] = useState(null);

  // Check admin access
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setCheckingAuth(false); return; }
        const admin = await isAdmin();
        setIsAdminUser(admin);
      } catch {
        setIsAdminUser(false);
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminSellers({
        status: activeTab || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });
      if (result.success) {
        setSellers(result.sellers || []);
        setTotal(result.total || 0);
        setTotalPages(result.total_pages || 1);
      } else {
        setSellers([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('[AdminSellers] fetch error:', err);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    if (isAdminUser) fetchSellers();
  }, [isAdminUser, fetchSellers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSellers();
  };

  const handleApprove = async (sellerId) => {
    setActionMsg(null);
    try {
      const result = await approveSeller(sellerId);
      if (result.success) {
        setActionMsg({ type: 'success', text: 'Seller approved successfully.' });
        fetchSellers();
      } else {
        setActionMsg({ type: 'error', text: result.error || 'Failed to approve seller.' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to approve seller.' });
    }
  };

  const openRejectModal = (seller) => {
    setRejectModal(seller);
    setRejectReason('');
    setRejecting(false);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      const result = await rejectSeller(rejectModal.id, rejectReason.trim());
      if (result.success) {
        setActionMsg({ type: 'success', text: 'Seller rejected.' });
        setRejectModal(null);
        fetchSellers();
      } else {
        setActionMsg({ type: 'error', text: result.error || 'Failed to reject seller.' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to reject seller.' });
    } finally {
      setRejecting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400" />
            Sellers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{total} total seller(s)</p>
        </div>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-4 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-900/20 border border-emerald-800/40 text-emerald-300'
              : 'bg-red-900/20 border border-red-800/40 text-red-300'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <p className="text-sm flex-1">{actionMsg.text}</p>
          <button
            onClick={() => setActionMsg(null)}
            className="p-0.5 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by shop name..."
          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      )}

      {/* No results */}
      {!loading && sellers.length === 0 && (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-3xl">
          <Store className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No sellers found.</p>
        </div>
      )}

      {/* Seller list */}
      {!loading && sellers.length > 0 && (
        <div className="space-y-3">
          {sellers.map((seller) => {
            const StatusIcon = STATUS_CONFIG[seller.status]?.icon || Clock;
            const statusInfo = STATUS_CONFIG[seller.status] || STATUS_CONFIG.pending;

            return (
              <div
                key={seller.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Shop info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-white truncate">
                        {seller.shop_name || 'Unnamed Shop'}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusInfo.class}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      {seller.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Shield className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      {seller.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {seller.email}
                        </span>
                      )}
                      {seller.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {seller.phone}
                        </span>
                      )}
                      {seller.mpesa_phone && (
                        <span className="flex items-center gap-1">
                          <span className="text-emerald-400">M-Pesa</span>
                          {seller.mpesa_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Registered {formatDate(seller.created_at)}
                      </span>
                      <span className="text-zinc-600">
                        Slug: /store/{seller.shop_slug}
                      </span>
                    </div>

                    {seller.shop_description && (
                      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">
                        {seller.shop_description}
                      </p>
                    )}

                    {(seller.business_registration || seller.kra_pin || seller.id_number) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-zinc-500">
                        {seller.business_registration && <span>Reg: {seller.business_registration}</span>}
                        {seller.kra_pin && <span>KRA: {seller.kra_pin}</span>}
                        {seller.id_number && <span>ID: {seller.id_number}</span>}
                      </div>
                    )}

                    {seller.status === 'rejected' && seller.rejection_reason && (
                      <div className="flex items-start gap-1.5 mt-2 text-xs text-red-400 bg-red-900/10 rounded-lg px-3 py-1.5 border border-red-800/30">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>Reason: {seller.rejection_reason}</span>
                      </div>
                    )}

                    {seller.reviewed_at && (
                      <p className="text-[10px] text-zinc-600 mt-1">
                        Reviewed {formatTimeAgo(seller.reviewed_at)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {seller.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(seller.id)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(seller)}
                          className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {seller.status === 'approved' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}

                    {seller.status === 'rejected' && (
                      <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-zinc-400 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Reject Seller
              </h3>
              <button
                onClick={() => setRejectModal(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-300 mb-1">
              Reject <strong className="text-white">{rejectModal.shop_name}</strong>?
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              The seller will be notified and unable to manage listings.
            </p>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Reason for rejection <span className="text-red-400">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why the application was rejected..."
              rows={3}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || rejecting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
