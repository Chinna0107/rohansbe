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

// Get Order History
router.get('/', async (req, res) => {
  try {
    // Assuming `customer` JSONB contains the user ID or email.
    // For robust querying, it's better to store user_id in orders.
    // We will fetch user email to match it.
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const userEmail = userResult.rows[0].email;

    // Filter orders where customer->>'email' = userEmail
    const result = await pool.query(
      "SELECT * FROM orders WHERE customer->>'email' = $1 ORDER BY created_at DESC",
      [userEmail]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Order
router.post('/:id/cancel', async (req, res) => {
  const { reason } = req.body;
  try {
    const result = await pool.query(
      "UPDATE orders SET order_status = 'cancelled', cancel_reason = $1 WHERE id = $2 RETURNING *",
      [reason, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return Request
router.post('/:id/return', async (req, res) => {
  const { reason } = req.body;
  try {
    const result = await pool.query(
      "UPDATE orders SET return_status = 'requested', return_reason = $1 WHERE id = $2 RETURNING *",
      [reason, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoice Download (Mock implementation)
router.get('/:id/invoice', async (req, res) => {
  // In a real app, generate PDF using PDFKit or return HTML
  // For now, return order details that frontend can render as a printable view
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ invoice: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
