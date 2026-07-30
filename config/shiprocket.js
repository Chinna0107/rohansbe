const axios = require('axios');

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = null;

// Get or refresh Shiprocket token (valid 24h)
const getToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });
  cachedToken = res.data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
  return cachedToken;
};

const shiprocketApi = async (method, endpoint, data = null) => {
  const token = await getToken();
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
};

// Create a Shiprocket order + auto-assign courier
const createShipment = async (order) => {
  const customer = order.customer || {};
  const items = order.items || [];

  // Build order payload
  const orderPayload = {
    order_id: String(order.id),
    order_date: order.createdAt
      ? new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' '),
    pickup_location: 'Primary',
    channel_id: '',
    comment: 'ROHANS MATCHING CENTRE Order',
    billing_customer_name: customer.name || 'Customer',
    billing_last_name: '',
    billing_address: customer.address || customer.street || 'N/A',
    billing_address_2: customer.address2 || '',
    billing_city: customer.city || 'Hyderabad',
    billing_pincode: customer.pincode || customer.zip || '500001',
    billing_state: customer.state || 'Telangana',
    billing_country: 'India',
    billing_email: customer.email || '',
    billing_phone: (customer.phone || '').replace(/\D/g, '').slice(-10),
    shipping_is_billing: true,
    order_items: items.map((item, idx) => ({
      name: item.productName || item.name || `Item ${idx + 1}`,
      sku: item.productId ? `SKU-${item.productId}` : `SKU-${idx + 1}`,
      units: item.quantity || 1,
      selling_price: item.price || item.salePrice || 0,
      discount: 0,
      tax: 0,
      hsn: '',
    })),
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total: Number(order.finalTotal || order.subtotal || 0),
    length: 20,
    breadth: 15,
    height: 5,
    weight: 0.5,
  };

  // Step 1: Create order on Shiprocket
  const created = await shiprocketApi('POST', '/orders/create/adhoc', orderPayload);

  if (!created.order_id && !created.shipment_id) {
    throw new Error(created.message || 'Failed to create Shiprocket order');
  }

  const shipmentId = created.shipment_id;

  // Step 2: Auto-assign best courier
  let courierData = null;
  try {
    courierData = await shiprocketApi('POST', '/courier/assign/awb', {
      shipment_id: String(shipmentId),
    });
  } catch (e) {
    // courier assign is best-effort
    console.warn('Courier auto-assign failed:', e.message);
  }

  // Step 3: Generate pickup request
  try {
    await shiprocketApi('POST', '/courier/generate/pickup', {
      shipment_id: [String(shipmentId)],
    });
  } catch (e) {
    console.warn('Pickup generation failed:', e.message);
  }

  return {
    shiprocket_order_id: created.order_id,
    shipment_id: shipmentId,
    awb_code: courierData?.response?.data?.awb_assign_status === 1
      ? courierData.response.data.awb_code
      : null,
    courier_name: courierData?.response?.data?.courier_name || null,
    status: created.status || 'created',
  };
};

// Track shipment by AWB
const trackShipment = async (awbCode) => {
  return await shiprocketApi('GET', `/courier/track/awb/${awbCode}`);
};

// Cancel shipment
const cancelShipment = async (awbCodes) => {
  return await shiprocketApi('POST', '/orders/cancel/shipment/awbs', {
    awbs: Array.isArray(awbCodes) ? awbCodes : [awbCodes],
  });
};

module.exports = { createShipment, trackShipment, cancelShipment, getToken };
