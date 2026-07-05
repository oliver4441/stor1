import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, CheckCircle, ShoppingCart, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../utils/constants';

const FORMSPREE_URL = 'https://formspree.io/f/mjgdyrrg';

const FLASH_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-red-500',
  'bg-zinc-900',
  'bg-violet-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
];

function ContactFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [flashColor, setFlashColor] = useState('bg-emerald-500');
  const [bump, setBump] = useState(false);
  const { getItemCount, setOnAddCallback, getItems, getTotal, updateQuantity, removeItem, clearCart } = useCart();
  const cartCount = getItemCount();
  const cartTotal = getTotal();
  const items = getItems();
  const prevCount = useRef(cartCount);

  // Register callback for cart add events
  useEffect(() => {
    setOnAddCallback(() => {
      // Pick a random non-white color
      const color = FLASH_COLORS[Math.floor(Math.random() * FLASH_COLORS.length)];
      setFlashColor(color);
      setFlash(true);
      setBump(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setBump(false), 400);
    });
  }, [setOnAddCallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(e.target);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        setSuccess(true);
        e.target.reset();
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    }

    setSubmitting(false);
  };

  return (
    <>
      {/* Floating Cart Button — above contact */}
      <button
        onClick={() => setCartOpen(!cartOpen)}
        className={`fixed bottom-32 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 ${bump ? 'animate-bounce-once' : ''} ${flash ? flashColor : 'bg-zinc-900 dark:bg-white'}`}
        aria-label="View cart"
      >
        <ShoppingCart className={`w-6 h-6 transition-colors duration-300 ${flash ? 'text-white' : 'text-white dark:text-zinc-900'}`} />
        {cartCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center transition-all duration-300 ${bump ? 'scale-125' : 'scale-100'} ${flash ? 'bg-zinc-800 text-white' : 'bg-[var(--seasonal-primary,#1a5632)]'}`}>
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      {/* Mini Cart Popup */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCartOpen(false)} />
          <div className="fixed bottom-52 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[380px] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 z-50 overflow-hidden" key="mini-cart">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-white">Cart ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400" aria-label="Close cart popup">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <ShoppingCart className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">Your cart is empty</p>
                  <Link to="/" onClick={() => setCartOpen(false)} className="inline-block mt-4 text-sm font-bold text-[var(--seasonal-primary,#1a5632)] hover:underline">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 px-5 py-3">
                      <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm text-white truncate">{item.name}</p>
                        <p className="text-[var(--seasonal-primary,#1a5632)] font-bold text-sm">{formatKES(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))} className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700" aria-label={`Decrease quantity of ${item.name}`}>
                          <Minus className="w-3 h-3 text-zinc-300" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700" aria-label={`Increase quantity of ${item.name}`}>
                          <Plus className="w-3 h-3 text-zinc-300" />
                        </button>
                        <button onClick={() => removeItem(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-900/20 ml-1" aria-label={`Remove ${item.name} from cart`}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-zinc-700 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-400">Total</span>
                  <span className="text-xl font-black text-[var(--seasonal-primary,#1a5632)]">{formatKES(cartTotal)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-3.5 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20"
                >
                  <CreditCard className="w-4 h-4" />
                  Checkout — {formatKES(cartTotal)}
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setCartOpen(false)}
                  className="block text-center text-sm text-zinc-400 hover:text-[var(--seasonal-primary,#1a5632)] font-medium"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => { setIsOpen(false); setSuccess(false); setError(''); }}
        />
      )}

      {/* Form Panel */}
      <div
        className={`fixed bottom-40 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[400px] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 z-50 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-black text-lg text-white">Contact Omix</h3>
            <p className="text-xs text-zinc-400 mt-0.5">We'll get back to you within 24 hours</p>
          </div>
          <button
            onClick={() => { setIsOpen(false); setSuccess(false); setError(''); }}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Close contact form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Message sent!</h4>
            <p className="text-sm text-zinc-400 mb-6">Thank you for reaching out. Our team in Kericho will respond soon.</p>
            <button
              onClick={() => { setSuccess(false); setIsOpen(false); }}
              className="text-sm font-bold text-[var(--seasonal-primary,#1a5632)] hover:underline"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Name</label>
              <input required name="name" type="text" placeholder="e.g. Kiprono Yegon"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-[var(--seasonal-primary,#1a5632)] focus:ring-2 focus:ring-[var(--seasonal-primary,#1a5632)]/10 focus:outline-none text-white text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input required name="email" type="email" placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-[var(--seasonal-primary,#1a5632)] focus:ring-2 focus:ring-[var(--seasonal-primary,#1a5632)]/10 focus:outline-none text-white text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Phone (optional)</label>
              <input name="phone" type="tel" placeholder="07XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-[var(--seasonal-primary,#1a5632)] focus:ring-2 focus:ring-[var(--seasonal-primary,#1a5632)]/10 focus:outline-none text-white text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Subject</label>
              <select name="subject"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-[var(--seasonal-primary,#1a5632)] focus:ring-2 focus:ring-[var(--seasonal-primary,#1a5632)]/10 focus:outline-none text-white text-sm transition-all appearance-none"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Problem">Payment Problem</option>
                <option value="Delivery Question">Delivery Question</option>
                <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Message</label>
              <textarea required name="message" rows="3" placeholder="Tell us how we can help..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-[var(--seasonal-primary,#1a5632)] focus:ring-2 focus:ring-[var(--seasonal-primary,#1a5632)]/10 focus:outline-none text-white text-sm transition-all resize-none" />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full bg-[var(--seasonal-primary,#1a5632)] text-white font-bold py-3.5 rounded-xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20"
            >
              {submitting ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
              ) : (
                <><Send className="w-4 h-4" />Send Message</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Floating Contact Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setSuccess(false); setError(''); }}
        className={`fixed bottom-16 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-zinc-900 dark:bg-white rotate-0 scale-90'
            : 'bg-[var(--seasonal-primary,#1a5632)] hover:bg-[var(--seasonal-secondary,#14472a)] hover:scale-110'
        }`}
        aria-label={isOpen ? 'Close contact form' : 'Contact Omix'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white dark:text-zinc-900" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Tooltip */}
      {!isOpen && (
        <div className="fixed bottom-[7rem] right-4 sm:right-6 z-40 pointer-events-none">
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-3 py-1.5 shadow-lg animate-[fadeIn_0.3s_ease_1s_forwards] opacity-0">
            Need help?
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-zinc-900 dark:bg-white rotate-45" />
          </div>
        </div>
      )}
    </>
  );
}

export default ContactFloat;
