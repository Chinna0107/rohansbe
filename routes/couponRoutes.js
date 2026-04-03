const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Validate coupon (public — called from Checkout)
router.post('/validate', async (req, res) => {
  const { code, subtotal, phone } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: 'No coupon code provided' });

  try {
    const result = await pool.query('SELECT * FROM coupons WHERE code = $1', [code.toUpperCase()]);
    if (!result.rows.length) return res.json({ valid: false, message: 'Invalid coupon code' });

    const coupon = result.rows[0];

    if (!coupon.is_active) return res.json({ valid: false, message: 'This coupon is no longer active' });
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return res.json({ valid: false, message: 'This coupon has expired' });
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return res.json({ valid: false, message: 'This coupon has reached its usage limit' });
    if (subtotal < coupon.min_order) return res.json({ valid: false, message: `Minimum order of ₹${coupon.min_order} required` });

    // Check if this phone already used this coupon
    if (phone) {
      const used = await pool.query('SELECT id FROM coupon_uses WHERE coupon_code = $1 AND phone = $2', [code.toUpperCase(), phone]);
      if (used.rows.length) return res.json({ valid: false, message: 'You have already used this coupon' });
    }

    res.json({
      valid: true,
      discount: Number(coupon.discount),
      type: coupon.type,
      message: coupon.type === 'percent'
        ? `${coupon.discount}% off applied!`
        : `₹${coupon.discount} off applied!`,
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Record coupon usage — called after order is placed
router.post('/use', async (req, res) => {
  const { code, phone, orderId } = req.body;
  if (!code || !phone) return res.status(400).json({ success: false });
  try {
    await pool.query(
      'INSERT INTO coupon_uses (coupon_code, phone, order_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [code.toUpperCase(), phone, orderId || null]
    );
    await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE code = $1', [code.toUpperCase()]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ── Admin routes ──

// Get all coupons
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    res.json({ success: true, coupons: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create coupon
router.post('/', authMiddleware, async (req, res) => {
  const { code, type, discount, min_order, max_uses, expires_at } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO coupons (code, type, discount, min_order, max_uses, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [code.toUpperCase(), type, discount, min_order || 0, max_uses || null, expires_at || null]
    );
    res.json({ success: true, coupon: result.rows[0] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Toggle active/inactive
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE coupons SET is_active = NOT is_active WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete coupon
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
