import { useState, useEffect } from 'react';
import { Search, Package, CheckCircle, Truck, Clock, XCircle, MapPin } from 'lucide-react';
import { fetchOrder, cancelOrderWithReason, submitReturnRequest } from '../utils/api';
import { formatKES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

const STATUS_LABELS = {
  pending: 'Order Placed',
  cod_pending: 'Cash on Delivery',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

const STEP_ICONS = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function TrackOrder() {
  const params = new URLSearchParams(window.location.search);
  const orderIdParam = params.get('orderId') || '';

  const [orderId, setOrderId] = useState(orderIdParam);
  const [order, setOrder] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState('');

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
      setTrackingEvents([]);
    }
    setLoading(false);
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) return;
    setReturnSubmitting(true);
    setReturnError('');
    setReturnSuccess('');
    try {
      const result = await submitReturnRequest(order.id, returnReason.trim());
      if (result.success) {
        setReturnSuccess('Return request submitted successfully.');
        setReturnReason('');
        setShowReturnForm(false);
      } else {
        setReturnError(result.error || 'Failed to submit return request.');
      }
    } catch (err) {
      setReturnError('Failed to submit return request. Please try again.');
    }
    setReturnSubmitting(false);
  };

  const handleCancelOrder = async () => {
    setCancelSubmitting(true);
    setCancelError('');
    try {
      const result = await cancelOrderWithReason(order.id, cancelReason.trim() || null);
      if (result.success) {
        setOrder(prev => ({ ...prev, status: 'cancelled' }));
        setShowCancelForm(false);
        setCancelReason('');
      } else {
        setCancelError(result.error || 'Failed to cancel order.');
      }
    } catch (err) {
      setCancelError('Failed to cancel order. Please try again.');
    }
    setCancelSubmitting(false);
  };

  // Fetch tracking events when order is loaded
  useEffect(() => {
    if (!order) {
      setTrackingEvents([]);
      return;
    }
    const fetchTracking = async () => {
      setEventsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders/${order.id}/tracking`);
        if (res.ok) {
          const data = await res.json();
          setTrackingEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch tracking events:', err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchTracking();
  }, [order]);

  // Build timeline steps based on order status and tracking events
  const getTimelineSteps = () => {
    if (!order) return [];

    const isCancelled = order.status === 'cancelled';
    const steps = [];

    // Build a map of status -> tracking event
    const eventMap = {};
    for (const event of trackingEvents) {
      if (!eventMap[event.status]) {
        eventMap[event.status] = event;
      }
    }

    // Determine which statuses are "completed"
    const currentStatusIndex = isCancelled
      ? STATUS_ORDER.length // cancelled is outside normal flow
      : STATUS_ORDER.indexOf(order.status);

    for (let i = 0; i < STATUS_ORDER.length; i++) {
      const status = STATUS_ORDER[i];
      const event = eventMap[status];
      const isCompleted = currentStatusIndex > i;
      const isCurrent = !isCancelled && currentStatusIndex === i;
      const isFuture = currentStatusIndex < i || isCancelled;

      steps.push({
        status,
        label: STATUS_LABELS[status],
        icon: STEP_ICONS[status],
        isCompleted,
        isCurrent,
        isFuture,
        timestamp: event?.created_at || null,
        note: event?.note || null,
      });
    }

    // Add cancelled step at the end if cancelled
    if (isCancelled) {
      const cancelEvent = eventMap['cancelled'];
      steps.push({
        status: 'cancelled',
        label: 'Cancelled',
        icon: XCircle,
        isCompleted: true,
        isCurrent: false,
        isFuture: false,
        isCancelled: true,
        timestamp: cancelEvent?.created_at || null,
        note: cancelEvent?.note || null,
      });
    }

    return steps;
  };

  const timelineSteps = getTimelineSteps();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-name="track-order-page">
      <Breadcrumb />
      <h1 className="text-3xl font-black text-white mb-8">Track Your Order</h1>

      {/* Search */}
      <div className="flex gap-3 mb-8">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter order ID..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none text-white placeholder-zinc-500"
          />
        </div>
        <button onClick={handleSearch} disabled={loading}
          className="bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors disabled:opacity-50">
          {loading ? 'Searching...' : 'Track'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-900/50">
          {error}
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Order Details Card */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-400">Order ID</p>
                <p className="font-mono font-bold text-white">{String(order.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-zinc-400">Date</p>
                <p className="font-bold text-white">{new Date(order.created_at).toLocaleDateString('en-KE')}</p>
              </div>
              <div>
                <p className="text-zinc-400">Customer</p>
                <p className="font-bold text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-zinc-400">Total</p>
                <p className="font-bold text-[var(--seasonal-primary,#1a5632)]">{formatKES(order.total_amount)}</p>
              </div>
              {order.phone && (
                <div>
                  <p className="text-zinc-400">Phone</p>
                  <p className="font-bold text-white">{order.phone}</p>
                </div>
              )}
              {order.alternate_phone && (
                <div>
                  <p className="text-zinc-400">Alt. Phone</p>
                  <p className="font-bold text-white">{order.alternate_phone}</p>
                </div>
              )}
              {order.id_number && (
                <div>
                  <p className="text-zinc-400">ID Number</p>
                  <p className="font-bold text-white">{order.id_number}</p>
                </div>
              )}
              {order.delivery_type === 'delivery' && order.scheduled_date && (
                <div>
                  <p className="text-zinc-400">Scheduled Date</p>
                  <p className="font-bold text-white">{new Date(order.scheduled_date).toLocaleDateString('en-KE')}</p>
                </div>
              )}
            </div>
            {order.address && (
              <div className="mt-4 flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <p className="text-zinc-400">{order.address}{order.city ? `, ${order.city}` : ''}</p>
              </div>
            )}
            {order.street && (
              <div className="mt-1 flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <p className="text-zinc-400">Street/Plot: {order.street}</p>
              </div>
            )}
            {order.delivery_instructions && (
              <div className="mt-2 p-3 rounded-xl bg-zinc-800/50 text-sm">
                <p className="text-xs text-zinc-500 mb-1 font-semibold">Delivery Instructions</p>
                <p className="text-zinc-400">{order.delivery_instructions}</p>
              </div>
            )}
            {order.order_notes && (
              <div className="mt-2 p-3 rounded-xl bg-zinc-800/50 text-sm">
                <p className="text-xs text-zinc-500 mb-1 font-semibold">Order Notes</p>
                <p className="text-zinc-400">{order.order_notes}</p>
              </div>
            )}

            {/* Cancel Order */}
            {['pending', 'processing'].includes(order.status) && !showCancelForm && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <button onClick={() => setShowCancelForm(true)}
                  className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                  Cancel Order
                </button>
              </div>
            )}

            {['pending', 'processing'].includes(order.status) && showCancelForm && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-2">Cancel Order</h3>
                {cancelError && (
                  <div className="bg-red-900/20 text-red-600 p-3 rounded-xl mb-3 text-xs font-medium border border-red-900/50">
                    {cancelError}
                  </div>
                )}
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (optional)..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-800 border border-zinc-700 focus:border-red-500 focus:outline-none text-white placeholder-zinc-500 text-sm resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowCancelForm(false); setCancelError(''); }}
                    className="flex-1 bg-zinc-800 text-zinc-300 font-bold px-4 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors text-xs">
                    Keep Order
                  </button>
                  <button onClick={handleCancelOrder} disabled={cancelSubmitting}
                    className="flex-1 bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-xs">
                    {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pay on Delivery Info */}
          {order.payment_method === 'cod' && (
            <div className="bg-amber-900/10 border border-amber-800/30 rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">Pay on Delivery</h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <p>
                  This order is set to <strong>Cash on Delivery (COD)</strong>.
                  Please inspect the items thoroughly before making payment to the delivery agent.
                </p>
                <p>
                  If you are not satisfied with the condition of any item, you may refuse
                  delivery or request a return at the point of delivery.
                </p>
                <p className="text-amber-400 font-medium">
                  Do not pay for items that are damaged or not as described.
                </p>
              </div>
            </div>
          )}

          {/* Visual Timeline */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
            {eventsLoading ? (
              /* Skeleton loader */
              <div className="space-y-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                    <div className="flex-grow space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-32" />
                      <div className="h-3 bg-zinc-800/50 rounded w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-zinc-800" />

                <div className="space-y-0">
                  {timelineSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isLast = index === timelineSteps.length - 1;

                    return (
                      <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Dot + connecting line */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                            step.isCancelled
                              ? 'bg-red-900/30 border-2 border-red-500'
                              : step.isCompleted
                                ? 'bg-emerald-900/30 border-2 border-emerald-500'
                                : step.isCurrent
                                  ? 'bg-blue-900/30 border-2 border-blue-500 animate-pulse'
                                  : 'bg-zinc-800 border-2 border-zinc-700'
                          }`}>
                            <StepIcon className={`w-4 h-4 ${
                              step.isCancelled
                                ? 'text-red-400'
                                : step.isCompleted
                                  ? 'text-emerald-400'
                                  : step.isCurrent
                                    ? 'text-blue-400'
                                    : 'text-zinc-500'
                            }`} />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 h-full bg-zinc-800 mt-0" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-grow pb-0 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${
                              step.isCancelled
                                ? 'text-red-400'
                                : step.isCompleted
                                  ? 'text-emerald-400'
                                  : step.isCurrent
                                    ? 'text-blue-400'
                                    : 'text-zinc-500'
                            }`}>
                              {step.label}
                            </span>
                            {step.isCurrent && !step.isCancelled && (
                              <span className="text-[10px] font-medium text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>

                          {step.timestamp && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {new Date(step.timestamp).toLocaleDateString('en-KE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}

                          {step.note && (
                            <p className="text-xs text-zinc-400 mt-1 bg-zinc-800/50 px-3 py-1.5 rounded-lg inline-block">
                              {step.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {timelineSteps.length === 0 && (
                  <p className="text-zinc-500 text-sm text-center py-4">No tracking information available yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Items</h2>
            <div className="space-y-3">
              {(order.omix_order_items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-white text-sm">{item.product_name}</p>
                    <p className="text-xs text-zinc-400">Qty: {item.quantity}</p>
                    {item.variant_size && <p className="text-xs text-zinc-400">Size: {item.variant_size}</p>}
                    {item.variant_color && <p className="text-xs text-zinc-400">Color: {item.variant_color}</p>}
                    {item.variant_label && <p className="text-xs text-zinc-400">{item.variant_label}</p>}
                  </div>
                  <p className="font-bold text-white text-sm">{formatKES(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Return Request */}
          {order.status === 'delivered' && !showReturnForm && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Need to return an item?</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    You can request a return within 7 days of delivery.
                  </p>
                </div>
                <button onClick={() => setShowReturnForm(true)}
                  className="bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors text-sm">
                  Request Return
                </button>
              </div>
            </div>
          )}

          {order.status === 'delivered' && showReturnForm && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-white mb-3">Submit Return Request</h2>
              {returnSuccess ? (
                <div className="bg-emerald-900/20 text-emerald-400 p-4 rounded-xl text-sm font-medium border border-emerald-900/50">
                  {returnSuccess}
                </div>
              ) : (
                <>
                  {returnError && (
                    <div className="bg-red-900/20 text-red-600 p-4 rounded-xl mb-4 text-sm font-medium border border-red-900/50">
                      {returnError}
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-xs text-zinc-400 mb-2">Order ID</p>
                    <p className="font-mono font-bold text-white text-sm">{String(order.id).slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-zinc-400 mb-2">Reason for Return</label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Tell us why you want to return this item..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-800 border border-zinc-700 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none text-white placeholder-zinc-500 text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowReturnForm(false); setReturnError(''); }}
                      className="flex-1 bg-zinc-800 text-zinc-300 font-bold px-6 py-3 rounded-2xl hover:bg-zinc-700 transition-colors text-sm">
                      Cancel
                    </button>
                    <button onClick={handleReturnRequest} disabled={returnSubmitting || !returnReason.trim()}
                      className="flex-1 bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors disabled:opacity-50 text-sm">
                      {returnSubmitting ? 'Submitting...' : 'Submit Return Request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!order && !error && searched && (
        <div className="text-center py-12 text-zinc-400">No order found with that ID.</div>
      )}
    </div>
  );
}
