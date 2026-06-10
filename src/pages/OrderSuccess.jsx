import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function OrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || 'N/A';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-name="order-success-page">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-3">Order Placed Successfully!</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-2">Thank you for your order. We will process it shortly.</p>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mt-8 inline-block">
          <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <Package className="w-5 h-5 text-[#ff385c]" />
            <span>Order ID: <strong className="text-zinc-900 dark:text-white font-mono">{String(orderId).slice(0, 8).toUpperCase()}</strong></span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Estimated delivery: 2-5 business days</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link to={`/track-order?orderId=${orderId}`}
            className="inline-flex items-center justify-center gap-2 bg-[#ff385c] hover:bg-[#e03150] text-white font-bold px-8 py-4 rounded-2xl transition-colors">
            Track Order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/"
            className="inline-flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold px-8 py-4 rounded-2xl transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
