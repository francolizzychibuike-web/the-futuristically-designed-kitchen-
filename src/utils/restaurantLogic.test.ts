import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNaira,
  calculateCartTotals,
  validateOrderInput,
  validateReviewInput,
  validateContactInput,
  isValidOrderStatus,
  generateOrderNumber,
  slugify,
} from './restaurantLogic';

test('formatNaira formats Nigerian Naira amounts cleanly', () => {
  assert.equal(formatNaira(4500), '₦4,500');
  assert.equal(formatNaira(0), '₦0');
  assert.equal(formatNaira(12500.6), '₦12,501');
});

test('calculateCartTotals handles delivery fee, free delivery threshold, and pickup', () => {
  const belowThreshold = calculateCartTotals(
    [
      { price_ngn: 4500, quantity: 2 },
      { price_ngn: 2000, quantity: 1 },
    ],
    'delivery',
    2500,
    25000
  );
  assert.equal(belowThreshold.itemCount, 3);
  assert.equal(belowThreshold.subtotal, 11000);
  assert.equal(belowThreshold.deliveryFee, 2500);
  assert.equal(belowThreshold.total, 13500);
  assert.equal(belowThreshold.qualifiesForFreeDelivery, false);
  assert.equal(belowThreshold.amountToFreeDelivery, 14000);

  const aboveThreshold = calculateCartTotals(
    [{ price_ngn: 15000, quantity: 2 }],
    'delivery',
    2500,
    25000
  );
  assert.equal(aboveThreshold.deliveryFee, 0);
  assert.equal(aboveThreshold.total, 30000);
  assert.equal(aboveThreshold.qualifiesForFreeDelivery, true);

  const pickup = calculateCartTotals(
    [{ price_ngn: 4500, quantity: 1 }],
    'pickup',
    2500,
    25000
  );
  assert.equal(pickup.deliveryFee, 0);
  assert.equal(pickup.total, 4500);
});

test('validateOrderInput enforces required fields and phone format', () => {
  const invalid = validateOrderInput({
    customerName: 'A',
    customerPhone: '123',
    fulfillmentType: 'delivery',
    deliveryAddress: 'No 1',
    items: [],
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.customerPhone);
  assert.ok(invalid.errors.deliveryAddress);
  assert.ok(invalid.errors.items);

  const validPickup = validateOrderInput({
    customerName: 'Chidi Okafor',
    customerPhone: '+234 803 123 4567',
    customerEmail: 'chidi@example.com',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
    items: [{ productId: 1, quantity: 2 }],
  });
  assert.equal(validPickup.valid, true);
});

test('validateReviewInput checks name, 1-5 rating, and comment length', () => {
  const bad = validateReviewInput({ customerName: 'B', rating: 6, comment: 'Too short' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.customerName);
  assert.ok(bad.errors.rating);
  assert.ok(bad.errors.comment);

  const good = validateReviewInput({
    customerName: 'Amaka Nwosu',
    rating: 5,
    comment: 'Best smoky party jollof and suya in Lekki, arrived piping hot!',
  });
  assert.equal(good.valid, true);
});

test('validateContactInput validates email and message', () => {
  const bad = validateContactInput({ name: '', email: 'not-email', message: 'hi' });
  assert.equal(bad.valid, false);
  const good = validateContactInput({
    name: 'Tunde Bakare',
    email: 'tunde@example.com',
    message: 'Do you cater for corporate lunches of 40 guests on Fridays?',
  });
  assert.equal(good.valid, true);
});

test('isValidOrderStatus and generateOrderNumber work deterministically', () => {
  assert.equal(isValidOrderStatus('Preparing'), true);
  assert.equal(isValidOrderStatus('Ready for Pickup'), true);
  assert.equal(isValidOrderStatus('Shipped'), false);
  assert.equal(generateOrderNumber(new Date('2026-11-14T12:00:00Z'), 'A7K2'), 'TFK-20261114-A7K2');
  assert.equal(slugify('Smoky Party Jollof & Chicken'), 'smoky-party-jollof-chicken');
});
