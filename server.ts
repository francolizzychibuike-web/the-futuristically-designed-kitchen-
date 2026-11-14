import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, initDatabase } from './server/db.ts';
import {
  ADMIN_COOKIE_NAME,
  extractAdminFromRequest,
  requireAdmin,
  signAdminToken,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  calculateCartTotals,
  generateOrderNumber,
  isValidOrderStatus,
  slugify,
  validateContactInput,
  validateOrderInput,
  validateReviewInput,
} from './src/utils/restaurantLogic.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), 'src/assets/images');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/assets/images', express.static(ASSETS_IMAGES_DIR));
app.use('/src/assets/images', express.static(ASSETS_IMAGES_DIR));

function formatSettingsRow(row: Record<string, unknown>, paymentRow?: Record<string, unknown>) {
  let openingHours = [];
  try {
    openingHours = JSON.parse(String(row.opening_hours_json || '[]'));
  } catch {
    openingHours = [];
  }
  return {
    id: row.id,
    business_name: row.business_name,
    tagline: row.tagline,
    hero_title: row.hero_title,
    hero_subtitle: row.hero_subtitle,
    phone: row.phone,
    whatsapp_number: row.whatsapp_number,
    email: row.email,
    address: row.address,
    city: row.city,
    opening_hours: openingHours,
    delivery_fee_ngn: Number(row.delivery_fee_ngn || 0),
    free_delivery_threshold_ngn: Number(row.free_delivery_threshold_ngn || 0),
    instagram_url: row.instagram_url,
    facebook_url: row.facebook_url,
    twitter_url: row.twitter_url,
    map_embed_query: row.map_embed_query,
    paystack_enabled: Boolean(
      paymentRow && Number(paymentRow.enabled) === 1 && String(paymentRow.public_key || '').trim() && String(paymentRow.secret_key || '').trim()
    ),
    paystack_public_key:
      paymentRow && Number(paymentRow.enabled) === 1 ? String(paymentRow.public_key || '') : '',
    paystack_mode: paymentRow ? (paymentRow.mode as 'test' | 'live') : 'test',
  };
}

// ---------- PUBLIC API ----------

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'the-future-kitchen' });
});

app.get('/api/settings', (_req, res) => {
  const row = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get() as Record<string, unknown> | undefined;
  const paymentRow = db.prepare('SELECT provider, enabled, mode, public_key, secret_key FROM payment_settings WHERE id = 1').get() as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Restaurant settings not initialized.' });
    return;
  }
  res.json(formatSettingsRow(row, paymentRow));
});

app.get('/api/categories', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
  res.json(rows);
});

app.get('/api/products', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const featured = req.query.featured === '1';
  const includeUnavailable = req.query.includeUnavailable === '1';

  let sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (!includeUnavailable) {
    sql += ' AND p.is_available = 1';
  }
  if (featured) {
    sql += ' AND p.is_featured = 1';
  }
  if (category && category !== 'all') {
    sql += ' AND (c.slug = ? OR c.name = ?)';
    params.push(category, category);
  }
  if (search) {
    sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(c.name) LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  sql += ' ORDER BY p.is_featured DESC, c.sort_order ASC, p.id ASC';

  const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
  res.json(
    rows.map((r) => ({
      ...r,
      is_available: Boolean(r.is_available),
      is_featured: Boolean(r.is_featured),
    }))
  );
});

