import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Share2, Package } from 'lucide-react';
import { formatKES } from '../utils/constants';

function ProductCard({ listing }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = listing.images && listing.images.length > 0 && !imgError;

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const message = `Check out this ${listing.title} on Omix!\nKES ${listing.price?.toLocaleString()} — Kericho\n${window.location.origin}/listing/${listing.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
        {/* Share button */}
        <button onClick={handleShare}
          className="absolute top-2 right-2 bg-[#25D366] text-white p-1.5 rounded-full shadow-sm hover:bg-[#20BD5A] transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share on WhatsApp">
          <Share2 className="w-3 h-3" />
        </button>
      </div>
      <div>
        <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{listing.title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">{listing.category}{listing.brand ? ` • ${listing.brand}` : ''}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="font-bold text-[#ff385c] text-sm">{formatKES(listing.price)}</p>
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
