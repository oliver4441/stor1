import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Share2, Package, ShoppingCart } from 'lucide-react';
import { ProductSocialBadge } from '../components/SocialProof';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';

function ProductCard({ listing }) {
  const [imgError, setImgError] = useState(false);
  const [user, setUser] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem, cart } = useCart();
  const navigate = useNavigate();
  const hasImage = listing.images && listing.images.length > 0 && !imgError;

  const inCart = cart.find(item => item.id === listing.id);

  // Check auth on mount
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  });

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const message = `Check out this ${listing.title} on Omix!\nKES ${listing.price?.toLocaleString()} - Kericho\n${window.location.origin}/listing/${listing.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate(`/login?redirect=/listing/${listing.id}`);
      return;
    }

    if (listing.quantity === 0) return;

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

  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden aspect-[4/5] mb-3 relative">
        {hasImage ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}

        {/* Condition badge */}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm capitalize">
          {listing.condition?.replace('_', ' ')}
        </div>

        {/* Stock badge */}
        {listing.quantity === 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-[10px] font-bold text-center py-1">Out of stock</div>
        )}
        {listing.quantity > 0 && listing.quantity <= 3 && (
          <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-[10px] font-bold text-center py-1">Only {listing.quantity} left</div>
        )}

        {/* Discount badge on image */}
        {listing.compare_at_price && listing.compare_at_price > listing.price && (
          <div className="absolute top-2 right-12 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
            -{Math.round((1 - listing.price / listing.compare_at_price) * 100)}%
          </div>
        )}

        {/* Share button */}
        <button onClick={handleShare}
          className="absolute top-2 right-2 bg-[#25D366] text-white p-1.5 rounded-full shadow-sm hover:bg-[#20BD5A] transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share on WhatsApp">
          <Share2 className="w-3 h-3" />
        </button>

        {/* Quick Add to Cart button (bottom-right, on hover) */}
        {listing.quantity > 0 && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all opacity-0 group-hover:opacity-100 ${
              justAdded
                ? 'bg-green-500 text-white'
                : inCart
                ? 'bg-[#ff385c]/90 text-white'
                : 'bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white hover:bg-[#ff385c] hover:text-white'
            }`}
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-3 h-3" />
            {justAdded ? 'Added!' : inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate flex-1">{listing.title}</h3>
          <ProductSocialBadge listing={listing} />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">{listing.category}{listing.brand ? ` - ${listing.brand}` : ''}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[#ff385c] text-sm">{formatKES(listing.price)}</p>
            {listing.compare_at_price && listing.compare_at_price > listing.price && (
              <p className="text-xs text-zinc-400 line-through">{formatKES(listing.compare_at_price)}</p>
            )}
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
