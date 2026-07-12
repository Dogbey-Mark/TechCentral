import express from 'express';
import { query, queryOne, run } from '../db.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    const revenue = await queryOne("SELECT SUM(total_amount) as total FROM orders WHERE status != 'Cancelled'");
    const totalRevenue = revenue.total || 0;

    // Total Orders
    const ordersCount = await queryOne('SELECT COUNT(*) as count FROM orders');
    const totalOrders = ordersCount.count || 0;

    // Pending Orders
    const pendingCount = await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'");
    const pendingOrders = pendingCount.count || 0;

    // Total Customers
    const customersCount = await queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalCustomers = customersCount.count || 0;

    // Products in stock
    const productsInStock = await queryOne("SELECT COUNT(*) as count FROM products WHERE stock > 0 AND status = 'active'");
    const activeProducts = productsInStock.count || 0;

    // Low stock items (stock <= 3)
    const lowStockCount = await queryOne("SELECT COUNT(*) as count FROM products WHERE stock <= 3 AND status = 'active'");
    const lowStockItems = lowStockCount.count || 0;

    // Monthly Sales Chart Data (group by year and month)
    const monthlySales = await query(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(total_amount) as total, COUNT(id) as count
      FROM orders
      WHERE status != 'Cancelled'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `);

    const topProducts = await query(`
      SELECT p.id, p.name, p.price, p.image_url, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    const recentCustomers = await query(`
      SELECT id, first_name, last_name, email, created_at, status
      FROM users
      WHERE role = 'customer'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const recentOrders = await query(`
      SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json({
      metrics: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalCustomers,
        activeProducts,
        lowStockItems
      },
      monthlySales: monthlySales.reverse(),
      topProducts,
      recentCustomers,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory', verifyToken, isAdmin, async (req, res) => {
  try {
    const items = await query(`
      SELECT p.id, p.name, p.sku, p.stock, p.price, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.stock ASC
    `);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/inventory/:id/restock', verifyToken, isAdmin, async (req, res) => {
  const { stock } = req.body;
  const productId = req.params.id;

  if (stock === undefined || parseInt(stock) < 0) {
    return res.status(400).json({ message: 'Valid stock quantity is required.' });
  }

  try {
    const product = await queryOne('SELECT name FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    await run('UPDATE products SET stock = ? WHERE id = ?', [parseInt(stock), productId]);
    console.log(`[Notification Log] [RESTOCK HISTORY] Product "${product.name}" (ID ${productId}) updated to stock: ${stock}`);
    
    res.json({ message: 'Stock updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers', verifyToken, isAdmin, async (req, res) => {
  try {
    const customers = await query("SELECT id, first_name, last_name, email, phone, role, status, created_at FROM users WHERE role = 'customer' ORDER BY id DESC");
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { status } = req.body; 
  const customerId = req.params.id;

  if (!status || (status !== 'active' && status !== 'suspended')) {
    return res.status(400).json({ message: "Status must be 'active' or 'suspended'" });
  }

  try {
    const user = await queryOne('SELECT email FROM users WHERE id = ? AND role = ?', [customerId, 'customer']);
    if (!user) return res.status(404).json({ message: 'Customer not found.' });

    await run('UPDATE users SET status = ? WHERE id = ?', [status, customerId]);
    console.log(`[Notification Log] User Status Change: Account ${user.email} status updated to: ${status}`);

    res.json({ message: `Customer account status set to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
