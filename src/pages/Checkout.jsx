import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Loader2, Package, CreditCard, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../utils/api';
import { formatKES } from '../utils/constants';
import { supabase } from '../utils/supabase';

const PAYSTACK_PUBLIC_KEY = 'pk_live_27f0020f17e275660e4a92c34fb7f7a9fc36ea94';

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, updateQuantity, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });

  const total = getTotal();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login?redirect=/checkout');
    });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    if (!form.phone.trim()) { setError('Phone number is required for M-Pesa'); return; }
    if (!form.address.trim()) { setError('Delivery address is required'); return; }

    setLoading(true);

    try {
      await loadPaystackScript();

      // Create order in Supabase first (pending payment)
      const orderResult = await createOrder({
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.image_url,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        total,
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const orderId = orderResult.order.id;

      // Initialize Paystack STK push
      window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: form.email.trim() || 'customer@omix.store',
        amount: total * 100, // Paystack uses cents
        currency: 'KES',
        ref: `omix_${orderId}_${Date.now()}`,
        metadata: {
          order_id: orderId,
          customer_name: form.fullName.trim(),
          phone: form.phone.trim(),
        },
        callback: function(response) {
          // Payment successful
          clearCart();
          navigate(`/order-success?orderId=${orderId}`);
        },
        onClose: function() {
          // User closed the popup — keep order as pending
          setLoading(false);
          setError('Payment was not completed. You can try again or contact us.');
        },
      }).openIframe();

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to process checkout. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1a1a2e] flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Your cart is empty</h1>
          <p className="text-gray-400 mb-8">Add some items before checking out.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e62e4f] text-white font-semibold px-8 py-4 rounded-xl transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-name="checkout-page">
      <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 h-fit">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{item.name}</h4>
                  <p className="text-[#ff385c] font-bold text-sm">{formatKES(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-zinc-900 dark:text-white">Total</span>
              <span className="text-2xl font-black text-[#ff385c]">{formatKES(total)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Delivery Details</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-4 text-sm font-medium border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Full Name *</label>
              <input required name="fullName" type="text" value={form.fullName} onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">M-Pesa Phone *</label>
              <input required name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="07XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
              <p className="text-xs text-zinc-500 mt-1">M-Pesa STK push will be sent to this number</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Delivery Address *</label>
              <textarea required name="address" rows="3" value={form.address} onChange={handleChange}
                placeholder="Street, building, area in Kericho"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20 flex items-center justify-center gap-2">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Pay {formatKES(total)} via M-Pesa</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
