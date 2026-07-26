import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { getSellerReviews } from '../utils/api';
import { supabase } from '../utils/supabase';

// ── Star rating display ────────────────────────────────────
function StarRating({ rating, size = 'sm' }) {
  const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const fullStars = Math.floor(rating);
  const fraction = rating - fullStars;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} className={`${starSize} text-amber-400 fill-amber-400`} />
      );
    } else if (i === fullStars && fraction > 0) {
      // Partial fill — use a mask approach via CSS
      stars.push(
        <span key={i} className="relative inline-block">
          <Star className={`${starSize} text-[#353F54]`} />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fraction * 100}%` }}
          >
            <Star className={`${starSize} text-amber-400 fill-amber-400`} />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star key={i} className={`${starSize} text-[#353F54]`} />
      );
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export default function SellerRatingCard({ sellerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOrder, setHasOrder] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const reviews = await getSellerReviews(sellerId);
        if (mounted) {
          setData(reviews);
        }
      } catch (err) {
        console.error('Failed to load seller reviews:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const checkUserOrder = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) setCheckingOrder(false);
          return;
        }

        // First get the current user's orders
        const { data: userOrders, error: orderErr } = await supabase
          .from('omix_orders')
          .select('id')
          .eq('user_id', session.user.id);

        if (orderErr) {
          console.warn('Failed to fetch user orders:', orderErr.message);
          if (mounted) setCheckingOrder(false);
          return;
        }

        if (userOrders && userOrders.length > 0) {
          const orderIds = userOrders.map((o) => o.id);
          // Then check if any of those orders have items from this seller
          const { data: items, error: itemsErr } = await supabase
            .from('omix_order_items')
            .select('id')
            .in('order_id', orderIds)
            .eq('seller_id', sellerId)
            .limit(1);

          if (!itemsErr && items && items.length > 0) {
            if (mounted) setHasOrder(true);
          }
        }
      } catch (err) {
        console.warn('Failed to check orders:', err.message);
      } finally {
        if (mounted) setCheckingOrder(false);
      }
    };

    fetchData();
    checkUserOrder();

    return () => { mounted = false; };
  }, [sellerId]);

  if (loading) {
    return (
      <div className="bg-[#1E2A3D] border border-[#353F54] rounded-2xl p-5 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#8E9BB5]" />
        <span className="text-sm text-[#8E9BB5]">Loading reviews…</span>
      </div>
    );
  }

  const averageRating = data?.average_rating ?? 0;
  const totalReviews = data?.total_reviews ?? 0;

  return (
    <div className="bg-[#1E2A3D] border border-[#353F54] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          Seller Rating
        </h3>
        {totalReviews > 0 && (
          <span className="text-xs text-[#8E9BB5] bg-[#08080a] px-2 py-1 rounded-full">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {totalReviews > 0 ? (
        <div className="flex items-center gap-4 mb-4">
          {/* Big rating number */}
          <div className="text-center">
            <p className="text-3xl font-black text-white">
              {averageRating.toFixed(1)}
            </p>
            <StarRating rating={averageRating} size="lg" />
          </div>

          {/* Review distribution placeholder */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data?.distribution?.[star] ?? 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-[#8E9BB5] w-3 text-right">{star}</span>
                  <Star className="w-3 h-3 text-amber-400" />
                  <div className="flex-1 h-1.5 bg-[#08080a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[#8E9BB5] w-6 text-right text-[10px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 mb-3">
          <Star className="w-10 h-10 text-[#353F54] mx-auto mb-2" />
          <p className="text-sm text-[#8E9BB5]">No reviews yet</p>
          <p className="text-xs text-[#8E9BB5]/60 mt-0.5">
            Be the first to leave a review!
          </p>
        </div>
      )}

      {/* Rate this seller button */}
      {hasOrder && (
        <button
          onClick={() => {
            // Navigate to rate page or open a rating modal
            window.location.href = `/rate-seller/${sellerId}`;
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#353F54] text-sm font-bold text-white hover:bg-[#4A5678] transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          Rate this seller
        </button>
      )}
    </div>
  );
}
