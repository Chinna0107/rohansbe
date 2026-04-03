const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Verify customer by email + phone from orders (public — customer login)
router.post('/customer/verify', async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) return res.status(400).json({ success: false, message: 'Email and phone required' });
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    const orders = result.rows
      .map(o => ({ ...o, customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer }))
      .filter(o => o.customer?.email?.toLowerCase() === email.toLowerCase() && o.customer?.phone === phone);

    if (!orders.length) {
      return res.json({ success: false, message: 'no_orders' });
    }
    const customer = orders[0].customer;
    res.json({ success: true, customer: { name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Razorpay order (public)
router.post('/razorpay/create', async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Razorpay payment signature (public)
router.post('/razorpay/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, verified: true });
  } else {
    res.status(400).json({ success: false, verified: false, error: 'Invalid signature' });
  }
});

// Get orders by customer email + phone (public — customer dashboard)
router.post('/customer/orders', async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) return res.status(400).json({ success: false });
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    const orders = result.rows
      .map(mapOrder)
      .filter(o => o.customer?.email?.toLowerCase() === email.toLowerCase() && o.customer?.phone === phone);
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Place order (public)
router.post('/', async (req, res) => {
  try {
    const {
      customer, items, subtotal, totalSavings,
      couponCode, couponDiscount, finalTotal,
      paymentMethod, paymentStatus,
      razorpayPaymentId, razorpayOrderId, razorpaySignature,
      createdAt, date, time
    } = req.body;

    const result = await pool.query(
      `INSERT INTO orders
        (customer, items, subtotal, total_savings, coupon_code, coupon_discount, final_total,
         payment_method, payment_status,
         razorpay_payment_id, razorpay_order_id, razorpay_signature, created_at, order_date, order_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [
        JSON.stringify(customer),
        JSON.stringify(items),
        subtotal,
        totalSavings || 0,
        couponCode || null,
        couponDiscount || 0,
        finalTotal || subtotal,
        paymentMethod,
        paymentStatus,
        razorpayPaymentId || null,
        razorpayOrderId || null,
        razorpaySignature || null,
        createdAt || new Date().toISOString(),
        date || null,
        time || null,
      ]
    );
    res.json({ success: true, orderId: result.rows[0].id });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const mapOrder = (o) => ({
  id: o.id,
  customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer,
  items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
  subtotal: o.subtotal,
  totalSavings: o.total_savings,
  couponCode: o.coupon_code,
  couponDiscount: o.coupon_discount,
  finalTotal: o.final_total || o.subtotal,
  paymentMethod: o.payment_method,
  paymentStatus: o.payment_status,
  orderStatus: o.order_status || 'pending',
  razorpayPaymentId: o.razorpay_payment_id,
  razorpayOrderId: o.razorpay_order_id,
  razorpaySignature: o.razorpay_signature,
  createdAt: o.created_at,
  orderDate: o.order_date,
  orderTime: o.order_time,
});

// Get all orders (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json({ success: true, orders: result.rows.map(mapOrder) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single order (admin only)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order: mapOrder(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET order_status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