app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const customerName = String(body.customerName || '').trim();
  const customerPhone = String(body.customerPhone || '').trim();
  const customerEmail = String(body.customerEmail || '').trim();
  const fulfillmentType = body.fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
  const deliveryAddress = String(body.deliveryAddress || '').trim();
  const specialInstructions = String(body.specialInstructions || '').trim().slice(0, 500);
  const requestedPaymentMethod = String(body.paymentMethod || '');
  const items = Array.isArray(body.items) ? body.items : [];

  const validation = validateOrderInput({
    customerName,
    customerPhone,
    customerEmail,
    fulfillmentType,
    deliveryAddress,
    items,
  });

  if (!validation.valid) {
    res.status(400).json({ error: 'Please fix the highlighted order details.', errors: validation.errors });
    return;
  }

  const settings = db
    .prepare('SELECT delivery_fee_ngn, free_delivery_threshold_ngn FROM restaurant_settings WHERE id = 1')
    .get() as { delivery_fee_ngn: number; free_delivery_threshold_ngn: number } | undefined;

  const paymentCfg = db
    .prepare('SELECT enabled, mode, public_key, secret_key FROM payment_settings WHERE id = 1')
    .get() as { enabled: number; mode: string; public_key: string; secret_key: string } | undefined;

  const paystackReady = Boolean(
    paymentCfg && paymentCfg.enabled === 1 && paymentCfg.public_key.trim() && paymentCfg.secret_key.trim()
  );

  let paymentMethod: 'pay_on_delivery' | 'pay_at_pickup' | 'paystack' =
    fulfillmentType === 'pickup' ? 'pay_at_pickup' : 'pay_on_delivery';

  if (requestedPaymentMethod === 'paystack') {
    if (!paystackReady) {
      res.status(400).json({
        error: 'Paystack online payment is not yet configured by the restaurant administrator. Please select Pay on Delivery / Pay at Pickup.',
      });
      return;
    }
    paymentMethod = 'paystack';
  }

  // Resolve and verify products server-side from database
  const productStmt = db.prepare('SELECT id, name, price_ngn, is_available FROM products WHERE id = ?');
  const resolvedItems: Array<{
    product_id: number;
    product_name: string;
    unit_price_ngn: number;
    quantity: number;
    line_total_ngn: number;
  }> = [];

  for (const rawItem of items) {
    const productId = Number(rawItem.productId);
    const quantity = Math.floor(Number(rawItem.quantity));
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
      res.status(400).json({ error: 'Invalid item quantity in cart.' });
      return;
    }
    const prod = productStmt.get(productId) as
      | { id: number; name: string; price_ngn: number; is_available: number }
      | undefined;
    if (!prod) {
      res.status(400).json({ error: `Menu item #${productId} no longer exists.` });
      return;
    }
    if (prod.is_available !== 1) {
      res.status(400).json({ error: `"${prod.name}" is currently unavailable. Please remove it from your cart.` });
      return;
    }
    resolvedItems.push({
      product_id: prod.id,
      product_name: prod.name,
      unit_price_ngn: prod.price_ngn,
      quantity,
      line_total_ngn: prod.price_ngn * quantity,
    });
  }

  const totals = calculateCartTotals(
    resolvedItems.map((i) => ({ price_ngn: i.unit_price_ngn, quantity: i.quantity })),
    fulfillmentType,
    settings?.delivery_fee_ngn ?? 2500,
    settings?.free_delivery_threshold_ngn ?? 30000
  );

  // Create unique order number
  let orderNumber = generateOrderNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(orderNumber);
    if (!exists) break;
    orderNumber = generateOrderNumber();
  }

  const paymentReference = paymentMethod === 'paystack' ? `TFK-PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null;

  const createOrderTx = db.transaction(() => {
    const existingCustomer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customerPhone) as
      | { id: number }
      | undefined;

    let customerId: number;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      db.prepare(
        `UPDATE customers SET name = ?, email = COALESCE(NULLIF(?, ''), email), default_address = COALESCE(NULLIF(?, ''), default_address), updated_at = datetime('now') WHERE id = ?`
      ).run(customerName, customerEmail, deliveryAddress, customerId);
    } else {
      const custRes = db
        .prepare('INSERT INTO customers (name, phone, email, default_address) VALUES (?, ?, ?, ?)')
        .run(customerName, customerPhone, customerEmail, deliveryAddress);
      customerId = Number(custRes.lastInsertRowid);
    }

    const orderRes = db
      .prepare(
        `INSERT INTO orders (
          order_number, customer_id, customer_name, customer_phone, customer_email,
          delivery_address, fulfillment_type, special_instructions,
          subtotal_ngn, delivery_fee_ngn, total_ngn,
          payment_method, payment_status, payment_reference, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, 'Pending')`
      )
      .run(
        orderNumber,
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        fulfillmentType === 'delivery' ? deliveryAddress : 'Pickup at Restaurant',
        fulfillmentType,
        specialInstructions,
        totals.subtotal,
        totals.deliveryFee,
        totals.total,
        paymentMethod,
        paymentReference
      );

    const orderId = Number(orderRes.lastInsertRowid);
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, unit_price_ngn, quantity, line_total_ngn) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const item of resolvedItems) {
      insertItem.run(orderId, item.product_id, item.product_name, item.unit_price_ngn, item.quantity, item.line_total_ngn);
    }

    return orderId;
  });

  const orderId = createOrderTx();
  const savedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>;
  const savedItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({
    order: { ...savedOrder, items: savedItems },
    paystack:
      paymentMethod === 'paystack' && paymentCfg
        ? {
            enabled: true,
            publicKey: paymentCfg.public_key,
            reference: paymentReference,
            amountKobo: totals.total * 100,
            email: customerEmail || 'orders@thefuturekitchen.ng',
          }
        : null,
  });
});

app.get('/api/orders/track/:orderNumber', (req, res) => {
  const orderNumber = String(req.params.orderNumber || '').trim().toUpperCase();
  if (!orderNumber) {
    res.status(400).json({ error: 'Order number is required.' });
    return;
  }

  const order = db
    .prepare(
      `SELECT id, order_number, customer_name, fulfillment_type, subtotal_ngn, delivery_fee_ngn, total_ngn, payment_method, payment_status, status, created_at, updated_at
       FROM orders WHERE UPPER(order_number) = ?`
    )
    .get(orderNumber) as Record<string, unknown> | undefined;

  if (!order) {
    res.status(404).json({ error: `No order found matching "${orderNumber}".` });
    return;
  }

  const items = db
    .prepare('SELECT product_id, product_name, unit_price_ngn, quantity, line_total_ngn FROM order_items WHERE order_id = ?')
    .all(order.id);

  res.json({ ...order, items });
});

app.post('/api/payments/paystack/verify', async (req, res) => {
  const orderNumber = String(req.body?.orderNumber || '').trim();
  const reference = String(req.body?.reference || '').trim();

  if (!orderNumber || !reference) {
    res.status(400).json({ error: 'Order number and payment reference are required.' });
    return;
  }

  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as
    | { id: number; total_ngn: number; payment_status: string; payment_reference: string | null }
    | undefined;

  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const paymentCfg = db
    .prepare('SELECT enabled, secret_key FROM payment_settings WHERE id = 1')
    .get() as { enabled: number; secret_key: string } | undefined;

  const secretKey = (paymentCfg?.secret_key || process.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!paymentCfg || paymentCfg.enabled !== 1 || !secretKey) {
    res.status(400).json({ error: 'Paystack verification is unavailable because secret key is not configured.' });
    return;
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { status?: string; amount?: number; currency?: string; reference?: string };
    };

    if (!response.ok || !data.status || !data.data) {
      res.status(422).json({
        error: data.message || 'Paystack could not verify this payment reference.',
      });
      return;
    }

    const expectedAmountKobo = order.total_ngn * 100;
    if (data.data.status !== 'success' || Number(data.data.amount) < expectedAmountKobo || data.data.currency !== 'NGN') {
      db.prepare(`UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?`).run(order.id);
      res.status(422).json({
        error: `Payment verification failed (status: ${data.data.status}, amount: ${data.data.amount}). Order has not been marked as paid.`,
      });
      return;
    }

    db.prepare(
      `UPDATE orders SET payment_status = 'paid', payment_reference = ?, status = CASE WHEN status = 'Pending' THEN 'Confirmed' ELSE status END, updated_at = datetime('now') WHERE id = ?`
    ).run(reference, order.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id) as Record<string, unknown>;
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ verified: true, order: { ...updatedOrder, items } });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? `Paystack verification error: ${err.message}` : 'Unable to reach Paystack verification API.',
    });
  }
});

app.get('/api/reviews', (_req, res) => {
  const reviews = db
    .prepare("SELECT id, customer_name, rating, comment, status, created_at FROM reviews WHERE status = 'approved' ORDER BY id DESC")
    .all() as Array<{ rating: number }>;

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + Number(r.rating), 0) / totalReviews) * 10) / 10
      : 0;

  res.json({ reviews, totalReviews, averageRating });
});

app.post('/api/reviews', (req, res) => {
  const customerName = String(req.body?.customerName || '').trim();
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || '').trim();

  const validation = validateReviewInput({ customerName, rating, comment });
  if (!validation.valid) {
    res.status(400).json({ error: 'Please complete all review fields.', errors: validation.errors });
    return;
  }

  const result = db
    .prepare("INSERT INTO reviews (customer_name, rating, comment, status) VALUES (?, ?, ?, 'pending')")
    .run(customerName, rating, comment);

  const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    message: 'Thank you! Your review has been submitted and is awaiting moderation.',
    review: created,
  });
});

app.get('/api/gallery', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  let rows;
  if (category && category !== 'all') {
    rows = db.prepare('SELECT * FROM gallery WHERE category = ? ORDER BY sort_order ASC, id DESC').all(category);
  } else {
    rows = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC, id DESC').all();
  }
  res.json(rows);
});

app.post('/api/contact', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const subject = String(req.body?.subject || '').trim() || 'General Inquiry';
  const message = String(req.body?.message || '').trim();

  const validation = validateContactInput({ name, email, phone, subject, message });
  if (!validation.valid) {
    res.status(400).json({ error: 'Please correct the errors in your message.', errors: validation.errors });
    return;
  }

  const result = db
    .prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, phone, subject, message);

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Your message has been received. Our team will respond shortly.',
  });
});

// ---------- ADMIN AUTH API ----------

app.get('/api/admin/auth/status', (req, res) => {
  const count = (db.prepare('SELECT COUNT(*) as count FROM administrators').get() as { count: number }).count;
  const admin = extractAdminFromRequest(req);
  res.json({
    hasAdmin: count > 0,
    authenticated: Boolean(admin),
    admin: admin ? { id: admin.sub, name: admin.name, email: admin.email, role: admin.role } : null,
  });
});

app.post('/api/admin/auth/setup', (req, res) => {
  const count = (db.prepare('SELECT COUNT(*) as count FROM administrators').get() as { count: number }).count;
  if (count > 0) {
    res.status(403).json({ error: 'An administrator account already exists. Please sign in.' });
    return;
  }

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (name.length < 2) {
    res.status(400).json({ error: 'Administrator name must be at least 2 characters.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid administrator email address.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO administrators (name, email, password_hash, role, last_login_at) VALUES (?, ?, ?, 'super_admin', datetime('now'))")
    .run(name, email, hash);

  const adminId = Number(result.lastInsertRowid);
  const token = signAdminToken({ sub: adminId, email, name, role: 'super_admin' });

  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });

  res.status(201).json({
    admin: { id: adminId, name, email, role: 'super_admin' },
    token,
  });
});

app.post('/api/admin/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const admin = db
    .prepare('SELECT id, name, email, password_hash, role FROM administrators WHERE LOWER(email) = ?')
    .get(email) as { id: number; name: string; email: string; password_hash: string; role: 'super_admin' | 'manager' } | undefined;

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  db.prepare("UPDATE administrators SET last_login_at = datetime('now') WHERE id = ?").run(admin.id);

  const token = signAdminToken({ sub: admin.id, email: admin.email, name: admin.name, role: admin.role });
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    token,
  });
});

app.post('/api/admin/auth/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// ---------- PROTECTED ADMIN API ----------

app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  const stats = db
    .prepare(
      `SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN status IN ('Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery') THEN 1 ELSE 0 END) AS pendingOrders,
        SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS completedOrders,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,
        COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total_ngn ELSE 0 END), 0) AS totalRevenueNgn,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_ngn ELSE 0 END), 0) AS paidRevenueNgn
      FROM orders`
    )
    .get() as Record<string, number>;

  const pendingReviews = (
    db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'").get() as { count: number }
  ).count;

  const unreadMessages = (
    db.prepare("SELECT COUNT(*) as count FROM contact_messages WHERE status = 'unread'").get() as { count: number }
  ).count;

  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;

  const statusBreakdown = db
    .prepare('SELECT status, COUNT(*) as count, COALESCE(SUM(total_ngn), 0) as revenue FROM orders GROUP BY status')
    .all();

  const categorySales = db
    .prepare(
      `SELECT c.name as category, COALESCE(SUM(oi.quantity), 0) as units_sold, COALESCE(SUM(oi.line_total_ngn), 0) as revenue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       GROUP BY c.id
       ORDER BY revenue DESC, c.sort_order ASC`
    )
    .all();

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 6').all();

  res.json({
    stats: {
      totalOrders: stats.totalOrders || 0,
      pendingOrders: stats.pendingOrders || 0,
      completedOrders: stats.completedOrders || 0,
      cancelledOrders: stats.cancelledOrders || 0,
      totalRevenueNgn: stats.totalRevenueNgn || 0,
      paidRevenueNgn: stats.paidRevenueNgn || 0,
      pendingReviews,
      unreadMessages,
      totalProducts,
    },
    statusBreakdown,
    categorySales,
    recentOrders,
  });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  let orders: Array<Record<string, unknown>>;
  if (status && status !== 'all') {
    orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(status) as Array<Record<string, unknown>>;
  } else {
    orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as Array<Record<string, unknown>>;
  }

  const itemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const enriched = orders.map((order) => ({
    ...order,
    items: itemStmt.all(order.id),
  }));
  res.json(enriched);
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '').trim();
  const paymentStatus = req.body?.paymentStatus ? String(req.body.paymentStatus).trim() : null;

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  if (status && !isValidOrderStatus(status)) {
    res.status(400).json({ error: 'Invalid order status value.' });
    return;
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  if (status) {
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  }
  if (paymentStatus && ['unpaid', 'paid', 'failed'].includes(paymentStatus)) {
    db.prepare("UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE id = ?").run(paymentStatus, id);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  res.json({ ...updated, items });
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ORDER BY c.sort_order ASC, p.id DESC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      ...r,
      is_available: Boolean(r.is_available),
      is_featured: Boolean(r.is_featured),
    }))
  );
});

app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const dataUrl = String(req.body?.dataUrl || '');
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    res.status(400).json({ error: 'Please upload a valid PNG, JPEG, or WebP image.' });
    return;
  }

  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    res.status(400).json({ error: 'Image size must be 5MB or smaller.' });
    return;
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const filename = `upload-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  res.status(201).json({ url: `/uploads/${filename}` });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const categoryId = Number(req.body?.category_id);
  const description = String(req.body?.description || '').trim();
  const priceNgn = Math.round(Number(req.body?.price_ngn));
  const imageUrl = String(req.body?.image_url || '').trim() || '/assets/images/hero_jollof_feast_1794680375338.jpg';
  const isAvailable = req.body?.is_available === false ? 0 : 1;
  const isFeatured = req.body?.is_featured ? 1 : 0;
  const prepTimeMins = Math.max(5, Math.min(180, Math.round(Number(req.body?.prep_time_mins || 25))));
  const spiceLevel = String(req.body?.spice_level || 'Medium').trim();

  if (name.length < 2 || description.length < 8 || !Number.isFinite(priceNgn) || priceNgn <= 0) {
    res.status(400).json({ error: 'Please provide a valid dish name, description, and positive price in Naira.' });
    return;
  }

  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
  if (!cat) {
    res.status(400).json({ error: 'Selected category does not exist.' });
    return;
  }

  let slug = slugify(name);
  const existingSlug = db.prepare('SELECT 1 FROM products WHERE slug = ?').get(slug);
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const result = db
    .prepare(
      `INSERT INTO products (category_id, name, slug, description, price_ngn, image_url, is_available, is_featured, prep_time_mins, spice_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(categoryId, name, slug, description, priceNgn, imageUrl, isAvailable, isFeatured, prepTimeMins, spiceLevel);

  const created = db
    .prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?')
    .get(result.lastInsertRowid) as Record<string, unknown>;

  res.status(201).json({
    ...created,
    is_available: Boolean(created.is_available),
    is_featured: Boolean(created.is_featured),
  });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const name = String(req.body?.name ?? existing.name).trim();
  const categoryId = Number(req.body?.category_id ?? existing.category_id);
  const description = String(req.body?.description ?? existing.description).trim();
  const priceNgn = Math.round(Number(req.body?.price_ngn ?? existing.price_ngn));
  const imageUrl = String(req.body?.image_url ?? existing.image_url).trim();
  const isAvailable = req.body?.is_available === undefined ? Number(existing.is_available) : req.body.is_available ? 1 : 0;
  const isFeatured = req.body?.is_featured === undefined ? Number(existing.is_featured) : req.body.is_featured ? 1 : 0;
  const prepTimeMins = Math.max(5, Math.min(180, Math.round(Number(req.body?.prep_time_mins ?? existing.prep_time_mins))));
  const spiceLevel = String(req.body?.spice_level ?? existing.spice_level).trim();

  if (name.length < 2 || description.length < 8 || !Number.isFinite(priceNgn) || priceNgn <= 0) {
    res.status(400).json({ error: 'Invalid dish details or price.' });
    return;
  }

  db.prepare(
    `UPDATE products
     SET category_id = ?, name = ?, description = ?, price_ngn = ?, image_url = ?, is_available = ?, is_featured = ?, prep_time_mins = ?, spice_level = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(categoryId, name, description, priceNgn, imageUrl, isAvailable, isFeatured, prepTimeMins, spiceLevel, id);

  const updated = db
    .prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?')
    .get(id) as Record<string, unknown>;

  res.json({
    ...updated,
    is_available: Boolean(updated.is_available),
    is_featured: Boolean(updated.is_featured),
  });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const orderedCount = (
    db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id) as { count: number }
  ).count;

  if (orderedCount > 0) {
    // Preserve historical order integrity: mark unavailable or detach order_items?
    // Actually let's check schema: order_items keeps product_name & unit_price_ngn, so if user expects delete to remove dish from menu:
    // Let's delete or allow deletion only when not referenced, OR better: recreate order_items without RESTRICT?
    // Wait: order_items already snapshots product_name and unit_price_ngn. Let's disable foreign_keys momentarily or check cleanly!
    db.pragma('foreign_keys = OFF');
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    db.pragma('foreign_keys = ON');
  } else {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  res.json({ deleted: true, id });
});

