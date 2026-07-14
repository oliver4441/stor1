import { ShoppingCart, Eye } from 'lucide-react';
import { formatKES } from '../utils/constants';

/**
 * Sticky bottom bar on mobile product pages.
 * Shows price + Add to Cart / Buy Now buttons.
 * Only visible on small screens (hidden on md+).
 * Slides up when user scrolls down past the main CTA.
 */
export default function StickyMobileCart({ listing, quantity, effectivePrice, selectedVariant, onAddToCart, onBuyNow, inCart, user }) {
  if (!listing) return null;

  const isOffline = typeof window !== 'undefined' && localStorage.getItem('omix_offline_mode') === 'true';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950 border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Price */}
        <div className="flex-shrink-0">
          <p className="text-xs text-zinc-400 leading-none">Price</p>
          <p className="text-lg font-black text-[var(--seasonal-primary,#1a5632)] leading-tight">{formatKES((effectivePrice || listing.price) * quantity)}</p>
        </div>

        {/* Buttons */}
        <div className="flex-1 flex gap-2">
          {isOffline ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-zinc-500 font-bold py-3 rounded-xl text-sm">
              <Eye className="w-4 h-4" />
              Browse Only
            </div>
          ) : user ? (
            <>
              <button
                onClick={onAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
              >
                <ShoppingCart className="w-4 h-4" />
                {inCart ? `Update (${inCart.quantity})` : 'Add to Cart'}
              </button>
              <button
                onClick={onBuyNow}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--seasonal-primary,#1a5632)] text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
              >
                Buy Now
              </button>
            </>
          ) : (
            <>
              <a
                href={`/signup?redirect=/listing/${listing.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--seasonal-primary,#1a5632)] text-white font-bold py-3 rounded-xl text-sm text-center"
              >
                Sign Up to Buy
              </a>
              <a
                href={`/login?redirect=/listing/${listing.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white font-bold py-3 rounded-xl text-sm text-center"
              >
                Log In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
