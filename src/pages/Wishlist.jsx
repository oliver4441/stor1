import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Package } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .from('wishlist')
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
    // Optimistic remove from UI
    setItems(prev => prev.filter(i => i.listing_id !== listingId));
    try {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id).eq('listing_id', listingId);
      if (error) {
        console.error('Failed to remove wishlist item:', error);
        // Rollback — reload the wishlist
        loadWishlist(user.id);
      }
    } catch (err) {
      console.error('Failed to remove wishlist item:', err);
      loadWishlist(user.id);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[var(--seasonal-primary,#ff385c)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Saved Items</h1>
        <p className="text-zinc-500 mb-8">Sign in to save your favorite items.</p>
        <Link to="/login" className="bg-[var(--seasonal-primary,#ff385c)] text-white font-bold px-8 py-3 rounded-xl inline-block">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Heart className="w-6 h-6 text-[var(--seasonal-primary,#ff385c)]" /> Saved Items
        </h1>
        <span className="text-sm text-zinc-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-zinc-500 mb-6">Start saving items you love!</p>
          <Link to="/" className="bg-[var(--seasonal-primary,#ff385c)] text-white font-bold px-8 py-3 rounded-xl inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => {
            const listing = item.listings;
            if (!listing) return null;
            return (
              <div key={item.id} className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <Link to={`/listing/${listing.id}`}>
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-zinc-400" /></div>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(listing.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-zinc-800/90 rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <div className="p-3">
                  <Link to={`/listing/${listing.id}`}>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{listing.title}</h3>
                  </Link>
                  <p className="text-[var(--seasonal-primary,#ff385c)] font-bold text-sm mt-1">{formatKES(listing.price)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