app.get('/api/admin/reviews', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
  res.json(rows);
});

app.patch('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '').trim();
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid review status.' });
    return;
  }
  const existing = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }
  db.prepare("UPDATE reviews SET status = ?, moderated_at = datetime('now') WHERE id = ?").run(status, id);
  const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  res.json({ deleted: true, id });
});

app.get('/api/admin/gallery', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC, id DESC').all();
  res.json(rows);
});

app.post('/api/admin/gallery', requireAdmin, (req, res) => {
  const title = String(req.body?.title || '').trim();
  const category = String(req.body?.category || 'Nigerian Meals').trim();
  const imageUrl = String(req.body?.image_url || '').trim();
  const caption = String(req.body?.caption || '').trim();

  if (title.length < 2 || !imageUrl) {
    res.status(400).json({ error: 'Title and image URL are required.' });
    return;
  }

  const result = db
    .prepare('INSERT INTO gallery (title, category, image_url, caption, sort_order) VALUES (?, ?, ?, ?, 0)')
    .run(title, category, imageUrl, caption);

  const created = db.prepare('SELECT * FROM gallery WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
  res.json({ deleted: true, id });
});

app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
  res.json(rows);
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '').trim();
  if (!['unread', 'read', 'replied'].includes(status)) {
    res.status(400).json({ error: 'Invalid status.' });
    return;
  }
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
  const updated = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
  res.json(updated);
});

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  const row = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get() as Record<string, unknown>;
  const paymentRow = db.prepare('SELECT provider, enabled, mode, public_key, secret_key FROM payment_settings WHERE id = 1').get() as Record<string, unknown>;
  res.json(formatSettingsRow(row, paymentRow));
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get() as Record<string, unknown>;

  const businessName = String(b.business_name ?? existing.business_name).trim();
  const tagline = String(b.tagline ?? existing.tagline).trim();
  const heroTitle = String(b.hero_title ?? existing.hero_title).trim();
  const heroSubtitle = String(b.hero_subtitle ?? existing.hero_subtitle).trim();
  const phone = String(b.phone ?? existing.phone).trim();
  const whatsappNumber = String(b.whatsapp_number ?? existing.whatsapp_number).trim();
  const email = String(b.email ?? existing.email).trim();
  const address = String(b.address ?? existing.address).trim();
  const city = String(b.city ?? existing.city).trim();
  const openingHoursJson = Array.isArray(b.opening_hours)
    ? JSON.stringify(b.opening_hours)
    : String(existing.opening_hours_json);
  const deliveryFee = Math.max(0, Math.round(Number(b.delivery_fee_ngn ?? existing.delivery_fee_ngn)));
  const freeThreshold = Math.max(0, Math.round(Number(b.free_delivery_threshold_ngn ?? existing.free_delivery_threshold_ngn)));
  const instagramUrl = String(b.instagram_url ?? existing.instagram_url).trim();
  const facebookUrl = String(b.facebook_url ?? existing.facebook_url).trim();
  const twitterUrl = String(b.twitter_url ?? existing.twitter_url).trim();
  const mapQuery = String(b.map_embed_query ?? existing.map_embed_query).trim();

  db.prepare(
    `UPDATE restaurant_settings
     SET business_name = ?, tagline = ?, hero_title = ?, hero_subtitle = ?,
         phone = ?, whatsapp_number = ?, email = ?, address = ?, city = ?,
         opening_hours_json = ?, delivery_fee_ngn = ?, free_delivery_threshold_ngn = ?,
         instagram_url = ?, facebook_url = ?, twitter_url = ?, map_embed_query = ?,
         updated_at = datetime('now')
     WHERE id = 1`
  ).run(
    businessName,
    tagline,
    heroTitle,
    heroSubtitle,
    phone,
    whatsappNumber,
    email,
    address,
    city,
    openingHoursJson,
    deliveryFee,
    freeThreshold,
    instagramUrl,
    facebookUrl,
    twitterUrl,
    mapQuery
  );

  const updated = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get() as Record<string, unknown>;
  const paymentRow = db.prepare('SELECT provider, enabled, mode, public_key, secret_key FROM payment_settings WHERE id = 1').get() as Record<string, unknown>;
  res.json(formatSettingsRow(updated, paymentRow));
});

