import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User, Shield, Package, HelpCircle, Info, LogIn, UserPlus, Menu, X,
  ShoppingCart, LogOut, RefreshCw, DollarSign, Store, Wallet,
  Smartphone, Sofa, Shirt, Wrench, Car, Home, BookOpen, Dumbbell, Heart,
  UtensilsCrossed, Coffee, Cookie, ChefHat, Grid, Tag, ChevronRight,
  Layers, Search, CalendarDays, Sparkles, Download,
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useLang } from '../utils/lang';
import { isAdmin, isAffiliate, getSellerProfile } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useActiveTheme } from '../context/SeasonalContext';
import { sounds } from '../utils/sounds';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { WhatsAppNavButton } from './WhatsAppButtons';
import { CATEGORIES, CATEGORY_INFO } from '../utils/constants';

const CATEGORY_ICON_MAP = {
  Smartphone, Sofa, Shirt, Wrench, Car, Home, BookOpen, Dumbbell, Heart,
  UtensilsCrossed, Coffee, Cookie, ChefHat, Grid, Tag,
};

function CategoryIcon({ iconName, className }) {
  const Icon = CATEGORY_ICON_MAP[iconName] || Tag;
  return <Icon className={className} aria-hidden="true" />;
}

const FEATURE_LINKS = [
  { to: '/seller/register', label: 'Sell on Omix', icon: Package },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/refurbished', label: 'Refurbished', icon: RefreshCw },
  { to: '/wholesale', label: 'Wholesale', icon: Package },
  { to: 'https://omixsystems.store', label: 'Journal', icon: Sparkles, external: true },
  { to: '/how-it-works', label: 'How it works', icon: HelpCircle },
  { to: '/help', label: 'Help centre', icon: HelpCircle },
  { to: '/about', label: 'About Omix', icon: Info },
  { to: '/install', label: 'Install app', icon: Download },
  { to: '/affiliate', label: 'Earn with Omix', icon: DollarSign },
];

