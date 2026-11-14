import type { FulfillmentType, OrderStatus } from '../types/restaurant.ts';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const GALLERY_CATEGORIES = [
  'Nigerian Meals',
  'Restaurant Interior',
  'Food Preparation',
  'Grilled Dishes',
  'Drinks',
  'Special Presentations',
] as const;

export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₦${safe.toLocaleString('en-NG')}`;
}

export interface CartCalculationInputItem {
  price_ngn: number;
  quantity: number;
}

export interface CartCalculationResult {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  qualifiesForFreeDelivery: boolean;
  amountToFreeDelivery: number;
}

export function calculateCartTotals(
  items: CartCalculationInputItem[],
  fulfillmentType: FulfillmentType,
  baseDeliveryFee: number,
  freeDeliveryThreshold: number
): CartCalculationResult {
  let itemCount = 0;
  let subtotal = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const price = Math.max(0, Number(item.price_ngn) || 0);
    if (qty > 0) {
      itemCount += qty;
      subtotal += price * qty;
    }
  }

  const safeBaseFee = Math.max(0, Number(baseDeliveryFee) || 0);
  const safeThreshold = Math.max(0, Number(freeDeliveryThreshold) || 0);

  if (fulfillmentType === 'pickup' || subtotal === 0) {
    return {
      itemCount,
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      qualifiesForFreeDelivery: fulfillmentType === 'pickup' || (safeThreshold > 0 && subtotal >= safeThreshold),
      amountToFreeDelivery: fulfillmentType === 'pickup' ? 0 : Math.max(0, safeThreshold - subtotal),
    };
  }

  const qualifiesForFreeDelivery = safeThreshold > 0 && subtotal >= safeThreshold;
  const deliveryFee = qualifiesForFreeDelivery ? 0 : safeBaseFee;
  const amountToFreeDelivery = qualifiesForFreeDelivery ? 0 : Math.max(0, safeThreshold - subtotal);

  return {
    itemCount,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    qualifiesForFreeDelivery,
    amountToFreeDelivery,
  };
}

export interface OrderValidationInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string;
  items: Array<{ productId: number; quantity: number }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateOrderInput(input: OrderValidationInput): ValidationResult {
  const errors: Record<string, string> = {};
  const name = (input.customerName || '').trim();
  const phone = (input.customerPhone || '').trim();
  const email = (input.customerEmail || '').trim();
  const address = (input.deliveryAddress || '').trim();

  if (name.length < 2) {
    errors.customerName = 'Please enter your full name (at least 2 characters).';
  }

  const normalizedPhone = phone.replace(/[\s()-]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
    errors.customerPhone = 'Please enter a valid Nigerian or international phone number (10–15 digits).';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.customerEmail = 'Please enter a valid email address.';
  }

  if (input.fulfillmentType !== 'delivery' && input.fulfillmentType !== 'pickup') {
    errors.fulfillmentType = 'Select either Delivery or Pickup.';
  }

  if (input.fulfillmentType === 'delivery' && address.length < 6) {
    errors.deliveryAddress = 'Please provide a complete delivery street address and landmark.';
  }

  const validItems = Array.isArray(input.items)
    ? input.items.filter((i) => Number.isInteger(i.productId) && i.productId > 0 && Number.isInteger(i.quantity) && i.quantity > 0)
    : [];

  if (validItems.length === 0) {
    errors.items = 'Your cart is empty. Add at least one dish before placing an order.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface ReviewValidationInput {
  customerName: string;
  rating: number;
  comment: string;
}

export function validateReviewInput(input: ReviewValidationInput): ValidationResult {
  const errors: Record<string, string> = {};
  const name = (input.customerName || '').trim();
  const comment = (input.comment || '').trim();
  const rating = Number(input.rating);

  if (name.length < 2 || name.length > 80) {
    errors.customerName = 'Please enter your name (2–80 characters).';
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Please select a star rating from 1 to 5.';
  }
  if (comment.length < 10 || comment.length > 800) {
    errors.comment = 'Please write a review between 10 and 800 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface ContactValidationInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export function validateContactInput(input: ContactValidationInput): ValidationResult {
  const errors: Record<string, string> = {};
  const name = (input.name || '').trim();
  const email = (input.email || '').trim();
  const message = (input.message || '').trim();

  if (name.length < 2) {
    errors.name = 'Please enter your name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (message.length < 10) {
    errors.message = 'Please enter a message of at least 10 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isValidOrderStatus(status: string): status is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(status);
}

export function generateOrderNumber(date = new Date(), randomSuffix?: string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix =
    randomSuffix ||
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TFK-${yyyy}${mm}${dd}-${suffix}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
