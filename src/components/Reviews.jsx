import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';

// ── Star Rating Component ──────────────────────────────────────
export function StarRating({ rating = 0, size = 'md', interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const cls = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}
        >
          <Star
            className={`${cls} ${
              (hovered || rating) >= star
                ? 'text-amber-400 fill-amber-400'
                : 'text-zinc-300 dark:text-zinc-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review List ────────────────────────────────────────────────
export function ReviewList({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  const loadReviews = async () => {
    try {
      const { data } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayed = showAll ? reviews : reviews.slice(0, 3);

  if (loading) return <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />;

  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Reviews</h3>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(avgRating)} size="sm" />
          <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-zinc-500">({reviews.length})</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayed.map(review => (
          <div key={review.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--seasonal-primary,#1a5632)]/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[var(--seasonal-primary,#1a5632)]">
                    {(review.user_name || 'A')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-bold">{review.user_name || 'Anonymous'}</span>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
            {review.review && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{review.review}</p>
            )}
            <p className="text-xs text-zinc-400 mt-2">
              {review.created_at
                ? new Date(review.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently'}
            </p>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex items-center gap-1 text-sm font-bold text-[var(--seasonal-primary,#1a5632)] hover:underline mx-auto"
        >
          {showAll ? 'Show less' : `View all ${reviews.length} reviews`}
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

// ── Review Form ────────────────────────────────────────────────
export function ReviewForm({ listingId, onSubmitted }) {
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('product_reviews').insert({
        listing_id: listingId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        rating,
        review: review.trim() || null,
      });
      if (err) throw err;
      setSuccess(true);
      setRating(0);
      setReview('');
      onSubmitted?.();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
        Review submitted! Thank you.
        <button onClick={() => setSuccess(false)} className="ml-2 underline">Write another</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <h4 className="text-sm font-bold mb-3">Write a Review</h4>
      <div className="mb-3">
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm resize-none h-24 focus:outline-none focus:border-[var(--seasonal-primary,#1a5632)]"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="mt-3 px-6 py-2.5 bg-[var(--seasonal-primary,#1a5632)] text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[var(--seasonal-secondary,#14472a)] transition-all"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
