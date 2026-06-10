import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, CheckCircle, ShoppingCart, Minus, Plus, Package, Truck, Shield, Tag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { WhatsAppShareButton } from '../components/WhatsAppButtons';
import { fetchListing, fetchListings } from '../utils/api';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase';
import NiaContextualTrigger from '../components/NiaContextualTrigger';

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

  const listingId = Number(id);
  const inCart = cart.find(item => item.id === listingId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) { setError('No listing ID'); setLoading(false); return; }
    setLoading(true);
    fetchListing(id).then(data => {
      if (!data) { setError('Listing not found'); setLoading(false); return; }
      setListing(data);
      setLoading(false);
      fetchListings(data.category, '').then(all => {
        setRelated(all.filter(l => l.id !== data.id).slice(0, 4));
      });
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <div className="w-full md:w-1/2 lg:w-3/5 aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 rounded-3xl"></div>
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

  const specs = [
    ...(listing.brand ? [{ label: 'Brand', value: listing.brand }] : []),
    ...(listing.model ? [{ label: 'Model', value: listing.model }] : []),
    ...(listing.color ? [{ label: 'Color', value: listing.color }] : []),
    ...(listing.weight ? [{ label: 'Weight', value: listing.weight }] : []),
    ...(listing.sku ? [{ label: 'SKU', value: listing.sku }] : []),
    { label: 'Condition', value: listing.condition },
    { label: 'Category', value: listing.category },
  ];

  const stockStatus = listing.quantity === 0 ? 'Out of stock' : listing.quantity <= 3 ? `Only ${listing.quantity} left` : 'In stock';
  const stockColor = listing.quantity === 0 ? 'text-red-500' : listing.quantity <= 3 ? 'text-amber-500' : 'text-green-500';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="listing-details">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Images */}
        <div className="w-full lg:w-1/2">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden aspect-square group relative">
            {listing.images && listing.images.length > 0 && listing.images[0] ? (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400"><ImageIcon className="w-16 h-16" /></div>
            )}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm capitalize">
              {listing.condition?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-zinc-900 dark:text-white leading-tight">{listing.title}</h1>
            <p className="text-3xl font-black text-[#ff385c]">{formatKES(listing.price)}</p>
          </div>

          {/* Stock & Location */}
          <div className="flex flex-wrap gap-3 mb-6">
            <span className={`flex items-center gap-1.5 text-sm font-bold ${stockColor}`}>
              <Package className="w-4 h-4" /> {stockStatus}
            </span>
            {listing.location && (
              <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                <MapPin className="w-4 h-4 text-[#ff385c]" /> {listing.location}
              </span>
            )}
          </div>

          {/* Specs Table */}
          {specs.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Product Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                    <Tag className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{spec.label}</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white ml-auto">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h3 className="font-bold mb-2 text-lg">Description</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed text-sm">{listing.description}</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Truck className="w-3.5 h-3.5" /> Delivery available
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Shield className="w-3.5 h-3.5" /> Secure payment
            </div>
          </div>

          {/* Seller */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 py-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff385c]/10 rounded-full flex items-center justify-center font-bold text-lg text-[#ff385c]">O</div>
              <div>
                <p className="font-bold text-sm text-zinc-900 dark:text-white">Omix Store</p>
                <p className="text-xs text-zinc-500">Kericho, Kenya</p>
              </div>
            </div>
          </div>

          {/* Nia contextual help */}
          <div className="mb-4">
            <NiaContextualTrigger page="listing" />
          </div>

          {/* Cart Section */}
          <div className="space-y-3">
            {inCart && user && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800">
                <ShoppingCart className="w-4 h-4" /> {inCart.quantity} in cart
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
                <button onClick={() => addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity })}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 text-lg">
                  <ShoppingCart className="w-5 h-5" /> {inCart ? 'Update Cart' : 'Add to Cart'} — {formatKES(listing.price * quantity)}
                </button>
                <button onClick={() => { addItem({ id: listing.id, name: listing.title, price: listing.price, image_url: listing.images?.[0] || null, quantity }); navigate('/checkout'); }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
                  Buy Now — {formatKES(listing.price * quantity)}
                </button>
              </>
            ) : (
              <>
                <Link to={`/signup?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 text-lg">
                  <ShoppingCart className="w-5 h-5" /> Sign Up to Add to Cart
                </Link>
                <Link to={`/login?redirect=/listing/${listing.id}`} className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
                  Log In to Buy Now
                </Link>
              </>
            )}
          </div>

          {/* Share */}
          <div className="mt-4">
            <WhatsAppShareButton title={listing.title} price={listing.price} url={`${window.location.origin}/listing/${listing.id}`} type="listing" className="flex-1 justify-center" />
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-8">Similar in {listing.category}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map(l => (<ProductCard key={l.id} listing={l} />))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetails;
