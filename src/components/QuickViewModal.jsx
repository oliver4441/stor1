import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Share2, MapPin, Package, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import { isMaintenanceCached } from '../hooks/useMaintenanceMode';

export default function QuickViewModal({ listing, onClose }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem, cart } = useCart();
  const navigate = useNavigate();
  const images = listing?.images || [];
  const hasImage = images.length > 0;
  const inCart = cart.find(item => item.id === listing?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!listing) return null;

  const handleAddToCart = (e) => {
    e.stopPropagation();

    // Block during maintenance mode
    if (isMaintenanceCached()) {
      return;
    }

    if (!user) {
      onClose();
      navigate(`/login?redirect=/listing/${listing.id}`);
      return;
    }
    if (listing.quantity === 0) return;
    addItem({
      id: listing.id,
      name: listing.title,
      price: listing.price,
      image_url: images[0] || null,
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const message = `Check out this ${listing.title} on Omix!\nKES ${listing.price?.toLocaleString()} - Kericho\n${window.location.origin}/listing/${listing.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
            {hasImage ? (
              <>
                <img
                  src={images[imgIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImgIndex(i => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <Package className="w-16 h-16" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {listing.condition && (
                <span className="bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm capitalize">
                  {listing.condition.replace('_', ' ')}
                </span>
              )}
              {listing.quantity === 0 && (
                <span className="bg-red-500/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold">Out of stock</span>
              )}
              {listing.quantity > 0 && listing.quantity <= 3 && (
                <span className="bg-amber-500/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold">Only {listing.quantity} left</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{listing.category}{listing.brand ? ` · ${listing.brand}` : ''}</p>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">{listing.title}</h2>

            <div className="flex items-center gap-2 mb-4">
              <p className="text-2xl font-black text-[var(--seasonal-primary,#ff385c)]">{formatKES(listing.price)}</p>
              {listing.compare_at_price && listing.compare_at_price > listing.price && (
                <>
                  <p className="text-sm text-zinc-400 line-through">{formatKES(listing.compare_at_price)}</p>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {listing.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">{listing.description}</p>
            )}

            {listing.location && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <MapPin className="w-3.5 h-3.5" />
                <span>{listing.location}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              {listing.quantity > 0 && (
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    justAdded
                      ? 'bg-emerald-500 text-white'
                      : inCart
                      ? 'bg-[var(--seasonal-primary,#ff385c)]/10 text-[var(--seasonal-primary,#ff385c)] border border-[var(--seasonal-primary,#ff385c)]/20'
                      : 'bg-[var(--seasonal-primary,#ff385c)] text-white hover:bg-[var(--seasonal-secondary,#e03150)] shadow-lg shadow-[var(--seasonal-primary,#ff385c)]/20'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {justAdded ? 'Added!' : inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
                </button>
              )}
              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <Link
              to={`/listing/${listing.id}`}
              onClick={onClose}
              className="mt-3 text-center text-xs font-bold text-[var(--seasonal-primary,#ff385c)] hover:underline"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
