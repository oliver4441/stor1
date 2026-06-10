import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 mt-12" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; 2026 Omix Store. Your trusted online store in Kericho, Kenya.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/how-it-works" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">How It Works</Link>
          <Link to="/about" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">About</Link>
          <Link to="/install" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">Install App</Link>
        </div>
        <div className="flex gap-4">
          <Link to="/terms" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">Terms of Service</Link>
          <Link to="/privacy" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
