const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, password]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, email: result.rows[0].email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ success: true, message: 'User registered', user: result.rows[0], token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }
    
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

module.exports = router;