function Navbar() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserAffiliate, setIsUserAffiliate] = useState(false);
  const [isUserSeller, setIsUserSeller] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const theme = useActiveTheme();

  const navAccentColor = theme?.colors?.navAccent || 'var(--brand)';

  const loadUserRoles = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setIsUserAdmin(false);
      setIsUserAffiliate(false);
      setIsUserSeller(false);
      return;
    }
    const [admin, affiliate, seller] = await Promise.all([
      isAdmin().catch(() => false),
      isAffiliate().catch(() => false),
      getSellerProfile(sessionUser.id).catch(() => null),
    ]);
    setIsUserAdmin(admin);
    setIsUserAffiliate(affiliate);
    setIsUserSeller(!!seller?.seller);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      loadUserRoles(session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadUserRoles(session?.user);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserRoles]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, handleKeyDown]);

  const handleLogout = async () => {
    sounds.logout();
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate('/login');
  };

  const visibleLinks = FEATURE_LINKS.filter(link => !(link.to === '/how-it-works' && user));
  const topCategories = CATEGORIES.filter(category => category !== 'All').slice(0, 7);

  const renderCart = (className = '') => (
    <Link
      to="/cart"
      className={`marketplace-icon-button marketplace-cart-button ${className}`}
      aria-label={`Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
    >
      <ShoppingCart className="h-[19px] w-[19px]" strokeWidth={1.8} />
      {cartCount > 0 && <span className="marketplace-cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}
    </Link>
  );

  return (
    <>
      <header className="marketplace-navbar" style={{ '--nav-accent': navAccentColor }}>
        <div className="marketplace-nav-inner">
          <Link to="/" className="marketplace-brand" aria-label="Omix Store home">
            <span className="marketplace-brand-mark" aria-hidden="true"><span>O</span></span>
            <span className="marketplace-brand-wordmark">omix<span>store</span></span>
          </Link>

          <Link to="/search" className="marketplace-nav-search" aria-label="Search the marketplace">
            <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span>Search products, brands and more</span>
            <kbd>⌘ K</kbd>
          </Link>

          <div className="marketplace-nav-actions marketplace-nav-actions-desktop">
            <Link to="/seller/register" className="marketplace-sell-link">
              <Package className="h-4 w-4" />
              Sell
            </Link>
            <ThemeToggle />
            <WhatsAppNavButton />
            <NotificationBell />
            {renderCart()}
            {isUserAdmin && <Link to="/admin" className="marketplace-role-link"><Shield className="h-4 w-4" />Admin</Link>}
            {user ? (
              <Link to="/account" className="marketplace-account-link">
                <span className="marketplace-avatar"><User className="h-4 w-4" /></span>
                <span>{t('nav.account') || 'Account'}</span>
              </Link>
            ) : (
              <Link to="/login" className="marketplace-login-link">Log In</Link>
            )}
          </div>

          <div className="marketplace-nav-actions marketplace-nav-actions-mobile">
            {renderCart()}
            <button
              type="button"
              className="marketplace-icon-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="marketplace-category-bar" aria-label="Shop by category">
          <div className="marketplace-category-inner">
            <Link to="/search" className={`marketplace-category-link marketplace-category-all ${location.pathname === '/search' && !location.search ? 'is-active' : ''}`}>
              <Layers className="h-4 w-4" />
              Browse all
            </Link>
            {topCategories.map(category => {
              const info = CATEGORY_INFO[category] || {};
              const isActive = location.pathname === '/search' && new URLSearchParams(location.search).get('category') === category;
              return (
                <Link
                  key={category}
                  to={`/search?category=${encodeURIComponent(category)}`}
                  className={`marketplace-category-link ${isActive ? 'is-active' : ''}`}
                >
                  <CategoryIcon iconName={info.icon} className="h-4 w-4" />
                  {category}
                </Link>
              );
            })}
            <Link to="/flash-deals" className="marketplace-category-link marketplace-deals-link">
              <Sparkles className="h-4 w-4" />
              Flash deals
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`marketplace-drawer-backdrop ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`marketplace-drawer ${menuOpen ? 'is-open' : ''}`} aria-label="Navigation menu" aria-hidden={!menuOpen}>
        <div className="marketplace-drawer-header">
          <Link to="/" className="marketplace-brand" onClick={() => setMenuOpen(false)}>
            <span className="marketplace-brand-mark" aria-hidden="true"><span>O</span></span>
            <span className="marketplace-brand-wordmark">omix<span>store</span></span>
          </Link>
          <button type="button" className="marketplace-icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="marketplace-drawer-scroll">
          <Link to="/search" className="marketplace-drawer-search" onClick={() => setMenuOpen(false)}>
            <Search className="h-5 w-5" />
            <span>Search the marketplace</span>
          </Link>

          <div className="marketplace-drawer-account">
            {user ? (
              <>
                <div className="marketplace-drawer-profile">
                  <span className="marketplace-avatar marketplace-avatar-large"><User className="h-5 w-5" /></span>
                  <div><strong>Welcome back</strong><span>{user.email}</span></div>
                </div>
                <Link to="/account" onClick={() => setMenuOpen(false)} className="marketplace-drawer-profile-link">View account <ChevronRight className="h-4 w-4" /></Link>
              </>
            ) : (
              <div className="marketplace-drawer-auth">
                <div><strong>Make shopping personal</strong><span>Save favourites and track every order.</span></div>
                <div className="marketplace-drawer-auth-actions">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="marketplace-button marketplace-button-secondary">Log In</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="marketplace-button marketplace-button-primary">Create account</Link>
                </div>
              </div>
            )}
          </div>

          <div className="marketplace-drawer-section">
            <p className="marketplace-drawer-label">Explore Omix</p>
            {visibleLinks.map(link => {
              const Icon = link.icon;
              const linkClass = 'marketplace-drawer-link';
              if (link.external) {
                return <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer" className={linkClass} onClick={() => setMenuOpen(false)}><Icon className="h-[18px] w-[18px]" />{link.label}<ChevronRight className="h-4 w-4 ml-auto" /></a>;
              }
              return <Link key={link.to} to={link.to} className={linkClass} onClick={() => setMenuOpen(false)}><Icon className="h-[18px] w-[18px]" />{link.label}<ChevronRight className="h-4 w-4 ml-auto" /></Link>;
            })}
          </div>

          <div className="marketplace-drawer-section">
            <div className="flex items-center justify-between mb-3">
              <p className="marketplace-drawer-label mb-0">Shop categories</p>
              <Link to="/search" onClick={() => setMenuOpen(false)} className="marketplace-drawer-see-all">See all</Link>
            </div>
            <div className="marketplace-drawer-categories">
              {topCategories.concat(CATEGORIES.filter(category => category !== 'All').slice(7)).map(category => {
                const info = CATEGORY_INFO[category] || {};
                return <Link key={category} to={`/search?category=${encodeURIComponent(category)}`} onClick={() => setMenuOpen(false)} className="marketplace-drawer-category"><span><CategoryIcon iconName={info.icon} className="h-4 w-4" /></span>{category}</Link>;
              })}
            </div>
          </div>

          {user && (
            <div className="marketplace-drawer-section marketplace-drawer-account-links">
              {isUserSeller ? <Link to="/seller/dashboard" onClick={() => setMenuOpen(false)} className="marketplace-drawer-link"><Store className="h-[18px] w-[18px]" />Seller dashboard<ChevronRight className="h-4 w-4 ml-auto" /></Link> : <Link to="/seller/register" onClick={() => setMenuOpen(false)} className="marketplace-drawer-link"><Store className="h-[18px] w-[18px]" />Become a seller<ChevronRight className="h-4 w-4 ml-auto" /></Link>}
              {isUserAffiliate && <Link to="/affiliate-dashboard" onClick={() => setMenuOpen(false)} className="marketplace-drawer-link"><DollarSign className="h-[18px] w-[18px]" />Affiliate dashboard<ChevronRight className="h-4 w-4 ml-auto" /></Link>}
              <Link to="/wallet" onClick={() => setMenuOpen(false)} className="marketplace-drawer-link"><Wallet className="h-[18px] w-[18px]" />Wallet<ChevronRight className="h-4 w-4 ml-auto" /></Link>
              {isUserAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="marketplace-drawer-link"><Shield className="h-[18px] w-[18px]" />Admin dashboard<ChevronRight className="h-4 w-4 ml-auto" /></Link>}
              <button type="button" onClick={handleLogout} className="marketplace-drawer-link marketplace-drawer-logout"><LogOut className="h-[18px] w-[18px]" />Sign out</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;
