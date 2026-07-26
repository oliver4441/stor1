import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../utils/constants';
import { fetchListings, mapListingCategories } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import SearchBar from '../components/SearchBar';
import QuickViewModal from '../components/QuickViewModal';
import SeasonalParticles from '../components/SeasonalParticles';
import { useActiveTheme } from '../context/SeasonalContext';
import { ShoppingBag, Sparkles } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

function Refurbished() {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [quickViewListing, setQuickViewListing] = useState(null);
  const theme = useActiveTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const result = await fetchListings(activeCategory, searchQuery, 1, ITEMS_PER_PAGE, 'refurbished');
      setListings(result.listings);
      setTotalCount(result.total);
      setHasMore(result.listings.length < result.total);
      setPage(1);
      setLoading(false);
    };
    fetch();
  }, [activeCategory, searchQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await fetchListings(activeCategory, searchQuery, nextPage, ITEMS_PER_PAGE, 'refurbished');
    setListings(prev => [...prev, ...result.listings]);
    setPage(nextPage);
    setHasMore(nextPage * ITEMS_PER_PAGE < result.total);
    setLoadingMore(false);
  };

  const heroFrom = theme?.colors?.heroFrom || '#007AFF';
  const heroVia = theme?.colors?.heroVia || '#0066CC';
  const heroTo = theme?.colors?.heroTo || '#0055AA';
  const particleType = theme?.particleType || 'none';

  return (
    <div data-name="refurbished-page">
      <SeasonalParticles type={particleType} count={15} />

      {/* Hero */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-0 seasonal-hero-gradient" style={{ background: `linear-gradient(135deg, ${heroFrom}, ${heroVia}, ${heroTo})` }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative px-4 py-12 sm:py-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Quality Checked</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">Refurbished Deals</h1>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
            Pre-owned items restored to great condition. Same quality, lower price. All with our standard warranty and return policy.
          </p>
          <div className="mt-6">
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/30 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Shop New Arrivals
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search */}
        <div className="mb-6">
          <SearchBar onSearch={(q) => setSearchQuery(q)} initialValue={searchQuery} />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {['All', ...CATEGORIES.filter(c => c !== 'All')].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[var(--seasonal-primary,#007AFF)] text-white shadow-lg'
                  : 'bg-[#28303F] text-[#4A5771] hover:bg-[#28303F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#4A5771]">
            {loading ? 'Loading...' : `${totalCount} refurbished item${totalCount !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="fusion-skeleton rounded-2xl animate-pulse h-72"></div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {listings.map(listing => (
                <ProductCard key={listing.id} listing={listing} onQuickView={() => setQuickViewListing(listing)} />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button onClick={loadMore} disabled={loadingMore}
                  className="px-8 py-3 rounded-xl bg-[#28303F] text-white text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#4A5771] mb-2">No refurbished items yet</h3>
            <p className="text-sm text-[#4A5771]">Check back soon — great deals are coming!</p>
          </div>
        )}
      </div>

      {quickViewListing && (
        <QuickViewModal listing={quickViewListing} onClose={() => setQuickViewListing(null)} />
      )}
    </div>
  );
}

export default Refurbished;
