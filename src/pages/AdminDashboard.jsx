import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Package, ShoppingBag, DollarSign, Pencil, Trash2, X, AlertTriangle, CheckCircle, Loader2, LogOut, Shield, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchAllListings, createListing, updateListing, deleteListing, adminDeleteListing, fetchAllOrders, updateOrderStatus, isAdmin } from '../utils/api';
import { formatKES, CATEGORIES } from '../utils/constants';
import { uploadImage } from '../utils/api';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'For Parts'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  // Product form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', price: '', description: '', category: 'Electronics', condition: 'New', location: 'CBD',
    image_url: '', quantity: '1', brand: '', model: '', color: '', weight: '', sku: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const admin = await isAdmin();
    if (!admin) { navigate('/account'); return; }
    setUser(user);
    const [allListings, allOrders] = await Promise.all([fetchAllListings(), fetchAllOrders()]);
    setListings(allListings);
    setOrders(allOrders);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ title: '', price: '', description: '', category: 'Electronics', condition: 'New', location: 'CBD', image_url: '', quantity: '1', brand: '', model: '', color: '', weight: '', sku: '' });
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (listing) => {
    setEditingId(listing.id);
    setForm({
      title: listing.title, price: String(listing.price), description: listing.description || '',
      category: listing.category || 'Electronics', condition: listing.condition || 'New',
      location: listing.location_city || 'CBD', image_url: listing.images?.[0] || '',
      quantity: String(listing.quantity || 1), brand: listing.brand || '', model: listing.model || '',
      color: listing.color || '', weight: listing.weight || '', sku: listing.sku || ''
    });
    setImagePreview(listing.images?.[0] || null);
    setModalOpen(true);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const result = await uploadImage(file);
    if (result.success) {
      setForm(prev => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
    } else {
      alert(result.error || 'Image upload failed');
    }
    setImageUploading(false);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title, description: form.description, price: form.price,
      category: form.category, condition: form.condition, location: form.location,
      image_url: form.image_url, quantity: form.quantity, brand: form.brand,
      model: form.model, color: form.color, weight: form.weight, sku: form.sku,
    };
    const result = editingId ? await updateListing(editingId, payload) : await createListing(payload);
    if (result.success) {
      setSuccessMsg(editingId ? 'Product updated!' : 'Product added!');
      setModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert('Error: ' + result.error);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Try admin delete first, then regular delete
    let result = await adminDeleteListing(deleteTarget.id);
    if (!result.success) {
      result = await deleteListing(deleteTarget.id);
    }
    if (result.success) {
      setSuccessMsg('Product deleted!');
      setDeleteTarget(null);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert('Delete failed: ' + (result.error || 'Unknown error. Check RLS policies in Supabase.'));
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="admin-dashboard-page">
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-500/20 text-sm font-bold animate-slide-in">{successMsg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#ff385c]" /> Admin Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your store</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Package className="w-6 h-6 text-[#ff385c] mb-2" />
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{listings.length}</p>
          <p className="text-xs text-zinc-500">Products</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <ShoppingBag className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{orders.length}</p>
          <p className="text-xs text-zinc-500">Orders</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <DollarSign className="w-6 h-6 text-emerald-500 mb-2" />
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{formatKES(totalRevenue)}</p>
          <p className="text-xs text-zinc-500">Revenue</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{pendingOrders}</p>
          <p className="text-xs text-zinc-500">Pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('products')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-[#ff385c] text-white shadow-lg shadow-[#ff385c]/20' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'}`}>
          Products ({listings.length})
        </button>
        <button onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-[#ff385c] text-white shadow-lg shadow-[#ff385c]/20' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'}`}>
          Orders ({orders.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">All Products</h2>
            <button onClick={openAddModal} className="flex items-center gap-2 bg-[#ff385c] text-white px-5 py-3 rounded-2xl font-bold hover:bg-[#e03150] shadow-lg shadow-[#ff385c]/20 transition-all">
              <Plus className="w-5 h-5" /> Add Product
            </button>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <div key={listing.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 relative">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400"><ImageIcon className="w-12 h-12" /></div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-green-500 text-white' : 'bg-zinc-500 text-white'}`}>{listing.status}</span>
                      {listing.quantity <= 3 && listing.quantity > 0 && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">Only {listing.quantity} left</span>}
                      {listing.quantity === 0 && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">Out of stock</span>}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-zinc-900 dark:text-white truncate">{listing.title}</h4>
                    <p className="text-[#ff385c] font-bold text-sm">{formatKES(listing.price)}</p>
                    <p className="text-xs text-zinc-500 mt-1">{listing.category} • {listing.condition} • Qty: {listing.quantity || 'N/A'}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEditModal(listing)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget({ id: listing.id, title: listing.title })} className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No products yet</h3>
              <button onClick={openAddModal} className="text-[#ff385c] font-bold hover:underline">Add your first product</button>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">All Orders</h2>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">#{String(order.id).slice(0, 8).toUpperCase()}</p>
                      <p className="font-bold text-zinc-900 dark:text-white">{order.customer_name || 'Guest'}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{order.phone} • {order.email || 'No email'}</p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-xs text-zinc-400">{order.address}{order.city ? `, ${order.city}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-black text-[#ff385c]">{formatKES(order.total_amount)}</span>
                      <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="px-3 py-2 rounded-xl text-sm font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  {order.omix_order_items && order.omix_order_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs font-bold text-zinc-500 mb-2">Items:</p>
                      {order.omix_order_items.map((item, i) => (
                        <p key={i} className="text-sm text-zinc-600 dark:text-zinc-400">{item.product_name} × {item.quantity} = {formatKES(item.price * item.quantity)}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No orders yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Orders will appear here when customers place them.</p>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Product Image *</label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border-2 border-dashed border-zinc-300 dark:border-zinc-600">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50">
                      {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload Image</>}
                    </button>
                    <p className="text-xs text-zinc-500 mt-2">JPG, PNG or WebP. Max 5MB. Image will be compressed automatically.</p>
                    {form.image_url && <p className="text-xs text-green-600 mt-1 font-medium">Image uploaded</p>}
                  </div>
                </div>
              </div>

              {/* Title & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Product Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. iPhone 13 Pro 256GB" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Price (KES) *</label>
                  <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="85000" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              {/* Category, Condition, Quantity */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Condition</label>
                  <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm appearance-none">
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Quantity *</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="1" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              {/* Brand, Model, Color */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Brand</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Apple" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Model</label>
                  <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. iPhone 13 Pro" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Color</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Pacific Blue" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              {/* Weight & SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Weight</label>
                  <input value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 0.5kg" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">SKU / Item Code</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g. IP13P-256-BLU" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the product in detail..." className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting || !form.image_url} className="flex-1 bg-[#ff385c] text-white font-bold py-3 rounded-xl disabled:opacity-50">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Saving...</> : (editingId ? 'Save Changes' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-600" /></div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">This will permanently delete "{deleteTarget.title}".</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-xl">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
