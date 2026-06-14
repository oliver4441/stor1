import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, LogOut, ShoppingBag, ArrowRight, Search, Grid3X3, List, ChevronDown, ChevronUp, Clock, Gift, Copy, Check, Star, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchOrders, fetchListings, fetchAddresses, saveAddress, deleteAddress, setDefaultAddress, getReferralCode, getReferralStats, getLoyaltyPoints, getPointsHistory } from '../utils/api';
import { formatKES, CATEGORIES } from '../utils/constants';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUser(user);
      const [userOrders, allProducts, userAddresses, code, stats, pts, hist] = await Promise.all([
        fetchOrders(user.id),
        fetchListings('All', '', 1, 100),
        fetchAddresses(user.id),
        getReferralCode(user.id),
        getReferralStats(user.id),
        getLoyaltyPoints(user.id),
        getPointsHistory(user.id),
      ]);
      setOrders(userOrders);
      setProducts(allProducts.listings || allProducts);
      setAddresses(userAddresses);
      setReferralCode(code);
      setReferralCount(stats.count);
      setLoyaltyPoints(pts.points);
      setPointsHistory(hist);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500">Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="user-dashboard-page">
      <Breadcrumb />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">My Account</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {user?.user_metadata?.full_name || user?.email || 'there'}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/track-order" className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Track Order</h3>
            <p className="text-zinc-500 text-sm">Check delivery status</p>
          </div>
          <Package className="w-7 h-7 text-[#ff385c] group-hover:scale-110 transition-transform" />
        </Link>
        <div className="bg-gradient-to-br from-[#ff385c] to-[#e03150] p-5 rounded-2xl text-white">
          <h3 className="font-bold">My Orders</h3>
          <p className="text-white/70 text-sm">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Orders</h2>
            <button
              onClick={() => setExpandedOrders(
                Object.keys(expandedOrders).length === orders.slice(0, 3).length ? {} :
                Object.fromEntries(orders.slice(0, 3).map(o => [o.id, true]))
              )}
              className="text-xs font-bold text-[#ff385c] hover:underline"
            >
              {Object.keys(expandedOrders).length === orders.slice(0, 3).length ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => {
              const isExpanded = !!expandedOrders[order.id];
              return (
                <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-200">
                  {/* Header - always visible */}
                  <button
                    onClick={() => setExpandedOrders(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30' :
                        order.status === 'shipped' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <Package className={`w-4 h-4 ${
                          order.status === 'delivered' ? 'text-green-600' :
                          order.status === 'shipped' ? 'text-purple-600' :
                          'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <span className="font-mono text-xs text-zinc-400">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{order.status}</span>
                      <span className="font-bold text-[#ff385c] text-sm">{formatKES(order.total_amount)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 space-y-3 animate-slide-down">
                      {/* Order items from the items JSON */}
                      {order.omix_order_items && Array.isArray(order.omix_order_items) && order.omix_order_items.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Items</p>
                          {order.omix_order_items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-700" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-zinc-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.name || item.title}</p>
                                <p className="text-xs text-zinc-500">Qty: {item.quantity || 1}</p>
                              </div>
                              {item.price && <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatKES(item.price * (item.quantity || 1))}</span>}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Contact info */}
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

                      {/* Action */}
                      <Link to={`/track-order?orderId=${order.id}`} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#ff385c]/10 text-[#ff385c] font-bold text-sm hover:bg-[#ff385c]/20 transition-colors">
                        Track Order
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">All Products</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] text-sm text-zinc-900 dark:text-white w-48" />
            </div>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${activeCategory === cat ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800'}`}>
              {cat}
            </button>
          ))}
        </div>

        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6' : 'space-y-3'}>
            {filteredProducts.map(product => (
              viewMode === 'grid' ? (
                <ProductCard key={product.id} listing={product} />
              ) : (
                <Link key={product.id} to={`/listing/${product.id}`} className="flex gap-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 group">
                  <div className="w-24 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400"><Package className="w-6 h-6" /></div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-zinc-900 dark:text-white truncate">{product.title}</h3>
                    <p className="text-xs text-zinc-500">{product.category} • {product.condition}</p>
                    <p className="text-[#ff385c] font-bold mt-1">{formatKES(product.price)}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-400 self-center group-hover:text-[#ff385c] transition-colors" />
                </Link>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No products found</h3>
            <p className="text-zinc-500 text-sm">Try a different category or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
