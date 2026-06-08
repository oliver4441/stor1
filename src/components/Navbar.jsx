import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, User, Globe, Shield, Package, Sparkles, HelpCircle, Heart, Info, Store, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useLang } from '../utils/lang';
import { isAdmin } from '../utils/api';

const FEATURE_LINKS = [
  { to: '/events', label: 'Events', icon: Sparkles, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/40', pulse: 'animate-pulse-violet' },
  { to: '/how-it-works', label: 'How It Works', icon: HelpCircle, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/40', pulse: 'animate-pulse-amber' },
  { to: '/wishes', label: 'Wishes', icon: Heart, color: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/40', pulse: 'animate-pulse-rose' },
  { to: '/about', label: 'About', icon: Info, color: 'from-cyan-500 to-teal-600', glow: 'shadow-cyan-500/40', pulse: 'animate-pulse-cyan' },
];

function Navbar() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggleLang, t } = useLang();
  const location = useLocation();

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

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggleTheme = () => document.documentElement.classList.toggle('dark');

  return (
    <nav className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 transition-all" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold text-[#ff385c] tracking-tight">Omix</span>
        </Link>

        {/* Desktop: Feature Links */}
        <div className="hidden lg:flex items-center gap-2">
          {FEATURE_LINKS.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 group ${
                  isActive
                    ? `bg-gradient-to-r ${link.color} text-white shadow-lg ${link.glow}`
                    : `text-zinc-600 dark:text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:${link.color} hover:shadow-md hover:${link.glow}`
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-bounce-subtle' : 'group-hover:animate-bounce-subtle'}`} />
                <span>{link.label}</span>
                {/* Pulsing ring indicator */}
                <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-20 animate-ping-slow pointer-events-none`} />
              </Link>
            );
          })}
        </div>

        {/* Desktop: Right side */}
        <div className="hidden md:flex items-center gap-2.5">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors" aria-label="Toggle theme">
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-[#ff385c] hover:text-[#ff385c] transition-all" aria-label="Toggle language">
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'EN' : 'SW'}
          </button>

          {isUserAdmin && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-700">
              <Link to="/admin/events" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#ff385c] hover:bg-[#ff385c]/10 transition-all">
                <Shield className="w-3.5 h-3.5" />
                Events
              </Link>
              <Link to="/admin/listings" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#ff385c] hover:bg-[#ff385c]/10 transition-all">
                <Package className="w-3.5 h-3.5" />
                Listings
              </Link>
            </div>
          )}

          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium hidden lg:block">{t('nav.dashboard')}</span>
              </Link>
              <Link to="/sell" className="flex items-center gap-1.5 bg-[#ff385c] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#e03150] shadow-lg shadow-[#ff385c]/25 hover:shadow-[#ff385c]/40 transition-all hover:scale-105 active:scale-95">
                <Store className="w-4 h-4" />
                Sell
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <Link to="/signup" className="flex items-center gap-1.5 bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#ff385c]/25 hover:shadow-[#ff385c]/40 transition-all hover:scale-105 active:scale-95">
                <UserPlus className="w-4 h-4" />
                Start Selling
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
            {/* Feature links */}
            {FEATURE_LINKS.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${link.color} text-white shadow-lg`
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-2">
              {user ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <User className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <Link to="/sell" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-[#ff385c] text-white mt-1">
                    <Store className="w-5 h-5" />
                    Sell
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <LogIn className="w-5 h-5" />
                    Log In
                  </Link>
                  <Link to="/signup" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white mt-1">
                    <UserPlus className="w-5 h-5" />
                    Start Selling
                  </Link>
                </>
              )}
            </div>

            {/* Theme + Lang */}
            <div className="flex gap-2 pt-2">
              <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                <Sun className="w-4 h-4 hidden dark:block" />
                <Moon className="w-4 h-4 block dark:hidden" />
                <span className="hidden dark:inline">Light</span>
                <span className="dark:hidden">Dark</span>
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
