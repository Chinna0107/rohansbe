const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { createShipment, trackShipment, cancelShipment } = require('../config/shiprocket');

const mapOrder = (o) => ({
  id: o.id,
  customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer,
  items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
  subtotal: o.subtotal,
  finalTotal: o.final_total || o.subtotal,
  paymentMethod: o.payment_method,
  paymentStatus: o.payment_status,
  orderStatus: o.order_status || 'pending',
  createdAt: o.created_at,
  shiprocket_order_id: o.shiprocket_order_id,
  shipment_id: o.shipment_id,
  awb_code: o.awb_code,
  courier_name: o.courier_name,
});

// POST /api/shiprocket/create/:orderId — Create shipment for an order
router.post('/create/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = mapOrder(result.rows[0]);

    if (order.shiprocket_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Shipment already created',
        shiprocket_order_id: order.shiprocket_order_id,
        awb_code: order.awb_code,
      });
    }

    // Create shipment via Shiprocket
    const shipData = await createShipment(order);

    // Save Shiprocket data back to order
    await pool.query(
      `UPDATE orders SET
        shiprocket_order_id = $1,
        shipment_id = $2,
        awb_code = $3,
        courier_name = $4,
        order_status = 'shipped'
       WHERE id = $5`,
      [
        shipData.shiprocket_order_id,
        shipData.shipment_id,
        shipData.awb_code,
        shipData.courier_name,
        orderId,
      ]
    );

    res.json({ success: true, ...shipData });
  } catch (err) {
    console.error('Shiprocket create error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

// GET /api/shiprocket/track/:awb — Track shipment
router.get('/track/:awb', authMiddleware, async (req, res) => {
  try {
    const data = await trackShipment(req.params.awb);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/shiprocket/cancel/:orderId — Cancel shipment
router.post('/cancel/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT awb_code FROM orders WHERE id = $1', [req.params.orderId]);
    if (!result.rows.length || !result.rows[0].awb_code) {
      return res.status(404).json({ success: false, message: 'No AWB found for this order' });
    }
    const awb = result.rows[0].awb_code;
    const data = await cancelShipment(awb);

    await pool.query(
      `UPDATE orders SET order_status = 'cancelled' WHERE id = $1`,
      [req.params.orderId]
    );

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
