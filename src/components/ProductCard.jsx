import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Share2, Package, ShoppingCart, Eye, CheckSquare, Square, AlertTriangle, Heart } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { ProductSocialBadge } from '../components/SocialProof';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { isMaintenanceCached } from '../hooks/useMaintenanceMode';
import { useActiveTheme } from '../context/SeasonalContext';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../utils/api';

const COMPARE_KEY = 'omix_compare_ids';

function getCompareIds() {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
  } catch { return []; }
}

function setCompareIds(ids) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('omix-compare-changed'));
}

function ProductCard({ listing, compareMode, onCompareChange }) {
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const { user } = useAuth();
  const { addItem, cart } = useCart();

  // ── Variant selection state ──
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Derive unique colors and sizes from listing variants
  const hasVariants = listing?.has_variants && listing?.variants?.length > 0;
  const uniqueColors = useMemo(() => {
    if (!hasVariants) return [];
    const seen = new Set();
    return listing.variants
      .filter(v => v.color && !seen.has(v.color) && seen.add(v.color))
      .map(v => ({ hex: v.color, name: v.colorName || v.color }));
  }, [listing?.variants, hasVariants]);
  const uniqueSizes = useMemo(() => {
    if (!hasVariants) return [];
    return [...new Set(listing.variants.map(v => v.size).filter(Boolean))];
  }, [listing?.variants, hasVariants]);

  // Derive the selected variant object matching both color + size
  const selectedVariantObj = useMemo(() => {
    if (!hasVariants) return null;
    return listing.variants.find(v =>
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize)
    ) || null;
  }, [hasVariants, listing?.variants, selectedColor, selectedSize]);

  // Effective price reflects the selected variant's price adjustment
  const effectivePrice = selectedVariantObj
    ? (listing.price || 0) + (selectedVariantObj.priceAdjustment || 0)
    : listing.price;

  // Reset variant selection when listing changes
  useEffect(() => {
    setSelectedColor(null);
    setSelectedSize(null);
  }, [listing?.id]);

  // Check wishlist status on mount
  useEffect(() => {
    if (user && listing?.id) {
      isInWishlist(listing.id).then(res => {
        if (res.success) setWishlisted(res.inWishlist);
      });
    }
  }, [user, listing?.id]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishBusy || !user) return;
    setWishBusy(true);
    try {
      if (wishlisted) {
        const res = await removeFromWishlist(listing.id);
        if (res.success) setWishlisted(false);
      } else {
        const res = await addToWishlist(listing.id);
        if (res.success) setWishlisted(true);
      }
    } catch {}
    setWishBusy(false);
  };
  const navigate = useNavigate();
  const hasImage = listing.images && listing.images.length > 0 && !imgError;

  const inCart = cart.find(item => item.id === listing.id);
  const theme = useActiveTheme();
  const priceColor = theme?.colors?.priceColor || '#1a5632';
  const accentColor = theme?.colors?.accent || '#1a5632';
  const sticker = theme?.sticker || '';
  const socialBadge = theme?.socialBadge || '';

  // Check if this item is selected for comparison
  const [isCompared, setIsCompared] = useState(() => getCompareIds().includes(listing.id));

  // Sync compare state when localStorage changes
  useEffect(() => {
    const handler = () => {
      setIsCompared(getCompareIds().includes(listing.id));
    };
    window.addEventListener('omix-compare-changed', handler);
    return () => window.removeEventListener('omix-compare-changed', handler);
  }, [listing.id]);

  const handleWebShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: listing.title,
      text: `${listing.title} - KES ${listing.price?.toLocaleString()} on Omix`,
      url: window.location.origin + '/listing/' + listing.id,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareData.url).then(() => {}).catch(() => {});
    }
  };

  const handleWhatsAppShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const message = `Check out this ${listing.title} on Omix!\nKES ${listing.price?.toLocaleString()} - Kericho\n${window.location.origin}/listing/${listing.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMaintenanceCached()) {
      const btn = e.currentTarget;
      btn.style.animation = 'none';
      btn.offsetHeight;
      btn.style.animation = 'shake 0.4s ease-in-out';
      return;
    }

    if (!user) {
      navigate(`/login?redirect=/listing/${listing.id}`);
      return;
    }

    // If product has variants but none selected, pick first available
    let variantToUse = selectedVariantObj;
    if (hasVariants && !variantToUse) {
      const inStock = listing.variants.find(v => (v.quantity || 0) > 0);
      if (inStock) {
        variantToUse = inStock;
        // Also update local state so selection shows
        setSelectedColor(inStock.color || null);
        setSelectedSize(inStock.size || null);
      }
    }

    addItem({
      id: listing.id,
      name: listing.title,
      price: variantToUse ? (listing.price || 0) + (variantToUse.priceAdjustment || 0) : listing.price,
      image_url: listing.images?.[0] || null,
      quantity: 1,
      variant: variantToUse ? {
        id: variantToUse.id,
        size: variantToUse.size,
        color: variantToUse.color,
        colorName: variantToUse.colorName,
        sku: variantToUse.sku,
      } : null,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const toggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let ids = getCompareIds();
    if (ids.includes(listing.id)) {
      ids = ids.filter(id => id !== listing.id);
    } else {
      ids.push(listing.id);
    }
    setCompareIds(ids);
    setIsCompared(!isCompared);
    if (onCompareChange) onCompareChange(ids);
  };

  // Display price range for variant products
  const displayPrice = listing.has_variants && listing.variants?.length > 0 ? (() => {
    const prices = listing.variants.map(v => (listing.price || 0) + (v.priceAdjustment || 0));
    if (prices.length === 0) return formatKES(listing.price || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (!isFinite(min) || !isFinite(max)) return formatKES(listing.price || 0);
    return min === max ? formatKES(min) : `${formatKES(min)} - ${formatKES(max)}`;
  })() : (listing.flash_sale_price ? formatKES(listing.flash_sale_price) : formatKES(listing.price));

  return (
    <Link to={`/listing/${listing.id}`} className="block group theme-card-shimmer theme-card-glow">
      <div className="bg-zinc-900 rounded-2xl overflow-hidden aspect-[4/5] mb-3 relative">
        {hasImage ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}

        {sticker && socialBadge && (
          <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
            <span>{sticker}</span>
            <span className="truncate max-w-[80px]">{socialBadge}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm capitalize">
          {listing.condition?.replace('_', ' ')}
        </div>

        {listing.status !== 'sold' && listing.stock_quantity !== undefined && listing.stock_quantity > 0 && listing.stock_quantity <= 2 && (
          <div className="absolute top-2 left-16 bg-orange-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            Only {listing.stock_quantity} left!
          </div>
        )}

        {listing.status === 'sold' && (
          <div className="absolute top-2 left-16 bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            Sold Out
          </div>
        )}

        {listing.featured && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            Popular
          </div>
        )}

        {listing.flash_sale_ends_at && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
            <CountdownTimer targetDate={listing.flash_sale_ends_at} />
          </div>
        )}

        {listing.compare_at_price && listing.compare_at_price > listing.price && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
          </div>
        )}

        {compareMode && (
          <button
            onClick={toggleCompare}
            className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all z-10 ${
              isCompared
                ? 'bg-[var(--seasonal-primary,#1a5632)] text-white'
                : 'bg-white/90 dark:bg-black/90 text-zinc-400 hover:text-[var(--seasonal-primary,#1a5632)]'
            }`}
            aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isCompared ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        )}

        <button onClick={handleWishlist}
          className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all z-10 ${
            wishlisted
              ? 'bg-[var(--seasonal-primary,#1a5632)] text-white scale-110'
              : 'bg-black/60 text-white/80 hover:text-[var(--seasonal-primary,#1a5632)] hover:bg-black/80 md:opacity-0 md:group-hover:opacity-100'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        <button onClick={handleWebShare}
          className="absolute top-2 right-12 bg-white/90 dark:bg-black/90 text-zinc-300 p-1.5 rounded-full shadow-sm hover:bg-[var(--seasonal-primary,#1a5632)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share">
          <Share2 className="w-3 h-3" />
        </button>

        <button onClick={handleWhatsAppShare}
          className="absolute top-2 right-2 bg-[#25D366] text-white p-1.5 rounded-full shadow-sm hover:bg-[#20BD5A] transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share on WhatsApp">
          <Share2 className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-10 right-2 bg-white/90 dark:bg-black/90 text-white p-1.5 rounded-full shadow-sm hover:bg-[var(--seasonal-primary,#1a5632)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Quick view"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
            onClick={handleAddToCart}
            className={`absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all opacity-0 group-hover:opacity-100 ${
              isMaintenanceCached()
                ? 'bg-amber-500 text-white'
                : justAdded
                  ? 'bg-green-500 text-white'
                  : inCart
                    ? 'bg-[var(--seasonal-primary,#1a5632)]/90 text-white'
                    : 'bg-white/90 dark:bg-black/90 text-white hover:bg-[var(--seasonal-primary,#1a5632)] hover:text-white'
            }`}
            aria-label={isMaintenanceCached() ? 'Under maintenance' : 'Add to cart'}
          >
            {isMaintenanceCached() ? (
              <><AlertTriangle className="w-3 h-3" /> Unavailable</>
            ) : (
              <><ShoppingCart className="w-3 h-3" />
              {justAdded ? 'Added!' : inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}</>
            )}
          </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-white text-sm truncate flex-1">{listing.title}</h3>
          <ProductSocialBadge listing={listing} />
        </div>
        <p className="text-zinc-400 text-xs">{listing.category}{listing.brand ? ` - ${listing.brand}` : ''}</p>

        {/* Interactive Color Selector */}
        {uniqueColors.length > 1 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {uniqueColors.map((c, i) => {
              const isSelected = selectedColor === c.hex;
              const stock = listing.variants.filter(v => v.color === c.hex).reduce((s, v) => s + (v.quantity || 0), 0);
              const disabled = stock <= 0;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(isSelected ? null : c.hex);
                  }}
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    isSelected
                      ? 'border-[var(--seasonal-primary,#1a5632)] scale-125 shadow-sm shadow-[var(--seasonal-primary,#1a5632)]/30'
                      : disabled
                        ? 'border-zinc-700 opacity-25 cursor-not-allowed'
                        : 'border-zinc-400 dark:border-zinc-600 hover:border-[var(--seasonal-primary,#1a5632)] hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex?.startsWith('#') ? c.hex : '#ccc' }}
                  title={`${c.name}${disabled ? ' (out of stock)' : ''}`}
                />
              );
            })}
            {selectedColor && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(null); }}
                className="text-[8px] text-zinc-500 hover:text-white ml-0.5 font-bold"
                title="Clear color"
              >
                x
              </button>
            )}
          </div>
        )}

        {/* Interactive Size Selector */}
        {uniqueSizes.length > 1 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {uniqueSizes.map((s, i) => {
              const isSelected = selectedSize === s;
              const stock = listing.variants.filter(v =>
                v.size === s && (!selectedColor || v.color === selectedColor)
              ).reduce((total, v) => total + (v.quantity || 0), 0);
              const disabled = stock <= 0;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(isSelected ? null : s);
                  }}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                    isSelected
                      ? 'bg-[var(--seasonal-primary,#1a5632)] text-white border-[var(--seasonal-primary,#1a5632)]'
                      : disabled
                        ? 'bg-zinc-900 text-zinc-600 border-zinc-800 line-through cursor-not-allowed'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)]'
                  }`}
                  title={disabled ? 'Out of stock' : s}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected variant indicator */}
        {selectedVariantObj && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-[var(--seasonal-primary,#1a5632)] font-bold">
              {selectedVariantObj.colorName || selectedColor ? `${uniqueColors.find(c => c.hex === selectedColor)?.name || ''}${selectedSize ? ` - ${selectedSize}` : ''}` : selectedSize}
            </span>
            {selectedVariantObj.quantity <= 0 && (
              <span className="text-[9px] text-red-500 font-bold">Out of stock</span>
            )}
            {selectedVariantObj.quantity > 0 && selectedVariantObj.quantity <= 2 && (
              <span className="text-[9px] text-orange-500 font-bold">Only {selectedVariantObj.quantity} left!</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm" style={{ color: priceColor }}>
              {selectedVariantObj ? formatKES(effectivePrice) : displayPrice}
            </p>
            {(listing.compare_at_price && listing.compare_at_price > listing.price) || listing.flash_sale_price ? (
              <p className="text-xs text-zinc-400 line-through">
                {selectedVariantObj && selectedVariantObj.priceAdjustment !== 0
                  ? formatKES(listing.price)
                  : formatKES(listing.compare_at_price || listing.price)
                }
              </p>
            ) : null}
          </div>
          {listing.location && (
            <span className="text-zinc-400 text-[10px] flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{listing.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
