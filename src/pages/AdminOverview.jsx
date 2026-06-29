import { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingBag, DollarSign, Banknote, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import { fetchAllListings, fetchAllOrders } from '../utils/api';

export default function AdminOverview() {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [allListings, allOrders] = await Promise.all([fetchAllListings(), fetchAllOrders()]);
      setListings(allListings);
      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeListings = listings.filter(l => l.status === 'active').length;
  const lowStock = listings.filter(l => l.quantity > 0 && l.quantity <= 3).length;
  const outOfStock = listings.filter(l => l.quantity === 0).length;

  // COD stats
  const codOrders = orders.filter(o => o.status === 'cod_pending' || o.payment_method === 'cod');
  const codRevenue = codOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const codProductCount = codOrders.reduce((sum, o) => sum + (o.omix_order_items || []).reduce((s, i) => s + (i.quantity || 1), 0), 0);

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Top products by order count
  const productSales = {};
  orders.forEach(order => {
    (order.omix_order_items || []).forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, count: 0, revenue: 0 };
      }
      productSales[item.product_name].count += item.quantity;
      productSales[item.product_name].revenue += (item.price * item.quantity);
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Products', value: listings.length, icon: Package, color: 'text-primary', bg: 'bg-primary/10', change: `${activeListings} active` },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10', change: `${pendingOrders} pending` },
    { label: 'Revenue (Online)', value: formatKES(totalRevenue), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', change: 'Paid orders' },
    { label: 'Cash on Delivery', value: formatKES(codRevenue), icon: Banknote, color: 'text-orange-500', bg: 'bg-orange-500/10', change: `${codOrders.length} orders • ${codProductCount} items` },
    { label: 'Low Stock', value: lowStock + outOfStock, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', change: `${outOfStock} out of stock` },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{stat.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Orders</h3>
            <a href="/admin/orders" className="text-xs font-semibold text-primary hover:underline">View all orders</a>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      #{String(order.id).slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-zinc-400">{order.customer_name || 'Guest'} • {order.phone || 'No phone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatKES(order.total_amount)}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'cod_pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>{order.status === 'cod_pending' ? 'COD' : order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Top Products</h3>
            <a href="/admin/products" className="text-xs font-semibold text-primary hover:underline">View all products</a>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-white truncate max-w-[180px]">{product.name}</p>
                      <p className="text-xs text-zinc-400">{product.count} sold</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatKES(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sales data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
        <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/admin/products" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-primary">Add Product</span>
          </a>
          <a href="/admin/orders" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-blue-900/20 hover:border-blue-500/30 border border-transparent transition-all group">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-blue-500">View Orders</span>
          </a>
          <a href="/admin/analytics" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500/30 border border-transparent transition-all group">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-emerald-500">Analytics</span>
          </a>
          <a href="/" target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500/30 border border-transparent transition-all group">
            <Eye className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-purple-500">View Store</span>
          </a>
        </div>
      </div>
    </div>
  );
}
