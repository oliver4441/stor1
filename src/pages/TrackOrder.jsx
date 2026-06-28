import { useState } from 'react';
import { Search, Package, CheckCircle, Clock, Truck, MapPin, AlertTriangle } from 'lucide-react';
import { fetchOrder } from '../utils/api';
import { formatKES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Delivered' },
  cancelled: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Cancelled' },
};

export default function TrackOrder() {
  const params = new URLSearchParams(window.location.search);
  const orderIdParam = params.get('orderId') || '';

  const [orderId, setOrderId] = useState(orderIdParam);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    const result = await fetchOrder(orderId.trim());
    if (result) {
      setOrder(result);
    } else {
      setError('Order not found. Please check the order ID and try again.');
      setOrder(null);
    }
    setLoading(false);
  };

  const statusConfig = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending) : null;
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-name="track-order-page">
      <Breadcrumb />
      <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-8">Track Your Order</h1>

      {/* Search */}
      <div className="flex gap-3 mb-8">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order ID..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none text-zinc-900 dark:text-white"
          />
        </div>
        <button onClick={handleSearch} disabled={loading}
          className="bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors disabled:opacity-50">
          {loading ? 'Searching...' : 'Track'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`p-6 rounded-3xl border ${statusConfig.bg} border-zinc-200 dark:border-zinc-800`}>
            <div className="flex items-center gap-4">
              <StatusIcon className={`w-10 h-10 ${statusConfig.color}`} />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Order Status</p>
                <p className={`text-2xl font-black ${statusConfig.color}`}>{statusConfig.label}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Order ID</p>
                <p className="font-mono font-bold text-zinc-900 dark:text-white">{String(order.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Date</p>
                <p className="font-bold text-zinc-900 dark:text-white">{new Date(order.created_at).toLocaleDateString('en-KE')}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Customer</p>
                <p className="font-bold text-zinc-900 dark:text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Total</p>
                <p className="font-bold text-[var(--seasonal-primary,#1a5632)]">{formatKES(order.total_amount)}</p>
              </div>
            </div>
            {order.address && (
              <div className="mt-4 flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <p className="text-zinc-600 dark:text-zinc-400">{order.address}{order.city ? `, ${order.city}` : ''}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Items</h2>
            <div className="space-y-3">
              {(order.omix_order_items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-zinc-900 dark:text-white text-sm">{item.product_name}</p>
                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{formatKES(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!order && !error && searched && (
        <div className="text-center py-12 text-zinc-500">No order found with that ID.</div>
      )}
    </div>
  );
}
