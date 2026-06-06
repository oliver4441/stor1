import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 mt-12" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; 2026 Omix Marketplace. Kericho, Kenya.
        </p>
        <div className="flex gap-4">
          <Link to="/wishes" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">Wishes</Link>
          <Link to="/about" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">About</Link>
          <Link to="/sell" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">Sell</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
