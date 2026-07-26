import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Send, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { submitSellerReview, getSellerReviews } from '../utils/api';

export default function RateSeller() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUser(session.user);

      // Get seller profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', sellerId)
        .single();
      setSeller(profile || { full_name: 'Seller' });

      // Check for existing review
      const existing = await getSellerReviews(sellerId);
      if (existing?.reviews) {
        const mine = existing.reviews.find(r => r.reviewer_id === session.user.id);
        if (mine) {
          setExistingReview(mine);
          setRating(mine.rating);
          setReview(mine.review || '');
        }
      }

      setLoading(false);
    };
    init();
  }, [sellerId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setError('');

    const result = await submitSellerReview({
      seller_id: sellerId,
      rating,
      review,
    });

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#71717a]" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Review Submitted</h1>
          <p className="text-[#8E9BB5] mb-6">
            Thank you for rating this seller. Your feedback helps the community.
          </p>
          <button
            onClick={() => navigate('/account')}
            className="px-6 py-3 bg-[#71717a] text-white rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#8E9BB5] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-[#1E2A3D] rounded-2xl border border-[#353F54] p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Rate this Seller</h1>
          <p className="text-[#8E9BB5] mb-6">{seller?.full_name || 'Seller'}</p>

          {existingReview && (
            <div className="bg-[#28303F] rounded-xl p-4 mb-6 border border-[#353F54]">
              <p className="text-sm text-[#8E9BB5]">
                You already rated this seller. Submitting again will update your review.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-[#8E9BB5] mb-3">Your Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        (hovered || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-600'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-[#8E9BB5] mb-3">
                Write a Review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this seller..."
                rows={4}
                maxLength={1000}
                className="w-full bg-[#08080a] border border-[#353F54] rounded-xl px-4 py-3 text-white text-sm placeholder-[#4A5771] focus:outline-none focus:border-[#71717a] transition-colors resize-none"
              />
              <p className="text-xs text-[#4A5771] mt-1 text-right">{review.length}/1000</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[#71717a] text-white rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
