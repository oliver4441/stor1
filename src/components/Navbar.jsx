import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, User, Globe, Shield, Package, HelpCircle, Info, LogIn, UserPlus, Menu, X, Download, ShoppingCart } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useLang } from '../utils/lang';
import { isAdmin } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useActiveTheme } from '../context/SeasonalContext';

const FEATURE_LINKS = [
  { to: 'https://blog.omixsystems.store', label: 'Blog', icon: Globe, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/40', external: true },
  { to: '/how-it-works', label: 'How It Works', icon: HelpCircle, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/40' },
  { to: '/about', label: 'About', icon: Info, color: 'from-cyan-500 to-teal-600', glow: 'shadow-cyan-500/40' },
  { to: '/install', label: 'Install App', icon: Download, color: 'from-[#ff385c] to-[#e03150]', glow: 'shadow-[#ff385c]/40' },
];

function Navbar() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggleLang, t } = useLang();
  const location = useLocation();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const theme = useActiveTheme();

  const navAccentColor = theme?.colors?.navAccent || '#ff385c';
  const navAccentText = theme?.colors?.navAccentText || '#ffffff';
  const badgeText = theme?.badgeText;
  const badgeBg = theme?.colors?.badgeBg || '#ff385c';
  const badgeTextColor = theme?.colors?.badgeText || '#ffffff';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        isAdmin().then(admin => setIsUserAdmin(admin));
      } else {
        setIsUserAdmin(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        isAdmin().then(admin => setIsUserAdmin(admin));
      } else {
        setIsUserAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <nav className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 transition-all" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold tracking-tight" style={{ color: navAccentColor }}>
            Omix Store
          </span>
          {badgeText && (
            <span
              className="seasonal-badge text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none"
              style={{ backgroundColor: badgeBg, color: badgeTextColor }}
            >
              {badgeText}
            </span>
          )}
        </Link>

        {/* Desktop: Feature Links */}
        <div className="hidden lg:flex items-center gap-2">
          {FEATURE_LINKS.map(link => {
            const Icon = link.icon;
            const isActive = !link.external && location.pathname === link.to;
            const linkClass = `relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 group ${
              isActive
                ? `bg-gradient-to-r ${link.color} text-white shadow-lg ${link.glow}`
                : `text-zinc-600 dark:text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:${link.color} hover:shadow-md hover:${link.glow}`
            }`;
            const iconEl = <Icon className={`w-4 h-4 ${isActive ? 'animate-bounce-subtle' : 'group-hover:animate-bounce-subtle'}`} />;
            const labelEl = <span>{link.label}</span>;
            const pingEl = <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-20 animate-ping-slow pointer-events-none`} />;
            if (link.external) {
              return (
                <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {iconEl}{labelEl}{pingEl}
                </a>
              );
            }
            return (
              <Link key={link.to} to={link.to} className={linkClass}>
                {iconEl}{labelEl}{pingEl}
              </Link>
            );
          })}
        </div>

        {/* Desktop: Right side */}
        <div className="hidden md:flex items-center gap-2.5">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" aria-label={t('common.toggleTheme')}>
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-[#ff385c] hover:text-[#ff385c] transition-all" aria-label={t('common.toggleLanguage')}>
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'EN' : 'SW'}
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                style={{ backgroundColor: navAccentColor }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {isUserAdmin && (
            <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
              style={{ color: navAccentColor, borderColor: navAccentColor + '33' }}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {user ? (
            <Link to="/account" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium hidden lg:block">{t('nav.account') || 'Account'}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${navAccentColor}, ${theme?.colors?.secondary || '#e03150'})`,
                  boxShadow: `0 4px 14px ${navAccentColor}40`,
                }}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-down">
          <div className="px-4 py-4 space-y-2">
            {FEATURE_LINKS.map(link => {
              const Icon = link.icon;
              const isActive = !link.external && location.pathname === link.to;
              const linkClass = `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? `bg-gradient-to-r ${link.color} text-white shadow-lg`
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`;
              if (link.external) {
                return (
                  <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </a>
                );
              }
              return (
                <Link key={link.to} to={link.to} className={linkClass}>
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}

            <Link to="/cart" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ShoppingCart className="w-5 h-5" />
              Cart {cartCount > 0 && <span className="bg-[#ff385c] text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>}
            </Link>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-2">
              {user ? (
                <>
                  <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <User className="w-5 h-5" />
                    My Account
                  </Link>
                  {isUserAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[#ff385c] hover:bg-[#ff385c]/10">
                      <Shield className="w-5 h-5" />
                      Admin Dashboard
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <LogIn className="w-5 h-5" />
                    Log In
                  </Link>
                  <Link to="/signup" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white mt-1">
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                <Sun className="w-4 h-4 hidden dark:block" />
                <Moon className="w-4 h-4 block dark:hidden" />
                <span className="hidden dark:inline">{t('common.dark')}</span>
                <span className="dark:hidden">{t('common.light')}</span>
              </button>
              <button onClick={toggleLang} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'EN' : 'SW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
