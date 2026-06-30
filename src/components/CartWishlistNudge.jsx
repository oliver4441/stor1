import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, X, ArrowRight, Clock, TrendingDown, Bell } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import { sendNotification, NotifType } from '../utils/notifications';

const CART_NUDGE_KEY = 'omix_cart_nudge_dismissed';
const WISH_NUDGE_KEY = 'omix_wish_nudge_dismissed';
const CART_NUDGE_DELAY = 2 * 60 * 1000;
const WISH_NUDGE_DELAY = 5 * 60 * 1000;
const REDISMISS_COOLDOWN = 15 * 60 * 1000;

// Custom event name for wishlist changes
export const WISHLIST_CHANGE_EVENT = 'omix:wishlist-changed';

export default function CartWishlistNudge() {
  const { getItemCount, getTotal, cart } = useCart();
  const [cartNudge, setCartNudge] = useState(false);
  const [wishNudge, setWishNudge] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check wishlist count with instant event-based refresh
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const checkWishlist = async () => {
      try {
        const { count, error } = await supabase
          .from('omix_wishlist')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (mounted && !error) setWishlistCount(count || 0);
      } catch {}
    };

    // Initial check
    checkWishlist();

    // Listen for wishlist changes (instant from other components)
    const handleWishlistChange = () => checkWishlist();
    window.addEventListener(WISHLIST_CHANGE_EVENT, handleWishlistChange);

    // Fallback polling every 30s in case event was missed
    const interval = setInterval(checkWishlist, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener(WISHLIST_CHANGE_EVENT, handleWishlistChange);
    };
  }, [user]);

  // Cart nudge
  useEffect(() => {
    const itemCount = getItemCount();
    if (itemCount === 0) {
      setCartNudge(false);
      return;
    }

    const dismissed = parseInt(localStorage.getItem(CART_NUDGE_KEY) || '0', 10);
    if (Date.now() - dismissed < REDISMISS_COOLDOWN) return;

    const timer = setTimeout(() => {
      const currentCount = getItemCount();
      if (currentCount > 0) {
        setCartNudge(true);
        // Also send a push notification if subscribed
        sendNotification({
          ...NotifType.CART_REMINDER,
          body: `${currentCount} item${currentCount !== 1 ? 's' : ''} — ${getTotal().toLocaleString()} KES`,
          url: '/cart',
        });
      }
    }, CART_NUDGE_DELAY);

    return () => clearTimeout(timer);
  }, [cart, getItemCount, getTotal]);

  // Wishlist nudge
  useEffect(() => {
    if (wishlistCount === 0) {
      setWishNudge(false);
      return;
    }

    const dismissed = parseInt(localStorage.getItem(WISH_NUDGE_KEY) || '0', 10);
    if (Date.now() - dismissed < REDISMISS_COOLDOWN) return;

    const timer = setTimeout(() => {
      if (wishlistCount > 0) {
        setWishNudge(true);
        // Also send push notification
        sendNotification({
          ...NotifType.WISHLIST_REMINDER,
          body: `${wishlistCount} item${wishlistCount !== 1 ? 's' : ''} waiting — prices may change!`,
          url: '/wishlist',
        });
      }
    }, WISH_NUDGE_DELAY);

    return () => clearTimeout(timer);
  }, [wishlistCount]);

  const dismissCartNudge = () => {
    setCartNudge(false);
    localStorage.setItem(CART_NUDGE_KEY, String(Date.now()));
  };

  const dismissWishNudge = () => {
    setWishNudge(false);
    localStorage.setItem(WISH_NUDGE_KEY, String(Date.now()));
  };

  const showCart = cartNudge;
  const showWish = wishNudge && !cartNudge;

  return (
    <>
      {showCart && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[60] animate-slide-up">
          <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/50 p-4">
            <button onClick={dismissCartNudge}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
              aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--seasonal-primary,#1a5632)]/20 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-[var(--seasonal-primary,#1a5632)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm">Items waiting in your cart</h4>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {getItemCount()} item{getItemCount() !== 1 ? 's' : ''} &middot; {getTotal().toLocaleString()} KES
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                  <Clock className="w-3 h-3" /> Don't miss out — complete your order!
                </div>
                <button
                  onClick={() => { dismissCartNudge(); navigate('/cart'); }}
                  className="mt-3 flex items-center gap-1.5 bg-[var(--seasonal-primary,#1a5632)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors"
                >
                  Go to Cart <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWish && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[60] animate-slide-up">
          <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/50 p-4">
            <button onClick={dismissWishNudge}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
              aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm">Your saved items are waiting</h4>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {wishlistCount} item{wishlistCount !== 1 ? 's' : ''} in your wishlist
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                  <TrendingDown className="w-3 h-3" /> Prices can change — grab yours before it's gone!
                </div>
                <button
                  onClick={() => { dismissWishNudge(); navigate('/wishlist'); }}
                  className="mt-3 flex items-center gap-1.5 bg-[var(--seasonal-primary,#1a5632)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors"
                >
                  View Wishlist <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
