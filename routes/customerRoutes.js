const router = require('express').Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, addresses, wishlist FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, email, phone, addresses, wishlist',
      [name, phone, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Addresses
router.put('/addresses', async (req, res) => {
  const { addresses } = req.body; // Expecting array of address objects
  try {
    const result = await pool.query(
      'UPDATE users SET addresses = $1::jsonb WHERE id = $2 RETURNING addresses',
      [JSON.stringify(addresses), req.user.id]
    );
    res.json(result.rows[0].addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Wishlist
router.put('/wishlist', async (req, res) => {
  const { wishlist } = req.body; // Expecting array of product IDs or objects
  try {
    const result = await pool.query(
      'UPDATE users SET wishlist = $1::jsonb WHERE id = $2 RETURNING wishlist',
      [JSON.stringify(wishlist), req.user.id]
    );
    res.json(result.rows[0].wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
