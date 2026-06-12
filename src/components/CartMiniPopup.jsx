import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../utils/constants';

export default function CartMiniPopup() {
  const { cart, getItemCount, getTotal, updateQuantity, removeItem, addItem, setOnAddCallback } = useCart();
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [flashColor, setFlashColor] = useState('');
  const popupRef = useRef(null);
  const btnRef = useRef(null);
  const count = getItemCount();
  const total = getTotal();

  const colors = ['#ff385c', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Listen for add-to-cart events from ProductCard
  useEffect(() => {
    setOnAddCallback(() => {
      setAnimating(true);
      setFlashColor(colors[Math.floor(Math.random() * colors.length)]);
      setTimeout(() => {
        setAnimating(false);
        setFlashColor('');
      }, 600);
    });
  }, [setOnAddCallback]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {/* Mini Cart Popup */}
      {open && (
        <div
          ref={popupRef}
          className="absolute bottom-14 right-0 w-[340px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#ff385c]" />
              <span className="font-bold text-sm text-zinc-900 dark:text-white">Cart ({count})</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="max-h-[300px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Your cart is empty</p>
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#ff385c] hover:underline"
                >
                  Browse products <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/listing/${item.id}`}
                        onClick={() => setOpen(false)}
                        className="text-xs font-bold text-zinc-900 dark:text-white hover:text-[#ff385c] truncate block"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs font-bold text-[#ff385c]">{formatKES(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center text-zinc-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with total + checkout */}
          {cart.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-2 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-zinc-500">Subtotal</span>
                <span className="font-bold text-sm text-zinc-900 dark:text-white">{formatKES(total)}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={() => setOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#ff385c] text-white text-xs font-bold hover:bg-[#e03150] transition-colors shadow-lg shadow-[#ff385c]/20"
                >
                  Checkout <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={`relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          animating ? 'scale-125' : 'scale-100'
        } ${open ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900' : ''}`}
        style={{
          backgroundColor: open ? undefined : (animating && flashColor ? flashColor : '#ff385c'),
          boxShadow: animating ? `0 0 20px ${flashColor || '#ff385c'}80` : '0 4px 12px rgba(0,0,0,0.15)',
        }}
        aria-label={`Shopping cart, ${count} items`}
      >
        <ShoppingCart className="w-5 h-5 text-white" />
        {count > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1 transition-transform duration-300 ${
              animating ? 'scale-150' : 'scale-100'
            }`}
            style={{ backgroundColor: animating ? flashColor : '#fff', color: animating ? '#fff' : '#ff385c' }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  );
}
