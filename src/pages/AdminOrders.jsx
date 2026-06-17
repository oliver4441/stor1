import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Eye, X, Calendar, Download, RefreshCw, MessageSquare, Package, MapPin, Phone, Mail, User, Clock, AlertTriangle } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus, updateOrderNotes, cancelOrder } from '../utils/api';
import { formatKES } from '../utils/constants';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
// Valid transitions: pending -> processing -> shipped -> delivered, or any -> cancelled
const VALID_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: '0' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const timersRef = useRef([]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  const addTimer = (fn, ms) => {
    const id = setTimeout(() => { fn(); timersRef.current = timersRef.current.filter(t => t !== id); }, ms);
    timersRef.current.push(id);
    return id;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const allOrders = await fetchAllOrders();
      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setErrorMsg('Failed to load orders. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchQuery ||
      String(o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone?.includes(searchQuery);
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    let matchDate = true;
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysAgo);
      matchDate = new Date(o.created_at) >= cutoff;
    }
    return matchSearch && matchStatus && matchDate;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    const currentOrder = orders.find(o => o.id === orderId);
    if (currentOrder) {
      const allowed = VALID_TRANSITIONS[currentOrder.status] || [];
      if (!allowed.includes(newStatus)) {
        setErrorMsg('Cannot change from "' + currentOrder.status + '" to "' + newStatus + '"');
        addTimer(() => setErrorMsg(''), 5000);
        return;
      }
    }
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      setSuccessMsg('Status updated');
      addTimer(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg('Failed to update status: ' + (result.error || 'Unknown error'));
      addTimer(() => setErrorMsg(''), 5000);
    }
  };

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    const result = await cancelOrder(orderId);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
      setSuccessMsg('Order cancelled');
      addTimer(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg('Failed to cancel: ' + (result.error || 'Unknown error'));
      addTimer(() => setErrorMsg(''), 5000);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    const result = await updateOrderNotes(selectedOrder.id, notesValue);
    if (result.success) {
      setSelectedOrder(prev => ({ ...prev, admin_notes: notesValue }));
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, admin_notes: notesValue } : o));
      setEditingNotes(false);
      setSuccessMsg('Notes saved');
      addTimer(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg('Failed to save notes: ' + (result.error || 'Unknown error'));
      addTimer(() => setErrorMsg(''), 5000);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Date', 'Address'];
    const escapeCSV = (val) => {
      const s = String(val ?? '');
      // Prevent CSV injection: strip leading =, +, -, @, tab, CR
      const sanitized = s.replace(/^[=+\-@\t\r]/, '');
      return `"${sanitized.replace(/"/g, '""')}"`;
    };
    const rows = filteredOrders.map(o => [
      String(o.id).slice(0, 8).toUpperCase(),
      o.customer_name || 'Guest',
      o.email || '',
      o.phone || '',
      o.total_amount,
      o.status,
      new Date(o.created_at).toLocaleDateString('en-KE'),
      `${o.address || ''} ${o.city || ''}`.trim(),
    ]);
    const csv = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setNotesValue(order.admin_notes || '');
    setEditingNotes(false);
  };

  // Summary stats
  const totalAmount = filteredOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const pendingCount = filteredOrders.filter(o => o.status === 'pending').length;
  const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="space-y-6 max-w-7xl">
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-500/20 text-sm font-bold">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="fixed top-28 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-red-500/20 text-sm font-bold">{errorMsg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Orders</h2>
          <p className="text-sm text-zinc-500">{filteredOrders.length} orders - {formatKES(totalAmount)} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Orders</p>
          <p className="text-xl font-black text-zinc-900 dark:text-white">{filteredOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-1">Pending</p>
          <p className="text-xl font-black text-amber-500">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 mb-1">Cancelled</p>
          <p className="text-xl font-black text-red-500">{cancelledCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
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
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white appearance-none">
          {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                      <p className="text-xs text-zinc-400">{new Date(order.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-zinc-100 text-zinc-600'}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openOrderDetail(order)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-[#ff385c]" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button onClick={() => handleCancel(order.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500" title="Cancel order">
                            <X className="w-4 h-4" />
                          </button>
                        )}
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
          <p className="text-sm text-zinc-500">{searchQuery || filterStatus !== 'All' || dateRange !== 'all' ? 'Try adjusting your filters' : 'Orders will appear here when customers place them'}</p>
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

            {/* Status + Actions */}
            <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <select value={selectedOrder.status} onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className={`text-sm font-bold px-3 py-2 rounded-xl border-0 cursor-pointer ${STATUS_COLORS[selectedOrder.status]}`}>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <button onClick={() => handleCancel(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cancel Order
                </button>
              )}
            </div>

            {/* Customer Info */}
            <div className="mb-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Customer</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="truncate">{selectedOrder.customer_name || 'Guest'}</span>
                </div>
                {selectedOrder.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="truncate">{selectedOrder.email}</span>
                  </div>
                )}
                {selectedOrder.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    {selectedOrder.phone}
                  </div>
                )}
                {selectedOrder.address && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    {selectedOrder.address}{selectedOrder.city ? `, ${selectedOrder.city}` : ''}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Items */}
            {selectedOrder.omix_order_items && selectedOrder.omix_order_items.length > 0 && (
              <div className="mb-5">
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
                          <p className="text-xs text-zinc-500">Qty: {item.quantity} x {formatKES(item.price)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatKES(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Internal Notes
                </h4>
                {!editingNotes && (
                  <button onClick={() => setEditingNotes(true)} className="text-xs font-semibold text-[#ff385c] hover:underline">
                    {selectedOrder.admin_notes ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea rows="3" value={notesValue} onChange={e => setNotesValue(e.target.value)}
                    placeholder="Add internal notes (only visible to admins)..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-sm text-zinc-900 dark:text-white resize-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingNotes(false); setNotesValue(selectedOrder.admin_notes || ''); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
                    <button onClick={handleSaveNotes}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ff385c] text-white hover:bg-[#e03150]">Save</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 min-h-[40px]">
                  {selectedOrder.admin_notes || <span className="text-zinc-400 italic">No internal notes</span>}
                </p>
              )}
            </div>

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
