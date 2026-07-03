import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User, Download, HelpCircle, Info, LogIn, UserPlus, Plus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import { WISHLIST_CHANGE_EVENT } from './CartWishlistNudge';

const CASCADE_ITEMS = [
  { to: '/account', icon: User, label: 'Account' },
  { to: '/install', icon: Download, label: 'Install App' },
  { to: '/how-it-works', icon: HelpCircle, label: 'How It Works' },
  { to: '/help', icon: Info, label: 'Help' },
  { to: '/about', icon: Info, label: 'About' },
];

const AUTH_CASCADE_ITEMS = [
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

  // Check auth state
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

  // Close cascade on route change
  useEffect(() => { setCascadeOpen(false); }, [location.pathname]);

  // Close cascade on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setCascadeOpen(false);
  }, []);

  useEffect(() => {
    if (cascadeOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cascadeOpen, handleKeyDown]);

  // Lock body scroll when cascade open
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

  const cascadeItems = user ? CASCADE_ITEMS : [...AUTH_CASCADE_ITEMS.slice(0, 1), ...CASCADE_ITEMS, ...AUTH_CASCADE_ITEMS.slice(1)];

  return (
    <>
      {/* Cascade overlay backdrop */}
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
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-41 lg:hidden transition-all duration-300 ease-out ${
          cascadeOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-w-[200px]">
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
                    ? 'text-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)]/10'
                    : 'text-zinc-300 hover:bg-zinc-800'
                } ${i < cascadeItems.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Arrow pointing down to the trigger */}
        <div className="flex justify-center -mb-1">
          <div className="w-3 h-3 bg-zinc-900 border-b border-r border-zinc-800 -rotate-45 transform -mt-1.5" />
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-900 border-t border-zinc-800 safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {/* Left: Home, Search */}
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const badge = item.badge ? getBadgeCount(item.badge) : 0;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-150 ${
                  active
                    ? 'text-[var(--seasonal-primary,#1a5632)]'
                    : 'text-zinc-400 active:scale-90'
                }`}
                aria-label={item.label}
              >
                <div className={`relative transition-transform duration-150 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
                  <Icon className="w-5 h-5 transition-transform duration-150" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-emerald-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}

          {/* Center: Cascading trigger */}
          <button
            onClick={() => setCascadeOpen(!cascadeOpen)}
            className={`relative -mt-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 ${
              cascadeOpen
                ? 'bg-red-500 rotate-45 scale-110'
                : 'bg-gradient-to-br from-[var(--seasonal-primary,#1a5632)] to-[var(--seasonal-secondary,#14472a)] hover:scale-105'
            }`}
            style={{
              boxShadow: cascadeOpen
                ? '0 4px 15px rgba(239,68,68,0.4)'
                : '0 4px 15px rgba(26,86,50,0.4)',
            }}
            aria-label={cascadeOpen ? 'Close menu' : 'Open actions'}
          >
            {cascadeOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Right: Cart, Wishlist */}
          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const badge = item.badge ? getBadgeCount(item.badge) : 0;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-all duration-150 ${
                  active
                    ? 'text-[var(--seasonal-primary,#1a5632)]'
                    : 'text-zinc-400 active:scale-90'
                }`}
                aria-label={item.label}
              >
                <div className={`relative transition-transform duration-150 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
                  <Icon className="w-5 h-5 transition-transform duration-150" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-emerald-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
