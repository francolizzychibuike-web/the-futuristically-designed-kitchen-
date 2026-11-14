import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';

export function Navbar() {
  const { cartCount, setCartOpen } = useRestaurant();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
      isActive
        ? 'text-[#133827] border-[#B88A3B]'
        : 'text-[#3D4A42] border-transparent hover:text-[#133827] hover:border-[#D7CEBC]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E8E1D3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-2 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="font-display text-lg sm:text-2xl font-bold tracking-tight text-[#133827] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15422D]"
        >
          The Future Kitchen
        </Link>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          <NavLink to="/menu" className={navLinkClass}>
            Menu
          </NavLink>
          <NavLink to="/gallery" className={navLinkClass}>
            Gallery
          </NavLink>
          <NavLink to="/reviews" className={navLinkClass}>
            Reviews
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Zone 3: 1 primary action + mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open order cart (${cartCount} items)`}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#15422D] hover:bg-[#0E2F20] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15422D]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Order Online</span>
            <span className="sm:hidden">Order</span>
            {cartCount > 0 && (
              <span className="font-mono tabular-nums text-xs text-[#F5E7C6]">({cartCount})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#DCD4C4] text-[#133827] hover:bg-[#F3EFE6] cursor-pointer shrink-0"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#E8E1D3] bg-[#FAF8F4] px-4 py-4 space-y-1"
        >
          {[
            { to: '/', label: 'Home' },
            { to: '/menu', label: 'Food Menu' },
            { to: '/order', label: 'Online Ordering' },
            { to: '/gallery', label: 'Photo Gallery' },
            { to: '/reviews', label: 'Customer Reviews' },
            { to: '/about', label: 'About Us' },
            { to: '/contact', label: 'Contact Us' },
            { to: '/admin', label: 'Admin Dashboard' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive ? 'bg-[#15422D] text-white' : 'text-[#17201B] hover:bg-[#EFECE4]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
