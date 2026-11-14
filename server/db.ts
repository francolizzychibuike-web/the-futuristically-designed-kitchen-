import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'future_kitchen.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price_ngn INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      prep_time_mins INTEGER NOT NULL DEFAULT 25,
      spice_level TEXT NOT NULL DEFAULT 'Medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL DEFAULT '',
      default_address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL DEFAULT '',
      delivery_address TEXT NOT NULL DEFAULT '',
      fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup')),
      special_instructions TEXT NOT NULL DEFAULT '',
      subtotal_ngn INTEGER NOT NULL,
      delivery_fee_ngn INTEGER NOT NULL,
      total_ngn INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('pay_on_delivery', 'pay_at_pickup', 'paystack')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
      payment_reference TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      unit_price_ngn INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_ngn INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      moderated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS administrators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'manager')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS restaurant_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      hero_title TEXT NOT NULL,
      hero_subtitle TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      opening_hours_json TEXT NOT NULL,
      delivery_fee_ngn INTEGER NOT NULL DEFAULT 2500,
      free_delivery_threshold_ngn INTEGER NOT NULL DEFAULT 30000,
      instagram_url TEXT NOT NULL DEFAULT '',
      facebook_url TEXT NOT NULL DEFAULT '',
      twitter_url TEXT NOT NULL DEFAULT '',
      map_embed_query TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT NOT NULL DEFAULT 'paystack',
      enabled INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live')),
      public_key TEXT NOT NULL DEFAULT '',
      secret_key TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const categoryCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;

  if (categoryCount === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)'
    );
    const categories = [
      ['Nigerian Rice Dishes', 'nigerian-rice-dishes', 'Firewood-smoked Party Jollof, Coconut Rice, and Ofada Specials.', 1],
      ['Soups and Swallows', 'soups-and-swallows', 'Slow-simmered traditional Nigerian soups paired with silky swallows.', 2],
      ['Grilled Foods', 'grilled-foods', 'Charcoal-seared suya, croaker fish, and peppered meats.', 3],
      ['Fast Foods', 'fast-foods', 'Chef-crafted shawarma wraps, gourmet burgers, and crispy wings.', 4],
      ['Snacks', 'snacks', 'Freshly baked meat pies, golden puff-puff, and small chops platters.', 5],
      ['Drinks', 'drinks', 'House-brewed hibiscus zobo, classic chapman, and cold-pressed juices.', 6],
      ['Desserts', 'desserts', 'Artisanal Nigerian-inspired warm pastries and chilled creams.', 7],
    ];
    const insertManyCats = db.transaction(() => {
      for (const c of categories) insertCategory.run(...c);
    });
    insertManyCats();
  }

  const productCount = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  if (productCount === 0) {
    const catRows = db.prepare('SELECT id, name FROM categories').all() as Array<{ id: number; name: string }>;
    const catId = (name: string) => catRows.find((c) => c.name === name)?.id ?? 1;

    const IMG_JOLLOF = '/assets/images/hero_jollof_feast_1794680375338.jpg';
    const IMG_EGUSI = '/assets/images/egusi_pounded_yam_1794680374518.jpg';
    const IMG_SUYA = '/assets/images/suya_grill_platter_1794680375517.jpg';
    const IMG_SHAWARMA = '/assets/images/spiced_chicken_shawarma_1794680375514.jpg';
    const IMG_CHOPS = '/assets/images/nigerian_small_chops_1794680375709.jpg';
    const IMG_DRINKS = '/assets/images/zobo_chapman_drinks_1794680376396.jpg';
    const IMG_DESSERT = '/assets/images/spiced_puff_dessert_1794680376163.jpg';

    const products = [
      // Nigerian Rice Dishes
      [catId('Nigerian Rice Dishes'), 'Signature Smoky Party Jollof & Grilled Chicken', 'signature-smoky-party-jollof-chicken', 'Long-grain parboiled rice slow-cooked in roasted plum tomato, tatashe, and scotch bonnet reduction, served with char-grilled chicken quarter, sweet dodo plantain, and fresh slaw.', 6500, IMG_JOLLOF, 1, 1, 25, 'Medium'],
      [catId('Nigerian Rice Dishes'), 'Native Ofada Rice & Ayamase Designer Stew', 'native-ofada-rice-ayamase', 'Aromatic unpolished Abeokuta Ofada rice paired with bleached palm oil green pepper Ayamase sauce, assorted beef, shaki, and boiled egg.', 7800, IMG_JOLLOF, 1, 0, 30, 'Hot'],
      [catId('Nigerian Rice Dishes'), 'Coconut Basmati Fried Rice & Peppered Turkey', 'coconut-basmati-fried-rice-turkey', 'Fragrant coconut-infused basmati rice stir-fried with sweet corn, carrots, green peas, and crispy peppered turkey wing.', 7200, IMG_JOLLOF, 1, 0, 25, 'Mild'],

      // Soups and Swallows
      [catId('Soups and Swallows'), 'Egusi Melon Soup & Pounded Yam', 'egusi-melon-soup-pounded-yam', 'Stone-ground melon seeds simmered with fresh bitterleaf, uziza, tender braised beef, stockfish, and smoked kpomo, served with silky pounded yam.', 8500, IMG_EGUSI, 1, 1, 30, 'Medium'],
      [catId('Soups and Swallows'), 'Efo Riro Spinach Stew & Amala', 'efo-riro-spinach-amala', 'Rich Lagos-style greens cooked in smoky locust bean iru and tatashe base with goat meat and dried fish, served alongside smooth dark amala.', 8200, IMG_EGUSI, 1, 0, 30, 'Medium'],
      [catId('Soups and Swallows'), 'Oha & Uziza Soup with Semovita', 'oha-uziza-soup-semovita', 'Traditional Eastern Nigerian Oha leaf soup thickened with cocoyam, braised beef brisket, and stockfish, served with warm Semovita.', 8000, IMG_EGUSI, 1, 0, 30, 'Mild'],

      // Grilled Foods
      [catId('Grilled Foods'), 'Charcoal Beef Suya Platter', 'charcoal-beef-suya-platter', 'Flame-seared prime sirloin skewers coated in roasted groundnut yaji spice, served with red onion rings, ripe tomatoes, and charred lime.', 6000, IMG_SUYA, 1, 1, 20, 'Hot'],
      [catId('Grilled Foods'), 'Whole Charcoal Croaker Fish & Bole', 'whole-charcoal-croaker-fish-bole', 'Marinated whole Atlantic croaker grilled over open coals with herb pepper sauce, served with roasted plantain bole and yam chips.', 14500, IMG_SUYA, 1, 0, 35, 'Medium'],
      [catId('Grilled Foods'), 'Peppered Asun Goat Meat', 'peppered-asun-goat-meat', 'Smoky grilled goat meat chunks tossed in habanero, bell pepper, and sweet onion glaze.', 6800, IMG_SUYA, 1, 0, 25, 'Hot'],

      // Fast Foods
      [catId('Fast Foods'), 'Future Kitchen Chicken Shawarma & Fries', 'future-kitchen-chicken-shawarma-fries', 'Double-wrapped warm flatbread stuffed with suya-spiced grilled chicken breast, roasted garlic sauce, crisp slaw, and seasoned potato fries.', 5500, IMG_SHAWARMA, 1, 1, 18, 'Medium'],
      [catId('Fast Foods'), 'Crispy Suya-Glazed Chicken Wings (8 pcs)', 'crispy-suya-glazed-chicken-wings', 'Crunchy double-dredged chicken wings tossed in honey-yaji pepper glaze with cooling herb dip and fries.', 5800, IMG_SHAWARMA, 1, 0, 20, 'Medium'],
      [catId('Fast Foods'), 'Lagos Flame Beef Burger & Fries', 'lagos-flame-beef-burger-fries', '180g charcoal-grilled beef patty with caramelized onions, aged cheddar, pepper relish, and toasted brioche bun with spiced fries.', 6200, IMG_SHAWARMA, 1, 0, 20, 'Mild'],

      // Snacks
      [catId('Snacks'), 'Executive Small Chops Platter', 'executive-small-chops-platter', 'Sharing platter of golden puff-puff, mini meat pies, crispy vegetable spring rolls, beef samosas, and peppered gizzard bites.', 6500, IMG_CHOPS, 1, 1, 20, 'Mild'],
      [catId('Snacks'), 'Flaky Nigerian Meat Pie (Box of 2)', 'flaky-nigerian-meat-pie-box', 'Buttery hand-crimped shortcrust pastry filled with slow-braised minced beef, diced potatoes, carrots, and thyme.', 3200, IMG_CHOPS, 1, 0, 15, 'Mild'],

      // Drinks
      [catId('Drinks'), 'House Hibiscus Zobo & Pineapple', 'house-hibiscus-zobo-pineapple', 'Cold-steeped dried hibiscus petals infused with fresh pineapple, crushed ginger, cloves, and garden mint.', 2200, IMG_DRINKS, 1, 1, 5, 'None'],
      [catId('Drinks'), 'Signature Lagos Chapman', 'signature-lagos-chapman', 'Refreshing sparkling citrus blend finished with aromatic bitters, fresh cucumber ribbons, orange wheels, and crushed ice.', 2800, IMG_DRINKS, 1, 0, 5, 'None'],

      // Desserts
      [catId('Desserts'), 'Spiced Puff-Puff Beignets & Dark Chocolate', 'spiced-puff-puff-beignets-chocolate', 'Warm nutmeg-scented Nigerian puff-puff stacked with dark cocoa ganache, toasted coconut flakes, and Madagascar vanilla bean cream.', 3800, IMG_DESSERT, 1, 1, 12, 'None'],
      [catId('Desserts'), 'Caramelized Coconut Chin-Chin Parfait', 'caramelized-coconut-chin-chin-parfait', 'Layers of whipped vanilla yogurt mousse, roasted mango compote, and crunchy house-baked coconut chin-chin.', 3500, IMG_DESSERT, 1, 0, 10, 'None'],
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (category_id, name, slug, description, price_ngn, image_url, is_available, is_featured, prep_time_mins, spice_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertManyProds = db.transaction(() => {
      for (const p of products) insertProd.run(...p);
    });
    insertManyProds();
  }

  const reviewCount = (db.prepare('SELECT COUNT(*) as count FROM reviews').get() as { count: number }).count;
  if (reviewCount === 0) {
    const insertReview = db.prepare(
      'INSERT INTO reviews (customer_name, rating, comment, status, moderated_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
    );
    const reviews = [
      ['Adaeze Eze', 5, 'The Party Jollof actually has that authentic smoky firewood aroma without being overly oily. My family ordered the Executive Small Chops and Egusi too — everything arrived warm and thoughtfully packaged.', 'approved'],
      ['Tunde Adebayo', 5, 'Clean, calm dining room and attentive staff. Their Charcoal Beef Suya platter with fresh zobo is easily our favourite Friday evening ritual in Victoria Island.', 'approved'],
      ['Kemi Olawale', 5, 'Ordered online for a team lunch of 14 people. The order tracking code worked seamlessly and every dish matched the exact portions and prices listed on the menu.', 'approved'],
      ['Ibrahim Musa', 4, 'The Spiced Puff-Puff with dark chocolate ganache is a brilliant twist on a classic Nigerian snack. Crisp outside, pillowy inside.', 'approved'],
    ];
    for (const r of reviews) insertReview.run(...r);
  }

  const galleryCount = (db.prepare('SELECT COUNT(*) as count FROM gallery').get() as { count: number }).count;
  if (galleryCount === 0) {
    const insertGallery = db.prepare(
      'INSERT INTO gallery (title, category, image_url, caption, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const items = [
      ['Smoky Party Jollof Table Spread', 'Nigerian Meals', '/assets/images/hero_jollof_feast_1794680375338.jpg', 'Firewood-smoked Jollof rice plated with grilled chicken, sweet dodo, and garden slaw.', 1],
      ['Forest Green Dining Hall', 'Restaurant Interior', '/assets/images/restaurant_dining_interior_1794680377605.jpg', 'Deep forest green banquettes, warm plaster walls, and brushed brass lighting in our main dining room.', 2],
      ['Open Pass Plating', 'Food Preparation', '/assets/images/chef_kitchen_prep_1794680378657.jpg', 'Our culinary team finishing grilled platters with fresh herbs at the kitchen pass.', 3],
      ['Charcoal Beef Suya Platter', 'Grilled Dishes', '/assets/images/suya_grill_platter_1794680375517.jpg', 'Prime beef skewers seared over hot coals and dusted with roasted peanut yaji.', 4],
      ['Egusi & Pounded Yam', 'Nigerian Meals', '/assets/images/egusi_pounded_yam_1794680374518.jpg', 'Traditional stone-ground melon seed soup served in handmade stoneware.', 5],
      ['Hibiscus Zobo & Chapman', 'Drinks', '/assets/images/zobo_chapman_drinks_1794680376396.jpg', 'Cold-pressed spiced hibiscus zobo and classic Lagos chapman mixed to order.', 6],
      ['Executive Small Chops Board', 'Special Presentations', '/assets/images/nigerian_small_chops_1794680375709.jpg', 'Freshly baked meat pies, puff-puff, spring rolls, samosas, and peppered gizzard.', 7],
      ['Spiced Puff-Puff Dessert', 'Special Presentations', '/assets/images/spiced_puff_dessert_1794680376163.jpg', 'Warm puff-puff beignets finished with dark cocoa ganache and toasted coconut.', 8],
      ['Gourmet Chicken Shawarma', 'Nigerian Meals', '/assets/images/spiced_chicken_shawarma_1794680375514.jpg', 'Suya-spiced grilled chicken wrap with garlic herb cream and crispy fries.', 9],
    ];
    for (const g of items) insertGallery.run(...g);
  }

  const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM restaurant_settings').get() as { count: number }).count;
  if (settingsCount === 0) {
    const defaultHours = JSON.stringify([
      { days: 'Monday – Thursday', hours: '10:00 AM – 10:00 PM' },
      { days: 'Friday – Saturday', hours: '10:00 AM – 11:30 PM' },
      { days: 'Sunday', hours: '12:00 PM – 10:00 PM' },
    ]);
    db.prepare(`
      INSERT INTO restaurant_settings (
        id, business_name, tagline, hero_title, hero_subtitle,
        phone, whatsapp_number, email, address, city,
        opening_hours_json, delivery_fee_ngn, free_delivery_threshold_ngn,
        instagram_url, facebook_url, twitter_url, map_embed_query
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'THE FUTURE KITCHEN',
      'FRESH FOOD. AMAZING FLAVOUR. UNFORGETTABLE MOMENTS.',
      'Good Food. Great Moments.',
      'Modern Nigerian hospitality crafted from heirloom spices, open-flame grilling, and seasonal market produce.',
      '+234 800 555 0199',
      '2348005550199',
      'hello@thefuturekitchen.ng',
      '14 Adeola Odeku Way, Victoria Island (Sample Address)',
      'Lagos, Nigeria',
      defaultHours,
      2500,
      30000,
      'https://instagram.com',
      'https://facebook.com',
      'https://x.com',
      'Victoria Island, Lagos, Nigeria'
    );
  }

  const paymentCount = (db.prepare('SELECT COUNT(*) as count FROM payment_settings').get() as { count: number }).count;
  if (paymentCount === 0) {
    const envPublic = (process.env.PAYSTACK_PUBLIC_KEY || '').trim();
    const envSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    const enabled = envPublic && envSecret ? 1 : 0;
    db.prepare(`
      INSERT INTO payment_settings (id, provider, enabled, mode, public_key, secret_key)
      VALUES (1, 'paystack', ?, 'test', ?, ?)
    `).run(enabled, envPublic, envSecret);
  }

  // Optional env-based admin bootstrap (never hardcoded in source)
  const adminCount = (db.prepare('SELECT COUNT(*) as count FROM administrators').get() as { count: number }).count;
  const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const envAdminPass = (process.env.ADMIN_PASSWORD || '').trim();
  if (adminCount === 0 && envAdminEmail && envAdminPass.length >= 8) {
    const hash = bcrypt.hashSync(envAdminPass, 10);
    db.prepare(
      'INSERT INTO administrators (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run('Restaurant Administrator', envAdminEmail, hash, 'super_admin');
  }
}
