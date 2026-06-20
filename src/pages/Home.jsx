import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import InstallBanner from '../components/InstallBanner';
import { CATEGORIES } from '../utils/constants';
import { fetchListings } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import SearchBar from '../components/SearchBar';
import RecentlyViewed from '../components/RecentlyViewed';
import QuickViewModal from '../components/QuickViewModal';
import { useActiveTheme } from '../context/SeasonalContext';
import AutoScrollCarousel from '../components/AutoScrollCarousel';
const ITEMS_PER_PAGE = 24;

function Home() {
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
  const [isAiMode, setIsAiMode] = useState(false);
  const [quickViewListing, setQuickViewListing] = useState(null);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const result = await fetchListings(activeCategory, isAiMode ? '' : searchQuery, 1, ITEMS_PER_PAGE);
      setListings(result.listings);
      setTotalCount(result.total);
      setHasMore(result.listings.length < result.total);
      setPage(1);
      setLoading(false);
    };
    fetch();
  }, [activeCategory, searchQuery, isAiMode]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await fetchListings(activeCategory, isAiMode ? '' : searchQuery, nextPage, ITEMS_PER_PAGE);
    setListings(prev => [...prev, ...result.listings]);
    setPage(nextPage);
    setHasMore(nextPage * ITEMS_PER_PAGE < result.total);
    setLoadingMore(false);
  };

  const featuredProducts = listings.slice(0, 8);

  // Theme-aware hero colors
  const heroFrom = theme?.colors?.heroFrom || '#ff385c';
  const heroVia = theme?.colors?.heroVia || '#e03150';
  const heroTo = theme?.colors?.heroTo || '#c02040';
  const heroText = theme?.colors?.heroText || '#ffffff';
  const heroSubtext = theme?.colors?.heroSubtext || '#e0e0e0';
  const ctaBg = theme?.colors?.ctaBg || '#ffffff';
  const ctaText = theme?.colors?.ctaText || '#ff385c';
  const heroTitle = theme?.heroTitle || 'Your Online Store in Kericho';
  const heroSubtitle = theme?.heroSubtitle || 'Browse, add to cart, and pay easily via M-Pesa. Delivered to your doorstep.';
  const badgeText = theme?.badgeText || '';

  return (
    <div data-name="home-page">

      {/* Hero Section */}
      <div className="relative overflow-hidden mb-8">
        {/* Gradient Background — theme-aware */}
        <div
          className="absolute inset-0 seasonal-hero-gradient"
          style={{
            background: `linear-gradient(135deg, ${heroFrom}, ${heroVia}, ${heroTo})`,
          }}
        ></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_50%)]"></div>

        {/* Hero Content */}
        <div className="relative z-10 py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* Seasonal badge */}
            {badgeText && (
              <span
                className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4"
                style={{ backgroundColor: theme.colors?.badgeBg, color: theme.colors?.badgeText }}
              >
                {badgeText}
              </span>
            )}
            <h1
              className="text-4xl md:text-6xl font-black mb-4 tracking-tighter drop-shadow-lg"
              style={{ color: heroText }}
            >
              {heroTitle}
            </h1>
            <p
              className="mb-8 max-w-xl mx-auto text-lg font-medium drop-shadow-md"
              style={{ color: heroSubtext }}
            >
              {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
                style={{ backgroundColor: ctaBg, color: ctaText }}
              >
                {t('home.browseListings') || 'Browse Products'}
              </Link>
              <Link
                to={user ? '/account' : '/signup'}
                className="px-6 py-3 rounded-xl bg-white/15 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/25 transition-all border border-white/20"
              >
                {user ? (t('nav.account') || 'My Account') : (t('auth.signUp') || 'Sign Up')}
              </Link>
            </div>

            <SearchBar onSearch={(q) => { setSearchQuery(q); setIsAiMode(false); }} initialValue={searchQuery} />

          </div>
        </div>
      </div>

      {/* Video Preview */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full aspect-video"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%230f0f10' width='1920' height='1080'/%3E%3C/svg%3E"
          >
            <source src="/videos/buy_sell_kericho.mp4" type="video/mp4" />
          </video>
        </div>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-3">
          <Link to="/how-it-works" className="text-[#ff385c] font-bold hover:underline">{t('home.howItWorks')}</Link>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Featured Products - Auto Scroll Carousel */}
        {featuredProducts.length > 0 && activeCategory === 'All' && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t('home.featuredListings')}</h2>
            </div>
            <AutoScrollCarousel itemMinWidth={260} gap={16} speed={35}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} listing={product} />
              ))}
            </AutoScrollCarousel>
          </div>
        )}

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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {listings.map(listing => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Load More button */}
        {!loading && listings.length > 0 && hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-[#ff385c] text-white rounded-xl font-bold hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading...</span>
              ) : (
                `Load More (${listings.length} of ${totalCount})`
              )}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4 text-lg">{t('home.noListings')}</p>
            <Link to="/" className="text-[#ff385c] font-bold text-lg hover:underline underline-offset-4 mb-8 block">
              {t('home.browseListings') || 'Browse Products'}
            </Link>
            <NiaContextualTrigger page="emptyCart" />
          </div>
        )}
      </div>
      <InstallBanner />

      {/* Recently Viewed */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <RecentlyViewed allListings={listings} />
      </div>

      {/* Quick View Modal */}
      {quickViewListing && (
        <QuickViewModal listing={quickViewListing} onClose={() => setQuickViewListing(null)} />
      )}
    </div>
  );
}

export default Home;
