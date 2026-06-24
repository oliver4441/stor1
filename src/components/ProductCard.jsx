import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Share2, Package, ShoppingCart, Eye, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { ProductSocialBadge } from '../components/SocialProof';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { isMaintenanceCached } from '../hooks/useMaintenanceMode';
import { useActiveTheme } from '../context/SeasonalContext';

const COMPARE_KEY = 'omix_compare_ids';

function getCompareIds() {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
  } catch { return []; }
}

function setCompareIds(ids) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
  // Dispatch custom event so floating button can react
  window.dispatchEvent(new Event('omix-compare-changed'));
}

function ProductCard({ listing, compareMode, onCompareChange }) {
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { user } = useAuth();
  const { addItem, cart } = useCart();
  const navigate = useNavigate();
  const hasImage = listing.images && listing.images.length > 0 && !imgError;

  const inCart = cart.find(item => item.id === listing.id);
  const theme = useActiveTheme();
  const priceColor = theme?.colors?.priceColor || '#ff385c';
  const accentColor = theme?.colors?.accent || '#ff385c';
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
      navigator.clipboard.writeText(shareData.url).then(() => {
        // Brief visual feedback — could use a toast
      }).catch(() => {});
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

    // Block during maintenance mode
    if (isMaintenanceCached()) {
      // Brief shake animation on the button area
      const btn = e.currentTarget;
      btn.style.animation = 'none';
      btn.offsetHeight; // reflow
      btn.style.animation = 'shake 0.4s ease-in-out';
      return;
    }

    if (!user) {
      navigate(`/login?redirect=/listing/${listing.id}`);
      return;
    }

    addItem({
      id: listing.id,
      name: listing.title,
      price: listing.price,
      image_url: listing.images?.[0] || null,
      quantity: 1,
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

  return (
    <Link to={`/listing/${listing.id}`} className="block group theme-card-shimmer theme-card-glow">
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden aspect-[4/5] mb-3 relative">
        {hasImage ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}

        {/* Seasonal theme sticker badge */}
        {sticker && socialBadge && (
          <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
            <span>{sticker}</span>
            <span className="truncate max-w-[80px]">{socialBadge}</span>
          </div>
        )}

        {/* Condition badge */}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm capitalize">
          {listing.condition?.replace('_', ' ')}
        </div>

        {/* Flash sale badge */}
        {listing.flash_sale_ends_at && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
            <CountdownTimer targetDate={listing.flash_sale_ends_at} />
          </div>
        )}

        {/* Discount badge on image */}
        {listing.compare_at_price && listing.compare_at_price > listing.price && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
          </div>
        )}

        {/* Compare checkbox (visible when comparison mode is active) */}
        {compareMode && (
          <button
            onClick={toggleCompare}
            className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all z-10 ${
              isCompared
                ? 'bg-[var(--seasonal-primary,#ff385c)] text-white'
                : 'bg-white/90 dark:bg-black/90 text-zinc-400 hover:text-[var(--seasonal-primary,#ff385c)]'
            }`}
            aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isCompared ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        )}

        {/* Web Share button */}
        <button onClick={handleWebShare}
          className="absolute top-2 right-12 bg-white/90 dark:bg-black/90 text-zinc-700 dark:text-zinc-300 p-1.5 rounded-full shadow-sm hover:bg-[var(--seasonal-primary,#ff385c)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share">
          <Share2 className="w-3 h-3" />
        </button>

        {/* WhatsApp Share button */}
        <button onClick={handleWhatsAppShare}
          className="absolute top-2 right-2 bg-[#25D366] text-white p-1.5 rounded-full shadow-sm hover:bg-[#20BD5A] transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share on WhatsApp">
          <Share2 className="w-3 h-3" />
        </button>

        {/* Quick View button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-10 right-2 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white p-1.5 rounded-full shadow-sm hover:bg-[var(--seasonal-primary,#ff385c)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
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
                    ? 'bg-[var(--seasonal-primary,#ff385c)]/90 text-white'
                    : 'bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white hover:bg-[var(--seasonal-primary,#ff385c)] hover:text-white'
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
          <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate flex-1">{listing.title}</h3>
          <ProductSocialBadge listing={listing} />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">{listing.category}{listing.brand ? ` - ${listing.brand}` : ''}</p>

        {/* Color swatches */}
        {listing.has_variants && listing.variants?.length > 0 && (() => {
          const uniqueColors = [];
          const seen = new Set();
          listing.variants.forEach(v => {
            if (v.color && !seen.has(v.color)) {
              seen.add(v.color);
              uniqueColors.push({ hex: v.color, name: v.colorName || v.color });
            }
          });
          if (uniqueColors.length <= 1) return null;
          return (
            <div className="flex items-center gap-1 mt-1.5">
              {uniqueColors.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-600 flex-shrink-0"
                  style={{ backgroundColor: c.hex?.startsWith('#') ? c.hex : '#ccc' }}
                  title={c.name}
                />
              ))}
              {uniqueColors.length > 5 && (
                <span className="text-[9px] text-zinc-400 font-medium">+{uniqueColors.length - 5}</span>
              )}
            </div>
          );
        })()}

        {/* Size chips (show first few) */}
        {listing.has_variants && listing.variants?.length > 0 && (() => {
          const uniqueSizes = [...new Set(listing.variants.map(v => v.size).filter(Boolean))];
          if (uniqueSizes.length <= 1) return null;
          return (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {uniqueSizes.slice(0, 4).map((s, i) => (
                <span key={i} className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))}
              {uniqueSizes.length > 4 && (
                <span className="text-[9px] text-zinc-400">+{uniqueSizes.length - 4} more</span>
              )}
            </div>
          );
        })()}

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm" style={{ color: priceColor }}>
              {listing.has_variants && listing.variants?.length > 0 ? (() => {
                const prices = listing.variants.map(v => (listing.price || 0) + (v.priceAdjustment || 0));
                if (prices.length === 0) return formatKES(listing.price || 0);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                if (!isFinite(min) || !isFinite(max)) return formatKES(listing.price || 0);
                return min === max ? formatKES(min) : `${formatKES(min)} – ${formatKES(max)}`;
              })() : (listing.flash_sale_price ? formatKES(listing.flash_sale_price) : formatKES(listing.price))}
            </p>
            {(listing.compare_at_price && listing.compare_at_price > listing.price) || listing.flash_sale_price ? (
              <p className="text-xs text-zinc-400 line-through">{formatKES(listing.compare_at_price || listing.price)}</p>
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
