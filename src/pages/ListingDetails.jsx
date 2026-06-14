import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, ShoppingCart, Minus, Plus, Package, Truck, Shield, Tag, Cpu, HardDrive, Monitor, Battery, Camera, Wifi } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { WhatsAppShareButton } from '../components/WhatsAppButtons';
import { fetchListing, fetchListings } from '../utils/api';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import ImageGallery from '../components/ImageGallery';
import StickyMobileCart from '../components/StickyMobileCart';
import RecentlyViewed, { trackViewedProduct } from '../components/RecentlyViewed';
import { ListingSocialProof } from '../components/SocialProof';
import Breadcrumb from '../components/Breadcrumb';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import AutoScrollCarousel from '../components/AutoScrollCarousel';
import { ReviewList, ReviewForm } from '../components/Reviews';
import ImageLightbox from '../components/ImageLightbox';
import { useLang } from '../utils/lang';

function ListingDetails() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { addItem, cart } = useCart();

  const listingId = Number(id);
  const inCart = cart.find(item => item.id === listingId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) { setError('No listing ID'); setLoading(false); return; }
    setLoading(true);
    fetchListing(id).then(data => {
      if (!data) { setError(t('listing.listingNotFound')); setLoading(false); return; }
      setListing(data);
      setLoading(false);
      trackViewedProduct(data);
      fetchListings(data.category, '', 1, 10).then(all => {
            setRelated((all.listings || all).filter(l => l.id !== listingId));
      });
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <div className="w-full md:w-1/2 lg:w-3/5 aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 rounded-3xl"></div>
          <div className="w-full md:w-1/2 lg:w-2/5 space-y-4">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">{error || t('listing.listingNotFound')}</h2>
        <Link to="/" className="text-[#ff385c] font-bold hover:underline">{t('listing.goBackHome')}</Link>
      </div>
    );
  }

  // Group specs into categories (Jumia-style collapsible sections)
  const specCategories = [
    {
      title: 'General',
      specs: [
        ...(listing.brand ? [{ label: 'Brand', value: listing.brand }] : []),
        ...(listing.model ? [{ label: 'Model', value: listing.model }] : []),
        ...(listing.color ? [{ label: 'Color', value: listing.color }] : []),
        ...(listing.weight ? [{ label: 'Weight', value: listing.weight }] : []),
        ...(listing.sku ? [{ label: 'SKU', value: listing.sku }] : []),
        { label: 'Condition', value: listing.condition },
        { label: 'Category', value: listing.category },
      ],
    },
    ...(listing.ram || listing.storage ? [{
      title: 'Performance',
      specs: [
        ...(listing.ram ? [{ label: 'RAM', value: listing.ram }] : []),
        ...(listing.storage ? [{ label: 'Storage', value: listing.storage }] : []),
        ...(listing.processor ? [{ label: 'Processor', value: listing.processor }] : []),
        ...(listing.os ? [{ label: 'Operating System', value: listing.os }] : []),
      ],
    }] : []),
    ...(listing.screen_size || listing.screen_type ? [{
      title: 'Display',
      specs: [
        ...(listing.screen_size ? [{ label: 'Screen Size', value: listing.screen_size }] : []),
        ...(listing.screen_type ? [{ label: 'Display Type', value: listing.screen_type }] : []),
        ...(listing.resolution ? [{ label: 'Resolution', value: listing.resolution }] : []),
      ],
    }] : []),
    ...(listing.camera || listing.front_camera ? [{
      title: 'Camera',
      specs: [
        ...(listing.camera ? [{ label: 'Main Camera', value: listing.camera }] : []),
        ...(listing.front_camera ? [{ label: 'Front Camera', value: listing.front_camera }] : []),
      ],
    }] : []),
    ...(listing.battery ? [{
      title: 'Battery',
      specs: [
        ...(listing.battery ? [{ label: 'Battery', value: listing.battery }] : []),
        ...(listing.charging ? [{ label: 'Charging', value: listing.charging }] : []),
      ],
    }] : []),
    ...(listing.connectivity || listing.wifi || listing.bluetooth ? [{
      title: 'Connectivity',
      specs: [
        ...(listing.connectivity ? [{ label: 'Network', value: listing.connectivity }] : []),
        ...(listing.wifi ? [{ label: 'Wi-Fi', value: listing.wifi }] : []),
        ...(listing.bluetooth ? [{ label: 'Bluetooth', value: listing.bluetooth }] : []),
        ...(listing.nfc ? [{ label: 'NFC', value: listing.nfc === 'Yes' ? 'Yes' : 'No' }] : []),
      ],
    }] : []),
  ].filter(cat => cat.specs.length > 0);

  // Flat list for backward compat (key specs strip)
  const allSpecs = specCategories.flatMap(c => c.specs);

  // Key specs to show as icon highlights above the fold
  const keySpecs = [
    ...(listing.ram ? [{ icon: Cpu, label: 'RAM', value: listing.ram }] : []),
    ...(listing.storage ? [{ icon: HardDrive, label: 'Storage', value: listing.storage }] : []),
    ...(listing.screen_size ? [{ icon: Monitor, label: 'Display', value: listing.screen_size }] : []),
    ...(listing.battery ? [{ icon: Battery, label: 'Battery', value: listing.battery }] : []),
    ...(listing.camera ? [{ icon: Camera, label: 'Camera', value: listing.camera }] : []),
    ...(listing.connectivity ? [{ icon: Wifi, label: 'Network', value: listing.connectivity }] : []),
    ...(listing.brand ? [{ icon: Tag, label: 'Brand', value: listing.brand }] : []),
    ...(listing.model ? [{ icon: Cpu, label: 'Model', value: listing.model }] : []),
  ].slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="listing-details">
      <Breadcrumb customLabel={listing.title} />
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-6">
        {/* Images */}
        <ImageGallery images={listing.images} title={listing.title} condition={listing.condition} />

        {/* Details */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-zinc-900 dark:text-white leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-3xl font-black text-[#ff385c]">{formatKES(listing.price)}</p>
              {listing.compare_at_price && listing.compare_at_price > listing.price && (
                <>
                  <p className="text-lg font-bold text-zinc-400 line-through">{formatKES(listing.compare_at_price)}</p>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                    -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800">
              <Truck className="w-3.5 h-3.5" /> {t('listing.freeDeliveryInKericho')}
            </span>
            <span className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800">
              <Package className="w-3.5 h-3.5" /> {t('listing.deliveryByTomorrow')}
            </span>
          </div>

          {/* Social Proof */}
          <ListingSocialProof listing={listing} />

          {/* Key Specs Highlight Strip */}
          {keySpecs.length > 0 && (
            <div className="mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="flex gap-2 min-w-max">
                {keySpecs.map((spec, i) => {
                  const Icon = spec.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#ff385c]" />
                      <div className="leading-tight">
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{spec.label}</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{spec.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specs Categories */}
          {specCategories.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t('listing.specifications')}</h3>
              {specCategories.map((cat, ci) => (
                <div key={ci} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50">
                    <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{cat.title}</h4>
                  </div>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {cat.specs.map((spec, si) => (
                      <div key={si} className="flex items-center gap-3 px-4 py-2.5">
                        <Tag className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 flex-shrink-0">{spec.label}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h3 className="font-bold mb-2 text-lg">{t('listing.description')}</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed text-sm">{listing.description}</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Truck className="w-3.5 h-3.5" /> {t('listing.delivery')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Shield className="w-3.5 h-3.5" /> {t('checkout.securePayment')}
            </div>
          </div>

          {/* Seller / About the Store */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 mb-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#ff385c] to-[#ff6b8a] rounded-full flex items-center justify-center font-black text-lg text-white shadow-md shadow-[#ff385c]/20">O</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-zinc-900 dark:text-white">{t('listing.omixStore')}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('listing.kerichoKenya')} &bull; {t('listing.officialStore')}</p>
              </div>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full">{t('listing.verified')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-white dark:bg-zinc-800 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-[#ff385c]">100%</p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t('listing.quality')}</p>
              </div>
              <div className="text-center bg-white dark:bg-zinc-800 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-[#ff385c]">{t('listing.fast')}</p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t('listing.shipping')}</p>
              </div>
              <div className="text-center bg-white dark:bg-zinc-800 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-[#ff385c]">24/7</p>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t('listing.support')}</p>
              </div>
            </div>
          </div>

          {/* Nia contextual help */}
          <div className="mb-4">
            <NiaContextualTrigger page="listing" />
          </div>

          {/* Cart Section */}
          <div className="space-y-3">
            {inCart && user && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800">
                <ShoppingCart className="w-4 h-4" /> {inCart.quantity} {t('cart.title').toLowerCase()}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-black text-zinc-900 dark:text-white w-12 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {user ? (
              <>
                <button onClick={() => addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity })}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 text-lg">
                  <ShoppingCart className="w-5 h-5" /> {inCart ? t('cart.title') : t('productCard.addToCart')} &mdash; {formatKES(listing.price * quantity)}
                </button>
                <button onClick={() => { addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity }); navigate('/checkout'); }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
                  {t('listing.buyNow')} &mdash; {formatKES(listing.price * quantity)}
                </button>
              </>
            ) : (
              <>
                <Link to={`/signup?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 text-lg">
                  <ShoppingCart className="w-5 h-5" /> {t('listing.signUpToAddToCart')}
                </Link>
                <Link to={`/login?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
                  {t('listing.loginToBuyNow')}
                </Link>
              </>
            )}
          </div>

          {/* Share */}
          <div className="mt-4">
            <WhatsAppShareButton title={listing.title} price={listing.price} url={`${window.location.origin}/listing/${listing.id}`} type="listing" className="flex-1 justify-center" />
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && listing.images?.length > 0 && (
        <ImageLightbox
          images={listing.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Reviews */}
      <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <ReviewList listingId={listingId} />
        <ReviewForm listingId={listingId} onSubmitted={() => {}} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 pb-24 md:pb-0">
          <h2 className="text-2xl font-bold mb-6">{t('listing.youMayAlsoLike')}</h2>
          <AutoScrollCarousel itemMinWidth={260} gap={16} speed={40}>
            {related.map(l => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </AutoScrollCarousel>
        </div>
      )}

      {/* Recently Viewed */}
      <RecentlyViewed currentListing={listing} allListings={related} />

      {/* Sticky mobile cart bar */}
      <StickyMobileCart
        listing={listing}
        quantity={quantity}
        onAddToCart={() => addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity })}
        onBuyNow={() => { addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity }); navigate('/checkout'); }}
        inCart={inCart}
        user={user}
      />
    </div>
  );
}

export default ListingDetails;
