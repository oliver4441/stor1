import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/?search=true', icon: Search, label: 'Search' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: 'cart' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist', badge: 'wishlist' },
  { to: '/account', icon: User, label: 'Account' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { getItemCount } = useCart();
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const checkWishCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (mounted) setWishCount(0); return; }
        const { count } = await supabase
          .from('omix_wishlist')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        if (mounted) setWishCount(count || 0);
      } catch {}
    };
    checkWishCount();
    const interval = setInterval(checkWishCount, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const getBadgeCount = (type) => {
    if (type === 'cart') return getItemCount();
    if (type === 'wishlist') return wishCount;
    return 0;
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/?search=true') return location.pathname === '/' && location.search === '?search=true';
    return location.pathname === path;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const badge = item.badge ? getBadgeCount(item.badge) : 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 transition-all duration-150 ${
                active
                  ? 'text-[var(--seasonal-primary,#1a5632)]'
                  : 'text-zinc-500 active:scale-90'
              }`}
            >
              <div className={`relative transition-transform duration-150 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon className="w-5 h-5 transition-transform duration-150" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-[var(--seasonal-primary,#1a5632)] text-white text-[9px] font-bold rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
