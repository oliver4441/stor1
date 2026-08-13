import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Share2, MessageCircle, Package, ShoppingCart, CheckSquare, Square, AlertTriangle, Heart, ArrowRight, Sparkles, Eye } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { ProductSocialBadge } from '../components/SocialProof';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { isMaintenanceCached } from '../hooks/useMaintenanceMode';
import { useActiveTheme } from '../context/SeasonalContext';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../utils/api';
import QuickViewModal from './QuickViewModal';

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
  const [quickViewOpen, setQuickViewOpen] = useState(false);
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
  const priceColor = theme?.colors?.priceColor || '#0e7665';

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
    <article className="marketplace-product-card group">
      <Link to={`/listing/${listing.id}`} className="marketplace-product-card-link">
        <div className="marketplace-product-media">
          {hasImage ? (
            <img
              key={mainImage}
              src={mainImage}
              alt={listing.title}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="marketplace-product-image-fallback"><ImageIcon className="h-9 w-9" /></div>
          )}
          <div className="marketplace-product-image-shade" />
          <span className="marketplace-condition-badge">{listing.condition?.replace('_', ' ') || 'Pre-owned'}</span>
          {listing.status === 'sold' && <span className="marketplace-status-badge marketplace-status-sold">Sold out</span>}
          {listing.featured && listing.status !== 'sold' && <span className="marketplace-status-badge marketplace-status-featured"><Sparkles className="h-3 w-3" /> Popular</span>}
          {listing.flash_sale_ends_at && <span className="marketplace-status-badge marketplace-status-flash"><CountdownTimer targetDate={listing.flash_sale_ends_at} /></span>}
          {listing.compare_at_price && listing.compare_at_price > listing.price && (
            <span className="marketplace-discount-badge">-{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%</span>
          )}
        </div>
        <div className="marketplace-product-details">
          <div className="marketplace-product-topline"><span>{listing.category || 'Marketplace'}</span>{listing._rankReasons?.[0]?.label && <em className="marketplace-wholesale-badge">{listing._rankReasons[0].label}</em>}{listing.wholesale_enabled && <em className="marketplace-wholesale-badge">Wholesale</em>}<ProductSocialBadge listing={listing} /></div>
          <h3>{listing.title}</h3>
          <div className="marketplace-product-meta">
            {listing.avg_rating !== undefined && listing.avg_rating > 0 ? (
              <span className="marketplace-rating"><span>★</span> {Number(listing.avg_rating).toFixed(1)}{listing.review_count ? ` (${listing.review_count})` : ''}</span>
            ) : <span className="marketplace-location"><MapPin className="h-3 w-3" />{listing.location || 'Kenya'}</span>}
            {listing.brand && <span className="marketplace-brand-meta">{listing.brand}</span>}
          </div>
          <div className="marketplace-product-price-row">
            <div>
              <p className="marketplace-product-price" style={{ '--product-price': priceColor }}>{selectedVariantObj ? formatKES(effectivePrice) : displayPrice}</p>
              {((listing.compare_at_price && listing.compare_at_price > listing.price) || listing.flash_sale_price) && (
                <p className="marketplace-product-was">{formatKES(listing.compare_at_price || listing.price)}</p>
              )}
            </div>
            <span className="marketplace-product-detail-arrow"><ArrowRight className="h-4 w-4" /></span>
          </div>
          {(listing.delivery_estimate || listing.location) && <div className="marketplace-delivery-note"><Package className="h-3 w-3" />{listing.delivery_estimate || `Delivery in ${listing.location}`}</div>}
        </div>
      </Link>

      <div className="marketplace-card-actions">
        {compareMode && (
          <button type="button" onClick={toggleCompare} className={`marketplace-card-action ${isCompared ? 'is-active' : ''}`} aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}>
            {isCompared ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
        )}
        <button type="button" onClick={handleWishlist} disabled={wishBusy || !user} className={`marketplace-card-action ${wishlisted ? 'is-liked' : ''}`} aria-label={user ? (wishlisted ? 'Remove from wishlist' : 'Add to wishlist') : 'Sign in to save this item'}>
          <Heart className={`h-[17px] w-[17px] ${wishlisted ? 'fill-current' : ''}`} />
        </button>
        <button type="button" onClick={handleWebShare} className="marketplace-card-action marketplace-share-action" aria-label="Share product"><Share2 className="h-4 w-4" /></button>
        <button type="button" onClick={handleWhatsAppShare} className="marketplace-card-action marketplace-whatsapp-action" aria-label="Share on WhatsApp"><MessageCircle className="h-4 w-4" /></button>
        <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setQuickViewOpen(true); }} className="marketplace-card-action marketplace-quick-view-action" aria-label="Quick view"><Eye className="h-4 w-4" /></button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={hasVariants && !allSelected}
        className={`marketplace-card-cart ${justAdded || inCart ? 'is-added' : ''} ${hasVariants && !allSelected ? 'is-disabled' : ''}`}
        aria-label={hasVariants && !allSelected ? 'Select variants' : 'Add to cart'}
      >
        {isMaintenanceCached() ? <AlertTriangle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        <span>{isMaintenanceCached() ? 'Unavailable' : justAdded ? 'Added' : inCart ? 'In cart' : hasVariants && !allSelected ? 'Choose' : 'Add'}</span>
      </button>

      {hasVariants && (
        <div className="marketplace-card-variants" onClick={(event) => event.stopPropagation()}>
          {variantData.types.map(type => (
            <div key={type.id} className="marketplace-variant-row">
              <span>{type.name}</span>
              <div className="marketplace-variant-options">
                {type.values.map((val, index) => {
                  const value = val.value;
                  const label = val.label || value;
                  const isSelected = selections[type.id] === value;
                  const disabled = isOptionDisabled(type.id, value);
                  if (type.style === 'color') {
                    return <button key={index} type="button" disabled={disabled} onClick={() => setSelections(prev => ({ ...prev, [type.id]: isSelected ? null : value }))} className={`marketplace-color-option ${isSelected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`} style={{ backgroundColor: value?.startsWith('#') ? value : '#d6d3d1' }} aria-label={label} title={label} />;
                  }
                  return <button key={index} type="button" disabled={disabled} onClick={() => setSelections(prev => ({ ...prev, [type.id]: isSelected ? null : value }))} className={`marketplace-variant-option ${isSelected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}>{label}</button>;
                })}
              </div>
            </div>
          ))}
          {Object.values(selections).some(value => value != null) && <span className="marketplace-selected-variant">{variantData.types.filter(type => selections[type.id] != null).map(type => type.values.find(value => value.value === selections[type.id])?.label || selections[type.id]).join(' / ')}</span>}
        </div>
      )}

      {quickViewOpen && <QuickViewModal listing={listing} onClose={() => setQuickViewOpen(false)} />}
    </article>
  );
}

export default ProductCard;