import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  X,
  ShoppingCart,
  Share2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import SeoHead from '../components/SeoHead';
import { getWebSiteSchema } from '../utils/jsonld';
import useAnalytics from '../hooks/useAnalytics';
import { formatKES } from '../utils/constants';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

function StarRating({ rating }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-[1px]">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rounded ? 'text-yellow-400' : 'text-zinc-700'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function ConditionBadge({ condition }) {
  const colors = {
    new: 'bg-[#007AFF]/40 text-[#38B8EA] border-[#007AFF]',
    used: 'bg-amber-900/40 text-amber-400 border-amber-800',
    refurbished: 'bg-blue-900/40 text-blue-400 border-blue-800',
  };
  const cls = colors[condition?.toLowerCase()] || 'bg-[#28303F] text-[#4A5771] border-[#353F54]';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {condition?.replace(/_/g, ' ') || 'N/A'}
    </span>
  );
}

function DiscountBadge({ compareAtPrice, price }) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  const pct = Math.round((1 - price / compareAtPrice) * 100);
  return (
    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-lg shadow-lg z-10">
      -{pct}%
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#28303F]/60 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-700/50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-700/50 rounded w-3/4" />
        <div className="h-3 bg-zinc-700/50 rounded w-1/2" />
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="w-3.5 h-3.5 bg-zinc-700/50 rounded" />
          ))}
        </div>
        <div className="h-5 bg-zinc-700/50 rounded w-1/3" />
        <div className="h-9 bg-zinc-700/50 rounded w-full" />
      </div>
    </div>
  );
}

function SkeletonAnalysis() {
  return (
    <div className="bg-[#28303F]/60 rounded-2xl p-6 animate-pulse space-y-4 border-l-4 border-[#007AFF]/30">
      <div className="h-5 bg-zinc-700/50 rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-3 bg-zinc-700/50 rounded w-full" />
        <div className="h-3 bg-zinc-700/50 rounded w-5/6" />
        <div className="h-3 bg-zinc-700/50 rounded w-4/5" />
        <div className="h-3 bg-zinc-700/50 rounded w-3/4" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-zinc-700/50 rounded w-2/3" />
        <div className="h-3 bg-zinc-700/50 rounded w-1/2" />
        <div className="h-3 bg-zinc-700/50 rounded w-3/5" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <div className="w-5 h-5 bg-zinc-700/50 rounded-full" />
        <div className="h-3 bg-zinc-700/50 rounded w-28" />
      </div>
    </div>
  );
}

