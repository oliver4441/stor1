import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, User } from 'lucide-react';
import { supabase } from '../utils/supabase';

function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
        
        <div className="flex items-center gap-4">
          <Link to="/events" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">Events</Link>
          <Link to="/how-it-works" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">How It Works</Link>
          <Link to="/wishes" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">Wishes</Link>
          <Link to="/about" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hidden sm:block">About</Link>
          
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" aria-label="Toggle theme">
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">Dashboard</span>
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">Login</Link>
          )}

          <Link to="/sell" className="bg-[#ff385c] text-white px-4 py-2 rounded-[14px] text-sm font-bold hover:bg-[#e03150] shadow-md shadow-[#ff385c]/10">
            Sell
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
