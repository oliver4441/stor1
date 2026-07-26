import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CATEGORIES, CATEGORY_TO_ID, ID_TO_CATEGORY } from '../utils/constants';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import SearchBar from '../components/SearchBar';
import QuickViewModal from '../components/QuickViewModal';
import SeasonalParticles from '../components/SeasonalParticles';
import { useActiveTheme } from '../context/SeasonalContext';
import { ShoppingBag, Package } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

function mapCategoryName(item) {
  if (!item) return item;
  if (item.category && typeof item.category === 'string') return item;
  if (item.category_id != null) {
    item.category = ID_TO_CATEGORY[item.category_id] || item.category || 'Others';
  }
  return item;
}

function mapListingCategories(list) {
  return (list || []).map(mapCategoryName);
}

async function fetchWholesaleListings(category = 'All', searchQuery = '', page = 1, limit = ITEMS_PER_PAGE) {
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .eq('wholesale_enabled', true);

  if (category && category !== 'All') {
    const catId = CATEGORY_TO_ID[category] || null;
    if (catId) {
      query = query.eq('category_id', catId);
    } else {
      query = query.eq('category', category);
    }
  }

  if (searchQuery) {
    const sanitized = searchQuery.replace(/[^a-zA-Z0-9\s\-.]/g, '').trim();
    if (sanitized.length > 0) {
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }
  }

  query = query.order('created_at', { ascending: false });

  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[WholesalePage]', error);
    return { listings: [], total: 0 };
  }
  return { listings: mapListingCategories(data || []), total: count || 0 };
}

function WholesalePage() {
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
      const result = await fetchWholesaleListings(activeCategory, searchQuery, 1, ITEMS_PER_PAGE);
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
    const result = await fetchWholesaleListings(activeCategory, searchQuery, nextPage, ITEMS_PER_PAGE);
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
    <div data-name="wholesale-page">
      <SeasonalParticles type={particleType} count={15} />

      {/* Hero */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-0 seasonal-hero-gradient" style={{ background: `linear-gradient(135deg, ${heroFrom}, ${heroVia}, ${heroTo})` }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative px-4 py-12 sm:py-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Package className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Bulk Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">Wholesale</h1>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
            Shop products in bulk at special wholesale prices. Minimum order quantities apply per item.
          </p>
          <div className="mt-6">
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/30 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Shop Regular Items
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
            {loading ? 'Loading...' : `${totalCount} wholesale item${totalCount !== 1 ? 's' : ''} available`}
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
                <div key={listing.id} className="relative">
                  <ProductCard listing={listing} onQuickView={() => setQuickViewListing(listing)} />
                  {/* Wholesale Available Badge */}
                  <div className="absolute top-2 right-2 z-20 bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-sm">
                    Wholesale Available
                  </div>
                  {/* Minimum Order Quantity Badge */}
                  {listing.min_order_qty > 0 && (
                    <div className="absolute top-8 right-2 z-20 bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-sm">
                      Min: {listing.min_order_qty}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button onClick={loadMore} disabled={loadingMore}
                  className="px-8 py-3 rounded-xl bg-[#28303F] text-white text-sm font-bold hover:bg-[#353F54] transition-colors disabled:opacity-50">
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-[#353F54] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#4A5771] mb-2">No wholesale items yet</h3>
            <p className="text-sm text-[#4A5771]">Check back soon -- new bulk deals are added regularly!</p>
          </div>
        )}
      </div>

      {quickViewListing && (
        <QuickViewModal listing={quickViewListing} onClose={() => setQuickViewListing(null)} />
      )}
    </div>
  );
}

export default WholesalePage;
