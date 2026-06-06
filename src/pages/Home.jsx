import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CATEGORIES } from '../utils/constants'
import { fetchListings } from '../utils/api'

function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchListings(activeCategory, searchQuery).then(data => {
      setListings(data);
      setLoading(false);
    });
  }, [activeCategory, searchQuery]);

  return (
    <div data-name="home-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#ff385c]/10 via-zinc-100 to-white dark:from-[#ff385c]/10 dark:via-zinc-900 dark:to-zinc-950 py-16 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight text-zinc-900 dark:text-white">Buy and sell in Kericho</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-xl mx-auto text-lg">The cleanest marketplace to find electronics, furniture, vehicles, and services near you.</p>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-[#ff385c]" />
            </div>
            <input 
              type="text" 
              placeholder="Search for anything..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-[#ff385c]/50 text-zinc-900 dark:text-white shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-[14px] text-sm font-medium whitespace-nowrap border transition-all ${
                activeCategory === cat 
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' 
                  : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-[14px]"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {listings.map(listing => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4 text-lg">No listings found.</p>
            <Link to="/sell" className="text-[#ff385c] font-bold text-lg hover:underline underline-offset-4">
              Be the first to post!
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
