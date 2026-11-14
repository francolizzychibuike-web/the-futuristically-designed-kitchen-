import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Minus, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import type { FulfillmentType, Order, PaymentMethod } from '../types/restaurant.ts';
import {
  calculateCartTotals,
  formatNaira,
  validateOrderInput,
} from '../utils/restaurantLogic.ts';
import { ResilientImage } from '../components/ResilientImage.tsx';

export function OrderPage() {
  const { cart, products, settings, addToCart, updateQuantity, removeFromCart, clearCart, notify } =
    useRestaurant();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_on_delivery');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [paystackReferenceInput, setPaystackReferenceInput] = useState('');
  const [verifyingPaystack, setVerifyingPaystack] = useState(false);

  // Order Tracker
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (fulfillmentType === 'pickup' && paymentMethod === 'pay_on_delivery') {
      setPaymentMethod('pay_at_pickup');
    } else if (fulfillmentType === 'delivery' && paymentMethod === 'pay_at_pickup') {
      setPaymentMethod('pay_on_delivery');
    }
  }, [fulfillmentType, paymentMethod]);

  const totals = calculateCartTotals(
    cart.map((c) => ({ price_ngn: c.product.price_ngn, quantity: c.quantity })),
    fulfillmentType,
    settings?.delivery_fee_ngn ?? 2500,
    settings?.free_delivery_threshold_ngn ?? 30000
  );

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const validation = validateOrderInput({
      customerName,
      customerPhone,
      customerEmail,
      fulfillmentType,
      deliveryAddress,
      items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          fulfillmentType,
          deliveryAddress,
          specialInstructions,
          paymentMethod,
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setSubmitError(data.error || 'Could not place your order. Please check your details.');
        return;
      }

      setConfirmedOrder(data.order);
      if (data.paystack?.reference) {
        setPaystackReferenceInput(data.paystack.reference);
      }
      clearCart();
      notify(`Order ${data.order.order_number} confirmed!`, 'success');
    } catch {
      setSubmitError('Network error while submitting your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedOrder || !paystackReferenceInput.trim()) return;
    setVerifyingPaystack(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: confirmedOrder.order_number,
          reference: paystackReferenceInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Paystack payment verification failed.');
        return;
      }
      setConfirmedOrder(data.order);
      notify('Payment verified and order confirmed!', 'success');
    } catch {
      setSubmitError('Unable to reach backend payment verification.');
    } finally {
      setVerifyingPaystack(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackQuery.trim();
    if (!code) return;
    setTrackingLoading(true);
    setTrackError('');
    setTrackedOrder(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackError(data.error || 'Order not found.');
        return;
      }
      setTrackedOrder(data);
    } catch {
      setTrackError('Unable to check order status right now.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-[#9F742B]">Online Food Ordering</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#133827]">
            Place Your Order
          </h1>
          <p className="text-base text-[#4D5A52]">
            Freshly cooked Nigerian dishes for doorstep delivery or restaurant pickup. Every order receives a unique tracking number.
          </p>
        </div>

        {/* Order Status Tracker */}
        <form onSubmit={handleTrackOrder} className="flex items-center gap-2 w-full lg:w-auto">
          <label htmlFor="track-order-input" className="sr-only">
            Track order by order number
          </label>
          <div className="relative flex-1 lg:w-64">
            <Search
              className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="track-order-input"
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="Track Order (e.g. TFK-...)"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#DCD4C4] rounded-lg font-mono focus:outline-none focus:border-[#15422D]"
            />
          </div>
          <button
            type="submit"
            disabled={trackingLoading}
            className="px-4 py-2.5 text-sm font-semibold bg-[#133827] text-white rounded-lg hover:bg-[#0E2F20] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {trackingLoading ? 'Checking...' : 'Track Order'}
          </button>
        </form>
      </div>

      {trackError && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
          {trackError}
        </div>
      )}

      {trackedOrder && (
        <section className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F0ECE3] pb-4">
            <div>
              <p className="text-xs text-[#5A665F]">Tracked Order</p>
              <h2 className="font-mono text-xl font-bold text-[#133827]">{trackedOrder.order_number}</h2>
            </div>
            <div className="text-right text-sm">
              <span className="font-semibold text-[#15422D]">Status: {trackedOrder.status}</span>
              <p className="text-xs text-[#5A665F] font-mono tabular-nums">
                Total: {formatNaira(trackedOrder.total_ngn)} · Payment: {trackedOrder.payment_status}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {trackedOrder.items?.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#FAF8F4] rounded-lg border border-[#ECE6DA]">
                <p className="font-medium text-[#17201B]">{item.product_name}</p>
                <p className="text-xs text-[#5A665F] font-mono tabular-nums">
                  {item.quantity} × {formatNaira(item.unit_price_ngn)} = {formatNaira(item.line_total_ngn)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {confirmedOrder ? (
        <section className="bg-white rounded-2xl border border-[#D4E2D9] p-8 max-w-3xl mx-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F3EC] text-[#15422D] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-[#15422D]">Order Saved Successfully</p>
              <h2 className="font-display text-3xl font-bold text-[#133827]">
                Thank you, {confirmedOrder.customer_name}
              </h2>
              <p className="text-sm text-[#4D5A52]">
                Your unique order number is{' '}
                <strong className="font-mono text-[#133827]">{confirmedOrder.order_number}</strong>. Current status:{' '}
                <strong>{confirmedOrder.status}</strong>.
              </p>
            </div>
          </div>

          <div className="border-t border-b border-[#F0ECE3] py-5 space-y-3">
            {confirmedOrder.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#17201B]">
                  {item.quantity} × {item.product_name}
                </span>
                <span className="font-mono tabular-nums text-[#133827]">{formatNaira(item.line_total_ngn)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-[#F0ECE3] space-y-1 text-sm">
              <div className="flex justify-between text-[#5A665F]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatNaira(confirmedOrder.subtotal_ngn)}</span>
              </div>
              <div className="flex justify-between text-[#5A665F]">
                <span>Delivery Fee ({confirmedOrder.fulfillment_type})</span>
                <span className="font-mono tabular-nums">{formatNaira(confirmedOrder.delivery_fee_ngn)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base text-[#133827] pt-1">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatNaira(confirmedOrder.total_ngn)}</span>
              </div>
            </div>
          </div>

          {confirmedOrder.payment_method === 'paystack' && confirmedOrder.payment_status !== 'paid' && (
            <form onSubmit={handleVerifyPaystack} className="p-5 rounded-xl bg-[#FAF8F4] border border-[#E8E1D3] space-y-3">
              <h3 className="font-display text-lg font-semibold text-[#133827]">
                Verify Paystack Payment
              </h3>
              <p className="text-xs text-[#4D5A52]">
                Complete your Paystack checkout with your transaction reference, then click Verify Payment so the backend confirms settlement with Paystack before marking the order paid.
              </p>
              {submitError && <p className="text-xs text-[#991B1B]">{submitError}</p>}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={paystackReferenceInput}
                  onChange={(e) => setPaystackReferenceInput(e.target.value)}
                  placeholder="Paystack Transaction Reference"
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#DCD4C4] rounded-lg font-mono"
                />
                <button
                  type="submit"
                  disabled={verifyingPaystack}
                  className="px-5 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
                >
                  {verifyingPaystack ? 'Verifying...' : 'Verify Paystack Payment'}
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setTrackQuery(confirmedOrder.order_number);
                setConfirmedOrder(null);
              }}
              className="px-5 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20] cursor-pointer"
            >
              Start Another Order
            </button>
            <Link
              to="/menu"
              className="px-5 py-2.5 text-sm font-semibold border border-[#DCD4C4] text-[#133827] rounded-lg hover:bg-[#FAF8F4]"
            >
              Return to Menu
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Cart & Quick Add */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0ECE3] pb-4">
                <h2 className="font-display text-2xl font-bold text-[#133827]">
                  Your Selected Meals
                </h2>
                <span className="text-sm text-[#5A665F] tabular-nums">{totals.itemCount} items</span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <ShoppingBag className="w-8 h-8 text-[#15422D] mx-auto opacity-60" aria-hidden="true" />
                  <p className="font-display text-lg font-semibold text-[#133827]">Your cart is currently empty</p>
                  <p className="text-sm text-[#5A665F]">
                    Pick dishes from the quick-add list below or browse the full menu.
                  </p>
                  <Link
                    to="/menu"
                    className="inline-block px-5 py-2.5 text-sm font-semibold bg-[#15422D] text-white rounded-lg hover:bg-[#0E2F20]"
                  >
                    Browse Full Menu
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#F0ECE3]">
                  {cart.map(({ product, quantity }) => (
                    <div key={product.id} className="py-4 flex items-center gap-4">
                      <ResilientImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans text-sm font-semibold text-[#17201B] truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-[#5A665F] font-mono tabular-nums">
                          {formatNaira(product.price_ngn)} each
                        </p>
                      </div>
                      <div className="inline-flex items-center border border-[#DCD4C4] rounded-lg bg-[#FAF8F4]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className="w-9 h-9 inline-flex items-center justify-center hover:bg-[#EFECE4] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-mono tabular-nums font-semibold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="w-9 h-9 inline-flex items-center justify-center hover:bg-[#EFECE4] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="w-24 text-right font-mono tabular-nums text-sm font-semibold text-[#133827]">
                        {formatNaira(product.price_ngn * quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="text-[#6B7280] hover:text-[#991B1B] p-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Add Popular Dishes */}
            <section className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-[#133827]">Quick Add Popular Dishes</h2>
                <Link to="/menu" className="text-xs font-semibold text-[#15422D] hover:underline">
                  See all {products.length} dishes
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products
                  .filter((p) => p.is_available)
                  .slice(0, 6)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#FAF8F4] border border-[#ECE6DA]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#17201B] truncate">{p.name}</p>
                        <p className="text-xs font-mono tabular-nums text-[#5A665F]">
                          {formatNaira(p.price_ngn)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(p, 1)}
                        aria-label={`Add ${p.name} to cart`}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#15422D] text-white rounded-md hover:bg-[#0E2F20] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Right: Customer & Delivery Form */}
          <form
            onSubmit={handleSubmitOrder}
            noValidate
            className="lg:col-span-5 bg-white rounded-xl border border-[#E8E1D3] p-6 sm:p-7 space-y-5"
          >
            <h2 className="font-display text-2xl font-bold text-[#133827]">Customer & Delivery Details</h2>

            {submitError && (
              <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
                {submitError}
              </div>
            )}
            {errors.items && (
              <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
                {errors.items}
              </div>
            )}

            {/* Fulfillment Segmented Control */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#3D4A42]">Fulfillment Option</span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF8F4] rounded-lg border border-[#E8E1D3]">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                    fulfillmentType === 'delivery'
                      ? 'bg-[#15422D] text-white'
                      : 'text-[#3D4A42] hover:bg-[#EFECE4]'
                  }`}
                >
                  Doorstep Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                  className={`py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                    fulfillmentType === 'pickup'
                      ? 'bg-[#15422D] text-white'
                      : 'text-[#3D4A42] hover:bg-[#EFECE4]'
                  }`}
                >
                  Restaurant Pickup
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="order-name" className="block text-sm font-medium text-[#17201B]">
                Full Name *
              </label>
              <input
                id="order-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Chinedu Okonkwo"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              />
              {errors.customerName && <p className="text-xs text-[#991B1B]">{errors.customerName}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="order-phone" className="block text-sm font-medium text-[#17201B]">
                Phone Number *
              </label>
              <input
                id="order-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +234 803 123 4567"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg font-mono focus:outline-none focus:border-[#15422D]"
              />
              {errors.customerPhone && <p className="text-xs text-[#991B1B]">{errors.customerPhone}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="order-email" className="block text-sm font-medium text-[#17201B]">
                Email Address (optional)
              </label>
              <input
                id="order-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              />
              {errors.customerEmail && <p className="text-xs text-[#991B1B]">{errors.customerEmail}</p>}
            </div>

            {fulfillmentType === 'delivery' && (
              <div className="space-y-1.5">
                <label htmlFor="order-address" className="block text-sm font-medium text-[#17201B]">
                  Delivery Address & Nearest Landmark *
                </label>
                <textarea
                  id="order-address"
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street number, estate/area, and landmark (e.g. Lekki Phase 1)"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
                />
                {errors.deliveryAddress && <p className="text-xs text-[#991B1B]">{errors.deliveryAddress}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="order-notes" className="block text-sm font-medium text-[#17201B]">
                Special Instructions (optional)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Spice preference, allergies, or gate code..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="payment-method" className="block text-sm font-medium text-[#17201B]">
                Payment Method
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F4] border border-[#DCD4C4] rounded-lg focus:outline-none focus:border-[#15422D]"
              >
                {fulfillmentType === 'delivery' ? (
                  <option value="pay_on_delivery">Pay on Delivery (Cash / POS Transfer)</option>
                ) : (
                  <option value="pay_at_pickup">Pay at Restaurant Pickup</option>
                )}
                {settings?.paystack_enabled && (
                  <option value="paystack">
                    Pay Online with Paystack ({settings.paystack_mode === 'live' ? 'Live' : 'Test Mode'})
                  </option>
                )}
              </select>
              {!settings?.paystack_enabled && (
                <p className="text-xs text-[#5A665F]">
                  Paystack online checkout becomes available once configured by the administrator in Payment Settings.
                </p>
              )}
            </div>

            <div className="border-t border-[#F0ECE3] pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#5A665F]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#17201B]">{formatNaira(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#5A665F]">
                <span>{fulfillmentType === 'pickup' ? 'Pickup Fee' : 'Delivery Fee'}</span>
                <span className="font-mono tabular-nums text-[#17201B]">
                  {totals.deliveryFee === 0 ? 'Free' : formatNaira(totals.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#133827] pt-1">
                <span>Order Total</span>
                <span className="font-mono tabular-nums">{formatNaira(totals.total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 text-sm font-semibold bg-[#15422D] hover:bg-[#0E2F20] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Submitting Order...' : `Submit Order · ${formatNaira(totals.total)}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
