import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, LogOut, ShoppingBag, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchOrders } from '../utils/api';
import { formatKES } from '../utils/constants';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setUser(user);
    const userOrders = await fetchOrders(user.id);
    setOrders(userOrders);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">My Account</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Link to="/" className="bg-gradient-to-br from-[#ff385c] to-[#e03150] p-6 rounded-3xl text-white flex items-center justify-between group">
          <div>
            <h3 className="font-bold text-lg">Continue Shopping</h3>
            <p className="text-white/70 text-sm">Browse products</p>
          </div>
          <ShoppingBag className="w-8 h-8 group-hover:scale-110 transition-transform" />
        </Link>
        <Link to="/track-order" className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Track Order</h3>
            <p className="text-zinc-500 text-sm">Check delivery status</p>
          </div>
          <Package className="w-8 h-8 text-[#ff385c] group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* Orders */}
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">My Orders</h2>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                      #{String(order.id).slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                      'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {(order.omix_order_items || []).length} item{(order.omix_order_items || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black text-[#ff385c]">{formatKES(order.total_amount)}</span>
                  <Link to={`/track-order?orderId=${order.id}`} className="flex items-center gap-1 text-sm font-bold text-[#ff385c] hover:underline">
                    Track <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No orders yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Start shopping to see your orders here.</p>
          <Link to="/" className="text-[#ff385c] font-bold hover:underline">Browse Products</Link>
        </div>
      )}
    </div>
  );
}
