import React, { useEffect, useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import type { Review } from '../types/restaurant.ts';
import { validateReviewInput } from '../utils/restaurantLogic.ts';
import { useRestaurant } from '../context/RestaurantContext.tsx';

export function ReviewsPage() {
  const { notify } = useRestaurant();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  const loadReviews = () => {
    setLoading(true);
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setAvgRating(data.averageRating || 0);
          setTotalReviews(data.totalReviews || 0);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage('');

    const validation = validateReviewInput({ customerName, rating, comment });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        notify(data.error || 'Could not submit review.', 'error');
        return;
      }

      setCustomerName('');
      setRating(5);
      setComment('');
      setSubmittedMessage(
        data.message || 'Thank you! Your review has been received and awaits administrator approval.'
      );
      notify('Review submitted for moderation!', 'success');
    } catch {
      notify('Network error submitting review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3 mb-12">
        <p className="text-xs font-semibold tracking-wider text-[#9F742B]">
          Customer Reviews · {avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : 'Guest Stories'} ({totalReviews}{' '}
          approved)
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#133827]">
          What Our Guests Say
        </h1>
        <p className="text-base text-[#4D5A52]">
          Read verified dining experiences and share your feedback on our meals, service, and delivery speed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Approved Reviews List */}
        <div className="lg:col-span-7 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-36 bg-white rounded-xl border border-[#E8E1D3] animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E1D3] p-10 text-center">
              <p className="font-display text-xl font-semibold text-[#133827]">No approved reviews yet</p>
              <p className="text-sm text-[#5A665F] mt-1">Be the first guest to share your dining experience.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-sans text-base font-semibold text-[#133827]">
                      {review.customer_name}
                    </h2>
                    <p className="text-xs text-[#5A665F] tabular-nums">
                      {new Date(review.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-[#B88A3B] text-[#B88A3B]' : 'text-[#DCD4C4]'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#3D4A42] leading-relaxed">{review.comment}</p>
              </article>
            ))
          )}
        </div>

        {/* Review Submission Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-5 bg-white rounded-xl border border-[#E8E1D3] p-6 sm:p-7 space-y-5"
        >
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-[#133827]">Share Your Feedback</h2>
            <p className="text-xs text-[#5A665F]">
              Submitted reviews appear on the site once approved by our restaurant team.
            </p>
          </div>

          {submittedMessage && (
            <div className="p-4 rounded-lg bg-[#E8F3EC] border border-[#C6DFCF] text-sm text-[#133827] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#15422D]" aria-hidden="true" />
              <span>{submittedMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="review-name" className="block text-sm font-medium text-[#17201B]">
              Your Name *
            </label>
            <input
              id="review-name"
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Folake Adeyemi"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
            />
            {errors.customerName && <p className="text-xs text-[#991B1B]">{errors.customerName}</p>}
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-[#17201B]">Rating (1 to 5 Stars) *</span>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                  onClick={() => setRating(star)}
                  className="p-1.5 rounded-md hover:bg-[#FAF8F4] cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= rating ? 'fill-[#B88A3B] text-[#B88A3B]' : 'text-[#DCD4C4]'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono text-[#5A665F] ml-1">{rating}/5</span>
            </div>
            {errors.rating && <p className="text-xs text-[#991B1B]">{errors.rating}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="block text-sm font-medium text-[#17201B]">
              Your Review *
            </label>
            <textarea
              id="review-comment"
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your favourite dish, hospitality, or delivery..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
            />
            {errors.comment && <p className="text-xs text-[#991B1B]">{errors.comment}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-5 text-sm font-semibold bg-[#15422D] hover:bg-[#0E2F20] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
