import { Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'

function Navbar() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#ff385c] tracking-tight">Omix</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/about" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">About</Link>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" aria-label="Toggle theme">
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>
          <Link to="/sell" className="bg-[#ff385c] text-white px-4 py-2 rounded-[14px] text-sm font-bold hover:bg-[#e03150]">
            Sell
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