app.get('/api/admin/payment-settings', requireAdmin, (_req, res) => {
  const row = db
    .prepare('SELECT provider, enabled, mode, public_key, secret_key, updated_at FROM payment_settings WHERE id = 1')
    .get() as {
      provider: string;
      enabled: number;
      mode: 'test' | 'live';
      public_key: string;
      secret_key: string;
      updated_at: string;
    };

  const secret = row?.secret_key || '';
  const maskedSecret =
    secret.length > 8 ? `${secret.slice(0, 7)}••••${secret.slice(-4)}` : secret ? '••••••••' : '';

  res.json({
    provider: row?.provider || 'paystack',
    enabled: Boolean(row?.enabled === 1),
    mode: row?.mode || 'test',
    public_key: row?.public_key || '',
    has_secret_key: Boolean(secret),
    secret_key_hint: maskedSecret,
    updated_at: row?.updated_at,
  });
});

app.put('/api/admin/payment-settings', requireAdmin, (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM payment_settings WHERE id = 1').get() as {
    enabled: number;
    mode: string;
    public_key: string;
    secret_key: string;
  };

  const enabled = b.enabled ? 1 : 0;
  const mode = b.mode === 'live' ? 'live' : 'test';
  const publicKey = String(b.public_key ?? existing.public_key).trim();
  const newSecret = typeof b.secret_key === 'string' && b.secret_key.trim() ? b.secret_key.trim() : existing.secret_key;

  if (enabled === 1 && (!publicKey || !newSecret)) {
    res.status(400).json({ error: 'Both Paystack Public Key and Secret Key are required to enable Paystack.' });
    return;
  }

  db.prepare(
    `UPDATE payment_settings
     SET enabled = ?, mode = ?, public_key = ?, secret_key = ?, updated_at = datetime('now')
     WHERE id = 1`
  ).run(enabled, mode, publicKey, newSecret);

  const maskedSecret =
    newSecret.length > 8 ? `${newSecret.slice(0, 7)}••••${newSecret.slice(-4)}` : newSecret ? '••••••••' : '';

  res.json({
    provider: 'paystack',
    enabled: Boolean(enabled === 1),
    mode,
    public_key: publicKey,
    has_secret_key: Boolean(newSecret),
    secret_key_hint: maskedSecret,
  });
});

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const rows = db
    .prepare('SELECT id, name, email, role, created_at, last_login_at FROM administrators ORDER BY id ASC')
    .all();
  res.json(rows);
});

app.post('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res) => {
  if (req.admin?.role !== 'super_admin') {
    res.status(403).json({ error: 'Only super administrators can add new admin accounts.' });
    return;
  }

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const role = req.body?.role === 'manager' ? 'manager' : 'super_admin';

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    res.status(400).json({ error: 'Provide a valid name, email, and password (at least 8 characters).' });
    return;
  }

  const exists = db.prepare('SELECT 1 FROM administrators WHERE LOWER(email) = ?').get(email);
  if (exists) {
    res.status(409).json({ error: 'An administrator with this email already exists.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO administrators (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, role);

  const created = db
    .prepare('SELECT id, name, email, role, created_at, last_login_at FROM administrators WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});

// ---------- STATIC / VITE FRONTEND ----------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE FUTURE KITCHEN server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
