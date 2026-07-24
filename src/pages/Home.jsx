import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstallBanner from '../components/InstallBanner';
import { fetchListings, mapListingCategories } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import SearchBar from '../components/SearchBar';
import RecentlyViewed from '../components/RecentlyViewed';
import QuickViewModal from '../components/QuickViewModal';
import SeasonalParticles from '../components/SeasonalParticles';
import { useSeasonalTheme } from '../context/SeasonalContext';
import { CATEGORIES } from '../utils/constants';
import FlashDealsBar from '../components/FlashDealsBar';
import AutoScrollCarousel from '../components/AutoScrollCarousel';

const ITEMS_PER_PAGE = 24;

function Home() {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [popularProducts, setPopularProducts] = useState([]);
  const { activeTheme: theme, heroOverride } = useSeasonalTheme();
  const [isAiMode, setIsAiMode] = useState(false);
  const [quickViewListing, setQuickViewListing] = useState(null);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch popular products (sorted by purchase_count)
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('purchase_count', { ascending: false })
          .limit(8);
        if (!error && data) {
          setPopularProducts(mapListingCategories(data));
        }
      } catch (e) {
        console.warn('Failed to fetch popular products:', e.message);
      }
    };
    fetchPopular();
  }, []);
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery, isAiMode]);

  // Fetch products for current page
  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const result = await fetchListings(activeCategory, isAiMode ? '' : searchQuery, page, ITEMS_PER_PAGE, 'new');
      setListings(result.listings);
      setTotalCount(result.total);
      setLoading(false);
    };
    fetch();
  }, [activeCategory, searchQuery, isAiMode, page]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const featuredProducts = listings.slice(0, 8);

  const heroFrom = theme?.colors?.heroFrom || '#1E2A3D';
  const heroVia = theme?.colors?.heroVia || '#242C3B';
  const heroTo = theme?.colors?.heroTo || '#2A3548';
  const heroText = theme?.colors?.heroText || '#ffffff';
  const heroSubtext = theme?.colors?.heroSubtext || '#8E9BB5';
  const heroAccent = theme?.colors?.heroAccent || '#007AFF';
  const heroOverlay = theme?.colors?.heroOverlay || 'rgba(0,122,255,0.2)';
  const ctaBg = theme?.colors?.ctaBg || '#007AFF';
  const ctaText = theme?.colors?.ctaText || '#ffffff';
  const heroTitle = heroOverride?.title || theme?.heroTitle || "Kenya's #1 Online Store";
  const heroSubtitle = heroOverride?.subtitle || theme?.heroSubtitle || 'M-Pesa Payments · Free Delivery · 7-Day Returns · Shop from anywhere in Kenya';
  const heroImageUrl = heroOverride?.imageUrl || '';
  const hasHeroImage = !!heroImageUrl;
  const particleType = theme?.particleType || 'none';
  const heroImages = theme?.heroImages || [];
  const hasHeroImages = heroImageUrl ? true : heroImages.length > 0;
  const sticker = theme?.sticker || '';
  const socialBadge = theme?.socialBadge || '';
  const vibe = theme?.vibe || 'default';

  return (
    <div data-name="home-page">
      {/* Seasonal Particles */}
      <SeasonalParticles type={particleType} count={25} />

      {/* Flash Deals Bar */}
      <FlashDealsBar />

      {!user && (
        <>
      {/* Hero Section */}
      <div className="relative overflow-hidden mb-8">
        {/* Gradient Background — theme-aware */}
        <div
          className="absolute inset-0 seasonal-hero-gradient"
          style={{
            background: `linear-gradient(135deg, ${heroFrom}, ${heroVia}, ${heroTo})`,
          }}
        ></div>
        {/* Ambient glow orb */}
        <div
          className="theme-ambient-orb"
          style={{
            background: `radial-gradient(circle, ${heroAccent || heroFrom} 0%, transparent 70%)`,
            top: '-10%',
            right: '-5%',
          }}
        />
        <div
          className="theme-ambient-orb"
          style={{
            background: `radial-gradient(circle, ${heroFrom} 0%, transparent 70%)`,
            bottom: '-15%',
            left: '-5%',
            animationDelay: '-10s',
            width: '400px',
            height: '400px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_50%)]"></div>

        {/* Floating sticker decoration */}
        {sticker && (
          <div className="absolute top-8 right-8 md:top-16 md:right-16 opacity-20 select-none pointer-events-none">
            <span className="text-8xl md:text-9xl">{sticker}</span>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1
              className="text-4xl md:text-6xl font-display font-black mb-4 tracking-tighter drop-shadow-lg"
              style={{ color: heroText }}
            >
              {heroTitle}
            </h1>
            <p
              className="mb-4 max-w-xl mx-auto text-lg font-medium drop-shadow-md"
              style={{ color: heroSubtext }}
            >
              {heroSubtitle}
            </p>

            {/* Theme social proof badge */}
            {socialBadge && (
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-bold">
                <span>{sticker}</span>
                <span>{socialBadge}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <button
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer"
                style={{ backgroundColor: ctaBg, color: ctaText }}
              >
                {t('home.browseListings') || 'Browse Products'}
              </button>
              <Link
                to={user ? '/account' : '/signup'}
                className="px-6 py-3 rounded-xl bg-white/15 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/25 transition-all border border-white/20"
              >
                {user ? (t('nav.account') || 'My Account') : (t('auth.signUp') || 'Sign Up')}
              </Link>
            </div>

            <SearchBar onSearch={(q) => { setSearchQuery(q); setIsAiMode(false); }} initialValue={searchQuery} />

            {/* World Cup Hero Images */}
            {hasHeroImages && (
              <div className="mt-10 max-w-4xl mx-auto">
                <div className="grid grid-cols-3 gap-3 md:gap-5">
                  {(heroImageUrl ? [heroImageUrl] : heroImages).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 hover:border-white/50 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 group"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      <img
                        src={img}
                        alt={`World Cup ${idx + 1}`}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      </>
      )}

      {/* Trust Strip */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 bg-[#28303F] border border-[#353F54] rounded-xl p-4">
<div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <p className="text-sm text-[#FAFAFA] font-bold">M-Pesa Payments</p>
              <p className="text-xs text-[#4A5771]">Secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#28303F] border border-[#353F54] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Free Delivery</p>
              <p className="text-xs text-[#4A5771]">Nationwide delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#28303F] border border-[#353F54] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">7-Day Returns</p>
              <p className="text-xs text-zinc-400">Hassle-free</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#28303F] border border-[#353F54] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.062-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Verified Seller</p>
              <p className="text-xs text-[#4A5771]">Trusted & local</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="fusion-recessed-card overflow-hidden shadow-2xl">
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
        <p className="text-center text-sm text-zinc-400 mt-3">
          {!user && <Link to="/how-it-works" className="text-[var(--seasonal-primary,#007AFF)] font-bold hover:underline">{t('home.howItWorks')}</Link>}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4" id="products-section">
        {/* Featured Products - Auto Scroll Carousel */}
        {featuredProducts.length > 0 && activeCategory === 'All' && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{t('home.featuredListings')}</h2>
            </div>
            <AutoScrollCarousel itemMinWidth={260} gap={16} speed={35}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} listing={product} />
              ))}
            </AutoScrollCarousel>
          </div>
        )}

        {/* Popular Products - Auto Scroll Carousel */}
        {popularProducts.length > 0 && activeCategory === 'All' && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Popular Right Now</h2>
            </div>
            <AutoScrollCarousel itemMinWidth={260} gap={16} speed={30}>
              {popularProducts.map((product) => (
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
                  ? 'bg-[#007AFF] text-white border-[#007AFF]' 
                  : 'bg-[#28303F]/60 text-[#8E9BB5] border-[#353F54] hover:border-[#007AFF] hover:text-white'
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
                <div className="aspect-square bg-[#28303F] rounded-[14px]"></div>
                <div className="h-4 bg-[#28303F] rounded w-3/4"></div>
                <div className="h-4 bg-[#28303F] rounded w-1/2"></div>
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

        {/* Pagination */}
        {!loading && listings.length > 0 && totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 mt-8">
            <p className="text-xs text-[#4A5771]">Page {page} of {totalPages}</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-400 mb-4 text-lg">{t('home.noListings')}</p>
            <Link to="/" className="text-[var(--seasonal-primary,#1a5632)] font-bold text-lg hover:underline underline-offset-4 mb-8 block">
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
