import { useState, useEffect } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import InstallBanner from '../components/InstallBanner';
import { CATEGORIES } from '../utils/constants';
import { fetchListings } from '../utils/api';

function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiMode, setIsAiMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const data = await fetchListings(activeCategory, isAiMode ? '' : searchQuery);
      setListings(data);
      setLoading(false);
    };
    fetch();
  }, [activeCategory, searchQuery, isAiMode]);

  return (
    <div data-name="home-page">
      {/* Hero Section */}
      <div className="relative overflow-hidden mb-8">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%2318181b' width='1920' height='1080'/%3E%3C/svg%3E"
          >
            <source src="/eruption.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-white drop-shadow-lg">Buy and sell in Kericho</h1>
            <p className="text-zinc-200 mb-8 max-w-xl mx-auto text-lg font-medium drop-shadow-md">The cleanest marketplace to find electronics, furniture, and services near you.</p>
            
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {isAiMode ? <Sparkles className="w-5 h-5 text-[#ff385c]" /> : <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-[#ff385c]" />}
              </div>
              <input 
                type="text" 
                placeholder={isAiMode ? "Describe what you're looking for (AI)..." : "Search for anything..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-24 py-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border transition-all focus:outline-none focus:ring-4 focus:ring-[#ff385c]/20 shadow-xl text-lg ${isAiMode ? 'border-[#ff385c] ring-2 ring-[#ff385c]/10' : 'border-zinc-200 dark:border-zinc-800'}`}
              />
              <button 
                onClick={() => setIsAiMode(!isAiMode)}
                className={`absolute inset-y-2 right-2 px-4 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${isAiMode ? 'bg-[#ff385c] text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                {isAiMode ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {isAiMode ? 'Cancel' : 'Ask AI'}
              </button>
            </div>
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
      <InstallBanner />
    </div>
  );
}

export default Home;
