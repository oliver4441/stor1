import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User, Globe, Shield, Package, HelpCircle, Info, LogIn, UserPlus, Menu, X, Download,
  ShoppingCart, ChevronDown, LogOut, RefreshCw, DollarSign, Store,
  Smartphone, Sofa, Shirt, Wrench, Car, Home, BookOpen, Dumbbell, Heart,
  UtensilsCrossed, Coffee, Cookie, ChefHat, Grid, Tag, ChevronRight,
  Layers, Eye, EyeOff, Search
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useLang } from '../utils/lang';
import { isAdmin, isAffiliate, getSellerProfile } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useActiveTheme } from '../context/SeasonalContext';
import { sounds } from '../utils/sounds';
import NotificationBell from './NotificationBell';
import { WhatsAppNavButton } from './WhatsAppButtons';
import { CATEGORIES, CATEGORY_INFO } from '../utils/constants';

// Icon resolver: maps CATEGORY_INFO.icon string names to Lucide components
const CATEGORY_ICON_MAP = {
  Smartphone, Sofa, Shirt, Wrench, Car, Home, BookOpen, Dumbbell, Heart,
  UtensilsCrossed, Coffee, Cookie, ChefHat, Grid, Tag, Layers,
};

function CategoryIcon({ iconName, className }) {
  const Icon = CATEGORY_ICON_MAP[iconName] || Tag;
  return <Icon className={className} />;
}

