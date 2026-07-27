import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { trackPurchase } from '../utils/analytics';
import { sounds } from '../utils/sounds';

export default function OrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || 'N/A';

  // Track purchase on page load
  React.useEffect(() => {
    sounds.checkout();
    // Get order details from sessionStorage if available
    const storageKey = `omix_order_${orderId}`;
    const orderData = sessionStorage.getItem(storageKey);
    if (orderData) {
      try {
        const order = JSON.parse(orderData);
        trackPurchase(orderId, order.total, order.items || []);
        // Remove after reading to prevent duplicate tracking on refresh
        sessionStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('Failed to parse order data for tracking:', e);
      }
    }
  }, [orderId]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-name="order-success-page">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">Order Placed Successfully!</h1>
        <p className="text-zinc-400 mb-2">Thank you for your order. We will process it shortly.</p>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 mt-8 inline-block">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <Package className="w-5 h-5 text-[var(--seasonal-primary,#0d9488)]" />
            <span>Order ID: <strong className="text-white font-mono">{String(orderId).slice(0, 8).toUpperCase()}</strong></span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">Estimated delivery: 2-5 business days</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link to={`/track-order?orderId=${orderId}`}
            className="inline-flex items-center justify-center gap-2 bg-[var(--seasonal-primary,#0d9488)] hover:bg-[var(--seasonal-secondary,#14b8a6)] text-white font-bold px-8 py-4 rounded-2xl transition-colors">
            Track Order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/"
            className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-8 py-4 rounded-2xl transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
