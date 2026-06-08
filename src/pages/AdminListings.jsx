import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Trash2, Eye, Search, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { isAdmin, fetchAllListings, adminDeleteListing, updateListingStatus } from '../utils/api';
import { formatKES } from '../utils/constants';

function AdminListings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedListing, setExpandedListing] = useState(null);

  useEffect(() => {
    const init = async () => {
      const admin = await isAdmin();
      if (!admin) { navigate('/login'); return; }
      await fetchListings();
    };
    init();
  }, [navigate]);

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllListings();
      setListings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId) => {
    setDeleteLoading(true);
    try {
      const result = await adminDeleteListing(listingId);
      if (result.success) {
        setListings(prev => prev.filter(l => l.id !== listingId));
        setDeleteConfirm(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete listing');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    setActionLoading(listingId);
    try {
      const result = await updateListingStatus(listingId, newStatus);
      if (result.success) {
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = listings.filter(l => {
    const matchesSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.seller_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    inactive: listings.filter(l => l.status === 'inactive').length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="admin-listings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-7 h-7 text-[#ff385c]" />
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Admin — Listings</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">Manage all marketplace listings.</p>
        </div>
        <button onClick={fetchListings} className="text-sm font-bold text-[#ff385c] hover:underline">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{statusCounts.all}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl p-4">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-green-700 dark:text-green-400">{statusCounts.active}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{statusCounts.inactive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or seller name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all capitalize ${
                statusFilter === status
                  ? 'bg-[#ff385c] text-white shadow-lg shadow-[#ff385c]/20'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No listings found</h3>
          <p className="text-zinc-500 dark:text-zinc-400">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-5 py-4">Listing</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-5 py-4 hidden sm:table-cell">Seller</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-5 py-4">Price</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-5 py-4">Status</th>
                  <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(listing => (
                  <tr key={listing.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-white text-sm truncate max-w-[200px]">{listing.title}</p>
                          <p className="text-xs text-zinc-500">#{listing.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{listing.seller_name || '—'}</p>
                      <p className="text-xs text-zinc-500">{listing.seller_phone || ''}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {listing.category || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">{formatKES(listing.price)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                        listing.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/listing/${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-[#ff385c] transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        {listing.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(listing.id, 'inactive')}
                            disabled={actionLoading === listing.id}
                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 transition-colors"
                            title="Deactivate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(listing.id, 'active')}
                            disabled={actionLoading === listing.id}
                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-green-500 transition-colors"
                            title="Activate"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ id: listing.id, title: listing.title })}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Delete Listing?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              This will permanently delete "<strong className="text-zinc-700 dark:text-zinc-300">{deleteConfirm.title}</strong>". This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleteLoading}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminListings;
