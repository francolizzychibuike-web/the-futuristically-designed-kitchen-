import { Plus } from 'lucide-react';
import type { Product } from '../types/restaurant.ts';
import { formatNaira } from '../utils/restaurantLogic.ts';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useRestaurant();

  return (
    <article className="bg-white rounded-xl border border-[#E8E1D3] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3EFE6]">
        <ResilientImage
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs text-[#5A665F] flex flex-wrap items-center gap-1.5 mb-2">
          <span className="font-medium text-[#15422D]">{product.category_name || 'Kitchen Special'}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{product.prep_time_mins} mins</span>
          <span aria-hidden="true">·</span>
          <span className={product.is_available ? 'text-[#15422D]' : 'text-[#991B1B] font-medium'}>
            {product.is_available ? 'Available' : 'Sold Out'}
          </span>
        </div>

        <h3 className="font-display text-lg font-semibold text-[#17201B] leading-snug mb-2">
          {product.name}
        </h3>

        <p className="text-sm text-[#4D5A52] leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="mt-5 pt-4 border-t border-[#F0ECE3] flex items-center justify-between gap-3">
          <div>
            <span className="font-mono tabular-nums text-base font-semibold text-[#133827]">
              {formatNaira(product.price_ngn)}
            </span>
          </div>

          <button
            type="button"
            disabled={!product.is_available}
            onClick={() => addToCart(product, 1)}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#15422D] text-white hover:bg-[#0E2F20]"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{product.is_available ? 'Add to Cart' : 'Unavailable'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
