import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User, Plus, X, Sun, Moon, Download, HelpCircle, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import { WISHLIST_CHANGE_EVENT } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const CASCADE_ITEMS = [
  { to: '/account', icon: User, label: 'Account' },
  { to: '/install', icon: Download, label: 'Install app' },
  { to: '/how-it-works', icon: HelpCircle, label: 'How it works' },
  { to: '/help', icon: Info, label: 'Help centre' },
];

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: 'cart' },
  { to: '/wishlist', icon: Heart, label: 'Saved', badge: 'wishlist' },
];

export default function MobileBottomNav() {
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { getItemCount } = useCart();
  const { toggleTheme, isDark } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkWishCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (mounted) setWishCount(0); return; }
        const { count } = await supabase.from('omix_wishlist').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
        if (mounted) setWishCount(count || 0);
      } catch {}
    };
    checkWishCount();
    window.addEventListener(WISHLIST_CHANGE_EVENT, checkWishCount);
    const interval = setInterval(checkWishCount, 30000);
    return () => { mounted = false; clearInterval(interval); window.clearInterval(interval); window.removeEventListener(WISHLIST_CHANGE_EVENT, checkWishCount); };
  }, []);

  useEffect(() => { setCascadeOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    document.body.style.overflow = cascadeOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cascadeOpen]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') setCascadeOpen(false);
  }, []);
  useEffect(() => {
    if (!cascadeOpen) return undefined;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cascadeOpen, handleKeyDown]);

  const getBadgeCount = (type) => type === 'cart' ? getItemCount() : type === 'wishlist' ? wishCount : 0;
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname === path;
  const cascadeItems = user ? CASCADE_ITEMS.filter(item => item.to !== '/how-it-works') : CASCADE_ITEMS;

  return (
    <>
      <div className={`marketplace-mobile-sheet-backdrop ${cascadeOpen ? 'is-open' : ''}`} onClick={() => setCascadeOpen(false)} aria-hidden="true" />
      <div className={`marketplace-mobile-sheet ${cascadeOpen ? 'is-open' : ''}`} aria-hidden={!cascadeOpen}>
        <div className="marketplace-mobile-sheet-handle" />
        <div className="marketplace-mobile-sheet-grid">
          {cascadeItems.map(item => {
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} onClick={() => setCascadeOpen(false)}><Icon className="h-[18px] w-[18px]" /><span>{item.label}</span></Link>;
          })}
          <button type="button" onClick={() => { setCascadeOpen(false); toggleTheme(); }}><span className="marketplace-mobile-sheet-icon">{isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</span><span>{isDark ? 'Light mode' : 'Dark mode'}</span></button>
        </div>
      </div>

      <nav className="marketplace-bottom-nav" aria-label="Mobile navigation">
        <div className="marketplace-bottom-nav-inner">
          {navItems.slice(0, 2).map(item => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return <Link key={item.to} to={item.to} className={active ? 'is-active' : ''} aria-label={item.label}><Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.5 : 1.8} /><span>{item.label}</span></Link>;
          })}
          <button type="button" className={`marketplace-bottom-menu-button ${cascadeOpen ? 'is-open' : ''}`} onClick={() => setCascadeOpen(value => !value)} aria-label={cascadeOpen ? 'Close menu' : 'Open more options'} aria-expanded={cascadeOpen}>
            {cascadeOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
          {navItems.slice(2).map(item => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const badge = getBadgeCount(item.badge);
            return <Link key={item.to} to={item.to} className={active ? 'is-active' : ''} aria-label={item.label}><span className="marketplace-bottom-icon-wrap"><Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.5 : 1.8} />{badge > 0 && <b>{badge > 99 ? '99+' : badge}</b>}</span><span>{item.label}</span></Link>;
          })}
        </div>
      </nav>
    </>
  );
}
