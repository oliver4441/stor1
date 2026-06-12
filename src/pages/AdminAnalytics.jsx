import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Package, Calendar } from 'lucide-react';
import { fetchAllOrders, fetchAllListings } from '../utils/api';
import { formatKES } from '../utils/constants';

export default function AdminAnalytics() {
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [allOrders, allListings] = await Promise.all([fetchAllOrders(), fetchAllListings()]);
    setOrders(allOrders);
    setListings(allListings);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter orders by date range
  const daysAgo = parseInt(dateRange);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const filteredOrders = orders.filter(o => new Date(o.created_at) >= cutoffDate);

  // Revenue stats
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Orders by status
  const ordersByStatus = {};
  filteredOrders.forEach(o => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  });

  // Revenue by day (last N days)
  const revenueByDay = {};
  filteredOrders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(o.total_amount || 0);
  });
  const chartData = Object.entries(revenueByDay).slice(-14);
  const maxRevenue = Math.max(...chartData.map(([, v]) => v), 1);

  // Top products
  const productSales = {};
  filteredOrders.forEach(order => {
    (order.omix_order_items || []).forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, count: 0, revenue: 0 };
      }
      productSales[item.product_name].count += item.quantity;
      productSales[item.product_name].revenue += (item.price * item.quantity);
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Category breakdown
  const categoryBreakdown = {};
  filteredOrders.forEach(order => {
    (order.omix_order_items || []).forEach(item => {
      // Find the listing to get category
      const listing = listings.find(l => l.id === item.product_id);
      const cat = listing?.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (item.price * item.quantity);
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Analytics</h2>
          <p className="text-sm text-zinc-500">Sales performance overview</p>
        </div>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white appearance-none">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{formatKES(totalRevenue)}</p>
          <p className="text-xs text-zinc-500 mt-1">Revenue</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <ShoppingBag className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{filteredOrders.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Orders</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{formatKES(avgOrderValue)}</p>
          <p className="text-xs text-zinc-500 mt-1">Avg Order</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <Package className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{listings.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Products</p>
        </div>
      </div>

      {/* Revenue Chart (simple bar chart) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Revenue Trend</h3>
        {chartData.length > 0 ? (
          <div className="flex items-end gap-2 h-40">
            {chartData.map(([day, revenue]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#ff385c]/20 rounded-t-lg relative group" style={{ height: `${Math.max((revenue / maxRevenue) * 100, 5)}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatKES(revenue)}
                  </div>
                </div>
                <span className="text-[9px] text-zinc-400 rotate-45 origin-left mt-2">{day}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">No data for this period</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[180px]">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.count} sold</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatKES(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">No sales data</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Sales by Category</h3>
          {Object.keys(categoryBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a).map(([cat, revenue]) => {
                const pct = totalRevenue > 0 ? (revenue / totalRevenue * 100).toFixed(0) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{cat}</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatKES(revenue)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#ff385c] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">No category data</p>
          )}
        </div>
      </div>
    </div>
  );
}
