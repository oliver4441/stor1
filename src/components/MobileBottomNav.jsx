import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User, Download, HelpCircle, Info, LogIn, UserPlus, Plus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import { WISHLIST_CHANGE_EVENT } from '../utils/constants';

const CASCADE_ITEMS = [
  { to: '/account', icon: User, label: 'Account' },
  { to: '/install', icon: Download, label: 'Install App' },
  { to: '/how-it-works', icon: HelpCircle, label: 'How It Works' },
  { to: '/help', icon: Info, label: 'Help' },
  { to: '/about', icon: Info, label: 'About' },
];

const AUTH_ITEMS = [
  { to: '/login', icon: LogIn, label: 'Log In' },
  { to: '/signup', icon: UserPlus, label: 'Sign Up' },
];

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/?search=true', icon: Search, label: 'Search' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: 'cart' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist', badge: 'wishlist' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { getItemCount } = useCart();
  const [wishCount, setWishCount] = useState(0);
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const [user, setUser] = useState(null);
  const cascadeRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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
    const handleChange = () => checkWishCount();
    window.addEventListener(WISHLIST_CHANGE_EVENT, handleChange);
    const interval = setInterval(checkWishCount, 30000);
    return () => { mounted = false; clearInterval(interval); window.removeEventListener(WISHLIST_CHANGE_EVENT, handleChange); };
  }, []);

  useEffect(() => { setCascadeOpen(false); }, [location.pathname]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setCascadeOpen(false);
  }, []);

  useEffect(() => {
    if (cascadeOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cascadeOpen, handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = cascadeOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cascadeOpen]);

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

  const cascadeItems = user
    ? CASCADE_ITEMS.filter(item => item.to !== '/how-it-works')
    : [...AUTH_ITEMS, ...CASCADE_ITEMS];

  return (
    <>
      {/* Cascade backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-out ${
          cascadeOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCascadeOpen(false)}
        aria-hidden="true"
      />

      {/* Cascade items panel */}
      <div
        ref={cascadeRef}
        className={`fixed left-0 right-0 bottom-0 z-[52] lg:hidden transition-all duration-300 ease-out ${
          cascadeOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`mx-4 mb-24 fusion-glass rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            cascadeOpen ? 'translate-y-0' : 'translate-y-4'
          }`}
        >
          {cascadeItems.map((item, i) => {
            const Icon = item.icon;
            const isItemActive = location.pathname === item.to;
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                onClick={() => setCascadeOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all ${
                  isItemActive
                    ? 'text-[var(--seasonal-primary,#007AFF)] bg-[var(--seasonal-primary,#007AFF)]/10'
                    : 'text-[#8E9BB5] active:bg-[#28303F]'
                } ${i < cascadeItems.length - 1 ? 'border-b border-[#353F54]/50' : ''}`}
                style={{ animationDelay: `${i * 50}ms`, animation: cascadeOpen ? `cascade-up 0.25s ease-out ${i * 50}ms both` : 'none' }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav
        className="lg:hidden fusion-tabbar"
      >
        {/* ponytail: grid-cols-5 gives equal columns; center button lives in col 3 */}
        <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const badge = item.badge ? getBadgeCount(item.badge) : 0;
            // Insert center button before col 3 (Cart index)
            return (
              <React.Fragment key={item.to}>
                {idx === 2 && (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => setCascadeOpen(!cascadeOpen)}
                      className={`relative -mt-5 w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 ${
                        cascadeOpen
                          ? 'bg-[#007AFF] rotate-45 scale-110 shadow-[#007AFF]/40'
                          : 'bg-gradient-to-br from-[var(--seasonal-primary,#007AFF)] to-[var(--seasonal-secondary,#0066CC)] hover:scale-105 shadow-black/30'
                      }`}
                      aria-label={cascadeOpen ? 'Close menu' : 'Open actions'}
                    >
                      {cascadeOpen ? (
                        <X className="w-6 h-6 text-white" />
                      ) : (
                        <Plus className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>
                )}
                <Link
                  to={item.to}
                  className={`relative flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-150 ${
                    active
                      ? 'text-[var(--seasonal-primary,#1a5632)]'
                      : 'text-zinc-400 active:text-zinc-200'
                  }`}
                  aria-label={item.label}
                >
                  <div className={`relative transition-transform duration-150 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-[#007AFF] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </>
  );
}
