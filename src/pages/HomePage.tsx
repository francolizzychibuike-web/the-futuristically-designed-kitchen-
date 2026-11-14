import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone, Star } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import type { Review } from '../types/restaurant.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';

export function HomePage() {
  const { settings, products, loadingMenu } = useRestaurant();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(4.9);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.reviews) {
          setReviews(data.reviews.slice(0, 3));
          if (data.averageRating) setAvgRating(data.averageRating);
        }
      })
      .catch(() => {});
  }, []);

  const featuredDishes = products.filter((p) => p.is_available && p.is_featured).slice(0, 6);

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="relative bg-[#0F2D1F] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#D9B675]">
                {settings?.tagline || 'FRESH FOOD. AMAZING FLAVOUR. UNFORGETTABLE MOMENTS.'}
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-white">
                {settings?.hero_title || 'Good Food. Great Moments.'}
              </h1>

              <p className="text-base sm:text-lg text-[#D7E2DC] leading-relaxed max-w-xl">
                {settings?.hero_subtitle ||
                  'Welcome to The Future Kitchen — where heirloom Nigerian recipes, open-flame charcoal grilling, and fresh market ingredients come together for dine-in and doorstep delivery.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/order"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold bg-[#B88A3B] hover:bg-[#9F742B] text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border border-[#426B56] text-white hover:bg-[#15422D] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Menu</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[300px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-[#24523C] shadow-2xl">
                <ResilientImage
                  src="/assets/images/hero_jollof_feast_1794680375338.jpg"
                  alt="Signature Party Jollof Rice with grilled chicken, fried plantain, and fresh herbs at The Future Kitchen"
                  className="w-full h-full lg:h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs text-[#E8D09B] font-medium">Chef's Table Feature</p>
                    <p className="font-display text-xl font-semibold">Smoky Party Jollof & Char-Grilled Chicken</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#9F742B]">
              Curated Kitchen Selection · Sample Prices in ₦
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#133827]">
              Featured Nigerian Dishes
            </h2>
            <p className="text-sm sm:text-base text-[#4D5A52]">
              Prepared fresh to order using stone-ground spices, palm-ripened produce, and open-coal searing.
            </p>
          </div>

          <Link
            to="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15422D] hover:text-[#0E2F20] whitespace-nowrap shrink-0"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {loadingMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-white rounded-xl border border-[#E8E1D3] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredDishes.map((dish) => (
              <ProductCard key={dish.id} product={dish} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Why Choose Us & Opening Hours */}
      <section className="bg-[#F3EFE6] border-y border-[#E8E1D3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-[#9F742B]">Why Choose Us</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#133827]">
                  Crafted for Taste, Consistency, and Warmth
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
                  <p className="font-mono text-xs text-[#9F742B] font-semibold">01.</p>
                  <h3 className="font-display text-xl font-semibold text-[#133827]">Market-Fresh Ingredients</h3>
                  <p className="text-sm text-[#4D5A52] leading-relaxed">
                    Every pepper mix, melon seed batch, and herb infusion is sourced daily from trusted local growers.
                  </p>
                </div>

                <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
                  <p className="font-mono text-xs text-[#9F742B] font-semibold">02.</p>
                  <h3 className="font-display text-xl font-semibold text-[#133827]">Open-Flame Grill Craft</h3>
                  <p className="text-sm text-[#4D5A52] leading-relaxed">
                    Our suya, croaker fish, and smoky jollof base develop deep natural char and aromatic richness.
                  </p>
                </div>

                <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
                  <p className="font-mono text-xs text-[#9F742B] font-semibold">03.</p>
                  <h3 className="font-display text-xl font-semibold text-[#133827]">Prompt Dispatch & Tracking</h3>
                  <p className="text-sm text-[#4D5A52] leading-relaxed">
                    Track every online order in real time from kitchen confirmation to pickup or doorstep delivery.
                  </p>
                </div>

                <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
                  <p className="font-mono text-xs text-[#9F742B] font-semibold">04.</p>
                  <h3 className="font-display text-xl font-semibold text-[#133827]">Serene Dining Experience</h3>
                  <p className="text-sm text-[#4D5A52] leading-relaxed">
                    Designed for family celebrations, executive lunches, and memorable weekend evenings.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E1D3] p-7 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-bold text-[#133827]">Opening Hours & Visit</h3>
                <p className="text-sm text-[#5A665F]">Dine in, pick up, or order directly online.</p>
              </div>

              <div className="space-y-3 border-y border-[#F0ECE3] py-5">
                {(settings?.opening_hours || [
                  { days: 'Monday – Thursday', hours: '10:00 AM – 10:00 PM' },
                  { days: 'Friday – Saturday', hours: '10:00 AM – 11:30 PM' },
                  { days: 'Sunday', hours: '12:00 PM – 10:00 PM' },
                ]).map((row) => (
                  <div key={row.days} className="flex items-center justify-between text-sm gap-4">
                    <span className="flex items-center gap-2 font-medium text-[#17201B]">
                      <Clock className="w-4 h-4 text-[#15422D]" aria-hidden="true" />
                      {row.days}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-[#4D5A52]">{row.hours}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm text-[#3D4A42]">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#15422D] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{settings?.address || '14 Adeola Odeku Way, Victoria Island (Sample Address)'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#15422D] shrink-0" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{settings?.phone || '+234 800 555 0199'}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="px-4 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] transition-colors"
                >
                  Directions & Contact
                </Link>
                <Link
                  to="/gallery"
                  className="px-4 py-2.5 text-sm font-semibold border border-[#DCD4C4] text-[#133827] rounded-lg hover:bg-[#FAF8F4] transition-colors"
                >
                  View Gallery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-[#9F742B]">
              Guest Feedback · {avgRating.toFixed(1)} / 5.0 Average Rating
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#133827]">
              Loved by Our Guests
            </h2>
          </div>

          <Link
            to="/reviews"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15422D] hover:text-[#0E2F20] whitespace-nowrap shrink-0"
          >
            <span>Read & Write Reviews</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {reviews.map((review) => (
            <article key={review.id} className="bg-white rounded-xl border border-[#E8E1D3] p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#B88A3B]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'fill-[#B88A3B] text-[#B88A3B]' : 'text-[#DCD4C4]'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#3D4A42] leading-relaxed">“{review.comment}”</p>
              </div>
              <div className="pt-3 border-t border-[#F0ECE3] text-xs text-[#5A665F]">
                <span className="font-semibold text-[#133827]">{review.customer_name}</span>
                <span aria-hidden="true"> · </span>
                <span>Verified Diner</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
