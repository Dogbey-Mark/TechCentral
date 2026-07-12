import express from 'express';
import { run, query, queryOne } from '../db.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const cats = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', verifyToken, isAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = await run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description || '']);
    res.status(201).json({ id: result.id, name, slug, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/brands', async (req, res) => {
  try {
    const brands = await query('SELECT * FROM brands ORDER BY name ASC');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/brands', verifyToken, isAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Brand name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = await run('INSERT INTO brands (name, slug) VALUES (?, ?)', [name, slug]);
    res.status(201).json({ id: result.id, name, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin delete brand
router.delete('/brands/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await run('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      availability,
      sort,
      ram,
      storage,
      processor,
      screen_size,
      color
    } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
      (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating,
      (SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
      (SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.status != 'Cancelled') as sales_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR b.name LIKE ? OR c.name LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    if (category) {
      sql += ` AND c.slug = ?`;
      params.push(category);
    }

    if (brand) {
      sql += ` AND b.slug = ?`;
      params.push(brand);
    }

    if (minPrice) {
      sql += ` AND COALESCE(p.discount_price, p.price) >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ` AND COALESCE(p.discount_price, p.price) <= ?`;
      params.push(parseFloat(maxPrice));
    }

    if (availability) {
      if (availability === 'in_stock') {
        sql += ` AND p.stock > 0`;
      } else if (availability === 'out_of_stock') {
        sql += ` AND p.stock = 0`;
      }
    }

    // Sorting
    if (sort) {
      if (sort === 'price_asc') {
        sql += ` ORDER BY COALESCE(p.discount_price, p.price) ASC`;
      } else if (sort === 'price_desc') {
        sql += ` ORDER BY COALESCE(p.discount_price, p.price) DESC`;
      } else if (sort === 'newest') {
        sql += ` ORDER BY p.created_at DESC`;
      } else if (sort === 'best_selling') {
        sql += ` ORDER BY COALESCE(sales_count, 0) DESC`;
      } else if (sort === 'rating_desc') {
        sql += ` ORDER BY COALESCE(avg_rating, 0) DESC`;
      } else {
        sql += ` ORDER BY p.featured DESC, p.id DESC`;
      }
    } else {
      sql += ` ORDER BY p.featured DESC, p.id DESC`;
    }

    let products = await query(sql, params);

    if (ram || storage || processor || screen_size || color || rating) {
      products = products.filter(p => {
        let specs = {};
        try {
          specs = p.specifications ? JSON.parse(p.specifications) : {};
        } catch (e) {
          specs = {};
        }

        const getSpecValue = (keyPattern) => {
          const matchKey = Object.keys(specs).find(k => k.toLowerCase().includes(keyPattern));
          return matchKey ? specs[matchKey].toLowerCase() : '';
        };

        if (ram && !getSpecValue('ram').includes(ram.toLowerCase())) return false;
        if (storage && !getSpecValue('storage').includes(storage.toLowerCase())) return false;
        if (processor && !getSpecValue('processor').includes(processor.toLowerCase())) return false;
        if (screen_size && !getSpecValue('screen').includes(screen_size.toLowerCase())) return false;
        if (color && !getSpecValue('color').includes(color.toLowerCase())) return false;
        if (rating && (p.avg_rating || 0) < parseFloat(rating)) return false;

        return true;
      });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin-all', verifyToken, isAdmin, async (req, res) => {
  try {
    const products = await query(`
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await queryOne(`
      SELECT p.*, c.name as category_name, b.name as brand_name,
      (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating,
      (SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = p.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Get sub images
    const images = await query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
    product.images = images.map(img => img.image_url);

    // Get sub videos
    const videos = await query('SELECT video_url FROM product_videos WHERE product_id = ?', [product.id]);
    product.videos = videos.map(vid => vid.video_url);

    // Get reviews
    const reviews = await query(`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [product.id]);
    product.reviews = reviews;

    const related = await query(`
      SELECT id, name, price, discount_price, image_url, sku,
      (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = products.id) as avg_rating
      FROM products
      WHERE category_id = ? AND id != ? AND status = 'active'
      LIMIT 4
    `, [product.category_id, product.id]);
    product.related = related;

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add Product
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, discount_price, category_id, brand_id, stock, sku, warranty, specifications, image_url, featured, status, images, videos } = req.body;

  if (!name || !description || price === undefined || !sku) {
    return res.status(400).json({ message: 'Please provide name, description, price, and SKU.' });
  }

  try {
    const result = await run(`
      INSERT INTO products (name, description, price, discount_price, category_id, brand_id, stock, sku, warranty, specifications, image_url, featured, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      description,
      parseFloat(price),
      discount_price ? parseFloat(discount_price) : null,
      category_id || null,
      brand_id || null,
      parseInt(stock) || 0,
      sku,
      warranty || '',
      specifications || '{}',
      image_url || 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
      featured ? 1 : 0,
      status || 'active'
    ]);

    // Insert sub images
    if (images && Array.isArray(images)) {
      for (const imgUrl of images) {
        await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.id, imgUrl]);
      }
    } else {
      // Fallback to inserting main image
      await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [
        result.id,
        image_url || 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80'
      ]);
    }

    // Insert sub videos
    if (videos && Array.isArray(videos)) {
      for (const vidUrl of videos) {
        await run('INSERT INTO product_videos (product_id, video_url) VALUES (?, ?)', [result.id, vidUrl]);
      }
    }

    res.status(201).json({ id: result.id, message: 'Product created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Edit Product
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, discount_price, category_id, brand_id, stock, sku, warranty, specifications, image_url, featured, status, images, videos } = req.body;

  try {
    const product = await queryOne('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await run(`
      UPDATE products
      SET name = ?, description = ?, price = ?, discount_price = ?, category_id = ?, brand_id = ?, stock = ?, sku = ?, warranty = ?, specifications = ?, image_url = ?, featured = ?, status = ?
      WHERE id = ?
    `, [
      name,
      description,
      parseFloat(price),
      discount_price ? parseFloat(discount_price) : null,
      category_id || null,
      brand_id || null,
      parseInt(stock) || 0,
      sku,
      warranty || '',
      specifications || '{}',
      image_url || 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
      featured ? 1 : 0,
      status || 'active',
      productId
    ]);

    // Update sub images
    if (images && Array.isArray(images)) {
      await run('DELETE FROM product_images WHERE product_id = ?', [productId]);
      for (const imgUrl of images) {
        await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [productId, imgUrl]);
      }
    }

    // Update sub videos
    if (videos && Array.isArray(videos)) {
      await run('DELETE FROM product_videos WHERE product_id = ?', [productId]);
      for (const vidUrl of videos) {
        await run('INSERT INTO product_videos (product_id, video_url) VALUES (?, ?)', [productId, vidUrl]);
      }
    }

    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Product
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const product = await queryOne('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add review
router.post('/:id/reviews', verifyToken, async (req, res) => {
  const productId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const product = await queryOne('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if user already reviewed
    const existingReview = await queryOne('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    if (existingReview) {
      await run('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [rating, comment || '', existingReview.id]);
      return res.json({ message: 'Review updated successfully.' });
    }

    await run('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)', [
      req.user.id,
      productId,
      rating,
      comment || ''
    ]);

    res.status(201).json({ message: 'Review added successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
