import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

function formatKES(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[200px] snap-start animate-pulse">
      <div className="bg-zinc-800 rounded-2xl overflow-hidden">
        <div className="aspect-square bg-zinc-700" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-zinc-700 rounded w-full" />
          <div className="h-4 bg-zinc-700 rounded w-2/3" />
          <div className="h-5 bg-zinc-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ listing }) {
  const imageUrl = listing.images?.[0]
    ? (listing.images[0].startsWith('http') ? listing.images[0] : `https://utfs.io/f/${listing.images[0]}`)
    : null;

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="flex-shrink-0 w-[200px] snap-start group"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-colors h-full flex flex-col">
        <div className="aspect-square bg-zinc-800 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm font-bold">
              No Image
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1 flex-1">
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
            {listing.title}
          </h3>
          {listing.category && (
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {listing.category}
            </p>
          )}
          <p className="text-base font-black text-[var(--seasonal-primary,#1a5632)] mt-auto">
            {formatKES(listing.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function ProductRecommendations({ title, listingId, category, limit = 6 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchRecommendations() {
      try {
        let url;
        if (listingId) {
          url = `${API_BASE}/api/products/${listingId}/recommendations`;
        } else {
          const params = new URLSearchParams();
          if (category) params.set('category', category);
          if (limit) params.set('limit', limit);
          url = `${API_BASE}/api/recommendations/trending${params.toString() ? '?' + params.toString() : ''}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (!cancelled) {
          setRecommendations(data.recommendations || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ProductRecommendations] Error:', err);
          setRecommendations([]);
          setLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => { cancelled = true; };
  }, [listingId, category, limit]);

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>

      {loading ? (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recommendations.map(item => (
            <RecommendationCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}
