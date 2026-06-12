import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, LogOut, ShoppingBag, ArrowRight, Search, Grid3X3, List } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchOrders, fetchListings } from '../utils/api';
import { formatKES, CATEGORIES } from '../utils/constants';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setUser(user);
    const [userOrders, allProducts] = await Promise.all([fetchOrders(user.id), fetchListings('All', '')]);
    setOrders(userOrders);
    setProducts(allProducts);
    setLoading(false);
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
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
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
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => (
              <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-zinc-500">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                  <p className="text-sm text-zinc-500">{new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : order.status === 'shipped' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>{order.status}</span>
                <span className="font-bold text-[#ff385c]">{formatKES(order.total_amount)}</span>
                <Link to={`/track-order?orderId=${order.id}`} className="text-[#ff385c] font-bold text-sm hover:underline">Track →</Link>
              </div>
            ))}
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
