import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../utils/constants';

export default function FloatingCartButton() {
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const { getItemCount, setOnAddCallback, getItems, getTotal, updateQuantity, removeItem } = useCart();
  const cartCount = getItemCount();
  const cartTotal = getTotal();
  const items = getItems();
  const prevCount = useRef(cartCount);

  useEffect(() => {
    setOnAddCallback(() => {
      setBump(true);
      setTimeout(() => setBump(false), 400);
    });
  }, [setOnAddCallback]);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBump(true);
      setTimeout(() => setBump(false), 400);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setCartOpen(!cartOpen)}
        className={`fixed bottom-32 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 bg-zinc-900 dark:bg-white ${bump ? 'animate-bounce-once' : ''}`}
        aria-label="View cart"
      >
        <ShoppingCart className="w-6 h-6 text-white dark:text-zinc-900" />
        {cartCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center transition-all duration-300 ${bump ? 'scale-125' : 'scale-100'} bg-[var(--seasonal-primary,#ff385c)]`}>
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      {/* Mini Cart Popup */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCartOpen(false)} />
          <div className="fixed bottom-36 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[380px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-lg text-zinc-900 dark:text-white">Cart ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <ShoppingCart className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Your cart is empty</p>
                  <Link to="/" onClick={() => setCartOpen(false)} className="inline-block mt-4 text-sm font-bold text-[var(--seasonal-primary,#ff385c)] hover:underline">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 px-5 py-3">
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-[var(--seasonal-primary,#ff385c)] font-bold text-sm">{formatKES(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700">
                          <Minus className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-zinc-900 dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700">
                          <Plus className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Total</span>
                  <span className="text-xl font-black text-[var(--seasonal-primary,#ff385c)]">{formatKES(cartTotal)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-[var(--seasonal-primary,#ff385c)] text-white font-black py-3.5 rounded-2xl hover:bg-[var(--seasonal-secondary,#e03150)] transition-all shadow-lg shadow-[var(--seasonal-primary,#ff385c)]/20"
                >
                  <CreditCard className="w-4 h-4" />
                  Checkout — {formatKES(cartTotal)}
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setCartOpen(false)}
                  className="block text-center text-sm text-zinc-500 hover:text-[var(--seasonal-primary,#ff385c)] font-medium"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