const FEATURE_LINKS = [
  { to: '/refurbished', label: 'Refurbished', icon: RefreshCw, color: 'from-orange-500 to-amber-600', glow: 'shadow-orange-500/40' },
  { to: '/wholesale', label: 'Wholesale', icon: Package, color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/40' },
  { to: 'https://omixsystems.store', label: 'Blog', icon: Globe, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/40', external: true },
  { to: '/how-it-works', label: 'How It Works', icon: HelpCircle, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/40' },
  { to: '/help', label: 'Help', icon: Package, color: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/40' },
  { to: '/about', label: 'About', icon: Info, color: 'from-cyan-500 to-teal-600', glow: 'shadow-cyan-500/40' },
  { to: '/install', label: 'Install App', icon: Download, color: 'from-[var(--seasonal-primary,#1a5632)] to-[var(--seasonal-secondary,#14472a)]', glow: 'shadow-[var(--seasonal-primary,#1a5632)]/40' },
  { to: '/affiliate', label: 'Earn', icon: DollarSign, color: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-500/40' },
];

function Navbar() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserAffiliate, setIsUserAffiliate] = useState(false);
  const [isUserSeller, setIsUserSeller] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const drawerRef = useRef(null);
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const theme = useActiveTheme();

  const navAccentColor = theme?.colors?.navAccent || '#1a5632';
  const navAccentText = theme?.colors?.navAccentText || '#ffffff';
  const badgeText = theme?.badgeText;
  const badgeBg = theme?.colors?.badgeBg || '#1a5632';
  const badgeTextColor = theme?.colors?.badgeText || '#ffffff';
  const sticker = theme?.sticker || '';
  const secondaryColor = theme?.colors?.secondary || '#14472a';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        isAdmin().then(admin => setIsUserAdmin(admin));
        isAffiliate().then(aff => setIsUserAffiliate(aff));
        getSellerProfile(session.user.id).then(res => setIsUserSeller(!!res?.seller)).catch(() => setIsUserSeller(false));
      } else {
        setIsUserAdmin(false);
        setIsUserAffiliate(false);
        setIsUserSeller(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        isAdmin().then(admin => setIsUserAdmin(admin));
        isAffiliate().then(aff => setIsUserAffiliate(aff));
        getSellerProfile(session.user.id).then(res => setIsUserSeller(!!res?.seller)).catch(() => setIsUserSeller(false));
      } else {
        setIsUserAdmin(false);
        setIsUserAffiliate(false);
        setIsUserSeller(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setDesktopMenuOpen(false); }, [location.pathname]);

  // Filter out how-it-works for logged-in users
  const visibleLinks = FEATURE_LINKS.filter(
    link => !(link.to === '/how-it-works' && user)
  );

  // Close menu on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { setMenuOpen(false); setDesktopMenuOpen(false); }
  }, []);

  useEffect(() => {
    if (menuOpen || desktopMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, desktopMenuOpen, handleKeyDown]);

  // Lock body scroll when menu open on mobile
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Collapsible navbar — hide on scroll down, show on scroll up
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 50) { setNavVisible(true); lastScrollY.current = currentY; return; }
      if (currentY > lastScrollY.current + 5) setNavVisible(false);
      else if (currentY < lastScrollY.current - 5) setNavVisible(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    sounds.logout();
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <>
      <nav className={`border-b border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 transition-transform duration-200 ease-out ${navVisible ? 'translate-y-0' : '-translate-y-full'}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight text-white" style={{ color: navAccentText || '#ffffff' }}>
              Omix Store
            </span>
          </Link>

          {/* Desktop (lg+): Spacer so right section stays flush right */}
          <div className="hidden lg:block flex-1" />

          {/* Desktop (lg+): Right side */}
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/search" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </Link>
            <WhatsAppNavButton />
            <NotificationBell />
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors" aria-label={`Shopping cart, ${cartCount} items`}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#34d399' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Offline mode toggle */}
            <button
              onClick={() => {
                const next = localStorage.getItem('omix_offline_mode') !== 'true';
                if (next) localStorage.setItem('omix_offline_mode', 'true');
                else localStorage.removeItem('omix_offline_mode');
                window.dispatchEvent(new Event('storage'));
                // Force re-render
                window.location.reload();
              }}
              className={`p-2 rounded-full transition-colors ${
                localStorage.getItem('omix_offline_mode') === 'true'
                  ? 'bg-amber-900/30 text-amber-400'
                  : 'hover:bg-zinc-800 text-zinc-500'
              }`}
              aria-label="Toggle offline browse mode"
              title={localStorage.getItem('omix_offline_mode') === 'true' ? 'Offline mode on' : 'Offline mode off'}
            >
              {localStorage.getItem('omix_offline_mode') === 'true' ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {isUserAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                style={{ color: navAccentColor, borderColor: navAccentColor + '33' }}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {user ? (
              <>
                <Link to="/account" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('nav.account') || 'Account'}</span>
                </Link>
                {isUserAffiliate && (
                  <Link to="/affiliate-dashboard" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors">
                    <span className="text-sm font-medium">Affiliate Dashboard</span>
                  </Link>
                )}
                {isUserSeller ? (
                  <Link to="/seller/dashboard" className="flex items-center gap-2 p-2 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 text-emerald-400 hover:from-emerald-600/30 hover:to-green-600/30 transition-all">
                    <Store className="w-4 h-4" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                ) : (
                  <Link to="/seller/register" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors">
                    <Store className="w-4 h-4" />
                    <span className="text-sm font-medium">Become a Seller</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-full hover:bg-zinc-800 transition-all">
                  <LogIn className="w-4 h-4" />
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${navAccentColor}, ${theme?.colors?.secondary || '#14472a'})`,
                    boxShadow: `0 4px 14px ${navAccentColor}40`,
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </>
            )}

            {/* Desktop menu trigger */}
            <div className="relative">
              <button
                onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors"
                aria-label={desktopMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {desktopMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {desktopMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setDesktopMenuOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                    {visibleLinks.map(link => {
                      const Icon = link.icon;
                      const isActive = !link.external && location.pathname === link.to;
                      const btnClass = `flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${link.color} text-white`
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`;
                      if (link.external) {
                        return (
                          <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer" className={btnClass} onClick={() => setDesktopMenuOpen(false)}>
                            <Icon className="w-4 h-4" />
                            {link.label}
                          </a>
                        );
                      }
                      return (
                        <Link key={link.to} to={link.to} className={btnClass} onClick={() => setDesktopMenuOpen(false)}>
                          <Icon className="w-4 h-4" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Below lg: Compact controls + Hamburger */}
          <div className="flex lg:hidden items-center gap-1">
            <WhatsAppNavButton />
            {/* Mobile search icon */}
            <Link to="/search" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </Link>

            {/* Notification bell always visible on mobile */}
            <NotificationBell />

            {/* Cart icon always visible on mobile */}
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors" aria-label={`Shopping cart, ${cartCount} items`}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#34d399' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Offline mode banner */}
      {localStorage.getItem('omix_offline_mode') === 'true' && (
        <div className="bg-amber-900/40 border-b border-amber-700/50 backdrop-blur-sm z-40">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <EyeOff className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">Offline Browse Mode — purchasing and chat are disabled</span>
          </div>
        </div>
      )}

      {/* ── Category Bar (Jumia-style mega menu) ── */}
      <div className={`border-b border-zinc-800/50 bg-zinc-950/60 backdrop-blur-sm sticky z-40 transition-all duration-200 ease-out ${navVisible ? 'top-[56px]' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide gap-0.5 py-1.5 -mx-2 px-2">
            {CATEGORIES.filter(c => c !== 'All').slice(0, 12).map(cat => {
              const info = CATEGORY_INFO[cat] || { icon: 'Tag', color: 'from-zinc-500 to-zinc-600', glow: 'shadow-zinc-500/40' };
              const isActive = location.pathname === '/search' && new URLSearchParams(location.search).get('category') === cat;
              return (
                <Link
                  key={cat}
                  to={`/search?category=${encodeURIComponent(cat)}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? `bg-gradient-to-r ${info.color} text-white shadow-sm ${info.glow}`
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700'
                  }`}
                >
                  <CategoryIcon iconName={info.icon} className="w-3.5 h-3.5" />
                  {cat}
                </Link>
              );
            })}
            <Link
              to="/search"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all flex-shrink-0"
            >
              <ChevronRight className="w-3 h-3" />
              All
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar — rendered OUTSIDE nav to avoid CSS transform containing block bug */}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ease-out ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl z-[61] lg:hidden flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-800 shrink-0">
          <span className="text-sm font-bold tracking-wide text-zinc-400 uppercase">Menu</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {visibleLinks.map(link => {
            const Icon = link.icon;
            const isActive = !link.external && location.pathname === link.to;
            const linkClass = `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              isActive
                ? `bg-gradient-to-r ${link.color} text-white shadow-lg`
                : 'text-zinc-300 hover:bg-zinc-800'
            }`;
            if (link.external) {
              return (
                <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer" className={linkClass} onClick={() => setMenuOpen(false)}>
                  <Icon className="w-5 h-5" />
                  {link.label}
                </a>
              );
            }
            return (
              <Link key={link.to} to={link.to} className={linkClass} onClick={() => setMenuOpen(false)}>
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          {/* ── Shop by Category (Mobile) ── */}
          <div className="border-t border-zinc-800 my-1" />
          <div className="px-1 py-2">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Layers className="w-4 h-4 text-zinc-500" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Shop by Category</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.filter(c => c !== 'All').map(cat => {
                const info = CATEGORY_INFO[cat] || { icon: 'Tag', color: 'from-zinc-500 to-zinc-600' };
                return (
                  <Link
                    key={cat}
                    to={`/search?category=${encodeURIComponent(cat)}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center flex-shrink-0`}>
                      <CategoryIcon iconName={info.icon} className="w-3.5 h-3.5 text-white" />
                    </span>
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider — account section */}
          <div className="border-t border-zinc-800 my-1" />

          {/* Account section */}
          {user ? (
            <>
              <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                <User className="w-5 h-5" />
                My Account
              </Link>
              {isUserAffiliate && (
                <Link to="/affiliate-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                  <User className="w-5 h-5" />
                  Affiliate Dashboard
                </Link>
              )}
              {isUserSeller ? (
                <Link to="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600/20 to-green-600/20 text-emerald-400 hover:from-emerald-600/30 hover:to-green-600/30" onClick={() => setMenuOpen(false)}>
                  <Store className="w-5 h-5" />
                  Dashboard
                </Link>
              ) : (
                <Link to="/seller/register" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                  <Store className="w-5 h-5" />
                  Become a Seller
                </Link>
              )}
              {isUserAdmin && (
                <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[var(--seasonal-primary,#1a5632)] hover:bg-[var(--seasonal-primary,#1a5632)]/10" onClick={() => setMenuOpen(false)}>
                  <Shield className="w-5 h-5" />
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-900/20 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
              {/* Offline mode toggle */}
              <button
                onClick={() => {
                  const next = localStorage.getItem('omix_offline_mode') !== 'true';
                  if (next) localStorage.setItem('omix_offline_mode', 'true');
                  else localStorage.removeItem('omix_offline_mode');
                  window.location.reload();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold w-full text-left ${
                  localStorage.getItem('omix_offline_mode') === 'true'
                    ? 'text-amber-400 bg-amber-900/20'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {localStorage.getItem('omix_offline_mode') === 'true' ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                Offline Mode
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-300 hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                <LogIn className="w-5 h-5" />
                Log In
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${navAccentColor}, ${secondaryColor})` }}
                onClick={() => setMenuOpen(false)}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Link>
            </>
          )}
          {/* Offline mode toggle — always visible */}
          <div className="border-t border-zinc-800 my-1" />
          <button
            onClick={() => {
              const next = localStorage.getItem('omix_offline_mode') !== 'true';
              if (next) localStorage.setItem('omix_offline_mode', 'true');
              else localStorage.removeItem('omix_offline_mode');
              window.location.reload();
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold w-full text-left ${
              localStorage.getItem('omix_offline_mode') === 'true'
                ? 'text-amber-400 bg-amber-900/20'
                : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {localStorage.getItem('omix_offline_mode') === 'true' ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
            Offline Mode
          </button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
