import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, ShoppingCart, Minus, Plus, Package, Truck, Shield, Tag, Cpu, HardDrive, Monitor, Battery, Camera, Wifi, Bell, Heart, Percent, MessageCircle, Store } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { WhatsAppShareButton, FloatingWhatsAppButton } from '../components/WhatsAppButtons';
import { fetchListing, fetchListings, watchPriceDrop, watchBackInStock, addToWishlist, removeFromWishlist, isInWishlist, getDeliveryZones, getProductQuestions, postProductQuestion, getWholesalePrices, getSellerProfile } from '../utils/api';
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
import MessageSellerButton from '../components/MessageSellerButton';
import ProductRecommendations from '../components/ProductRecommendations';

function formatDimensions(dim) {
  if (!dim) return '';
  if (typeof dim === 'string') return dim;
  const { length, width, height, unit } = dim;
  if (length && width && height) return `${length} x ${width} x ${height} ${unit || 'cm'}`;
  return JSON.stringify(dim);
}

function normalizeVariants(variants) {
  if (!variants) return null;
  if (variants && typeof variants === 'object' && !Array.isArray(variants) && variants.types && variants.items) return variants;
  if (Array.isArray(variants)) {
    const colorSet = new Map();
    const sizeSet = new Set();
    variants.forEach(v => {
      if (v.color) colorSet.set(v.color, v.colorName || v.color);
      if (v.size) sizeSet.add(v.size);
    });
    const types = [];
    if (colorSet.size > 0) types.push({id: 'color', name: 'Color', style: 'color', values: Array.from(colorSet.entries()).map(([value, label]) => ({value, label}))});
    if (sizeSet.size > 0) types.push({id: 'size', name: 'Size', style: 'button', values: Array.from(sizeSet).map(s => ({value: s, label: s}))});
    return {
      types,
      items: variants.map(v => ({
        id: v.id,
        attrs: {...(v.color ? {color: v.color} : {}), ...(v.size ? {size: v.size} : {})},
        sku: v.sku,
        quantity: v.quantity,
        priceAdjustment: v.priceAdjustment,
        imageUrl: v.imageUrl
      }))
    };
  }
  return null;
}

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
  const [selections, setSelections] = useState({});
  const [user, setUser] = useState(null);
  const { addItem, cart } = useCart();
  const [notifyMsg, setNotifyMsg] = useState('');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [wholesalePrices, setWholesalePrices] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);

  const listingId = id;
  const inCart = cart.find(item => item.id === listingId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, []);

  // Check wishlist status
  useEffect(() => {
    if (user && listingId) {
      isInWishlist(listingId).then(res => {
        if (res.success) setWishlisted(res.inWishlist);
      });
    } else {
      setWishlisted(false);
    }
  }, [user, listingId]);

  const handleWishlist = async () => {
    if (wishBusy || !user) return navigate('/login?redirect=/listing/' + listingId);
    setWishBusy(true);
    try {
      if (wishlisted) {
        const res = await removeFromWishlist(listingId);
        if (res.success) setWishlisted(false);
      } else {
        const res = await addToWishlist(listingId);
        if (res.success) setWishlisted(true);
      }
    } catch {}
    setWishBusy(false);
  };

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

  // Fetch delivery zones
  useEffect(() => {
    getDeliveryZones().then(res => {
      if (res.success) setDeliveryZones(res.zones);
    });
  }, []);

  // Fetch Q&A, wholesale prices, seller profile when listing loads
  useEffect(() => {
    if (!listing || !listingId) return;
    getProductQuestions(listingId).then(res => {
      if (res.success) setQuestions(res.questions);
    });
    if (listing.wholesale_enabled) {
      getWholesalePrices(listingId).then(res => {
        if (res.success) setWholesalePrices(res.prices);
      });
    }
    if (listing.seller_id) {
      getSellerProfile(listing.seller_id).then(res => {
        if (res?.seller) setSellerProfile(res.seller);
      });
    }
  }, [listing, listingId]);

  // --- HOOKS MUST be before any early return ---

  // Normalize variant data (handles old array format and new object format)
  const variantData = useMemo(() => normalizeVariants(listing?.variants), [listing?.variants]);
  const hasVariants = variantData && variantData.types.length > 0;

  // Find the fully matched variant object
  const selectedVariantObj = useMemo(() => {
    if (!hasVariants || !variantData) return null;
    const selectedCount = variantData.types.filter(t => selections[t.id] != null).length;
    if (selectedCount === 0) return null;
    if (selectedCount < variantData.types.length) return null;
    return variantData.items.find(item => {
      return variantData.types.every(t => {
        return item.attrs[t.id] === selections[t.id];
      });
    }) || null;
  }, [hasVariants, variantData, selections]);

  // --- End of mandatory hooks ---

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
        ...(listing.warranty_period ? [{ label: 'Warranty', value: listing.warranty_period }] : []),
        ...(listing.shipping_dimensions ? [{ label: 'Shipping Dimensions', value: formatDimensions(listing.shipping_dimensions) }] : []),
        ...(listing.tags?.length ? [{ label: 'Tags', value: listing.tags.join(', ') }] : []),
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

  // Create a function to check if selecting a specific value for a type would still produce an in-stock variant
  const isOptionDisabled = (typeId, value) => {
    if (!variantData) return false;
    // Build a candidate selections map: existing selections + the candidate value for this type
    const candidate = { ...selections, [typeId]: value };
    // For each item in variantData.items, check if it matches ALL candidate selections
    const matchingItem = variantData.items.find(item => {
      return variantData.types.every(t => {
        const selectedVal = candidate[t.id];
        if (!selectedVal) return true; // if this type isn't selected yet, don't filter
        return item.attrs[t.id] === selectedVal;
      });
    });
    // If no matching item found, or the matching item has zero stock, it's disabled
    return !matchingItem || (matchingItem.quantity || 0) <= 0;
  };

  const effectivePrice = (listing.price || 0) + (selectedVariantObj?.priceAdjustment || 0);
  const effectiveStock = selectedVariantObj?.quantity || listing.quantity;
  const isOutOfStock = hasVariants && selectedVariantObj && selectedVariantObj.quantity <= 0;

  // Check if all variant types have been selected
  const allSelected = hasVariants && variantData.types.every(t => selections[t.id] != null);

  // Find the first unselected type name for the button prompt
  const firstUnselectedType = hasVariants
    ? variantData.types.find(t => selections[t.id] == null)
    : null;

  // Build the variant label for cart display
  const buildVariantLabel = () => {
    if (!hasVariants || !variantData || !allSelected) return '';
    return Object.entries(selections).map(([typeId, val]) => {
      const type = variantData.types.find(t => t.id === typeId);
      if (!type) return val;
      if (type.style === 'color') {
        const match = type.values.find(v => v.value === val);
        return match ? match.label : val;
      }
      return val;
    }).join(' / ');
  };

  // Build the cart variant object with backward compat fields
  const cartVariant = selectedVariantObj && variantData ? {
    ...selectedVariantObj,
    label: buildVariantLabel(),
    size: selectedVariantObj.attrs?.size || null,
    color: selectedVariantObj.attrs?.color || null,
    colorName: selectedVariantObj.attrs?.color
      ? (variantData.types.find(t => t.id === 'color')?.values.find(v => v.value === selectedVariantObj.attrs.color)?.label || null)
      : null,
  } : null;

  const handleAddToCart = () => {
    addItem({
      id: listing.id,
      name: listing.title,
      price: effectivePrice,
      image_url: listing.images?.[0] || null,
      quantity,
      variant: cartVariant,
    });
  };

  const handleBuyNow = () => {
    addItem({
      id: listing.id,
      name: listing.title,
      price: effectivePrice,
      image_url: listing.images?.[0] || null,
      quantity,
      variant: cartVariant,
    });
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="listing-details">
      <Breadcrumb customLabel={listing.title} />
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-6">
        {/* Images */}
        <div className="relative w-full lg:w-1/2">
          {listing.compare_at_price && listing.compare_at_price > listing.price && (
            <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" />
              -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
            </div>
          )}
          <ImageGallery images={listing.images} title={listing.title} condition={listing.condition} />
        </div>

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
                  <span className="bg-red-900/30 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                    -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Delivery Info - dynamic from getDeliveryZones() */}
          <div className="flex flex-wrap gap-2 mb-6">
            {deliveryZones.length > 0 ? (
              <>
                <span className="flex items-center gap-1.5 bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-800">
                  <Truck className="w-3.5 h-3.5" /> Free delivery in {deliveryZones[0].name || 'Kericho'}
                </span>
                <span className="flex items-center gap-1.5 bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800">
                  <Package className="w-3.5 h-3.5" /> Delivered in {deliveryZones[0].delivery_days || '1-2'} days
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-800">
                  <Truck className="w-3.5 h-3.5" /> Free delivery in Kericho
                </span>
                <span className="flex items-center gap-1.5 bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800">
                  <Package className="w-3.5 h-3.5" /> Delivered in 1-2 days
                </span>
              </>
            )}
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
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{spec.label}</p>
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

          {/* Return Policy */}
          {listing.return_policy && (
            <div className="mb-6 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-2 text-sm text-zinc-400 uppercase tracking-wider">Return Policy</h3>
              <p className="text-zinc-300 text-sm whitespace-pre-line">{listing.return_policy}</p>
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
          {sellerProfile ? (
            <Link to={`/seller/${sellerProfile.slug || sellerProfile.id}`} className="block bg-zinc-900/50 rounded-2xl p-4 mb-4 border border-zinc-800 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-[var(--seasonal-primary,#1a5632)] to-[#ff6b8a] rounded-full flex items-center justify-center font-black text-lg text-white shadow-md shadow-[var(--seasonal-primary,#1a5632)]/20 flex-shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{sellerProfile.shop_name || 'Shop'}</p>
                  <p className="text-xs text-zinc-400 truncate">{sellerProfile.location || 'Kericho, Kenya'}</p>
                </div>
                {sellerProfile.rating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-900/30 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full">
                    {sellerProfile.rating.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-zinc-800 rounded-xl py-2 px-1">
                  <p className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">{sellerProfile.rating > 0 ? sellerProfile.rating.toFixed(1) : 'N/A'}</p>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Rating</p>
                </div>
                <div className="text-center bg-zinc-800 rounded-xl py-2 px-1">
                  <p className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">{sellerProfile.sales_count || 0}</p>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Sales</p>
                </div>
                <div className="text-center bg-zinc-800 rounded-xl py-2 px-1">
                  <p className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">{sellerProfile.score || 'N/A'}</p>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Score</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-zinc-900/50 rounded-2xl p-4 mb-4 border border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-[var(--seasonal-primary,#1a5632)] to-[#ff6b8a] rounded-full flex items-center justify-center font-black text-lg text-white shadow-md shadow-[var(--seasonal-primary,#1a5632)]/20">O</div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{t('listing.omixStore')}</p>
                  <p className="text-xs text-zinc-400">{t('listing.kerichoKenya')} &bull; {t('listing.officialStore')}</p>
                </div>
                <span className="bg-green-900/30 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full">{t('listing.verified')}</span>
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
          )}

          {/* Nia contextual help */}
          <div className="mb-4">
            <NiaContextualTrigger page="listing" />
          </div>

          {/* Variant Selectors (Dynamic) */}
          {hasVariants && variantData && (
            <div className="mb-6 space-y-4">
              {variantData.types.map((type, idx) => {
                const selectedVal = selections[type.id];
                const selectedLabel = type.style === 'color'
                  ? (type.values.find(v => v.value === selectedVal)?.label || selectedVal)
                  : selectedVal;
                return (
                  <div key={type.id + '-' + idx} id={`variant-${type.id}-section`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        {type.name} {selectedVal && <span className="text-zinc-300 normal-case">— {selectedLabel}</span>}
                      </label>
                      {type.id === 'size' && listing.size_guide && (
                        <button type="button" className="text-[10px] text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">
                          Size Guide
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {type.style === 'color' && type.values.map(v => {
                        const isSelected = selectedVal === v.value;
                        const disabled = isOptionDisabled(type.id, v.value);
                        return (
                          <button
                            key={type.id + '-' + v.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelections(prev => ({ ...prev, [type.id]: v.value }));
                              setSelectedVariant(null);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)]/5'
                                : disabled
                                  ? 'border-zinc-700 opacity-40 cursor-not-allowed'
                                  : 'border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)]'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex-shrink-0" style={{ backgroundColor: v.value?.startsWith('#') ? v.value : '#ccc' }} />
                            <span className="text-zinc-300">{v.label}</span>
                          </button>
                        );
                      })}
                      {type.style === 'button' && type.values.map(v => {
                        const isSelected = selectedVal === v.value;
                        const disabled = isOptionDisabled(type.id, v.value);
                        return (
                          <button
                            key={type.id + '-' + v.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelections(prev => ({ ...prev, [type.id]: v.value }));
                              setSelectedVariant(null);
                            }}
                            className={`min-w-[36px] px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                              isSelected
                                ? 'border-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)] text-white'
                                : disabled
                                  ? 'border-zinc-700 opacity-40 cursor-not-allowed line-through'
                                  : 'border-zinc-700 text-zinc-300 hover:border-[var(--seasonal-primary,#1a5632)]'
                            }`}
                          >
                            {v.label}
                          </button>
                        );
                      })}
                      {type.style === 'text' && type.values.map(v => {
                        const isSelected = selectedVal === v.value;
                        const disabled = isOptionDisabled(type.id, v.value);
                        return (
                          <button
                            key={type.id + '-' + v.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelections(prev => ({ ...prev, [type.id]: v.value }));
                              setSelectedVariant(null);
                            }}
                            className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-[var(--seasonal-primary,#1a5632)] bg-[var(--seasonal-primary,#1a5632)]/10 text-[var(--seasonal-primary,#1a5632)]'
                                : disabled
                                  ? 'border-zinc-700 opacity-40 cursor-not-allowed'
                                  : 'border-zinc-700 text-zinc-300 hover:border-[var(--seasonal-primary,#1a5632)]'
                            }`}
                          >
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Selected variant info */}
              {selectedVariantObj && (
                <div className="flex items-center gap-3 text-xs">
                  {selectedVariantObj.quantity > 0 && selectedVariantObj.quantity <= 3 && (
                    <span className="text-amber-400 font-bold">Only {selectedVariantObj.quantity} left!</span>
                  )}
                  {selectedVariantObj.quantity <= 0 && (
                    <span className="text-red-500 font-bold">Out of stock</span>
                  )}
                  {selectedVariantObj.priceAdjustment !== 0 && (
                    <span className="text-zinc-400">
                      {selectedVariantObj.priceAdjustment > 0 ? '+' : ''}{formatKES(selectedVariantObj.priceAdjustment)} from base
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart Section */}
          <div className="space-y-3">
            {/* Wishlist + Price Summary row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleWishlist}
                disabled={wishBusy}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  wishlisted
                    ? 'bg-red-900/30 text-red-400 border border-red-800'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)] hover:text-[var(--seasonal-primary,#1a5632)]'
                }`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                {wishlisted ? 'Saved' : 'Save'}
              </button>
            </div>
            {inCart && user && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-900/20 px-4 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800">
                <ShoppingCart className="w-4 h-4" /> {inCart.quantity} {t('cart.title').toLowerCase()}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                aria-label="Decrease quantity">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-black text-white w-12 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                aria-label="Increase quantity">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {user ? (
              <>
                {hasVariants && !allSelected ? (
                  <>
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-zinc-700 text-zinc-400 font-black py-4 rounded-2xl cursor-not-allowed opacity-50 text-lg"
                    >
                      <ShoppingCart className="w-5 h-5" /> Select {firstUnselectedType?.name || 'options'} — {formatKES(effectivePrice * quantity)}
                    </button>
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-zinc-500 font-bold py-4 rounded-2xl cursor-not-allowed opacity-50"
                    >
                      Select {firstUnselectedType?.name || 'options'} &mdash; {formatKES(effectivePrice * quantity)}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20 text-lg"
                    >
                      <ShoppingCart className="w-5 h-5" /> {inCart ? t('cart.title') : t('productCard.addToCart')} — {formatKES(effectivePrice * quantity)}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all"
                    >
                      {t('listing.buyNow')} &mdash; {formatKES(effectivePrice * quantity)}
                    </button>
                  </>
                )}
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

          {/* Wholesale / Bulk Purchase */}
          {listing.wholesale_enabled && wholesalePrices.length > 0 && (
            <div className="mt-6 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-[var(--seasonal-primary,#1a5632)]" />
                <span className="font-bold text-sm text-white">Wholesale / Bulk Purchase Available</span>
              </div>
              <div className="space-y-2">
                {wholesalePrices.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2.5">
                    <span className="text-xs font-bold text-zinc-300">{tier.min_qty}+ units</span>
                    <span className="text-sm font-black text-[var(--seasonal-primary,#1a5632)]">{formatKES(tier.price_per_unit)} / unit</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="mt-4 space-y-3">
            <WhatsAppShareButton title={listing.title} price={listing.price} url={`${window.location.origin}/listing/${listing.id}`} type="listing" className="flex-1 justify-center" />
            <MessageSellerButton listingId={listingId} listingTitle={listing.title} sellerId={listing.seller_id} className="w-full" />
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
                <div className="text-center text-sm font-medium text-emerald-400 bg-emerald-900/20 px-4 py-2 rounded-xl animate-fade-in">
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

      {/* Product Q&A */}
      <div className="mt-16 pt-8 border-t border-zinc-800">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Questions &amp; Answers
        </h3>
        {questions.length > 0 ? (
          <div className="space-y-4 mb-6">
            {questions.map((q) => (
              <div key={q.id} className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{q.question}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {q.user_name || 'Anonymous'} — {new Date(q.created_at).toLocaleDateString()}
                    </p>
                    {q.answer && (
                      <div className="mt-3 bg-zinc-800/60 rounded-xl p-3 border-l-2 border-[var(--seasonal-primary,#1a5632)]">
                        <p className="text-xs font-bold text-[var(--seasonal-primary,#1a5632)] mb-1">Seller Response</p>
                        <p className="text-xs text-zinc-300">{q.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm mb-6">No questions yet. Be the first to ask!</p>
        )}
        {user ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question about this product..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--seasonal-primary,#1a5632)]"
              disabled={submittingQuestion}
            />
            <button
              onClick={async () => {
                if (!newQuestion.trim()) return;
                setSubmittingQuestion(true);
                const res = await postProductQuestion(listingId, newQuestion.trim(), user.id, user.user_metadata?.full_name || 'You');
                if (res.success) {
                  setQuestions(prev => [...prev, { id: Date.now(), question: newQuestion.trim(), user_name: 'You', created_at: new Date().toISOString(), answer: null }]);
                  setNewQuestion('');
                }
                setSubmittingQuestion(false);
              }}
              disabled={submittingQuestion || !newQuestion.trim()}
              className="bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingQuestion ? 'Submitting...' : 'Ask'}
            </button>
          </div>
        ) : (
          <Link to={`/login?redirect=/listing/${listingId}`} className="inline-flex items-center gap-2 text-sm text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">
            <MessageCircle className="w-4 h-4" />
            Log in to ask a question
          </Link>
        )}
      </div>

      {/* Product Recommendations */}
      {listing?.id && (
        <ProductRecommendations title="You May Also Like" listingId={listing.id} />
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-zinc-800">
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
        selectedVariant={cartVariant}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        inCart={inCart}
        user={user}
      />
      {/* Floating WhatsApp Share Button */}
      <FloatingWhatsAppButton
        title={listing.title}
        price={effectivePrice || listing.price}
        listingId={listing.id}
      />
    </div>
  );
}

export default ListingDetails;
