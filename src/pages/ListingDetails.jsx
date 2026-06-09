import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, CheckCircle, ShoppingCart, Minus, Plus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { WhatsAppShareButton } from '../components/WhatsAppButtons';
import { fetchListing, fetchListings } from '../utils/api';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';

function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
  const { addItem, cart } = useCart();

  // Compare as numbers to avoid string/number mismatch from useParams
  const listingId = Number(id);
  const inCart = cart.find(item => item.id === listingId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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

          {/* Seller Details - Show store info */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
            <h3 className="font-bold mb-4 text-lg">Sold by</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ff385c]/10 rounded-full flex items-center justify-center font-bold text-xl text-[#ff385c]">
                O
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Omix Store</p>
                <p className="text-sm text-zinc-500">Kericho, Kenya</p>
              </div>
            </div>
          </div>

          {/* Add to Cart Section */}
          <div className="mt-6 space-y-3">
            {inCart && user && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800">
                <ShoppingCart className="w-4 h-4" />
                {inCart.quantity} in cart
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-black text-zinc-900 dark:text-white w-12 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {user ? (
              <>
                <button
                  onClick={() => addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity })}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {inCart ? 'Update Cart' : 'Add to Cart'} — {formatKES(listing.price * quantity)}
                </button>
                <button
                  onClick={() => {
                    addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity });
                    navigate('/checkout');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all"
                >
                  Buy Now — {formatKES(listing.price * quantity)}
                </button>
              </>
            ) : (
              <>
                <Link to={`/signup?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Sign Up to Add to Cart
                </Link>
                <Link to={`/login?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
                  Log In to Buy Now
                </Link>
              </>
            )}
          </div>

          {/* Share */}
          <div className="mt-4">
            <WhatsAppShareButton
              title={listing.title}
              price={listing.price}
              url={`${window.location.origin}/listing/${listing.id}`}
              type="listing"
              className="flex-1 justify-center"
            />
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
