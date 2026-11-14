import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';

export function MenuPage() {
  const { categories, products, loadingMenu } = useRestaurant();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUnavailable, setShowUnavailable] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!showUnavailable && !p.is_available) return false;
      if (activeCategory !== 'all' && p.category_name !== activeCategory) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !(p.category_name || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [products, activeCategory, searchQuery, showUnavailable]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3 mb-10">
        <p className="text-xs font-semibold tracking-wider text-[#9F742B]">
          Kitchen Menu · Sample Restaurant Prices in Nigerian Naira (₦)
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#133827]">
          Authentic Nigerian Flavours
        </h1>
        <p className="text-base text-[#4D5A52]">
          Browse our seven kitchen categories, from smoky Party Jollof and slow-simmered soups to open-coal suya, small chops, and chilled house drinks.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-[#E8E1D3] p-4 sm:p-5 mb-10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="menu-search" className="sr-only">
              Search dishes
            </label>
            <Search
              className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="menu-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jollof, egusi, suya, shawarma..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg text-[#17201B] placeholder:text-[#6B7280] focus:outline-none focus:border-[#15422D]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[#3D4A42] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUnavailable}
              onChange={(e) => setShowUnavailable(e.target.checked)}
              className="w-4 h-4 accent-[#15422D] rounded"
            />
            <span>Show sold-out dishes</span>
          </label>
        </div>

        <div
          role="tablist"
          aria-label="Food categories"
          className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F0ECE3]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#15422D] text-white'
                : 'bg-[#FAF8F4] text-[#3D4A42] hover:bg-[#EFECE4]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeCategory === cat.name
                  ? 'bg-[#15422D] text-white'
                  : 'bg-[#FAF8F4] text-[#3D4A42] hover:bg-[#EFECE4]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loadingMenu ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 bg-white rounded-xl border border-[#E8E1D3] animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-12 text-center space-y-3">
          <p className="font-display text-xl font-semibold text-[#133827]">No matching dishes found</p>
          <p className="text-sm text-[#5A665F]">Try clearing your search or selecting All Categories.</p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProducts.map((dish) => (
            <ProductCard key={dish.id} product={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
