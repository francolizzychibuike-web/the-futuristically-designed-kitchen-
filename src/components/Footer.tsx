import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';

export function Footer() {
  const { settings } = useRestaurant();

  return (
    <footer className="bg-[#0F2D1F] text-[#F3EFE6] border-t border-[#1D4A35]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-3">
            <Link to="/" className="font-display text-2xl font-bold text-white block">
              {settings?.business_name || 'THE FUTURE KITCHEN'}
            </Link>
            <p className="text-xs tracking-wider text-[#D9B675] font-medium">
              {settings?.tagline || 'FRESH FOOD. AMAZING FLAVOUR. UNFORGETTABLE MOMENTS.'}
            </p>
            <p className="text-sm text-[#C7D4CD] leading-relaxed">
              Authentic Nigerian hospitality blending heirloom recipes, charcoal grill craft, and thoughtful modern service.
            </p>
          </div>

          <div>
            <h3 className="font-sans text-sm font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2.5 text-sm text-[#C7D4CD]">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/menu" className="hover:text-white transition-colors">Food Menu</Link></li>
              <li><Link to="/order" className="hover:text-white transition-colors">Online Ordering</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Photo Gallery</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition-colors">Customer Reviews</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/admin" className="hover:text-[#D9B675] transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-sm font-semibold text-white mb-4">Opening Hours</h3>
            <ul className="space-y-2.5 text-sm text-[#C7D4CD]">
              {(settings?.opening_hours || [
                { days: 'Monday – Thursday', hours: '10:00 AM – 10:00 PM' },
                { days: 'Friday – Saturday', hours: '10:00 AM – 11:30 PM' },
                { days: 'Sunday', hours: '12:00 PM – 10:00 PM' },
              ]).map((row) => (
                <li key={row.days} className="flex flex-col">
                  <span className="text-white font-medium">{row.days}</span>
                  <span className="font-mono text-xs text-[#C7D4CD] tabular-nums">{row.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-sans text-sm font-semibold text-white mb-4">Visit & Contact</h3>
            <div className="flex items-start gap-2.5 text-sm text-[#C7D4CD]">
              <MapPin className="w-4 h-4 text-[#D9B675] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{settings?.address || '14 Adeola Odeku Way, Victoria Island, Lagos'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[#C7D4CD]">
              <Phone className="w-4 h-4 text-[#D9B675] shrink-0" aria-hidden="true" />
              <a href={`tel:${settings?.phone || '+2348005550199'}`} className="hover:text-white font-mono tabular-nums">
                {settings?.phone || '+234 800 555 0199'}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[#C7D4CD]">
              <Mail className="w-4 h-4 text-[#D9B675] shrink-0" aria-hidden="true" />
              <a href={`mailto:${settings?.email || 'hello@thefuturekitchen.ng'}`} className="hover:text-white">
                {settings?.email || 'hello@thefuturekitchen.ng'}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1D4A35] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A9BCB2]">
          <p>© {new Date().getFullYear()} {settings?.business_name || 'THE FUTURE KITCHEN'}. All rights reserved.</p>
          <p>Sample menu prices displayed in Nigerian Naira (₦).</p>
        </div>
      </div>
    </footer>
  );
}
