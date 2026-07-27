import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Package, Calendar, Users, BarChart3, Activity } from 'lucide-react';
import { fetchAllOrders, fetchAllListings } from '../utils/api';
import { formatKES } from '../utils/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';

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

  const daysAgo = parseInt(dateRange);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const filteredOrders = orders.filter(o => new Date(o.created_at) >= cutoffDate);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Unique customers
  const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_name || o.email || 'Unknown'));
  const customerCount = uniqueCustomers.size;

  // Active listings count
  const activeListings = listings.filter(l => l.status === 'active' || l.status === 'published' || l.is_active === true).length;

  // Growth vs previous period
  const prevCutoffDate = new Date(cutoffDate);
  prevCutoffDate.setDate(prevCutoffDate.getDate() - daysAgo);
  const prevPeriodOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= prevCutoffDate && d < cutoffDate;
  });
  const prevRevenue = prevPeriodOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const prevOrderCount = prevPeriodOrders.length;
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null;
  const orderGrowth = prevOrderCount > 0 ? ((filteredOrders.length - prevOrderCount) / prevOrderCount * 100).toFixed(1) : null;

  // Orders by status
  const ordersByStatus = {};
  filteredOrders.forEach(o => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  });
  const statusData = Object.entries(ordersByStatus).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }));

  // Revenue by day for chart
  const revenueByDay = {};
  const ordersByDay = {};
  filteredOrders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(o.total_amount || 0);
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
  });

  // Build chart data - fill in missing days with 0
  const chartDays = [];
  for (let i = daysAgo - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    chartDays.push(d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }));
  }
  const chartData = chartDays.map(day => ({
    day,
    revenue: Math.round(revenueByDay[day] || 0),
    orders: ordersByDay[day] || 0,
  }));

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
      const listing = listings.find(l => l.id === item.product_id);
      const cat = listing?.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (item.price * item.quantity);
    });
  });
  const categoryData = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const CHART_COLORS = ['#0d9488', '#71717a', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const STATUS_COLORS = { pending: '#f59e0b', processing: '#71717a', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-bold text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-zinc-400">
            {p.name === 'revenue' ? 'Revenue' : 'Orders'}: <span className="font-bold">{p.name === 'revenue' ? formatKES(p.value) : p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-zinc-400">Sales performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white appearance-none">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="fusion-recessed-card p-5">
          <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-black text-white">{formatKES(totalRevenue)}</p>
          <p className="text-xs text-zinc-400 mt-1">Revenue</p>
        </div>
        <div className="fusion-recessed-card p-5">
          <ShoppingBag className="w-5 h-5 text-zinc-600 mb-2" />
          <p className="text-2xl font-black text-white">{filteredOrders.length}</p>
          <p className="text-xs text-zinc-400 mt-1">Orders</p>
        </div>
        <div className="fusion-recessed-card p-5">
          <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-black text-white">{formatKES(avgOrderValue)}</p>
          <p className="text-xs text-zinc-400 mt-1">Avg Order</p>
        </div>
        <div className="fusion-recessed-card p-5">
          <Users className="w-5 h-5 text-zinc-500 mb-2" />
          <p className="text-2xl font-black text-white">{customerCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Customers</p>
        </div>
        <div className="fusion-recessed-card p-5">
          <Package className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-black text-white">{listings.length} / {activeListings}</p>
          <p className="text-xs text-zinc-400 mt-1">Products</p>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="fusion-recessed-card p-4 flex items-center gap-6">
        <Activity className="w-5 h-5 text-emerald-500" />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Revenue Growth:</span>
            {revenueGrowth !== null ? (
              <span className={`font-bold flex items-center gap-1 ${parseFloat(revenueGrowth) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <TrendingUp className={`w-4 h-4 ${parseFloat(revenueGrowth) < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(parseFloat(revenueGrowth))}%
              </span>
            ) : (
              <span className="text-zinc-500">No prior data</span>
            )}
          </div>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Order Growth:</span>
            {orderGrowth !== null ? (
              <span className={`font-bold flex items-center gap-1 ${parseFloat(orderGrowth) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <TrendingUp className={`w-4 h-4 ${parseFloat(orderGrowth) < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(parseFloat(orderGrowth))}%
              </span>
            ) : (
              <span className="text-zinc-500">No prior data</span>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="fusion-recessed-card p-5">
        <h3 className="text-base font-bold text-white mb-4">Revenue Trend</h3>
        {chartData.length > 0 && chartData.some(d => d.revenue > 0) ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={60} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">No revenue data for this period</div>
        )}
      </div>

      {/* Orders Chart */}
      <div className="fusion-recessed-card p-5">
        <h3 className="text-base font-bold text-white mb-4">Orders Over Time</h3>
        {chartData.length > 0 && chartData.some(d => d.orders > 0) ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#71717a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-56 text-zinc-400 text-sm">No order data for this period</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-base font-bold text-white mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${CHART_COLORS[i]}20`, color: CHART_COLORS[i] }}>{i + 1}</span>
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
            <p className="text-sm text-zinc-400 text-center py-8">No sales data</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-base font-bold text-white mb-4">Sales by Category</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((cat, i) => {
                const pct = totalRevenue > 0 ? (cat.value / totalRevenue * 100).toFixed(0) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-zinc-300">{cat.name}</span>
                      <span className="text-sm font-bold text-white">{formatKES(cat.value)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
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

      {/* Orders by Status */}
      <div className="fusion-recessed-card p-5">
        <h3 className="text-base font-bold text-white mb-4">Orders by Status</h3>
        {Object.keys(ordersByStatus).length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: '#e4e4e7' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#a1a1aa' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.status.toLowerCase()] || '#71717a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">No order data</div>
        )}
      </div>
    </div>
  );
}
