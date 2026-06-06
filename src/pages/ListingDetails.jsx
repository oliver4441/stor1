import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image as ImageIcon, MapPin, CheckCircle, Smartphone } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { fetchListing, fetchListings } from '../utils/api';
import { formatKES } from '../utils/constants';

function ListingDetails() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) { setError('No listing ID'); setLoading(false); return; }

    setLoading(true);
    fetchListing(id).then(data => {
      if (!data) { setError('Listing not found'); setLoading(false); return; }
      setListing(data);
      setLoading(false);

      // Fetch related
      fetchListings(data.category, '').then(all => {
        setRelated(all.filter(l => l.id !== data.id).slice(0, 4));
      });
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <div className="w-full md:w-1/2 lg:w-3/5 aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 rounded-[14px]"></div>
          <div className="w-full md:w-1/2 lg:w-2/5 space-y-4">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">{error || 'Listing not found'}</h2>
        <Link to="/" className="text-[#ff385c] font-bold hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="listing-details">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Images Left */}
        <div className="w-full md:w-1/2 lg:w-3/5">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] overflow-hidden aspect-[4/3] group relative">
            {listing.images && listing.images.length > 0 && listing.images[0] ? (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm capitalize">
              {listing.condition?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Details Right */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-zinc-900 dark:text-white leading-tight">{listing.title}</h1>
            <p className="text-3xl font-bold text-[#ff385c]">{formatKES(listing.price)}</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full text-sm">
              <MapPin className="w-4 h-4 text-[#ff385c]" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{listing.category}</span>
            </div>
          </div>

          {listing.description && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
              <h3 className="font-bold mb-3 text-lg">Description</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}

          {listing.seller_name && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
              <h3 className="font-bold mb-4 text-lg">Seller Details</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-xl text-[#ff385c]">
                  {listing.seller_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{listing.seller_name}</p>
                  {listing.seller_phone && <p className="text-sm text-zinc-500">{listing.seller_phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* M-Pesa Section */}
          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-8 mt-8 border border-white/20 dark:border-zinc-800/50 shadow-2xl">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-xl text-zinc-900 dark:text-white">Pay via M-Pesa</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Safe & Direct Transaction</p>
              </div>
            </div>
            <div className="bg-zinc-900 dark:bg-black p-6 rounded-2xl mb-6 text-center transform hover:scale-[1.02] transition-transform">
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-2">Buy Goods Till Number</p>
              <p className="text-4xl font-black tracking-tighter text-green-500">9315501</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium flex gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Contact seller after payment to arrange pickup.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium flex gap-2">
                <CheckCircle className="w-4 h-4 text-[#ff385c] flex-shrink-0" />
                Never pay in advance for items you haven't seen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Listings */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-8">Similar in {listing.category}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map(l => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetails;
