import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronRight, CreditCard, MapPin, PackageCheck, ShieldCheck, Sparkles, Store, Truck, RotateCcw, Search as SearchIcon } from 'lucide-react';
import { fetchListings, mapListingCategories } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import SearchBar from '../components/SearchBar';
import RecentlyViewed from '../components/RecentlyViewed';
import SeasonalParticles from '../components/SeasonalParticles';
import { useSeasonalTheme } from '../context/SeasonalContext';
import { CATEGORIES } from '../utils/constants';
import FlashDealsBar from '../components/FlashDealsBar';
import AutoScrollCarousel from '../components/AutoScrollCarousel';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 24;

const CATEGORY_EMOJIS = {
  Electronics: '◈',
  Furniture: '⌂',
  Clothing: '✦',
  Services: '✳',
  Vehicles: '↗',
  'Home & Garden': '⌁',
  Books: '▤',
  Sports: '◎',
  'Health & Beauty': '✿',
  Food: '◇',
  Drinks: '○',
  Snacks: '✧',
  Bakery: '◌',
  Others: '＋',
};

const CATEGORY_TINTS = [
  'sage', 'sand', 'lavender', 'sky', 'peach', 'mint', 'butter', 'rose',
];

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
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('purchase_count', { ascending: false })
          .limit(8);
        if (!error && data) setPopularProducts(mapListingCategories(data));
      } catch (error) {
        console.warn('Failed to fetch popular products:', error.message);
      }
    };
    fetchPopular();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery, isAiMode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loadListings = async () => {
      const result = await fetchListings(activeCategory, isAiMode ? '' : searchQuery, page, ITEMS_PER_PAGE, 'new');
      if (cancelled) return;
      setListings(result.listings);
      setTotalCount(result.total);
      setLoading(false);
    };
    loadListings().catch(error => {
      if (!cancelled) {
        console.warn('Failed to load listings:', error.message);
        setListings([]);
        setTotalCount(0);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [activeCategory, searchQuery, isAiMode, page]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const featuredProducts = listings.slice(0, 8);
  const showDiscoveryRows = activeCategory === 'All' && !searchQuery && !isAiMode;
  const heroFrom = theme?.colors?.heroFrom || '#0d4f43';
  const heroVia = theme?.colors?.heroVia || '#0f766e';
  const heroTo = theme?.colors?.heroTo || '#173a35';
  const heroText = theme?.colors?.heroText || '#ffffff';
  const heroSubtext = theme?.colors?.heroSubtext || '#d8ebe4';
  const heroAccent = theme?.colors?.heroAccent || '#a9e7c5';
  const ctaBg = theme?.colors?.ctaBg || '#f5c56b';
  const ctaText = theme?.colors?.ctaText || '#173a35';
  const heroTitle = heroOverride?.title || theme?.heroTitle || 'Find something worth keeping.';
  const heroSubtitle = heroOverride?.subtitle || theme?.heroSubtitle || 'Shop quality finds from trusted local sellers, with simple M-Pesa checkout and delivery across Kenya.';
  const heroImage = heroOverride?.imageUrl || theme?.heroImages?.[0] || '/hero-bg.jpg';
  const particleType = theme?.particleType || 'none';
  const sticker = theme?.sticker || '';
  const socialBadge = theme?.socialBadge || '';

  return (
    <div className="marketplace-home" data-name="home-page">
      <SeasonalParticles type={particleType} count={25} />
      <FlashDealsBar />

      <section
        className="marketplace-hero"
        style={{
          '--hero-from': heroFrom,
          '--hero-via': heroVia,
          '--hero-to': heroTo,
          '--hero-text': heroText,
          '--hero-subtext': heroSubtext,
          '--hero-accent': heroAccent,
          '--hero-cta': ctaBg,
          '--hero-cta-text': ctaText,
        }}
      >
        <div className="marketplace-hero-glow marketplace-hero-glow-one" />
        <div className="marketplace-hero-glow marketplace-hero-glow-two" />
        <div className="marketplace-hero-inner">
          <div className="marketplace-hero-copy">
            <div className="marketplace-eyebrow marketplace-eyebrow-light">
              <span className="marketplace-live-dot" />
              {socialBadge || 'Kenya’s trusted marketplace'}
            </div>
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>
            <div className="marketplace-hero-actions">
              <button type="button" className="marketplace-button marketplace-button-hero" onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                {t('home.browseListings') || 'Explore products'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link to={user ? '/account' : '/signup'} className="marketplace-hero-secondary">
                {user ? 'Open my account' : 'Join Omix'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="marketplace-hero-proof">
              <span><BadgeCheck className="h-4 w-4" /> Verified sellers</span>
              <span><MapPin className="h-4 w-4" /> Delivery across Kenya</span>
            </div>
          </div>

          <div className="marketplace-hero-visual">
            <div className="marketplace-hero-image-frame">
              <img src={heroImage} alt="A selection of products available on Omix Store" />
              <div className="marketplace-hero-image-overlay" />
              <div className="marketplace-hero-image-label"><span>{sticker || '✦'}</span> Curated for you</div>
            </div>
            <div className="marketplace-floating-card marketplace-floating-card-top">
              <span className="marketplace-floating-icon"><ShieldCheck className="h-4 w-4" /></span>
              <span><strong>Shop with confidence</strong><small>Protected checkout</small></span>
            </div>
            <div className="marketplace-floating-card marketplace-floating-card-bottom">
              <span className="marketplace-floating-avatars"><i>J</i><i>M</i><i>K</i></span>
              <span><strong>Local sellers, real finds</strong><small>New items added daily</small></span>
            </div>
          </div>

          <div className="marketplace-hero-search">
            <div className="marketplace-hero-search-heading"><SearchIcon className="h-4 w-4" /><span>What are you looking for?</span><small>Try “phone”, “sofa” or “sneakers”</small></div>
            <SearchBar onSearch={(query) => { setSearchQuery(query); setIsAiMode(false); }} initialValue={searchQuery} />
          </div>
        </div>
      </section>

      <section className="marketplace-trust-strip marketplace-container" aria-label="Why shop with Omix">
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><ShieldCheck /></span><div><strong>Secure checkout</strong><span>Pay safely with M-Pesa</span></div></div>
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><Truck /></span><div><strong>Simple delivery</strong><span>From local sellers to you</span></div></div>
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><RotateCcw /></span><div><strong>Shop confidently</strong><span>7-day return promise</span></div></div>
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><Store /></span><div><strong>Local & trusted</strong><span>Support Kenyan sellers</span></div></div>
      </section>

      <section className="marketplace-container marketplace-category-section">
        <div className="marketplace-section-heading">
          <div><span className="marketplace-eyebrow">Start exploring</span><h2>Shop by category</h2></div>
          <Link to="/search" className="marketplace-text-link">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="marketplace-category-cards">
          {CATEGORIES.filter(category => category !== 'All').slice(0, 8).map((category, index) => (
            <Link key={category} to={`/search?category=${encodeURIComponent(category)}`} className={`marketplace-category-card marketplace-category-card-${CATEGORY_TINTS[index] || 'sage'}`}>
              <span className="marketplace-category-symbol">{CATEGORY_EMOJIS[category] || '＋'}</span>
              <span>{category}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </section>

      {showDiscoveryRows && featuredProducts.length > 0 && (
        <section className="marketplace-container marketplace-discovery-section">
          <div className="marketplace-section-heading">
            <div><span className="marketplace-eyebrow">Handpicked today</span><h2>{t('home.featuredListings') || 'Featured finds'}</h2></div>
            <Link to="/search" className="marketplace-text-link">See more <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <AutoScrollCarousel itemMinWidth={248} gap={16} speed={32} className="marketplace-product-carousel">
            {featuredProducts.map(product => <ProductCard key={product.id} listing={product} />)}
          </AutoScrollCarousel>
        </section>
      )}

      {showDiscoveryRows && popularProducts.length > 0 && (
        <section className="marketplace-container marketplace-discovery-section marketplace-discovery-section-popular">
          <div className="marketplace-section-heading">
            <div><span className="marketplace-eyebrow">Loved by shoppers</span><h2>Popular right now</h2></div>
            <Link to="/search" className="marketplace-text-link">Browse all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <AutoScrollCarousel itemMinWidth={248} gap={16} speed={28} className="marketplace-product-carousel">
            {popularProducts.map(product => <ProductCard key={product.id} listing={product} />)}
          </AutoScrollCarousel>
        </section>
      )}

      <section id="products-section" className="marketplace-container marketplace-catalog-section">
        <div className="marketplace-catalog-toolbar">
          <div><span className="marketplace-eyebrow">Fresh on Omix</span><h2>{searchQuery ? `Results for “${searchQuery}”` : 'Latest from the marketplace'}</h2><p>{loading ? 'Updating the collection…' : `${totalCount.toLocaleString()} ${totalCount === 1 ? 'item' : 'items'} ready to explore`}</p></div>
          <Link to="/search" className="marketplace-button marketplace-button-secondary marketplace-catalog-all-link">Advanced search <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="marketplace-filter-bar">
          <div className="marketplace-filter-label">Browse</div>
          <div className="marketplace-filter-scroll scrollbar-hide">
            {CATEGORIES.map(category => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`marketplace-filter-pill ${activeCategory === category ? 'is-active' : ''}`}>{category}</button>)}
          </div>
        </div>

        {loading ? (
          <div className="marketplace-product-grid" aria-label="Loading products">
            {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : listings.length > 0 ? (
          <div className="marketplace-product-grid">
            {listings.map(listing => <ProductCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="marketplace-empty-state">
            <span className="marketplace-empty-icon"><SearchIcon className="h-7 w-7" /></span>
            <h3>No products found yet</h3>
            <p>Try another search or browse the full collection.</p>
            <button type="button" className="marketplace-button marketplace-button-primary" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>Clear filters</button>
            <NiaContextualTrigger page="emptyCart" />
          </div>
        )}

        {!loading && listings.length > 0 && totalPages > 1 && (
          <div className="marketplace-pagination"><p>Page {page} of {totalPages}</p><Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} /></div>
        )}
      </section>

      <section className="marketplace-container marketplace-how-it-works">
        <div className="marketplace-process-intro"><span className="marketplace-eyebrow">A simpler way to shop</span><h2>From browse to doorstep.</h2><p>Every part of Omix is designed to make local shopping feel clear, safe and enjoyable.</p><Link to="/how-it-works" className="marketplace-text-link">See how it works <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="marketplace-process-steps">
          <div><span>01</span><CreditCard className="h-5 w-5" /><h3>Find your fit</h3><p>Explore thoughtful listings from sellers around Kenya.</p></div>
          <div><span>02</span><PackageCheck className="h-5 w-5" /><h3>Checkout simply</h3><p>Pay securely with M-Pesa and get clear order updates.</p></div>
          <div><span>03</span><Truck className="h-5 w-5" /><h3>Receive with ease</h3><p>Your seller gets it moving and you follow along.</p></div>
        </div>
      </section>

      <div className="marketplace-container marketplace-recently-viewed"><RecentlyViewed allListings={listings} /></div>
    </div>
  );
}

export default Home;
