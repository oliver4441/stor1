import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Package, MessageSquare, LogOut, ExternalLink, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchUserListings, deleteListing } from '../utils/api';
import { formatKES } from '../utils/constants';
import { CATEGORIES, LOCATIONS } from '../utils/constants';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setUser(user);
    const userListings = await fetchUserListings(user.id);
    setListings(userListings);
    const { data: userWishes } = await supabase.from('wishes').select('id').eq('user_id', user.id);
    if (userWishes && userWishes.length > 0) {
      const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('wish_id', userWishes.map(w => w.id));
      setInquiries(count || 0);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const startEdit = (listing) => {
    setEditingListing(listing.id);
    setEditForm({
      title: listing.title,
      price: listing.price,
      condition: listing.condition,
      category: listing.category,
      location: listing.location_city || 'CBD',
      description: listing.description || '',
      seller_name: listing.seller_name || '',
      seller_phone: listing.seller_phone || '',
    });
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingListing(null);
    setEditForm({});
    setEditError('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const catId = CATEGORIES.indexOf(editForm.category) >= 0 ? CATEGORIES.indexOf(editForm.category) : null;
      const { error } = await supabase
        .from('listings')
        .update({
          title: editForm.title,
          description: editForm.description,
          price: parseInt(editForm.price) || 0,
          condition: editForm.condition,
          category: editForm.category,
          category_id: catId,
          location_city: editForm.location,
          location_region: 'Kericho',
          seller_name: editForm.seller_name || currentUser?.user_metadata?.full_name,
          seller_phone: editForm.seller_phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingListing);
      if (error) throw error;
      setSuccessMsg('Listing updated successfully!');
      setEditingListing(null);
      setEditForm({});
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setEditError(err.message || 'Failed to update listing');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (listingId) => {
    setDeleteLoading(true);
    try {
      const result = await deleteListing(listingId);
      if (result.success) {
        setSuccessMsg('Listing deleted successfully!');
        setDeleteConfirm(null);
        await loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to delete listing');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="dashboard-page">
      {/* Success message */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-500/20 text-sm font-bold animate-slide-in">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/sell" className="flex items-center gap-2 bg-[#ff385c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#e03150] shadow-lg shadow-[#ff385c]/20 transition-all">
            <Plus className="w-5 h-5" />
            New Listing
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2 text-[#ff385c]">
            <Package className="w-6 h-6" />
            <h3 className="font-bold">Active Listings</h3>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{listings.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2 text-blue-500">
            <MessageSquare className="w-6 h-6" />
            <h3 className="font-bold">Total Inquiries</h3>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{inquiries}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Your Products</h2>

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelEdit} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Listing</h3>
              <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium border border-red-100 dark:border-red-900/50">
                {editError}
              </div>
            )}
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Title</label>
                <input required value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Price (KES)</label>
                  <input required type="number" value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Condition</label>
                  <select value={editForm.condition || 'New'} onChange={e => setEditForm({...editForm, condition: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    <option value="New">New</option>
                    <option value="Used - Like New">Used - Like New</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Fair">Used - Fair</option>
                    <option value="N/A">N/A (Services)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Category</label>
                  <select value={editForm.category || 'Electronics'} onChange={e => setEditForm({...editForm, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Location</label>
                  <select value={editForm.location || 'CBD'} onChange={e => setEditForm({...editForm, location: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea rows="3" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cancelEdit}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 bg-[#ff385c] text-white font-bold py-3 rounded-xl hover:bg-[#e03150] transition-all disabled:opacity-50">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
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

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex gap-4 group hover:shadow-lg transition-shadow">
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-zinc-900 dark:text-white truncate">{listing.title}</h4>
                <p className="text-[#ff385c] font-bold text-sm mb-1">{formatKES(listing.price)}</p>
                <div className="flex gap-2 mb-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {listing.status}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(listing)}
                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-[#ff385c] transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm({ id: listing.id, title: listing.title })}
                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <Link to={`/listing/${listing.id}`} className="ml-auto text-zinc-400 hover:text-[#ff385c] transition-colors p-1">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No products yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Start selling your items to see them here.</p>
          <Link to="/sell" className="text-[#ff385c] font-bold hover:underline">Post your first listing</Link>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
