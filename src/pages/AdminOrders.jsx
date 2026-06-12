import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, X, ChevronDown, Package, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus } from '../utils/api';
import { formatKES } from '../utils/constants';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const allOrders = await fetchAllOrders();
    setOrders(allOrders);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchQuery ||
      String(o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone?.includes(searchQuery);
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Orders</h2>
          <p className="text-sm text-zinc-500">{orders.length} total • {filteredOrders.length} shown</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text" placeholder="Search by ID, name, email, phone..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:border-[#ff385c] focus:outline-none"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white appearance-none">
          <option value="All">All Status</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Order</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden md:table-cell">Customer</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Total</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-bold text-zinc-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-white">#{String(order.id).slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-zinc-400">{order.omix_order_items?.length || 0} items</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{order.customer_name || 'Guest'}</p>
                      <p className="text-xs text-zinc-500">{order.phone || order.email || 'No contact'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-[#ff385c]">{formatKES(order.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-zinc-100 text-zinc-600'}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-[#ff385c]" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No orders found</h3>
          <p className="text-sm text-zinc-500">{searchQuery || filterStatus !== 'All' ? 'Try adjusting your filters' : 'Orders will appear here when customers place them'}</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Order Details</h3>
                <p className="text-sm font-mono text-zinc-500">#{String(selectedOrder.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-5 h-5" /></button>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Status</label>
              <select value={selectedOrder.status} onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className={`text-sm font-bold px-3 py-2 rounded-xl border-0 cursor-pointer ${STATUS_COLORS[selectedOrder.status]}`}>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            {/* Customer Info */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Customer</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  {selectedOrder.customer_name || 'Guest'}
                </div>
                {selectedOrder.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    {selectedOrder.email}
                  </div>
                )}
                {selectedOrder.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    {selectedOrder.phone}
                  </div>
                )}
                {selectedOrder.address && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    {selectedOrder.address}{selectedOrder.city ? `, ${selectedOrder.city}` : ''}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Items */}
            {selectedOrder.omix_order_items && selectedOrder.omix_order_items.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.omix_order_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.product_name}</p>
                          <p className="text-xs text-zinc-500">Qty: {item.quantity} × {formatKES(item.price)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatKES(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Total</span>
              <span className="text-xl font-black text-[#ff385c]">{formatKES(selectedOrder.total_amount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
