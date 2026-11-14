import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ResilientImage } from '../components/ResilientImage.tsx';

export function AboutPage() {
  return (
    <div>
      <section className="bg-[#0F2D1F] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold tracking-wider text-[#D9B675]">Our Story</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
              Honouring Nigerian Culinary Craft for Today’s Table
            </h1>
            <p className="text-base text-[#D7E2DC] leading-relaxed">
              The Future Kitchen was founded on a straightforward belief: Nigerian cuisine deserves both soulful authenticity and disciplined modern hospitality—whether you are seated in our dining room or unboxing a warm meal at home.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[#24523C]">
              <ResilientImage
                src="/assets/images/restaurant_dining_interior_1794680377605.jpg"
                alt="Inside The Future Kitchen dining room with forest green banquettes and warm brass lighting"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E1D3]">
            <ResilientImage
              src="/assets/images/chef_kitchen_prep_1794680378657.jpg"
              alt="Chef plating smoky Jollof rice and grilled skewers at The Future Kitchen"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-3xl font-bold text-[#133827]">Who We Are & Our Story</h2>
            <p className="text-base text-[#3D4A42] leading-relaxed">
              Born from family recipes passed across generations in Lagos and Abuja, our kitchen pairs time-honoured preparation—firewood-smoked pepper reductions, hand-pounded spice blends, and slow-braised meats—with clean culinary precision and attentive service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
              <h3 className="font-display text-xl font-semibold text-[#133827]">Food Philosophy</h3>
              <p className="text-sm text-[#4D5A52] leading-relaxed">
                Zero artificial shortcuts. Every soup base, suya yaji spice blend, and hibiscus zobo batch is brewed from whole ingredients in our kitchen daily.
              </p>
            </div>
            <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
              <h3 className="font-display text-xl font-semibold text-[#133827]">Commitment to Quality</h3>
              <p className="text-sm text-[#4D5A52] leading-relaxed">
                Strict kitchen hygiene, temperature-safe packaging for deliveries, and consistent portion weights on every plate.
              </p>
            </div>
            <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
              <h3 className="font-display text-xl font-semibold text-[#133827]">Hospitality Values</h3>
              <p className="text-sm text-[#4D5A52] leading-relaxed">
                Warm, unhurried care—from accommodating spice preferences to transparent order tracking from stove to table.
              </p>
            </div>
            <div className="space-y-2 border-t border-[#DCD4C4] pt-4">
              <h3 className="font-display text-xl font-semibold text-[#133827]">Community & Catering</h3>
              <p className="text-sm text-[#4D5A52] leading-relaxed">
                Whether a quiet dinner for two or corporate lunch trays for fifty, every guest receives the same care.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20]"
            >
              <span>Explore Our Menu</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border border-[#DCD4C4] text-[#133827] rounded-lg hover:bg-[#F3EFE6]"
            >
              <span>Book Catering or Contact Us</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
