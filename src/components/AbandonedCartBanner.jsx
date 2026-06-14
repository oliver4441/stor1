import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';

const CART_KEY = 'omix_cart';
const TIMESTAMP_KEY = 'cart_abandoned_ts';
const DISMISSED_KEY = 'cart_abandoned_dismissed';
const TIMEOUT_MINUTES = 30;

export default function AbandonedCartBanner() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => {
      try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        if (cart.length === 0) { setVisible(false); return; }

        const ts = parseInt(localStorage.getItem(TIMESTAMP_KEY) || '0', 10);
        const now = Date.now();
        const elapsed = (now - ts) / 1000 / 60;

        // Only show if 30+ min have passed since cart was first created
        if (elapsed < TIMEOUT_MINUTES) { setVisible(false); return; }

        // Only show once per hour after dismissal
        const dismissed = parseInt(localStorage.getItem(DISMISSED_KEY) || '0', 10);
        if (now - dismissed < 3600000) { setVisible(false); return; }

        setVisible(true);
      } catch { setVisible(false); }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  // Set timestamp when first item is added
  useEffect(() => {
    const origSetItem = localStorage.setItem.bind(localStorage);
    const setItem = (key, value) => {
      origSetItem(key, value);
      if (key === CART_KEY) {
        try {
          const cart = JSON.parse(value);
          if (cart.length === 1 && !localStorage.getItem(TIMESTAMP_KEY)) {
            localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
          }
        } catch {}
      }
    };
    // Monkey-patch to detect first item add
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (key === CART_KEY) {
        try {
          const cart = JSON.parse(value);
          if (cart.length === 1 && !localStorage.getItem(TIMESTAMP_KEY)) {
            localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
          }
        } catch {}
      }
    };
    return () => { Storage.prototype.setItem = originalSetItem; };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const handleViewCart = () => {
    setVisible(false);
    navigate('/cart');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="max-w-md mx-auto bg-[#ff385c] rounded-2xl shadow-2xl p-4 flex items-center gap-3 text-white">
        <ShoppingBag className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">
          Still shopping? Your cart items are waiting!
        </p>
        <button
          onClick={handleViewCart}
          className="px-4 py-1.5 bg-white text-[#ff385c] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
        >
          View Cart
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
