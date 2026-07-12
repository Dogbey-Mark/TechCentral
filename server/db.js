import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

let dbDefaultPath = './database.db';
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  dbDefaultPath = '/tmp/database.db';
  const sourcePath = path.resolve('./database.db');
  const targetPath = path.resolve(dbDefaultPath);
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log('Copied seed database to /tmp/database.db');
    } catch (copyErr) {
      console.error('Failed to copy seed database to /tmp', copyErr);
    }
  }
}

const dbPath = path.resolve(process.env.DATABASE_PATH || dbDefaultPath);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Helper wrapper for SQL commands
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const initDb = async () => {
  // Create tables
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT UNIQUE NOT NULL,
    warranty TEXT,
    specifications TEXT, -- Store specifications as JSON string
    image_url TEXT,
    featured BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS product_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Pending',
    payment_status TEXT DEFAULT 'Unpaid',
    payment_method TEXT,
    shipping_address TEXT NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    contact_number TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    UNIQUE(user_id, product_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    expiry_date DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0
  )`);

  await run(`CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    recipient_name TEXT,
    recipient_phone TEXT,
    street_address TEXT,
    city TEXT,
    region TEXT,
    is_default BOOLEAN DEFAULT 0
  )`);

  await run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS sms_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'bot',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seeding initial categories
  const cats = [
    { name: 'Laptops', slug: 'laptops', desc: 'Notebooks, ultrabooks, and gaming laptops' },
    { name: 'Phones', slug: 'phones', desc: 'Smartphones and cellphones' },
    { name: 'Printers', slug: 'printers', desc: 'Inkjet, Laser, and multi-function printers' },
    { name: 'Tablets', slug: 'tablets', desc: 'IPads, Android tablets, and drawing tablets' },
    { name: 'Accessories', slug: 'accessories', desc: 'Keyboards, mice, headphones, and chargers' },
    { name: 'Monitors', slug: 'monitors', desc: '4K, gaming, and office monitors' },
    { name: 'Networking', slug: 'networking', desc: 'Routers, switches, and modems' },
    { name: 'Storage', slug: 'storage', desc: 'External SSDs, HDDs, and flash drives' },
    { name: 'Desktop Computers', slug: 'desktop-computers', desc: 'All-in-One PCs, gaming rigs, and tower computers' }
  ];
  let categoriesSeeded = false;
  for (const cat of cats) {
    const existingCat = await queryOne('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
    if (!existingCat) {
      await run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [cat.name, cat.slug, cat.desc]);
      categoriesSeeded = true;
    }
  }
  if (categoriesSeeded) {
    console.log('Categories seeded.');
  }

  // Seeding initial brands
  const brands = ['HP', 'Dell', 'Lenovo', 'Apple', 'Samsung', 'Asus', 'Acer', 'Canon', 'Epson', 'Logitech'];
  let brandsSeeded = false;
  for (const b of brands) {
    const existingBrand = await queryOne('SELECT id FROM brands WHERE slug = ?', [b.toLowerCase()]);
    if (!existingBrand) {
      await run('INSERT INTO brands (name, slug) VALUES (?, ?)', [b, b.toLowerCase()]);
      brandsSeeded = true;
    }
  }
  if (brandsSeeded) {
    console.log('Brands seeded.');
  }

  // Seeding initial users
  const usersCount = await queryOne('SELECT COUNT(*) as count FROM users');
  if (usersCount.count === 0) {
    const adminPass = await bcrypt.hash('AdminPassword123!', 10);
    const custPass = await bcrypt.hash('CustomerPassword123!', 10);
    
    await run('INSERT INTO users (first_name, last_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)', 
      ['Admin', 'User', 'admin@techcentral.com', '+233240000001', adminPass, 'admin']);
    await run('INSERT INTO users (first_name, last_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)', 
      ['John', 'Doe', 'customer@techcentral.com', '+233240000002', custPass, 'customer']);
    
    console.log('Users seeded (Admin and Customer).');
  }

  // Seeding products
  const catsMap = {};
  const categoriesList = await query('SELECT id, name FROM categories');
  categoriesList.forEach(c => catsMap[c.name] = c.id);

  const brandsMap = {};
  const brandsList = await query('SELECT id, name FROM brands');
  brandsList.forEach(b => brandsMap[b.name] = b.id);

  const products = [
    {
      name: 'MacBook Pro 16"',
      description: 'Supercharged by Apple M3 Max chip. Extreme performance, stunning Liquid Retina XDR display, and up to 22 hours of battery life.',
      price: 3499.00,
      discount_price: 3299.00,
      category: 'Laptops',
      brand: 'Apple',
      stock: 12,
      sku: 'LAP-MBP16-M3M',
      warranty: '1 Year Apple Warranty',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Processor: 'Apple M3 Max (16-core CPU, 40-core GPU)',
        RAM: '36GB Unified Memory',
        Storage: '1TB Superfast SSD',
        'Graphics card': 'Apple 40-core Integrated GPU',
        'Screen size': '16.2-inch Liquid Retina XDR (3024x1964)',
        'Operating System': 'macOS Sonoma',
        Battery: '100-watt-hour battery (Up to 22 hours)'
      })
    },
    {
      name: 'Dell XPS 15 9530',
      description: 'Vibrant OLED display combined with high-end Intel 13th Gen and RTX 40-series graphics. Designed for creative professionals.',
      price: 2299.00,
      discount_price: 2099.00,
      category: 'Laptops',
      brand: 'Dell',
      stock: 8,
      sku: 'LAP-DELL-XPS15',
      warranty: '2 Years Dell Premium Support',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Processor: 'Intel Core i9-13900H (14 Cores, up to 5.4 GHz)',
        RAM: '32GB DDR5 Dual Channel',
        Storage: '1TB PCIe Gen4 M.2 SSD',
        'Graphics card': 'NVIDIA GeForce RTX 4070 8GB GDDR6',
        'Screen size': '15.6-inch OLED 3.5K (3456x2160) Touchscreen',
        'Operating System': 'Windows 11 Pro',
        Battery: '86-watt-hour battery (Up to 9 hours)'
      })
    },
    {
      name: 'HP Spectre x360 14',
      description: 'Premium 2-in-1 convertible laptop. Gorgeous OLED display, sleek aluminum CNC construction, and included active stylus pen.',
      price: 1499.00,
      discount_price: 1399.00,
      category: 'Laptops',
      brand: 'HP',
      stock: 15,
      sku: 'LAP-HP-SPECTRE',
      warranty: '1 Year Local Warranty',
      featured: 0,
      image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Processor: 'Intel Core Ultra 7 155H (16 Cores, Intel AI Boost)',
        RAM: '16GB LPDDR5X',
        Storage: '512GB NVMe SSD',
        'Graphics card': 'Intel Arc Graphics',
        'Screen size': '14-inch OLED 2.8K (2880x1800) 120Hz Touch',
        'Operating System': 'Windows 11 Home',
        Battery: '68-watt-hour battery (Up to 13 hours)'
      })
    },
    {
      name: 'iPhone 15 Pro Max',
      description: 'Forged in titanium. Features the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
      price: 1199.00,
      discount_price: 1149.00,
      category: 'Phones',
      brand: 'Apple',
      stock: 25,
      sku: 'PHN-AP-15PM',
      warranty: '1 Year Apple Warranty',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Storage: '256GB NVMe',
        RAM: '8GB LPDDR5',
        Camera: 'Triple 48MP main + 12MP ultra-wide + 12MP 5x telephoto',
        Display: '6.7-inch Super Retina XDR OLED (120Hz LTPO ProMotion)',
        Battery: '4441 mAh (Up to 29 hours video playback)',
        'Operating System': 'iOS 17',
        Processor: 'Apple A17 Pro (3nm, 6-core)'
      })
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Welcome to the era of mobile AI. Fitted with Galaxy AI capabilities, a built-in S Pen, and an armor aluminum & titanium outer frame.',
      price: 1299.00,
      discount_price: 1249.00,
      category: 'Phones',
      brand: 'Samsung',
      stock: 20,
      sku: 'PHN-SS-S24U',
      warranty: '2 Years Manufacturer Warranty',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Storage: '512GB UFS 4.0',
        RAM: '12GB LPDDR5X',
        Camera: 'Quad 200MP + 50MP + 12MP + 10MP (up to 100x Space Zoom)',
        Display: '6.8-inch Dynamic AMOLED 2X QHD+ (120Hz, 2600 nits)',
        Battery: '5000 mAh (45W Super Fast Charging)',
        'Operating System': 'Android 14 with One UI 6.1',
        Processor: 'Snapdragon 8 Gen 3 for Galaxy'
      })
    },
    {
      name: 'HP LaserJet Pro MFP M283fdw',
      description: 'Get high-quality color, wireless two-sided printing, and smart mobility and security features with this laser printer.',
      price: 499.00,
      discount_price: 449.00,
      category: 'Printers',
      brand: 'HP',
      stock: 5,
      sku: 'PRN-HP-LJ283',
      warranty: '1 Year HP Support',
      featured: 0,
      image_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        'Printing type': 'Color Laser',
        Connectivity: 'Wi-Fi, Ethernet, USB, AirPrint',
        'Color/Mono': 'Color and Monochrome',
        'Print speed': 'Up to 22 ppm (pages per minute)',
        'Paper size': 'A4, Letter, Legal, Envelopes',
        'Duplex printing': 'Automatic (Double-sided)'
      })
    },
    {
      name: 'Canon PIXMA G6020 MegaTank',
      description: 'Wireless All-in-One Inkjet Printer with incredibly high ink yields. Low cost printing with refillable ink tanks.',
      price: 399.00,
      discount_price: 349.00,
      category: 'Printers',
      brand: 'Canon',
      stock: 10,
      sku: 'PRN-CAN-G6020',
      warranty: '1 Year Canon Warranty',
      featured: 0,
      image_url: 'https://images.unsplash.com/photo-1563223552-30d01fda3ea6?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        'Printing type': 'Refillable Ink Tank Inkjet',
        Connectivity: 'Wireless, Ethernet, USB, Mopria',
        'Color/Mono': 'Color and Monochrome',
        'Print speed': '13 ipm black, 6.8 ipm color',
        'Paper size': 'A4, Letter, 4x6 photo papers',
        'Duplex printing': 'Automatic Duplex'
      })
    },
    {
      name: 'Epson EcoTank ET-2800',
      description: 'Cartridge-free printing with easy-to-fill supersized ink tanks. Includes up to 2 years of ink in the box.',
      price: 279.00,
      discount_price: 259.00,
      category: 'Printers',
      brand: 'Epson',
      stock: 15,
      sku: 'PRN-EPS-ET2800',
      warranty: '2 Years Register Warranty',
      featured: 0,
      image_url: 'https://images.unsplash.com/photo-1583228726885-333c8d197607?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        'Printing type': 'Supertank Inkjet',
        Connectivity: 'Wi-Fi, USB, Voice-activated printing',
        'Color/Mono': 'Color and Monochrome',
        'Print speed': '10.5 ppm black, 5 ppm color',
        'Paper size': 'A4, Letter, A6, Envelopes',
        'Duplex printing': 'Manual Duplex'
      })
    },
    {
      name: 'iPad Pro 11-inch M4',
      description: 'Impossibly thin design. Features the breakthrough Apple M4 chip, a revolutionary Tandem OLED Ultra Retina XDR display, and superfast Wi-Fi 6E.',
      price: 999.00,
      discount_price: 949.00,
      category: 'Tablets',
      brand: 'Apple',
      stock: 18,
      sku: 'TAB-AP-IPM4',
      warranty: '1 Year Apple Warranty',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Storage: '256GB SSD',
        RAM: '8GB RAM',
        Display: '11-inch Ultra Retina XDR Tandem OLED (120Hz ProMotion)',
        Processor: 'Apple M4 chip (9-core CPU, 10-core GPU)',
        'Operating System': 'iPadOS 17',
        Battery: 'Up to 10 hours of web surfing'
      })
    },
    {
      name: 'Logitech MX Master 3S',
      description: 'An iconic mouse remastered. Feel every moment of your workflow with even more precision, tactile quiet clicks, and an 8K DPI track-on-glass sensor.',
      price: 99.00,
      discount_price: null,
      category: 'Accessories',
      brand: 'Logitech',
      stock: 45,
      sku: 'ACC-LOG-MX3S',
      warranty: '1 Year Limited Hardware Warranty',
      featured: 0,
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Sensor: 'Darkfield high precision (200 - 8000 DPI)',
        Buttons: '7 customizable buttons + Smartshift scroll wheel',
        Connectivity: 'Bluetooth Low Energy & Logi Bolt USB Receiver',
        Battery: 'Rechargeable Li-Po (500 mAh) - Up to 70 days on full charge'
      })
    },
    {
      name: 'ASUS ROG Swift PG32UCDM OLED',
      description: '32-inch 4K QD-OLED gaming monitor, features a blistering 240Hz refresh rate, 0.03ms response time, custom heatsink, and vibrant colors.',
      price: 1299.00,
      discount_price: 1249.00,
      category: 'Monitors',
      brand: 'Asus',
      stock: 4,
      sku: 'MON-ASUS-PG32U',
      warranty: '3 Years OLED Burn-in Warranty',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        'Screen size': '31.5 inches QD-OLED',
        Resolution: '3840x2160 (4K UHD)',
        'Refresh rate': '240Hz',
        'Response time': '0.03ms (gray to gray)',
        Ports: '2x HDMI 2.1, 1x DisplayPort 1.4, USB-C (90W Power Delivery)'
      })
    },
    {
      name: 'HP Pavilion 24 All-in-One',
      description: 'Clean design, powerful performance. Features a 13th Gen Intel Core processor, a micro-edge Full HD display, and integrated pop-up privacy camera.',
      price: 1099.00,
      discount_price: 999.00,
      category: 'Desktop Computers',
      brand: 'HP',
      stock: 10,
      sku: 'DSK-HP-PAV24',
      warranty: '1 Year HP Support',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Processor: 'Intel Core i7-13700T (16 Cores, up to 4.9 GHz)',
        RAM: '16GB DDR4 Memory',
        Storage: '512GB PCIe NVMe M.2 SSD',
        'Graphics card': 'Intel Iris Xe Graphics',
        'Screen size': '23.8-inch diagonal FHD IPS Touchscreen',
        'Operating System': 'Windows 11 Home',
        Keyboard: 'HP Wireless Keyboard and Mouse combo'
      })
    },
    {
      name: 'Dell Alienware Aurora R16',
      description: 'A masterpiece of desktop gaming. Engineered with advanced liquid cooling, high-performance Intel Core i9 processor, and powerful NVIDIA RTX 40-series graphics.',
      price: 2399.00,
      discount_price: 2199.00,
      category: 'Desktop Computers',
      brand: 'Dell',
      stock: 6,
      sku: 'DSK-DELL-AW16',
      warranty: '2 Years Dell Premium Support',
      featured: 1,
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
      specifications: JSON.stringify({
        Processor: 'Intel Core i9-14900KF (24 Cores, up to 6.0 GHz)',
        RAM: '32GB DDR5 Dual Channel at 5600MT/s',
        Storage: '2TB PCIe NVMe M.2 SSD',
        'Graphics card': 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
        'Operating System': 'Windows 11 Pro',
        Cooling: 'Alienware Cryo-tech Liquid Cooling'
      })
    }
  ];

  let productsSeeded = false;
  for (const prod of products) {
    const existingProd = await queryOne('SELECT id FROM products WHERE sku = ?', [prod.sku]);
    if (!existingProd) {
      const catId = catsMap[prod.category] || null;
      const brandId = brandsMap[prod.brand] || null;
      
      const res = await run(
        `INSERT INTO products (name, description, price, discount_price, category_id, brand_id, stock, sku, warranty, specifications, image_url, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [prod.name, prod.description, prod.price, prod.discount_price, catId, brandId, prod.stock, prod.sku, prod.warranty, prod.specifications, prod.image_url, prod.featured]
      );
      
      // Seed sub images
      await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [res.id, prod.image_url]);
      // Seed dummy secondary image
      await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [res.id, 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80']);
      productsSeeded = true;
    }
  }
  if (productsSeeded) {
    console.log('Products seeded.');
  }

  // Seed sample coupons
  const couponsCount = await queryOne('SELECT COUNT(*) as count FROM coupons');
  if (couponsCount.count === 0) {
    await run('INSERT INTO coupons (code, discount_percent, expiry_date, usage_limit) VALUES (?, ?, ?, ?)',
      ['TECH20', 20, '2027-12-31', 100]);
    await run('INSERT INTO coupons (code, discount_percent, expiry_date, usage_limit) VALUES (?, ?, ?, ?)',
      ['WELCOME10', 10, '2027-12-31', 500]);
    console.log('Coupons seeded.');
  }

  // Seed some initial sample reviews
  const reviewsCount = await queryOne('SELECT COUNT(*) as count FROM reviews');
  if (reviewsCount.count === 0) {
    const custUser = await queryOne("SELECT id FROM users WHERE email = 'customer@techcentral.com'");
    const mbpProd = await queryOne("SELECT id FROM products WHERE sku = 'LAP-MBP16-M3M'");
    const s24Prod = await queryOne("SELECT id FROM products WHERE sku = 'PHN-SS-S24U'");

    if (custUser && mbpProd) {
      await run('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
        [custUser.id, mbpProd.id, 5, 'Unbelievable performance! The battery lasts all day and compile times are blazing fast. The screen is also a work of art.']);
    }
    if (custUser && s24Prod) {
      await run('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
        [custUser.id, s24Prod.id, 4, 'Excellent camera and display. S-Pen is extremely useful. The AI features are a bit gimmicky but the translation tools are actually decent.']);
    }
    console.log('Reviews seeded.');
  }
};
