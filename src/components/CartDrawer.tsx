import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { calculateCartTotals, formatNaira } from '../utils/restaurantLogic.ts';
import { ResilientImage } from './ResilientImage.tsx';

export function CartDrawer() {
  const navigate = useNavigate();
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, settings } = useRestaurant();

  if (!cartOpen) return null;

  const totals = calculateCartTotals(
    cart.map((c) => ({ price_ngn: c.product.price_ngn, quantity: c.quantity })),
    'delivery',
    settings?.delivery_fee_ngn ?? 2500,
    settings?.free_delivery_threshold_ngn ?? 30000
  );

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/order');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Your order cart">
      <div
        className="fixed inset-0 bg-black/45 transition-opacity"
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-[#FAF8F4] h-full flex flex-col border-l border-[#E8E1D3] shadow-2xl">
        <div className="px-6 py-5 border-b border-[#E8E1D3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#15422D]" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold text-[#133827]">Your Order</h2>
            <span className="text-sm text-[#5A665F] tabular-nums">· {totals.itemCount} items</span>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close order cart"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#3D4A42] hover:bg-[#F3EFE6] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EFECE4] text-[#15422D] mx-auto flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold text-[#133827]">Your cart is empty</p>
                <p className="text-sm text-[#5A665F]">
                  Explore our Nigerian rice dishes, soups, grilled suya, and fresh drinks to start an order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/menu');
                }}
                className="px-5 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3.5 p-3.5 bg-white rounded-xl border border-[#E8E1D3]"
              >
                <ResilientImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-sans text-sm font-semibold text-[#17201B] leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="text-[#6B7280] hover:text-[#991B1B] p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#5A665F] mt-0.5 font-mono tabular-nums">
                    {formatNaira(product.price_ngn)} each
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#DCD4C4] rounded-lg bg-[#FAF8F4]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        aria-label={`Decrease quantity of ${product.name}`}
                        className="w-8 h-8 inline-flex items-center justify-center text-[#133827] hover:bg-[#EFECE4] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-mono tabular-nums font-medium text-[#17201B]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        aria-label={`Increase quantity of ${product.name}`}
                        className="w-8 h-8 inline-flex items-center justify-center text-[#133827] hover:bg-[#EFECE4] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-mono tabular-nums font-semibold text-[#133827]">
                      {formatNaira(product.price_ngn * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E8E1D3] bg-white space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5A665F]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#17201B]">{formatNaira(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#5A665F]">
                <span>Estimated Delivery</span>
                <span className="font-mono tabular-nums text-[#17201B]">
                  {totals.qualifiesForFreeDelivery ? 'Free' : formatNaira(totals.deliveryFee)}
                </span>
              </div>
              {!totals.qualifiesForFreeDelivery && totals.amountToFreeDelivery > 0 && (
                <p className="text-xs text-[#9F742B]">
                  Add {formatNaira(totals.amountToFreeDelivery)} more for free delivery.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3 px-5 bg-[#15422D] hover:bg-[#0E2F20] text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Proceed to Checkout · {formatNaira(totals.subtotal)}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