function ProductSearchSelect({ label, onSelect, value, onClear }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=6`);
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setResults(data.listings || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (product) => {
    onSelect(product);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 bg-[#28303F] rounded-xl px-3 py-2.5 border border-[#353F54]">
          <div className="w-8 h-8 rounded-lg bg-zinc-700 overflow-hidden flex-shrink-0">
            {value.images?.[0] ? (
              <img src={value.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#4A5771]">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
          </div>
          <span className="text-sm text-white truncate flex-1">{value.title}</span>
          <button
            onClick={onClear}
            className="text-[#4A5771] hover:text-[#8E9BB5] transition-colors flex-shrink-0"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5771] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={`Search ${label}...`}
            className="w-full bg-[#28303F] border border-[#353F54] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#4A5771] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:border-[#007AFF]/50 transition-all"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5771] animate-spin" />
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#28303F] border border-[#353F54] rounded-xl overflow-hidden shadow-xl z-50 max-h-72 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-700 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-700 overflow-hidden flex-shrink-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#4A5771]">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{p.title}</p>
                <p className="text-xs text-[#4A5771]">{formatKES(p.price)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ThisOrThat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackShare } = useAnalytics();

  const [productA, setProductA] = useState(null);
  const [productB, setProductB] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [popularProducts, setPopularProducts] = useState([]);

  // Load from URL params on mount
  useEffect(() => {
    const idA = searchParams.get('a');
    const idB = searchParams.get('b');

    if (idA || idB) {
      const fetchIds = async () => {
        const ids = [idA, idB].filter(Boolean);
        try {
          const res = await fetch(
            `${API_BASE}/api/search?${ids.map((id) => `ids=${id}`).join('&')}`
          );
          if (res.ok) {
            const data = await res.json();
            const listings = data.listings || [];
            if (idA) {
              const match = listings.find((l) => String(l.id) === String(idA));
              if (match) setProductA(match);
            }
            if (idB) {
              const match = listings.find((l) => String(l.id) === String(idB));
              if (match) setProductB(match);
            }
          }
        } catch {
          // silent
        }
      };
      fetchIds();
    }
  }, []); // only on mount

  // Fetch popular products for the "Popular Comparisons" section
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search?limit=8&sort=popular`);
        if (res.ok) {
          const data = await res.json();
          const shuffled = (data.listings || []).sort(() => Math.random() - 0.5).slice(0, 4);
          setPopularProducts(shuffled);
        }
      } catch {
        // silent
      }
    };
    fetchPopular();
  }, []);

  const canCompare = productA && productB && productA.id !== productB.id;

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;
    setComparing(true);
    setComparison(null);
    trackShare('comparison', `${productA.id}_${productB.id}`);

    try {
      const res = await fetch(`${API_BASE}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: [productA.id, productB.id] }),
      });

      if (!res.ok) {
        throw new Error('Comparison request failed');
      }

      const data = await res.json();
      setComparison(data.comparison || data.analysis || data.content || 'No analysis returned.');
    } catch (err) {
      setComparison(
        'Unable to fetch AI comparison at this time. Please try again later.'
      );
    } finally {
      setComparing(false);
    }
  }, [canCompare, productA, productB, trackShare]);

  // Keyboard shortcut: Enter to compare
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && canCompare && !comparing) {
        handleCompare();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canCompare, comparing, handleCompare]);

  const handleAddToCart = (product) => {
    // Dispatch custom event for CartContext to pick up if needed
    // The app's CartContext handles addItem via useCart — this is a basic fallback
    const event = new CustomEvent('omix-add-to-cart', {
      detail: {
        id: product.id,
        name: product.title,
        price: product.price,
        image_url: product.images?.[0] || null,
        quantity: 1,
      },
    });
    window.dispatchEvent(event);
    // Also try to use the cart context via a simple toast-like feedback
    const btn = document.activeElement;
    if (btn) {
      btn.textContent = 'Added!';
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
      }, 1500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!productA || !productB) return;
    const text = `Can't decide between these two? Let AI help! \n\n${productA.title} - ${formatKES(productA.price)}\n${window.location.origin}/listing/${productA.id}\n\nVS\n\n${productB.title} - ${formatKES(productB.price)}\n${window.location.origin}/listing/${productB.id}\n\nCompare on Omix: ${window.location.origin}/this-or-that?a=${productA.id}&b=${productB.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    trackShare('whatsapp', `${productA.id}_${productB.id}`);
  };

  const handlePickProduct = (slot) => (product) => {
    if (slot === 'a') {
      setProductA(product);
    } else {
      setProductB(product);
    }
    setComparison(null);
  };

  const handleClearProduct = (slot) => () => {
    if (slot === 'a') {
      setProductA(null);
    } else {
      setProductB(null);
    }
    setComparison(null);
  };

  const renderProductCard = (product, slot) => {
    if (!product) {
      return (
        <div className="bg-[#28303F]/60 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px] border border-dashed border-[#353F54]">
          <div className="text-zinc-600 mb-4">
            <ImageIcon className="w-12 h-12" />
          </div>
          <ProductSearchSelect
            label={`Product ${slot.toUpperCase()}`}
            onSelect={handlePickProduct(slot)}
            value={null}
            onClear={() => {}}
          />
        </div>
      );
    }

    const hasDiscount =
      product.compare_at_price && product.compare_at_price > product.price;

    return (
      <div className="bg-[#28303F] rounded-2xl overflow-hidden border border-[#353F54]/50 flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-[#28303F]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <ImageIcon className="w-14 h-14" />
            </div>
          )}
          {hasDiscount && (
            <DiscountBadge
              compareAtPrice={product.compare_at_price}
              price={product.price}
            />
          )}
          <div className="absolute top-2 left-2">
            <ConditionBadge condition={product.condition} />
          </div>
        </div>

        {/* Details */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="text-white font-bold text-sm line-clamp-2 leading-snug min-h-[2.5rem]">
            {product.title}
          </h3>

          {product.brand && (
            <p className="text-[#4A5771] text-xs font-medium">{product.brand}</p>
          )}

          {product.avg_rating > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={product.avg_rating} />
              <span className="text-xs text-[#4A5771] font-medium">
                {product.avg_rating.toFixed(1)}
              </span>
              {product.review_count > 0 && (
                <span className="text-xs text-[#4A5771]">
                  ({product.review_count})
                </span>
              )}
            </div>
          )}

          <p className="text-[#38B8EA] font-bold text-lg mt-auto">
            {formatKES(product.price)}
          </p>

          {hasDiscount && (
            <p className="text-xs text-[#4A5771] line-through">
              {formatKES(product.compare_at_price)}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearProduct(slot)();
              }}
              className="p-2 text-[#4A5771] hover:text-[#8E9BB5] hover:bg-zinc-700 rounded-xl transition-colors"
              aria-label={`Remove Product ${slot.toUpperCase()}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SeoHead
        title="AI Product Comparison"
        jsonLd={[getWebSiteSchema()]}
      />

      <div className="min-h-screen bg-[#242C3B] text-white" data-name="this-or-that-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              This or That?
            </h1>
            <p className="text-[#4A5771] mt-1 text-sm md:text-base">
              Let AI help you choose
            </p>
          </div>

          {/* Product cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>{renderProductCard(productA, 'a')}</div>
            <div>{renderProductCard(productB, 'b')}</div>
          </div>

          {/* VS divider + Compare button */}
          <div className="flex items-center justify-center my-6 md:my-8 gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent max-w-[120px]" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-zinc-600 text-xs font-bold tracking-widest uppercase">
                VS
              </span>
              <button
                onClick={handleCompare}
                disabled={!canCompare || comparing}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  canCompare && !comparing
                    ? 'bg-[#007AFF] hover:bg-[#0066CC] text-white shadow-lg shadow-[#007AFF]/20 active:scale-95'
                    : 'bg-[#28303F] text-[#4A5771] cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {comparing ? 'Analyzing...' : 'Compare with AI'}
              </button>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent max-w-[120px]" />
          </div>

          {/* Loading skeleton */}
          {comparing && <SkeletonAnalysis />}

          {/* AI Comparison result */}
          {comparison && !comparing && (
            <div className="bg-[#28303F]/80 rounded-2xl p-5 md:p-6 border-l-4 border-[#007AFF] shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#38B8EA]" />
                <h3 className="text-white font-bold text-sm">
                  AI Comparison
                </h3>
              </div>
              <div className="text-[#8E9BB5] text-sm leading-relaxed whitespace-pre-line">
                {comparison}
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-700/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#38B8EA]" />
                <span className="text-[11px] text-[#4A5771] font-medium">
                  Powered by Nia AI
                </span>
              </div>
            </div>
          )}

          {/* Share on WhatsApp */}
          {productA && productB && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>
            </div>
          )}

          {/* Popular Comparisons */}
          {popularProducts.length > 0 && (
            <div className="mt-12 pt-6 border-t border-[#353F54]">
              <h3 className="text-sm font-bold text-[#4A5771] mb-3 uppercase tracking-wider">
                Popular Comparisons
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!productA || productA.id === p.id) {
                        handlePickProduct('a')(p);
                      } else if (!productB || productB.id === p.id) {
                        handlePickProduct('b')(p);
                      } else {
                        // Replace productB by default
                        handlePickProduct('b')(p);
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-[#28303F] hover:bg-zinc-700 border border-[#353F54] hover:border-zinc-600 rounded-xl px-3 py-2 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 overflow-hidden flex-shrink-0">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#4A5771]">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#8E9BB5] font-medium truncate max-w-[140px]">
                      {p.title}
                    </span>
                    <span className="text-xs text-[#38B8EA] font-bold whitespace-nowrap">
                      {formatKES(p.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
