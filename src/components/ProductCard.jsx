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

// ── Normalize old and new variant formats into a standard shape ──
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

function ProductCard({ listing, compareMode, onCompareChange }) {
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const { user } = useAuth();
  const { addItem, cart } = useCart();

  // ── Normalized variant data (supports old array & new object format) ──
  const variantData = useMemo(() => normalizeVariants(listing.variants), [listing?.variants]);
  const hasVariants = variantData && variantData.types.length > 0;

  // ── Variant selections (dynamic, keyed by type id) ──
  const [selections, setSelections] = useState({});

  // Find the matching variant item from current selections
  const selectedVariantObj = useMemo(() => {
    if (!hasVariants) return null;
    const selKeys = Object.keys(selections).filter(k => selections[k] != null);
    if (selKeys.length === 0) return null;
    return variantData.items.find(item =>
      selKeys.every(key => item.attrs[key] === selections[key])
    ) || null;
  }, [hasVariants, variantData, selections]);

  // Effective price reflects the selected variant's price adjustment
  const effectivePrice = selectedVariantObj
    ? (listing.price || 0) + (selectedVariantObj.priceAdjustment || 0)
    : listing.price;

  // All required types have been selected?
  const allSelected = hasVariants && variantData.types.every(t => selections[t.id] != null);

  // Check if a specific value option is disabled (out of stock for this combination)
  const isOptionDisabled = (typeId, value) => {
    if (!hasVariants) return true;
    return !variantData.items.some(item => {
      if (item.attrs[typeId] !== value) return false;
      for (const [key, selVal] of Object.entries(selections)) {
        if (key !== typeId && selVal != null) {
          if (item.attrs[key] !== selVal) return false;
        }
      }
      return (item.quantity || 0) > 0;
    });
  };

  // Reset selections when listing changes
  useEffect(() => {
    setSelections({});
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
  // Variant-aware main image — use selected variant's imageUrl if available
  const mainImage = selectedVariantObj?.imageUrl || listing.images?.[0] || null;
  const hasImage = mainImage && !imgError;

  // Reset image error when the active image source changes
  useEffect(() => {
    setImgError(false);
  }, [mainImage]);

  const inCart = cart.find(item => item.id === listing.id);
  const theme = useActiveTheme();
  const priceColor = theme?.colors?.priceColor || '#38B8EA';
  const accentColor = theme?.colors?.accent || '#71717a';
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
    const displayPrice = listing.flash_sale_price
      ? formatKES(listing.flash_sale_price)
      : formatKES(selectedVariantObj ? effectivePrice : listing.price);
    const variantImage = selectedVariantObj?.imageUrl || listing.images?.[0] || '';
    const message = `Check out this ${listing.title} on Omix!\\n${displayPrice} - Kenya\\n${variantImage ? `${variantImage}\\n` : ''}${window.location.origin}/listing/${listing.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ── Offline browse mode check removed ──

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

    // Find variant matching current selections (button is disabled if not all selected)
    let variantToUse = null;
    if (hasVariants && allSelected) {
      variantToUse = variantData.items.find(item =>
        variantData.types.every(t => item.attrs[t.id] === selections[t.id])
      ) || null;
    }

    addItem({
      id: listing.id,
      name: listing.title,
      price: variantToUse ? (listing.price || 0) + (variantToUse.priceAdjustment || 0) : listing.price,
      image_url: selectedVariantObj?.imageUrl || listing.images?.[0] || null,
      quantity: 1,
      variant: variantToUse ? {
        id: variantToUse.id,
        sku: variantToUse.sku,
        ...(variantToUse.attrs || {}),
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
  const displayPrice = hasVariants ? (() => {
    const prices = variantData.items.map(v => (listing.price || 0) + (v.priceAdjustment || 0));
    if (prices.length === 0) return formatKES(listing.price || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (!isFinite(min) || !isFinite(max)) return formatKES(listing.price || 0);
    return min === max ? formatKES(min) : `${formatKES(min)} - ${formatKES(max)}`;
  })() : (listing.flash_sale_price ? formatKES(listing.flash_sale_price) : formatKES(listing.price));

  return (
    <Link to={`/listing/${listing.id}`} className="block group theme-card-shimmer theme-card-glow">
      <div className="fusion-recessed-card fusion-card-interactive aspect-[4/5] mb-3 relative">
        {hasImage ? (
          <div className="fusion-img-frame fusion-aurora w-full h-full">
          <img key={mainImage} src={mainImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={() => setImgError(true)} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#4A5771] fusion-aurora">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}

        {sticker && socialBadge && false && (
          <div className="absolute bottom-2 left-2 bg-white/90 bg-[#28303F]/80 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
            <span>{sticker}</span>
            <span className="truncate max-w-[80px]">{socialBadge}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 bg-white/90 bg-[#28303F]/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm capitalize">
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
          <div className="fusion-chrome absolute top-2 right-16 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            Popular
          </div>
        )}

        {listing.flash_sale_ends_at && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
            <CountdownTimer targetDate={listing.flash_sale_ends_at} />
          </div>
        )}

        {listing.compare_at_price && listing.compare_at_price > listing.price && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-extrabold shadow-lg z-10">
            -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
          </div>
        )}

        {listing.wholesale_enabled && (
          <div className="absolute top-10 left-2 bg-zinc-700 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-sm z-10">
            Wholesale
          </div>
        )}

        {compareMode && (
          <button
            onClick={toggleCompare}
            className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all z-10 ${
              isCompared
                ? 'bg-[var(--seasonal-primary,#71717a)] text-white'
                : 'bg-white/90 bg-[#28303F]/90 text-[#4A5771] hover:text-[var(--seasonal-primary,#71717a)]'
            }`}
            aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isCompared ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        )}

        <button onClick={handleWishlist}
          className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all z-10 ${
            wishlisted
              ? 'bg-[var(--seasonal-primary,#71717a)] text-white scale-110'
              : 'bg-black/60 text-white/80 hover:text-[var(--seasonal-primary,#71717a)] hover:bg-black/80 md:opacity-0 md:group-hover:opacity-100'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        <button onClick={handleWebShare}
          className="absolute top-2 right-12 bg-white/90 bg-[#28303F]/90 text-[#8E9BB5] p-1.5 rounded-full shadow-sm hover:bg-[var(--seasonal-primary,#71717a)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
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
          className="absolute top-10 right-2 bg-white/90 bg-[#28303F]/90 text-white p-1.5 rounded-full shadow-sm hover:bg-[var(--seasonal-primary,#71717a)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Quick view"
        >
          <Eye className="w-3 h-3" />
        </button>

        {/* Add to Cart button — disabled until all variant types selected */}
        <button
          onClick={handleAddToCart}
          disabled={hasVariants && !allSelected}
          className={`absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all opacity-0 group-hover:opacity-100 ${
            isMaintenanceCached()
              ? 'bg-[#71717a] text-white'
              : justAdded
                ? 'bg-[#71717a] text-white'
                : inCart
                  ? 'bg-[var(--seasonal-primary,#71717a)]/90 text-white'
                  : hasVariants && !allSelected
                    ? 'bg-[#353F54] text-[#4A5771] cursor-not-allowed'
                    : 'bg-white/90 bg-[#28303F]/90 text-white hover:bg-[var(--seasonal-primary,#71717a)] hover:text-white'
          }`}
          aria-label={
            isMaintenanceCached()
              ? 'Under maintenance'
              : hasVariants && !allSelected
                ? 'Select variants'
                : 'Add to cart'
          }
        >
          {isMaintenanceCached() ? (
            <><AlertTriangle className="w-3 h-3" /> Unavailable</>
          ) : hasVariants && !allSelected ? (
            <><ShoppingCart className="w-3 h-3" /> Select variants</>
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
        <p className="text-[#4A5771] text-xs">{listing.category}{listing.brand ? ` - ${listing.brand}` : ''}</p>

        {listing.avg_rating !== undefined && listing.avg_rating > 0 && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#4A5771]">
            <span className="flex items-center gap-[1px]">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${star <= Math.round(listing.avg_rating) ? 'text-yellow-400' : 'text-[#353F54]'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </span>
            <span className="font-medium text-white">{listing.avg_rating.toFixed(1)}</span>
            {listing.review_count > 0 && (
              <span>({listing.review_count} {listing.review_count === 1 ? 'review' : 'reviews'})</span>
            )}
          </div>
        )}

        {/* Dynamic variant selectors based on normalized types */}
        {hasVariants && variantData.types.map((type) => (
          <div key={type.id} className="mt-1.5">
            <span className="text-[8px] text-[#4A5771] uppercase tracking-wider font-bold">{type.name}</span>
            {type.style === 'button' ? (
              <>
                <div className="mt-0.5 grid grid-cols-2 gap-1">
                  {type.values.map((val, i) => {
                    const value = val.value;
                    const label = val.label || value;
                    const isSelected = selections[type.id] === value;
                    const disabled = isOptionDisabled(type.id, value);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelections(prev => ({
                            ...prev,
                            [type.id]: isSelected ? null : value,
                          }));
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all w-full ${
                          isSelected
                            ? 'bg-[var(--seasonal-primary,#71717a)] text-white border-[var(--seasonal-primary,#71717a)]'
                            : disabled
                              ? 'bg-[#1E2A3D] text-[#4A5771] border-[#353F54] line-through cursor-not-allowed'
                              : 'bg-[#28303F] text-[#8E9BB5] border-[#353F54] hover:border-[var(--seasonal-primary,#71717a)]'
                        }`}
                        title={disabled ? 'Out of stock' : label}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {selections[type.id] != null && (
                  <div className="mt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelections(prev => ({...prev, [type.id]: null}));
                      }}
                      className="text-[8px] text-[#4A5771] hover:text-white font-bold"
                      title={`Clear ${type.name}`}
                    >
                      x
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={`mt-0.5 flex items-center gap-1 ${type.style === 'text' ? 'flex-wrap' : ''}`}>
                {type.values.map((val, i) => {
                  const value = val.value;
                  const label = val.label || value;
                  const isSelected = selections[type.id] === value;
                  const disabled = isOptionDisabled(type.id, value);

                  if (type.style === 'color') {
                    return (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelections(prev => ({
                              ...prev,
                              [type.id]: isSelected ? null : value,
                            }));
                          }}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
                            isSelected
                              ? 'border-[var(--seasonal-primary,#71717a)] scale-125 shadow-sm shadow-[var(--seasonal-primary,#71717a)]/30'
                              : disabled
                                ? 'border-[#353F54] opacity-25 cursor-not-allowed'
                                : 'border-[#4A5771] hover:border-[var(--seasonal-primary,#71717a)] hover:scale-110'
                          }`}
                          style={{ backgroundColor: value?.startsWith('#') ? value : '#ccc' }}
                          title={`${label}${disabled ? ' (out of stock)' : ''}`}
                        />
                        <span className={`text-[7px] leading-tight ${isSelected ? 'text-[#8E9BB5] font-medium' : 'text-[#4A5771]'}`}>{label}</span>
                      </div>
                    );
                  } else {
                    // text style (chips/pills)
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelections(prev => ({
                            ...prev,
                            [type.id]: isSelected ? null : value,
                          }));
                        }}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-[var(--seasonal-primary,#71717a)] text-white border-[var(--seasonal-primary,#71717a)]'
                            : disabled
                              ? 'bg-[#1E2A3D] text-[#4A5771] border-[#353F54] line-through cursor-not-allowed'
                              : 'bg-[#28303F] text-[#8E9BB5] border-[#353F54] hover:border-[var(--seasonal-primary,#71717a)]'
                        }`}
                        title={disabled ? 'Out of stock' : label}
                      >
                        {label}
                      </button>
                    );
                  }
                })}
                {/* Clear button inline for non-grid types */}
                {selections[type.id] != null && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelections(prev => ({...prev, [type.id]: null}));
                    }}
                    className="text-[8px] text-[#4A5771] hover:text-white ml-0.5 font-bold"
                    title={`Clear ${type.name}`}
                  >
                    x
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Active variants chip */}
        {hasVariants && Object.values(selections).some(v => v != null) && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="bg-[#28303F] text-[10px] text-[#8E9BB5] font-medium px-2 py-0.5 rounded-full border border-[#353F54]">
              {variantData.types
                .filter(t => selections[t.id] != null)
                .map(t => {
                  const val = t.values.find(v => v.value === selections[t.id]);
                  return val?.label || selections[t.id];
                })
                .join(' / ')}
            </div>
            {allSelected && selectedVariantObj && selectedVariantObj.quantity <= 0 && (
              <span className="text-[9px] text-red-500 font-bold">Out of stock</span>
            )}
            {allSelected && selectedVariantObj && selectedVariantObj.quantity > 0 && selectedVariantObj.quantity <= 2 && (
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
              <p className="text-xs text-[#4A5771] line-through">
                {selectedVariantObj && selectedVariantObj.priceAdjustment !== 0
                  ? formatKES(listing.price)
                  : formatKES(listing.compare_at_price || listing.price)
                }
              </p>
            ) : null}
          </div>
          {listing.location && (
            <span className="text-[#4A5771] text-[10px] flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{listing.location}
            </span>
          )}
        </div>
        {(listing.delivery_estimate || listing.location) && (
          <div className="mt-1 text-[10px] text-[#38B8EA] font-medium flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {listing.delivery_estimate || `Free delivery in ${listing.location}`}
          </div>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;