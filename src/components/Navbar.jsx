import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, User, Globe, Shield } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useLang } from '../utils/lang';
import { isAdmin } from '../utils/api';

function Navbar() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const { lang, toggleLang, t } = useLang();

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

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#ff385c] tracking-tight">Omix</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link to="/events" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">{t('nav.events')}</Link>
          <Link to="/how-it-works" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">{t('nav.howItWorks')}</Link>
          <Link to="/wishes" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">{t('nav.wishes')}</Link>
          <Link to="/about" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">{t('nav.about')}</Link>
          
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" aria-label="Toggle theme">
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          {/* Language Toggle Pill */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-[#ff385c] hover:text-[#ff385c] transition-all"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'EN' : 'SW'}
          </button>

          {isUserAdmin && (
            <Link to="/admin/events" className="flex items-center gap-1.5 text-sm font-bold text-[#ff385c] hover:text-[#e03150] hidden sm:flex">
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}

          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">{t('nav.dashboard')}</span>
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">{t('nav.login')}</Link>
          )}

          <Link to="/sell" className="bg-[#ff385c] text-white px-4 py-2 rounded-[14px] text-sm font-bold hover:bg-[#e03150] shadow-md shadow-[#ff385c]/10">
            {t('nav.sell')}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
