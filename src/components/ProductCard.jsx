import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, MapPin } from 'lucide-react'
import { formatKES } from '../utils/constants'

function ProductCard({ listing }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = listing.images && listing.images.length > 0 && !imgError;

  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] overflow-hidden aspect-square mb-3 relative">
        {hasImage ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-2 py-1 rounded-[8px] text-xs font-bold shadow-sm capitalize">
          {listing.condition?.replace('_', ' ')}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-zinc-900 dark:text-white truncate">{listing.title}</h3>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">{listing.category}</p>
        <div className="flex items-center gap-2">
          <p className="font-bold text-[#ff385c]">{formatKES(listing.price)}</p>
          {listing.location && (
            <span className="text-zinc-400 text-xs ml-auto flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
