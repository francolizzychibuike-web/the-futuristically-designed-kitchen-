import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { GalleryItem } from '../types/restaurant.ts';
import { GALLERY_CATEGORIES } from '../utils/restaurantLogic.ts';
import { ResilientImage } from '../components/ResilientImage.tsx';

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/gallery')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === 'all' ? items : items.filter((item) => item.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3 mb-10">
        <p className="text-xs font-semibold tracking-wider text-[#9F742B]">Photo Gallery</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#133827]">
          Inside The Future Kitchen
        </h1>
        <p className="text-base text-[#4D5A52]">
          Explore our Nigerian dishes, open-coal grill station, dining hall atmosphere, house drinks, and special food presentations.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Gallery categories"
        className="flex flex-wrap items-center gap-1.5 mb-10 pb-4 border-b border-[#E8E1D3]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-[#15422D] text-white'
              : 'bg-white border border-[#E8E1D3] text-[#3D4A42] hover:bg-[#EFECE4]'
          }`}
        >
          All Photos
        </button>
        {GALLERY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#15422D] text-white'
                : 'bg-white border border-[#E8E1D3] text-[#3D4A42] hover:bg-[#EFECE4]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="aspect-[4/3] bg-white rounded-xl border border-[#E8E1D3] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-12 text-center">
          <p className="font-display text-xl font-semibold text-[#133827]">No photographs in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedItem(item)}
              aria-label={`View photograph: ${item.title}`}
              className="group text-left bg-white rounded-xl border border-[#E8E1D3] overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#F3EFE6]">
                <ResilientImage
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4 space-y-1">
                <p className="text-xs font-medium text-[#9F742B]">{item.category}</p>
                <h2 className="font-display text-lg font-semibold text-[#133827]">{item.title}</h2>
                {item.caption && <p className="text-xs text-[#4D5A52] line-clamp-2">{item.caption}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E1D3]">
              <div>
                <p className="text-xs text-[#9F742B] font-medium">{selectedItem.category}</p>
                <h3 className="font-display text-xl font-bold text-[#133827]">{selectedItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close photo preview"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-[#F3EFE6] text-[#17201B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black max-h-[70vh] flex items-center justify-center">
              <ResilientImage
                src={selectedItem.image_url}
                alt={selectedItem.title}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            {selectedItem.caption && (
              <div className="px-6 py-4 text-sm text-[#3D4A42] bg-[#FAF8F4]">{selectedItem.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
