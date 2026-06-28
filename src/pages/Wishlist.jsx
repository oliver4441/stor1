import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Package, Bell, TrendingDown, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { watchPriceDrop, watchBackInStock } from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState({});
  const { addItem } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadWishlist(session.user.id);
      else setLoading(false);
    });
  }, []);

  const loadWishlist = async (userId) => {
    try {
      const { data } = await supabase
        .from('omix_wishlist')
        .select('*, listings(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (listingId) => {
    if (!user) return;
    setItems(prev => prev.filter(i => i.listing_id !== listingId));
    try {
      const { error } = await supabase.from('omix_wishlist').delete().eq('user_id', user.id).eq('listing_id', listingId);
      if (error) {
        console.error('Failed to remove wishlist item:', error);
        loadWishlist(user.id);
      }
    } catch (err) {
      console.error('Failed to remove wishlist item:', err);
      loadWishlist(user.id);
    }
  };

  const handleAddToCart = (listing) => {
    addItem({
      id: listing.id,
      name: listing.title,
      price: listing.price,
      image_url: listing.images?.[0] || null,
      quantity: 1,
    });
    setAddedToCart(prev => ({ ...prev, [listing.id]: true }));
    setTimeout(() => setAddedToCart(prev => ({ ...prev, [listing.id]: false })), 2000);
  };

  const handleNotifyPriceDrop = async (listingId) => {
    try {
      await watchPriceDrop(listingId);
      setItems(prev => prev.map(i =>
        i.listing_id === listingId ? { ...i, priceWatch: true } : i
      ));
    } catch {}
  };

  const handleNotifyBackInStock = async (listingId) => {
    try {
      await watchBackInStock(listingId);
      setItems(prev => prev.map(i =>
        i.listing_id === listingId ? { ...i, stockWatch: true } : i
      ));
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[var(--seasonal-primary,#1a5632)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Saved Items</h1>
        <p className="text-zinc-500 mb-8">Sign in to save your favorite items and get notified about price drops.</p>
        <Link to="/login" className="bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-8 py-3 rounded-xl inline-block">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Heart className="w-6 h-6 text-[var(--seasonal-primary,#1a5632)]" /> Saved Items
        </h1>
        <span className="text-sm text-zinc-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-zinc-500 mb-6">Start saving items you love! Tap the heart on any product.</p>
          <Link to="/" className="bg-[var(--seasonal-primary,#1a5632)] text-white font-bold px-8 py-3 rounded-xl inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const listing = item.listings;
            if (!listing) return null;
            const outOfStock = listing.status === 'sold' || listing.quantity <= 0;
            const inCart = addedToCart[listing.id];

            return (
              <div key={item.id} className="flex gap-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-3 hover:border-zinc-700 transition-colors">
                {/* Image */}
                <Link to={`/listing/${listing.id}`} className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 bg-zinc-800 rounded-xl overflow-hidden">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-zinc-500" /></div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link to={`/listing/${listing.id}`}>
                      <h3 className="font-bold text-sm text-white truncate hover:text-[var(--seasonal-primary,#1a5632)] transition-colors">{listing.title}</h3>
                    </Link>
                    <p className="text-[var(--seasonal-primary,#1a5632)] font-black text-base mt-0.5">{formatKES(listing.price)}</p>
                    {outOfStock && (
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mt-1">
                        <AlertCircle className="w-3 h-3" /> Out of stock
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {outOfStock ? (
                      <button
                        onClick={() => handleNotifyBackInStock(listing.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          item.stockWatch
                            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)]'
                        }`}
                      >
                        <Bell className="w-3 h-3" /> {item.stockWatch ? 'Notifying' : 'Notify Me'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(listing)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          inCart
                            ? 'bg-[var(--seasonal-primary,#1a5632)] text-white'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)] hover:text-white'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3" /> {inCart ? 'Added!' : 'Add to Cart'}
                      </button>
                    )}

                    <button
                      onClick={() => handleNotifyPriceDrop(listing.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        item.priceWatch
                          ? 'bg-amber-900/30 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-amber-600 hover:text-amber-400'
                      }`}
                    >
                      <TrendingDown className="w-3 h-3" /> {item.priceWatch ? 'Watching' : 'Price Alert'}
                    </button>

                    <button
                      onClick={() => removeItem(listing.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all ml-auto"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
