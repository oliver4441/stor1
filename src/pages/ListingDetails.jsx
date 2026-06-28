import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, ShoppingCart, Minus, Plus, Package, Truck, Shield, Tag, Cpu, HardDrive, Monitor, Battery, Camera, Wifi, Bell } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { WhatsAppShareButton } from '../components/WhatsAppButtons';
import { fetchListing, fetchListings, watchPriceDrop, watchBackInStock } from '../utils/api';
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
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [user, setUser] = useState(null);
  const { addItem, cart } = useCart();
  const [notifyMsg, setNotifyMsg] = useState('');

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
        <h2 className="text-3xl font-bold mb-4 text-white">{error || t('listing.listingNotFound')}</h2>
        <Link to="/" className="text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">{t('listing.goBackHome')}</Link>
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

  // Variant helpers
  const hasVariants = listing.has_variants && listing.variants?.length > 0;
  const variantColors = hasVariants ? (() => {
    const seen = new Set();
    return listing.variants
      .filter(v => v.color && !seen.has(v.color) && seen.add(v.color))
      .map(v => ({ hex: v.color, name: v.colorName || v.color }));
  })() : [];
  const variantSizes = hasVariants ? [...new Set(listing.variants.map(v => v.size).filter(Boolean))] : [];
  const selectedVariantObj = hasVariants
    ? listing.variants.find(v =>
        (!variantColors.length || !selectedColor || v.color === selectedColor) &&
        (!variantSizes.length || !selectedSize || v.size === selectedSize)
      ) : null;
  const effectivePrice = selectedVariantObj
    ? (listing.price || 0) + (selectedVariantObj.priceAdjustment || 0)
    : listing.price;
  const effectiveStock = selectedVariantObj?.quantity || listing.quantity;
  const isOutOfStock = hasVariants && selectedVariantObj && selectedVariantObj.quantity <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="listing-details">
      <Breadcrumb customLabel={listing.title} />
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-6">
        {/* Images */}
        <ImageGallery images={listing.images} title={listing.title} condition={listing.condition} />

        {/* Details */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-3xl font-black text-[var(--seasonal-primary,#1a5632)]">
                {hasVariants && selectedVariantObj && selectedVariantObj.priceAdjustment !== 0
                  ? formatKES(effectivePrice)
                  : formatKES(listing.price)}
              </p>
              {hasVariants && selectedVariantObj && selectedVariantObj.priceAdjustment !== 0 && (
                <p className="text-sm text-zinc-400 line-through">{formatKES(listing.price)}</p>
              )}
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
                    <div key={i} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5 flex-shrink-0">
                      <Icon className="w-4 h-4 text-[var(--seasonal-primary,#1a5632)]" />
                      <div className="leading-tight">
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{spec.label}</p>
                        <p className="text-xs font-bold text-white">{spec.value}</p>
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
              <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">{t('listing.specifications')}</h3>
              {specCategories.map((cat, ci) => (
                <div key={ci} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="px-4 py-3 bg-zinc-800/50">
                    <h4 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">{cat.title}</h4>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {cat.specs.map((spec, si) => (
                      <div key={si} className="flex items-center gap-3 px-4 py-2.5">
                        <Tag className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-400 w-28 flex-shrink-0">{spec.label}</span>
                        <span className="text-xs font-bold text-white">{spec.value}</span>
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
              <p className="text-zinc-300 whitespace-pre-line leading-relaxed text-sm">{listing.description}</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Truck className="w-3.5 h-3.5" /> {t('listing.delivery')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Shield className="w-3.5 h-3.5" /> {t('checkout.securePayment')}
            </div>
          </div>

          {/* Seller / About the Store */}
          <div className="bg-zinc-900/50 rounded-2xl p-4 mb-4 border border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[var(--seasonal-primary,#1a5632)] to-[#ff6b8a] rounded-full flex items-center justify-center font-black text-lg text-white shadow-md shadow-[var(--seasonal-primary,#1a5632)]/20">O</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-white">{t('listing.omixStore')}</p>
                <p className="text-xs text-zinc-400">{t('listing.kerichoKenya')} &bull; {t('listing.officialStore')}</p>
              </div>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full">{t('listing.verified')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-zinc-800 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">100%</p>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider">{t('listing.quality')}</p>
              </div>
              <div className="text-center bg-zinc-800 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">{t('listing.fast')}</p>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider">{t('listing.shipping')}</p>
              </div>
              <div className="text-center bg-zinc-800 rounded-xl py-2 px-1">
                <p className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">24/7</p>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider">{t('listing.support')}</p>
              </div>
            </div>
          </div>

          {/* Nia contextual help */}
          <div className="mb-4">
            <NiaContextualTrigger page="listing" />
          </div>

          {/* Variant Selectors (Color + Size) */}
          {hasVariants && (
            <div className="mb-6 space-y-4">
              {/* Color Selector */}
              {variantColors.length > 0 && (
                <div id="variant-color-section">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                    Color {selectedColor && <span className="text-zinc-300 normal-case">— {variantColors.find(c => c.hex === selectedColor)?.name}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variantColors.map(c => {
                      const isSelected = selectedColor === c.hex;
                      const colorStock = listing.variants.filter(v => v.color === c.hex).reduce((s, v) => s + (v.quantity || 0), 0);
                      const disabled = colorStock <= 0;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          disabled={disabled}
                          onClick={() => { setSelectedColor(c.hex); setSelectedVariant(null); }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)]/5'
                              : disabled
                                ? 'border-zinc-700 opacity-40 cursor-not-allowed'
                                : 'border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)]'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex-shrink-0" style={{ backgroundColor: c.hex?.startsWith('#') ? c.hex : '#ccc' }} />
                          <span className="text-zinc-300">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {variantSizes.length > 0 && (
                <div id="variant-size-section">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Size {selectedSize && <span className="text-zinc-300 normal-case">— {selectedSize}</span>}
                    </label>
                    {listing.size_guide && (
                      <button type="button" className="text-[10px] text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">
                        Size Guide
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {variantSizes.map(size => {
                      const isSelected = selectedSize === size;
                      const sizeStock = listing.variants.filter(v => v.size === size && (!selectedColor || !v.color || v.color === selectedColor)).reduce((s, v) => s + (v.quantity || 0), 0);
                      const disabled = sizeStock <= 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={disabled}
                          onClick={() => { setSelectedSize(size); setSelectedVariant(null); }}
                          className={`min-w-[36px] px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                            isSelected
                              ? 'border-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)] text-white'
                              : disabled
                                ? 'border-zinc-700 opacity-40 cursor-not-allowed line-through'
                                : 'border-zinc-700 text-zinc-300 hover:border-[var(--seasonal-primary,#1a5632)]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected variant info */}
              {selectedVariantObj && (
                <div className="flex items-center gap-3 text-xs">
                  {selectedVariantObj.quantity > 0 && selectedVariantObj.quantity <= 3 && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Only {selectedVariantObj.quantity} left!</span>
                  )}
                  {selectedVariantObj.quantity <= 0 && (
                    <span className="text-red-500 font-bold">Out of stock</span>
                  )}
                  {selectedVariantObj.priceAdjustment !== 0 && (
                    <span className="text-zinc-500">
                      {selectedVariantObj.priceAdjustment > 0 ? '+' : ''}{formatKES(selectedVariantObj.priceAdjustment)} from base
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart Section */}
          <div className="space-y-3">
            {inCart && user && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800">
                <ShoppingCart className="w-4 h-4" /> {inCart.quantity} {t('cart.title').toLowerCase()}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-black text-white w-12 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {user ? (
              <>
                <button
                  onClick={() => {
                    if (hasVariants && variantColors.length > 0 && !selectedColor) {
                      document.getElementById('variant-color-section')?.scrollIntoView({ behavior: 'smooth' });
                      return;
                    }
                    if (hasVariants && variantSizes.length > 0 && !selectedSize) {
                      document.getElementById('variant-size-section')?.scrollIntoView({ behavior: 'smooth' });
                      return;
                    }
                    addItem({
                      id: listing.id,
                      name: listing.title,
                      price: effectivePrice,
                      image_url: listing.images?.[0] || null,
                      quantity,
                      variant: selectedVariantObj ? {
                        id: selectedVariantObj.id,
                        size: selectedVariantObj.size,
                        color: selectedVariantObj.color,
                        colorName: selectedVariantObj.colorName,
                        sku: selectedVariantObj.sku,
                      } : null,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" /> {inCart ? t('cart.title') : t('productCard.addToCart')} — {formatKES(effectivePrice * quantity)}
                </button>
                <button onClick={() => {
                  addItem({
                    id: listing.id,
                    name: listing.title,
                    price: effectivePrice,
                    image_url: listing.images?.[0] || null,
                    quantity,
                    variant: selectedVariantObj ? {
                      id: selectedVariantObj.id,
                      size: selectedVariantObj.size,
                      color: selectedVariantObj.color,
                      colorName: selectedVariantObj.colorName,
                      sku: selectedVariantObj.sku,
                    } : null,
                  });
                  navigate('/checkout');
                }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
                  {t('listing.buyNow')} &mdash; {formatKES(effectivePrice * quantity)}
                </button>
              </>
            ) : (
              <>
                <Link to={`/signup?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20 text-lg">
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

          {/* Price Drop & Back in Stock Watchers */}
          {user && (
            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  await watchPriceDrop(user.id, listing.id);
                  setNotifyMsg('You\'ll be notified when the price drops!');
                  setTimeout(() => setNotifyMsg(''), 3000);
                }}
                className="w-full flex items-center justify-center gap-2 border-2 border-[var(--seasonal-primary,#1a5632)] text-[var(--seasonal-primary,#1a5632)] font-bold py-3 rounded-xl hover:bg-[var(--seasonal-primary,#1a5632)]/5 transition-all"
              >
                <Bell className="w-4 h-4" /> Notify me when price drops
              </button>
              <button
                onClick={async () => {
                  await watchBackInStock(user.id, listing.id);
                  setNotifyMsg('You\'ll be notified when back in stock!');
                  setTimeout(() => setNotifyMsg(''), 3000);
                }}
                className="w-full flex items-center justify-center gap-2 border-2 border-[var(--seasonal-primary,#1a5632)] text-[var(--seasonal-primary,#1a5632)] font-bold py-3 rounded-xl hover:bg-[var(--seasonal-primary,#1a5632)]/5 transition-all"
              >
                <Bell className="w-4 h-4" /> Notify when back in stock
              </button>
              {notifyMsg && (
                <div className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl animate-fade-in">
                  {notifyMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16 pt-8 border-t border-zinc-800">
        <ReviewList listingId={listingId} />
        <ReviewForm listingId={listingId} onSubmitted={() => {}} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-zinc-800 pb-24 md:pb-0">
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
        effectivePrice={effectivePrice}
        selectedVariant={selectedVariantObj}
        onAddToCart={() => addItem({ id: listing.id, name: listing.title, price: effectivePrice, image_url: listing.images?.[0] || null, quantity, variant: selectedVariantObj || null })}
        onBuyNow={() => { addItem({ id: listing.id, name: listing.title, price: effectivePrice, image_url: listing.images?.[0] || null, quantity, variant: selectedVariantObj || null }); navigate('/checkout'); }}
        inCart={inCart}
        user={user}
      />
    </div>
  );
}

export default ListingDetails;
