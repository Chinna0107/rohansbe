const express = require('express');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendEmail } = require('../config/mailer');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// In-memory store for pending signups
const pendingSignups = new Map();

router.post('/send-signup-otp', async (req, res) => {
  const { email, name, phone } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60000; // 10 mins

    // Store in memory
    pendingSignups.set(email, { name, phone, otp, expiry });

    await sendEmail(email, 'Your Signup OTP Code', `Your OTP for signing up is ${otp}. It expires in 10 minutes.`);
    res.json({ message: 'Signup OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, otp } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const pendingUser = pendingSignups.get(email);
    if (!pendingUser) return res.status(400).json({ error: 'Please request a new OTP first' });
    
    if (pendingUser.otp !== otp || Date.now() > pendingUser.expiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
      [pendingUser.name, email, pendingUser.phone, hashed]
    );
    
    // Clear pending signup
    pendingSignups.delete(email);

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    if (!user.password) return res.status(401).json({ error: 'Please login using OTP or Google' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    delete user.otp;
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up.' });
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins

    await pool.query('UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3', [otp, expiry, user.id]);

    await sendEmail(email, 'Your OTP Code', `Your OTP for login is ${otp}. It expires in 10 minutes.`);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = result.rows[0];
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await pool.query('UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    delete user.password;
    delete user.otp;
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  // Mock Google login for now. Frontend will send { email, name, googleId }
  const { email, name, googleId } = req.body;
  try {
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      const create = await pool.query(
        'INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING *',
        [email, name, googleId]
      );
      user = create.rows[0];
    } else {
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = result.rows[0];
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, otp = NULL, otp_expiry = NULL WHERE id = $2', [hashed, user.id]);
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
