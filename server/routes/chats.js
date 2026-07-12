import express from 'express';
import { run, query, queryOne } from '../db.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/history/:session_id', async (req, res) => {
  const { session_id } = req.params;
  try {
    const messages = await query(
      'SELECT sender, message, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [session_id]
    );
    const session = await queryOne('SELECT status FROM chat_sessions WHERE session_id = ?', [session_id]);
    res.json({
      status: session ? session.status : 'bot',
      messages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/message', async (req, res) => {
  const { session_id, message, userId } = req.body;
  
  if (!session_id || !message) {
    return res.status(400).json({ message: 'Session ID and message are required.' });
  }

  try {
    let session = await queryOne('SELECT * FROM chat_sessions WHERE session_id = ?', [session_id]);
    if (!session) {
      await run(
        'INSERT INTO chat_sessions (session_id, user_id, status) VALUES (?, ?, ?)',
        [session_id, userId || null, 'bot']
      );
      session = { session_id, user_id: userId || null, status: 'bot' };
    } else if (userId && !session.user_id) {
      await run('UPDATE chat_sessions SET user_id = ? WHERE session_id = ?', [userId, session_id]);
    }

    await run(
      'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
      [session_id, 'user', message]
    );

    if (session.status === 'admin') {
      const userLabel = userId ? `User ID ${userId}` : 'Guest';
      await run(
        'INSERT INTO admin_notifications (type, message) VALUES (?, ?)',
        ['chat', `New message in admin chat from ${userLabel} (Session: ${session_id.substring(0, 8)})`]
      );
      return res.json({ status: 'admin', reply: null });
    }

    const cleanMsg = message.toLowerCase().trim();
    const escalateKeywords = ['admin', 'human', 'agent', 'connect', 'toby', 'help', 'support', 'person', 'talk to'];
    
    const shouldEscalate = escalateKeywords.some(keyword => cleanMsg.includes(keyword));

    if (shouldEscalate) {
      await run("UPDATE chat_sessions SET status = 'admin' WHERE session_id = ?", [session_id]);
      
      const botReply = "I am connecting you to our Admin, Toby. Please stand by. Toby will reply to you shortly in this chat box.";
      await run(
        'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
        [session_id, 'bot', botReply]
      );

      const customerName = userId ? `Customer (ID: ${userId})` : 'A guest customer';
      await run(
        'INSERT INTO admin_notifications (type, message) VALUES (?, ?)',
        ['chat', `${customerName} requested support agent. Session: ${session_id.substring(0, 8)}`]
      );

      return res.json({
        status: 'admin',
        reply: botReply
      });
    }

    // Smart Keyword Automated Bot replies
    let reply = "";
    if (cleanMsg.includes('hour') || cleanMsg.includes('time') || cleanMsg.includes('open') || cleanMsg.includes('close')) {
      reply = "TechCentral is open Monday to Friday from 8:00 AM to 6:00 PM, and Saturdays from 9:00 AM to 3:00 PM. We are closed on Sundays.";
    } else if (cleanMsg.includes('where') || cleanMsg.includes('location') || cleanMsg.includes('address') || cleanMsg.includes('office') || cleanMsg.includes('located')) {
      reply = "Our main showroom is located at Plot 24, Ring Road Central, Accra, Ghana. However, we deliver nationwide so you can order right here online!";
    } else if (cleanMsg.includes('delivery') || cleanMsg.includes('shipping') || cleanMsg.includes('fee') || cleanMsg.includes('cost') || cleanMsg.includes('charges')) {
      reply = "We offer two delivery tiers: Standard (2-5 days, ₵15.00 / $15.00) and Express (24 hours, ₵30.00 / $30.00). We ship to Accra, Kumasi, and all other regions.";
    } else if (cleanMsg.includes('discount') || cleanMsg.includes('offer') || cleanMsg.includes('coupon') || cleanMsg.includes('promo') || cleanMsg.includes('code')) {
      reply = "We have great discounts! Apply coupon code TECH20 at checkout for 20% off. Plus, get a automatic lifetime 10% discount on all orders once you make more than 3 orders with us!";
    } else if (cleanMsg.includes('warranty') || cleanMsg.includes('guarantee')) {
      reply = "Quality is guaranteed! Apple products come with a 1-Year manufacturer warranty. Dell & HP laptops feature a 2-Year warranty, and monitors have a 3-Year burn-in warranty.";
    } else if (cleanMsg.includes('return') || cleanMsg.includes('refund') || cleanMsg.includes('defect') || cleanMsg.includes('exchange')) {
      reply = "We offer a 7-day hassle-free return policy for any hardware defects. Items must be returned in their original packaging and condition for assessment.";
    } else if (cleanMsg.includes('payment') || cleanMsg.includes('momo') || cleanMsg.includes('card') || cleanMsg.includes('paypal') || cleanMsg.includes('paystack')) {
      reply = "We accept secure payments via Paystack. You can pay using MTN Mobile Money, Telecel Cash, Debit/Credit Cards (Visa/Mastercard), or PayPal.";
    } else if (cleanMsg.includes('laptop') || cleanMsg.includes('phone') || cleanMsg.includes('macbook') || cleanMsg.includes('samsung') || cleanMsg.includes('printer')) {
      reply = "We stock flagship laptops, iPhones, Galaxy phones, LaserJet printers, and premium accessories! Browse our Shop page to see the latest stock, prices, and specifications.";
    } else {
      reply = "Thank you for your message! I'm the TechCentral Virtual Assistant. I can help with store hours, showroom locations, delivery options, refunds, and coupons. If you need to chat with Toby, our admin support agent, simply reply 'connect to admin'.";
    }

    await run(
      'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
      [session_id, 'bot', reply]
    );

    res.json({
      status: 'bot',
      reply
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/sessions', verifyToken, isAdmin, async (req, res) => {
  try {
    const sessions = await query(`
      SELECT cs.id, cs.session_id, cs.status, cs.created_at, cs.user_id,
             u.first_name, u.last_name, u.email,
             (SELECT message FROM chat_messages WHERE session_id = cs.session_id ORDER BY id DESC LIMIT 1) as last_message,
             (SELECT created_at FROM chat_messages WHERE session_id = cs.session_id ORDER BY id DESC LIMIT 1) as last_message_time
      FROM chat_sessions cs
      LEFT JOIN users u ON cs.user_id = u.id
      ORDER BY last_message_time DESC
    `);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/messages/:session_id', verifyToken, isAdmin, async (req, res) => {
  try {
    const messages = await query(
      'SELECT sender, message, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [req.params.session_id]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/reply', verifyToken, isAdmin, async (req, res) => {
  const { session_id, message } = req.body;
  if (!session_id || !message) {
    return res.status(400).json({ message: 'Session ID and message are required.' });
  }

  try {
    await run(
      'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
      [session_id, 'admin', message]
    );
    await run("UPDATE chat_sessions SET status = 'admin' WHERE session_id = ?", [session_id]);
    res.json({ message: 'Reply sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/sessions/:session_id/status', verifyToken, isAdmin, async (req, res) => {
  const { status } = req.body; // 'bot', 'admin', 'closed'
  if (!status) return res.status(400).json({ message: 'Status is required.' });

  try {
    await run('UPDATE chat_sessions SET status = ? WHERE session_id = ?', [status, req.params.session_id]);
    res.json({ message: 'Session status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const notifications = await query('SELECT * FROM admin_notifications ORDER BY id DESC LIMIT 50');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/notifications/:id/read', verifyToken, isAdmin, async (req, res) => {
  try {
    await run('UPDATE admin_notifications SET read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/notifications/read-all', verifyToken, isAdmin, async (req, res) => {
  try {
    await run('UPDATE admin_notifications SET read = 1');
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
