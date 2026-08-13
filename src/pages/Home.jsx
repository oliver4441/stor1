import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Check, ChevronRight, CreditCard,
  MapPin, PackageCheck, Search as SearchIcon, ShieldCheck, Sparkles, Store,
  Truck, RotateCcw,
} from 'lucide-react';
import { fetchListings, mapListingCategories } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import SearchBar from '../components/SearchBar';
import RecentlyViewed from '../components/RecentlyViewed';
import SeasonalParticles from '../components/SeasonalParticles';
import { useSeasonalTheme } from '../context/SeasonalContext';
import { CATEGORIES, formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import FlashDealsBar from '../components/FlashDealsBar';
import AutoScrollCarousel from '../components/AutoScrollCarousel';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 24;

const TRENDING_SEARCHES = ['iPhone', 'Sofa', 'Laptop', 'Sneakers', 'Dining table'];
const PRICE_RANGES = [
  { label: 'Under KES 2,000', max: '2000', note: 'Smart everyday finds' },
  { label: 'Under KES 5,000', max: '5000', note: 'More room to explore' },
  { label: 'KES 5,000 – 15,000', min: '5000', max: '15000', note: 'Quality upgrades' },
  { label: 'Premium picks', min: '15000', note: 'Worth the investment' },
];
const FAQ_ITEMS = [
  { question: 'How do I pay for an order?', answer: 'Checkout is designed around secure M-Pesa payments. You will see the available payment options clearly before confirming your order.' },
  { question: 'Where does Omix deliver?', answer: 'Omix connects you with sellers around Kenya. Delivery details and estimated timing are shown on the listing or during checkout.' },
  { question: 'Can I sell on Omix?', answer: 'Yes. Create a seller account, add your products and reach shoppers looking for good local finds.' },
  { question: 'What if something is not right?', answer: 'We keep the experience clear with seller information, delivery details and a 7-day return promise to help you shop with confidence.' },
];

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

const CATEGORY_TINTS = ['sage', 'sand', 'lavender', 'sky', 'peach', 'mint', 'butter', 'rose'];

function CollectionStack({ products = [] }) {
  return (
    <div className="marketplace-collection-stack" aria-hidden="true">
      {products.slice(0, 3).map((product, index) => (
        <span key={`${product.id}-${index}`} className={`marketplace-collection-stack-item stack-${index}`}>
          {product.images?.[0] ? <img src={product.images[0]} alt="" loading="lazy" /> : <i />}
        </span>
      ))}
      {products.length === 0 && <span className="marketplace-collection-stack-empty"><Sparkles className="h-6 w-6" /></span>}
    </div>
  );
}

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
  const [faqOpen, setFaqOpen] = useState(0);
  const { activeTheme: theme, heroOverride } = useSeasonalTheme();
  const { getItemCount, getTotal } = useCart();
  const [isAiMode, setIsAiMode] = useState(false);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const cartCount = getItemCount();
  const cartTotal = getTotal();

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

  const applySearch = (query) => {
    setActiveCategory('All');
    setSearchQuery(query);
    setIsAiMode(false);
    window.setTimeout(() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const featuredProducts = listings.slice(0, 8);
  const discoveryProducts = [...featuredProducts, ...popularProducts].filter((product, index, all) => all.findIndex(item => item.id === product.id) === index);
  const budgetProducts = discoveryProducts.filter(product => Number(product.price || 0) <= 2000);
  const discountedProducts = discoveryProducts.filter(product => Number(product.compare_at_price || 0) > Number(product.price || 0) || product.flash_sale_price);
  const furnitureProducts = discoveryProducts.filter(product => product.category === 'Furniture' || product.category === 'Home & Garden');
  const ratedProducts = discoveryProducts.filter(product => Number(product.avg_rating || 0) > 0 && Number(product.review_count || 0) > 0).slice(0, 3);
  const showDiscoveryRows = activeCategory === 'All' && !searchQuery && !isAiMode;
  const heroFrom = theme?.colors?.heroFrom || '#0d4f43';
  const heroVia = theme?.colors?.heroVia || '#0f766e';
  const heroTo = theme?.colors?.heroTo || '#173a35';
  const heroText = theme?.colors?.heroText || '#ffffff';
  const heroSubtext = theme?.colors?.heroSubtext || '#d8ebe4';
  const heroAccent = theme?.colors?.heroAccent || '#a9e7c5';
  const ctaBg = theme?.colors?.ctaBg || '#f5c56b';
  const ctaText = theme?.colors?.ctaText || '#173a35';
  const heroTitle = heroOverride?.title || theme?.heroTitle || 'Good finds. Trusted locally.';
  const heroSubtitle = heroOverride?.subtitle || theme?.heroSubtitle || 'Discover quality products from Kenyan sellers, pay simply with M-Pesa and get your next favourite find delivered to your door.';
  const heroImage = heroOverride?.imageUrl || theme?.heroImages?.[0] || '/hero-bg.jpg';
  const particleType = theme?.particleType || 'none';
  const sticker = theme?.sticker || '';
  const socialBadge = theme?.socialBadge || '';

  return (
    <div className="marketplace-home" data-name="home-page">
      <SeasonalParticles type={particleType} count={25} />
      <FlashDealsBar />
      <div className="marketplace-announcement-bar">
        <div><span className="marketplace-announcement-dot" /> <strong>Shop local. Feel good about every find.</strong><span className="marketplace-announcement-detail">Secure payments, clear delivery and real seller details.</span></div>
        <Link to="/how-it-works">How Omix works <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>

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
            <div className="marketplace-eyebrow marketplace-eyebrow-light"><span className="marketplace-live-dot" />{socialBadge || 'Kenya’s trusted marketplace'}</div>
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>
            <div className="marketplace-hero-actions">
              <button type="button" className="marketplace-button marketplace-button-hero" onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{t('home.browseListings') || 'Explore products'}<ArrowRight className="h-4 w-4" /></button>
              <Link to="/seller/register" className="marketplace-hero-secondary"><Store className="h-4 w-4" />Sell on Omix<ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="marketplace-hero-proof">
              <span><BadgeCheck className="h-4 w-4" />{totalCount > 0 ? `${totalCount.toLocaleString()} live listings` : 'Fresh listings every day'}</span>
              <span><CreditCard className="h-4 w-4" /> M-Pesa ready</span>
            </div>
            <div className="marketplace-hero-trending">
              <span>Trending now</span>
              {TRENDING_SEARCHES.slice(0, 3).map(term => <button key={term} type="button" onClick={() => applySearch(term)}>{term}</button>)}
            </div>
          </div>

          <div className="marketplace-hero-visual">
            <div className="marketplace-hero-image-frame"><img src={heroImage} alt="A selection of products available on Omix Store" /><div className="marketplace-hero-image-overlay" /><div className="marketplace-hero-image-label"><span>{sticker || '✦'}</span> Curated for you</div></div>
            <div className="marketplace-floating-card marketplace-floating-card-top"><span className="marketplace-floating-icon"><ShieldCheck className="h-4 w-4" /></span><span><strong>Shop with confidence</strong><small>Protected checkout</small></span></div>
            <div className="marketplace-floating-card marketplace-floating-card-bottom"><span className="marketplace-floating-avatars"><i>J</i><i>M</i><i>K</i></span><span><strong>Local sellers, real finds</strong><small>New items added daily</small></span></div>
          </div>

          <div className="marketplace-hero-search">
            <div className="marketplace-hero-search-heading"><SearchIcon className="h-4 w-4" /><span>Search the marketplace</span><small>Try “phone”, “sofa” or “sneakers”</small></div>
            <SearchBar onSearch={applySearch} initialValue={searchQuery} />
          </div>
        </div>
      </section>

      <section className="marketplace-trust-strip marketplace-container" aria-label="Why shop with Omix">
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><ShieldCheck /></span><div><strong>Secure checkout</strong><span>Pay safely with M-Pesa</span></div></div>
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><Truck /></span><div><strong>Simple delivery</strong><span>From local sellers to you</span></div></div>
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><RotateCcw /></span><div><strong>Shop confidently</strong><span>7-day return promise</span></div></div>
        <div className="marketplace-trust-item"><span className="marketplace-trust-icon"><Store /></span><div><strong>Local & trusted</strong><span>Support Kenyan sellers</span></div></div>
      </section>

      <section className="marketplace-container marketplace-trending-strip" aria-label="Trending searches">
        <div className="marketplace-trending-strip-label"><Sparkles className="h-4 w-4" /><span>People are looking for</span></div>
        <div className="marketplace-trending-strip-items">{TRENDING_SEARCHES.map(term => <button key={term} type="button" onClick={() => applySearch(term)}>{term}<ArrowRight className="h-3 w-3" /></button>)}</div>
      </section>

      <section className="marketplace-container marketplace-category-section">
        <div className="marketplace-section-heading"><div><span className="marketplace-eyebrow">Start exploring</span><h2>Shop by category</h2></div><Link to="/search" className="marketplace-text-link">View all <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="marketplace-category-cards">
          {CATEGORIES.filter(category => category !== 'All').slice(0, 8).map((category, index) => (
            <Link key={category} to={`/search?category=${encodeURIComponent(category)}`} className={`marketplace-category-card marketplace-category-card-${CATEGORY_TINTS[index] || 'sage'}`}>
              <span className="marketplace-category-symbol">{CATEGORY_EMOJIS[category] || '＋'}</span>
              <span className="marketplace-category-card-copy"><strong>{category}</strong><small>Explore the collection</small></span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </section>

      <section className="marketplace-container marketplace-budget-section">
        <div className="marketplace-budget-heading"><div><span className="marketplace-eyebrow">Shop your way</span><h2>Good finds for every budget</h2></div><span>Clear prices. No guesswork.</span></div>
        <div className="marketplace-budget-pills">
          {PRICE_RANGES.map(range => {
            const params = new URLSearchParams({ sort: 'price_asc' });
            if (range.min) params.set('min_price', range.min);
            if (range.max) params.set('max_price', range.max);
            return <Link key={range.label} to={`/search?${params.toString()}`}><span>{range.label}</span><small>{range.note}</small><ArrowRight className="h-4 w-4" /></Link>;
          })}
        </div>
      </section>

      {showDiscoveryRows && featuredProducts.length > 0 && (
        <section className="marketplace-container marketplace-discovery-section">
          <div className="marketplace-section-heading"><div><span className="marketplace-eyebrow">Handpicked today</span><h2>{t('home.featuredListings') || 'Featured finds'}</h2></div><Link to="/search" className="marketplace-text-link">See more <ArrowRight className="h-4 w-4" /></Link></div>
          <AutoScrollCarousel itemMinWidth={248} gap={16} speed={32} className="marketplace-product-carousel">{featuredProducts.map(product => <ProductCard key={product.id} listing={product} />)}</AutoScrollCarousel>
        </section>
      )}

      {showDiscoveryRows && popularProducts.length > 0 && (
        <section className="marketplace-container marketplace-discovery-section marketplace-discovery-section-popular">
          <div className="marketplace-section-heading"><div><span className="marketplace-eyebrow">Loved by shoppers</span><h2>Popular right now</h2></div><Link to="/search" className="marketplace-text-link">Browse all <ArrowRight className="h-4 w-4" /></Link></div>
          <AutoScrollCarousel itemMinWidth={248} gap={16} speed={28} className="marketplace-product-carousel">{popularProducts.map(product => <ProductCard key={product.id} listing={product} />)}</AutoScrollCarousel>
        </section>
      )}

      {showDiscoveryRows && (
        <section className="marketplace-container marketplace-curated-section">
          <div className="marketplace-section-heading"><div><span className="marketplace-eyebrow">Curated for the way you shop</span><h2>Make your next find a good one.</h2></div><Link to="/search" className="marketplace-text-link">Explore everything <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="marketplace-curated-grid">
            <Link to="/search?max_price=2000&sort=price_asc" className="marketplace-collection-card marketplace-collection-card-sage"><div><span className="marketplace-collection-eyebrow">Smart spending</span><h3>Good things under KES 2,000</h3><p>Small upgrades, thoughtful gifts and everyday wins.</p><span className="marketplace-collection-link">Shop the edit <ArrowRight className="h-4 w-4" /></span></div><CollectionStack products={budgetProducts} /></Link>
            <Link to="/search?has_discount=true" className="marketplace-collection-card marketplace-collection-card-sand"><div><span className="marketplace-collection-eyebrow">Worth a second look</span><h3>Deals that feel good</h3><p>Find marked-down products without losing the quality.</p><span className="marketplace-collection-link">See discounted finds <ArrowRight className="h-4 w-4" /></span></div><CollectionStack products={discountedProducts} /></Link>
            <Link to="/search?category=Furniture" className="marketplace-collection-card marketplace-collection-card-lavender"><div><span className="marketplace-collection-eyebrow">Make space</span><h3>Better living starts here</h3><p>Furniture and home finds to make your space feel like you.</p><span className="marketplace-collection-link">Shop home finds <ArrowRight className="h-4 w-4" /></span></div><CollectionStack products={furnitureProducts} /></Link>
          </div>
        </section>
      )}

      <section id="products-section" className="marketplace-container marketplace-catalog-section">
        <div className="marketplace-catalog-toolbar"><div><span className="marketplace-eyebrow">Fresh on Omix</span><h2>{searchQuery ? `Results for “${searchQuery}”` : 'Latest from the marketplace'}</h2><p>{loading ? 'Updating the collection…' : `${totalCount.toLocaleString()} ${totalCount === 1 ? 'item' : 'items'} ready to explore`}</p></div><Link to="/search" className="marketplace-button marketplace-button-secondary marketplace-catalog-all-link">Advanced search <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="marketplace-filter-bar"><div className="marketplace-filter-label">Browse</div><div className="marketplace-filter-scroll scrollbar-hide">{CATEGORIES.map(category => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`marketplace-filter-pill ${activeCategory === category ? 'is-active' : ''}`}>{category}</button>)}</div></div>
        {loading ? <div className="marketplace-product-grid" aria-label="Loading products">{Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}</div> : listings.length > 0 ? <div className="marketplace-product-grid">{listings.map(listing => <ProductCard key={listing.id} listing={listing} />)}</div> : <div className="marketplace-empty-state"><span className="marketplace-empty-icon"><SearchIcon className="h-7 w-7" /></span><h3>No products found yet</h3><p>Try another search or browse the full collection.</p><button type="button" className="marketplace-button marketplace-button-primary" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>Clear filters</button><NiaContextualTrigger page="emptyCart" /></div>}
        {!loading && listings.length > 0 && totalPages > 1 && <div className="marketplace-pagination"><p>Page {page} of {totalPages}</p><Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} /></div>}
      </section>

      {ratedProducts.length > 0 && (
        <section className="marketplace-container marketplace-rated-section">
          <div className="marketplace-rated-intro"><span className="marketplace-eyebrow">Shopper signals</span><h2>Rated finds worth a look.</h2><p>See what shoppers are responding to, then make the choice that feels right for you.</p></div>
          <div className="marketplace-rated-grid">{ratedProducts.map(product => <Link key={product.id} to={`/listing/${product.id}`} className="marketplace-rated-card"><span className="marketplace-rated-star">★</span><strong>{Number(product.avg_rating).toFixed(1)}</strong><span className="marketplace-rated-reviews">{product.review_count} {product.review_count === 1 ? 'review' : 'reviews'}</span><h3>{product.title}</h3><span className="marketplace-text-link">View find <ArrowRight className="h-3.5 w-3.5" /></span></Link>)}</div>
        </section>
      )}

      <section className="marketplace-container marketplace-how-it-works"><div className="marketplace-process-intro"><span className="marketplace-eyebrow">A simpler way to shop</span><h2>From browse to doorstep.</h2><p>Every part of Omix is designed to make local shopping feel clear, safe and enjoyable.</p><Link to="/how-it-works" className="marketplace-text-link">See how it works <ArrowRight className="h-4 w-4" /></Link></div><div className="marketplace-process-steps"><div><span>01</span><CreditCard className="h-5 w-5" /><h3>Find your fit</h3><p>Explore thoughtful listings from sellers around Kenya.</p></div><div><span>02</span><PackageCheck className="h-5 w-5" /><h3>Checkout simply</h3><p>Pay securely with M-Pesa and get clear order updates.</p></div><div><span>03</span><Truck className="h-5 w-5" /><h3>Receive with ease</h3><p>Your seller gets it moving and you follow along.</p></div></div></section>

      <section className="marketplace-container marketplace-seller-cta"><div className="marketplace-seller-cta-copy"><span className="marketplace-eyebrow">For sellers</span><h2>Your next customer is already looking.</h2><p>Turn the things you make, source or know into a storefront that reaches more people across Kenya.</p><div className="marketplace-seller-cta-actions"><Link to="/seller/register" className="marketplace-button marketplace-button-primary">Start selling <ArrowRight className="h-4 w-4" /></Link><Link to="/help/seller-guide" className="marketplace-text-link">Read the seller guide <ArrowRight className="h-4 w-4" /></Link></div></div><div className="marketplace-seller-cta-points"><div><span><Check /></span><strong>Simple listing tools</strong><small>Put your products in front of the right people.</small></div><div><span><Check /></span><strong>Clear order updates</strong><small>Keep the buying experience easy to follow.</small></div><div><span><Check /></span><strong>Built for local trade</strong><small>Meet shoppers where they are.</small></div></div></section>

      <section className="marketplace-container marketplace-faq-section"><div className="marketplace-faq-intro"><span className="marketplace-eyebrow">Need to know</span><h2>Shopping, made clear.</h2><p>We believe confidence comes from knowing what happens next.</p></div><div className="marketplace-faq-list">{FAQ_ITEMS.map((item, index) => <div key={item.question} className={`marketplace-faq-item ${faqOpen === index ? 'is-open' : ''}`}><button type="button" onClick={() => setFaqOpen(faqOpen === index ? -1 : index)}><span>{item.question}</span><ChevronRight className="h-4 w-4" /></button>{faqOpen === index && <p>{item.answer}</p>}</div>)}</div></section>

      {cartCount > 0 && <Link to="/cart" className="marketplace-mobile-cart-summary"><span className="marketplace-mobile-cart-icon"><PackageCheck className="h-4 w-4" /></span><span><strong>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</strong><small>Ready when you are</small></span><b>{formatKES(cartTotal)}</b><ArrowRight className="h-4 w-4" /></Link>}

      <div className="marketplace-container marketplace-recently-viewed"><RecentlyViewed allListings={listings} /></div>
    </div>
  );
}

export default Home;
