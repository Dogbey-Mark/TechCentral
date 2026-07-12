import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, queryOne, query } from '../db.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_techcentral_token_key_123!';

router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (first_name, last_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone || null, hashedPassword, 'customer']
    );

    const token = jwt.sign(
      { id: result.id, email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`[Notification Log] User Registered: ${first_name} ${last_name} (${email})`);

    res.status(201).json({
      token,
      user: {
        id: result.id,
        first_name,
        last_name,
        email,
        phone,
        role: 'customer'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
});

// Get Current User Profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, first_name, last_name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve profile.', error: err.message });
  }
});

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ message: 'First name, last name, and email are required.' });
  }

  try {
    // Check email clash
    const emailClash = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (emailClash) {
      return res.status(400).json({ message: 'Email is already taken by another account.' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await run(
        'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, password = ? WHERE id = ?',
        [first_name, last_name, email, phone || null, hashedPassword, req.user.id]
      );
    } else {
      await run(
        'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
        [first_name, last_name, email, phone || null, req.user.id]
      );
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.', error: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }
  try {
    const user = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }
    // Simulate email
    console.log(`[Notification Log] Password Reset Email Request sent to: ${email}. Code: 123456`);
    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Error processing forgot password request.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, code, new_password } = req.body;
  if (!email || !code || !new_password) {
    return res.status(400).json({ message: 'Missing parameters.' });
  }
  if (code !== '123456') {
    return res.status(400).json({ message: 'Invalid or expired verification code.' });
  }
  try {
    const user = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    res.json({ message: 'Password has been successfully updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Reset failed.', error: err.message });
  }
});

router.get('/addresses', verifyToken, async (req, res) => {
  try {
    const addresses = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id]);
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve addresses.', error: err.message });
  }
});

router.post('/addresses', verifyToken, async (req, res) => {
  const { title, recipient_name, recipient_phone, street_address, city, region, is_default } = req.body;

  if (!recipient_name || !recipient_phone || !street_address || !city) {
    return res.status(400).json({ message: 'Please provide all details.' });
  }

  try {
    if (is_default) {
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const result = await run(
      'INSERT INTO addresses (user_id, title, recipient_name, recipient_phone, street_address, city, region, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title || 'Address', recipient_name, recipient_phone, street_address, city, region || '', is_default ? 1 : 0]
    );

    res.status(201).json({ id: result.id, message: 'Address added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add address.', error: err.message });
  }
});

router.put('/addresses/:id', verifyToken, async (req, res) => {
  const { title, recipient_name, recipient_phone, street_address, city, region, is_default } = req.body;
  const addressId = req.params.id;

  try {
    const address = await queryOne('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (is_default) {
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    await run(
      'UPDATE addresses SET title = ?, recipient_name = ?, recipient_phone = ?, street_address = ?, city = ?, region = ?, is_default = ? WHERE id = ?',
      [title || 'Address', recipient_name, recipient_phone, street_address, city, region || '', is_default ? 1 : 0, addressId]
    );

    res.json({ message: 'Address updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update address.', error: err.message });
  }
});

router.delete('/addresses/:id', verifyToken, async (req, res) => {
  const addressId = req.params.id;

  try {
    const address = await queryOne('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    await run('DELETE FROM addresses WHERE id = ?', [addressId]);
    res.json({ message: 'Address deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete address.', error: err.message });
  }
});

// Send SMS token
router.post('/send-sms-token', verifyToken, async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  // Format to international format
  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+233' + formattedPhone.substring(1);
    } else {
      formattedPhone = '+' + formattedPhone;
    }
  }

  // Generate 6-digit token
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry

  try {
    // Insert into database
    await run(
      'INSERT INTO sms_tokens (phone, token, expires_at, verified) VALUES (?, ?, ?, 0)',
      [formattedPhone, token, expiresAt]
    );

    // Call Africa's Talking API
    const apiKey = (process.env.AFRICA_KEY || '').trim();
    const username = (process.env.AFRICA_USERNAME || 'sandbox').trim();
    const isSandbox = username.toLowerCase() === 'sandbox';
    const url = isSandbox
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const message = `Your TechCentral verification code is: ${token}`;

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('to', formattedPhone);
    params.append('message', message);

    console.log(`[SMS Token Send] Sending SMS token ${token} to ${formattedPhone} using username: ${username}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log('[SMS Token Send] Response from Africa\'s Talking:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Africa's Talking API returned error (${response.status}): ${responseText}`);
    }

    const recipients = result?.SMSMessageData?.Recipients || [];
    const successCount = recipients.filter(r => r.status === 'Success' || r.status === 'Success (Sent)' || r.status === 'Success (Sent to helper)').length;

    if (recipients.length > 0 && successCount === 0) {
      const errorMsg = recipients[0]?.reason || 'API error';
      throw new Error(`Africa's Talking SMS failed: ${errorMsg}`);
    }

    res.json({ message: 'Verification code sent successfully.', status: 'sent' });
  } catch (err) {
    console.error('Error sending SMS token:', err);
    res.status(500).json({ message: 'Failed to send verification SMS.', error: err.message });
  }
});

// Verify SMS token
router.post('/verify-sms-token', verifyToken, async (req, res) => {
  const { phone, token } = req.body;
  if (!phone || !token) {
    return res.status(400).json({ message: 'Phone and token are required.' });
  }

  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+233' + formattedPhone.substring(1);
    } else {
      formattedPhone = '+' + formattedPhone;
    }
  }

  try {
    const record = await queryOne(
      'SELECT * FROM sms_tokens WHERE phone = ? AND token = ? AND verified = 0 ORDER BY id DESC LIMIT 1',
      [formattedPhone, token.trim()]
    );

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    // Mark as verified
    await run('UPDATE sms_tokens SET verified = 1 WHERE id = ?', [record.id]);

    res.json({ message: 'Phone number verified successfully.', verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed.', error: err.message });
  }
});

export default router;
