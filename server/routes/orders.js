import express from 'express';
import { run, query, queryOne } from '../db.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/cart', verifyToken, async (req, res) => {
  try {
    const cartItems = await query(`
      SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.discount_price, p.image_url, p.stock, p.sku
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.user.id]);
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cart', verifyToken, async (req, res) => {
  const { product_id, quantity } = req.body;
  const qty = parseInt(quantity) || 1;

  if (!product_id) return res.status(400).json({ message: 'Product ID required' });

  try {
    const product = await queryOne('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock available.' });

    const existing = await queryOne('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (product.stock < newQty) return res.status(400).json({ message: 'Insufficient stock available.' });
      await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      await run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, qty]);
    }
    res.json({ message: 'Item added to cart.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cart/:id', verifyToken, async (req, res) => {
  const { quantity } = req.body;
  const qty = parseInt(quantity);
  const cartItemId = req.params.id;

  if (!qty || qty < 1) return res.status(400).json({ message: 'Invalid quantity' });

  try {
    const cartItem = await queryOne('SELECT ci.product_id, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?', [cartItemId, req.user.id]);
    if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });

    if (cartItem.stock < qty) return res.status(400).json({ message: `Only ${cartItem.stock} items in stock.` });

    await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, cartItemId]);
    res.json({ message: 'Cart updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cart/:id', verifyToken, async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/wishlist', verifyToken, async (req, res) => {
  try {
    const wishlist = await query(`
      SELECT w.id, w.product_id, p.name, p.price, p.discount_price, p.image_url, p.stock, p.sku
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
    `, [req.user.id]);
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/wishlist', verifyToken, async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ message: 'Product ID required' });

  try {
    const existing = await queryOne('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing) {
      return res.json({ message: 'Already in wishlist' });
    }
    await run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
    res.json({ message: 'Added to wishlist.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/wishlist/:id', verifyToken, async (req, res) => {
  try {
    await run('DELETE FROM wishlists WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from wishlist.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupon/apply', verifyToken, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code is required.' });

  try {
    const coupon = await queryOne('SELECT * FROM coupons WHERE code = ?', [code.toUpperCase()]);
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code.' });

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired.' });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit.' });
    }

    res.json({
      code: coupon.code,
      discount_percent: coupon.discount_percent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', verifyToken, isAdmin, async (req, res) => {
  const { code, discount_percent, expiry_date, usage_limit } = req.body;
  if (!code || !discount_percent) return res.status(400).json({ message: 'Code and discount percentage are required.' });

  try {
    await run('INSERT INTO coupons (code, discount_percent, expiry_date, usage_limit) VALUES (?, ?, ?, ?)',
      [code.toUpperCase(), parseInt(discount_percent), expiry_date || null, usage_limit ? parseInt(usage_limit) : null]);
    res.json({ message: 'Coupon created.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/coupons/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await run('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/coupons', verifyToken, isAdmin, async (req, res) => {
  try {
    const coupons = await query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const {
    shipping_address,
    contact_number,
    delivery_option, 
    payment_method, 
    coupon_code,
    transaction_id 
  } = req.body;

  if (!shipping_address || !contact_number || !payment_method) {
    return res.status(400).json({ message: 'Shipping address, contact number and payment method are required.' });
  }

  try {

    const cartItems = await query(`
      SELECT ci.quantity, p.id, p.name, p.price, p.discount_price, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.user.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty.' });
    }


    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}. (Only ${item.stock} available)` });
      }
    }


    let subtotal = 0;
    cartItems.forEach(item => {
      const price = item.discount_price !== null ? item.discount_price : item.price;
      subtotal += price * item.quantity;
    });

    let discount = 0;
    if (coupon_code) {
      const coupon = await queryOne('SELECT * FROM coupons WHERE code = ?', [coupon_code.toUpperCase()]);
      if (coupon && (!coupon.expiry_date || new Date(coupon.expiry_date) >= new Date()) && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit)) {
        discount = (subtotal * coupon.discount_percent) / 100;
        await run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
      }
    }


    const ordersCount = await queryOne('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [req.user.id]);
    const userOrderCount = ordersCount ? ordersCount.count : 0;
    let automaticDiscount = 0;
    if (userOrderCount > 3) {
      automaticDiscount = (subtotal - discount) * 0.10;
    }

    const shipping_fee = delivery_option === 'express' ? 30.00 : 15.00; // simulated fees in GHS/USD
    const total = subtotal - discount - automaticDiscount + shipping_fee;


    const orderNumber = 'TC-' + Math.floor(100000 + Math.random() * 900000);
    const payment_status = transaction_id ? 'Paid' : 'Unpaid';
    const status = 'Pending';

    const orderResult = await run(`
      INSERT INTO orders (order_number, user_id, total_amount, status, payment_status, payment_method, shipping_address, shipping_fee, contact_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderNumber, req.user.id, total, status, payment_status, payment_method, shipping_address, shipping_fee, contact_number]);

    for (const item of cartItems) {
      const itemPrice = item.discount_price !== null ? item.discount_price : item.price;
      await run(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `, [orderResult.id, item.id, item.quantity, itemPrice]);

      await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
    }

    if (transaction_id) {
      await run(`
        INSERT INTO payments (order_id, transaction_id, amount, payment_method, status)
        VALUES (?, ?, ?, ?, ?)
      `, [orderResult.id, transaction_id, total, payment_method, 'Successful']);
    }

    await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    console.log(`[Notification Log] New Order Created: ${orderNumber} for User ID ${req.user.id}. Total: ${total}`);

    await run(
      'INSERT INTO admin_notifications (type, message) VALUES (?, ?)',
      ['order', `New Order ${orderNumber} placed. Total: $${total.toFixed(2)} (${payment_method})`]
    );
    

    for (const item of cartItems) {
      const updatedProd = await queryOne('SELECT stock, name FROM products WHERE id = ?', [item.id]);
      if (updatedProd && updatedProd.stock <= 3) {
        console.warn(`[Notification Log] [LOW STOCK WARNING] Product: "${updatedProd.name}" is running low on stock. Current count: ${updatedProd.stock}`);
      }
    }

    res.status(201).json({
      order_id: orderResult.id,
      order_number: orderNumber,
      total,
      message: 'Order created successfully!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.*, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/discount-check', verifyToken, async (req, res) => {
  try {
    const ordersCount = await queryOne('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [req.user.id]);
    const count = ordersCount ? ordersCount.count : 0;
    res.json({
      orderCount: count,
      hasDiscount: count > 3
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    const items = await query(`
      SELECT oi.quantity, oi.unit_price, p.name, p.sku, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id]);
    order.items = items;

    const payment = await queryOne('SELECT transaction_id, payment_method, status, created_at FROM payments WHERE order_id = ?', [order.id]);
    order.payment = payment;

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { status, payment_status } = req.body;
  const orderId = req.params.id;

  try {
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const fields = [];
    const params = [];

    if (status) {
      fields.push('status = ?');
      params.push(status);
    }
    if (payment_status) {
      fields.push('payment_status = ?');
      params.push(payment_status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }

    params.push(orderId);
    await run(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params);

    console.log(`[Notification Log] Order Status Update: Order ${order.order_number} status updated to: ${status || order.status}, payment: ${payment_status || order.payment_status}`);

    res.json({ message: 'Order status updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/paystack/initialize', verifyToken, async (req, res) => {
  const {
    shipping_address,
    contact_number,
    delivery_option,
    payment_method,
    coupon_code
  } = req.body;

  if (!shipping_address || !contact_number) {
    return res.status(400).json({ message: 'Shipping address and contact number are required.' });
  }

  try {
    const cartItems = await query(`
      SELECT ci.quantity, p.id, p.name, p.price, p.discount_price, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.user.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty.' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}. (Only ${item.stock} available)` });
      }
    }

    let subtotal = 0;
    cartItems.forEach(item => {
      const price = item.discount_price !== null ? item.discount_price : item.price;
      subtotal += price * item.quantity;
    });

    let discount = 0;
    if (coupon_code) {
      const coupon = await queryOne('SELECT * FROM coupons WHERE code = ?', [coupon_code.toUpperCase()]);
      if (coupon && (!coupon.expiry_date || new Date(coupon.expiry_date) >= new Date()) && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit)) {
        discount = (subtotal * coupon.discount_percent) / 100;
      }
    }

    const ordersCount = await queryOne('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [req.user.id]);
    const userOrderCount = ordersCount ? ordersCount.count : 0;
    let automaticDiscount = 0;
    if (userOrderCount > 3) {
      automaticDiscount = (subtotal - discount) * 0.10;
    }

    const shipping_fee = delivery_option === 'express' ? 30.00 : 15.00;
    const total = subtotal - discount - automaticDiscount + shipping_fee;

    const user = await queryOne('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    if (!paystackSecret) {
      return res.status(500).json({ message: 'Paystack secret key is not configured.' });
    }

    const clientUrl = req.get('Origin') || process.env.CLIENT_URL || 'http://localhost:5173';
    const payload = {
      email: user.email,
      amount: Math.round(total * 100), // minor unit
      callback_url: `${clientUrl}/payment-gateway`,
      metadata: {
        shipping_address,
        contact_number,
        delivery_option,
        payment_method,
        coupon_code,
        user_id: req.user.id
      }
    };

    console.log(`[Paystack Initialize] Calling Paystack API for user: ${user.email}, amount: ${total}`);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.status) {
      console.error('[Paystack Initialize] Error:', result);
      return res.status(response.status || 400).json({ message: result.message || 'Failed to initialize Paystack transaction.' });
    }

    res.json({
      authorization_url: result.data.authorization_url,
      reference: result.data.reference
    });

  } catch (err) {
    console.error('[Paystack Initialize] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/paystack/verify', verifyToken, async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    return res.status(400).json({ message: 'Transaction reference is required.' });
  }

  try {
    const existingPayment = await queryOne('SELECT id FROM payments WHERE transaction_id = ?', [reference]);
    if (existingPayment) {
      const associatedOrder = await queryOne('SELECT order_number, total_amount FROM orders o JOIN payments p ON o.id = p.order_id WHERE p.transaction_id = ?', [reference]);
      if (associatedOrder) {
        return res.json({
          order_number: associatedOrder.order_number,
          total_amount: associatedOrder.total_amount,
          message: 'Order already processed.'
        });
      }
    }

    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    if (!paystackSecret) {
      return res.status(500).json({ message: 'Paystack secret key is not configured.' });
    }

    console.log(`[Paystack Verify] Verifying reference: ${reference}`);

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`
      }
    });

    const result = await response.json();
    if (!response.ok || !result.status) {
      console.error('[Paystack Verify] Error response:', result);
      return res.status(response.status || 400).json({ message: result.message || 'Payment verification failed.' });
    }

    if (result.data.status !== 'success') {
      return res.status(400).json({ message: `Payment not successful. Status: ${result.data.status}` });
    }

    const metadata = result.data.metadata;
    const {
      shipping_address,
      contact_number,
      delivery_option,
      payment_method,
      coupon_code,
      user_id
    } = metadata || {};

    const targetUserId = user_id || req.user.id;

    const cartItems = await query(`
      SELECT ci.quantity, p.id, p.name, p.price, p.discount_price, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [targetUserId]);

    if (cartItems.length === 0) {
      const lastCheck = await queryOne('SELECT order_number, total_amount FROM orders o JOIN payments p ON o.id = p.order_id WHERE p.transaction_id = ?', [reference]);
      if (lastCheck) {
        return res.json({
          order_number: lastCheck.order_number,
          total_amount: lastCheck.total_amount,
          message: 'Order already processed.'
        });
      }
      return res.status(400).json({ message: 'Shopping cart is empty. Cannot process payment verification.' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}. (Only ${item.stock} available)` });
      }
    }

    let subtotal = 0;
    cartItems.forEach(item => {
      const price = item.discount_price !== null ? item.discount_price : item.price;
      subtotal += price * item.quantity;
    });

    let discount = 0;
    if (coupon_code) {
      const coupon = await queryOne('SELECT * FROM coupons WHERE code = ?', [coupon_code.toUpperCase()]);
      if (coupon && (!coupon.expiry_date || new Date(coupon.expiry_date) >= new Date()) && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit)) {
        discount = (subtotal * coupon.discount_percent) / 100;
        await run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
      }
    }

    const ordersCount = await queryOne('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [targetUserId]);
    const userOrderCount = ordersCount ? ordersCount.count : 0;
    let automaticDiscount = 0;
    if (userOrderCount > 3) {
      automaticDiscount = (subtotal - discount) * 0.10;
    }

    const shipping_fee = delivery_option === 'express' ? 30.00 : 15.00;
    const total = subtotal - discount - automaticDiscount + shipping_fee;

    const orderNumber = 'TC-' + Math.floor(100000 + Math.random() * 900000);
    const payment_status = 'Paid';
    const status = 'Pending';

    const orderResult = await run(`
      INSERT INTO orders (order_number, user_id, total_amount, status, payment_status, payment_method, shipping_address, shipping_fee, contact_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderNumber, targetUserId, total, status, payment_status, payment_method || 'Paystack', shipping_address, shipping_fee, contact_number]);

    for (const item of cartItems) {
      const itemPrice = item.discount_price !== null ? item.discount_price : item.price;
      await run(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `, [orderResult.id, item.id, item.quantity, itemPrice]);

      await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
    }

    await run(`
      INSERT INTO payments (order_id, transaction_id, amount, payment_method, status)
      VALUES (?, ?, ?, ?, ?)
    `, [orderResult.id, reference, total, payment_method || 'Paystack', 'Successful']);

    await run('DELETE FROM cart_items WHERE user_id = ?', [targetUserId]);

    console.log(`[Paystack Verify] Success: Created Order ${orderNumber} for user ${targetUserId}. Reference: ${reference}`);

    await run(
      'INSERT INTO admin_notifications (type, message) VALUES (?, ?)',
      ['order', `New Order ${orderNumber} placed via Paystack. Total: $${total.toFixed(2)}`]
    );

    res.json({
      order_number: orderNumber,
      total_amount: total,
      message: 'Payment verified and order created successfully!'
    });

  } catch (err) {
    console.error('[Paystack Verify] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
