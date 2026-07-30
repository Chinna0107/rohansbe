require('dotenv').config();
const pool = require('./config/db');

const migrate = async () => {
  try {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
        ADD COLUMN IF NOT EXISTS shipment_id TEXT,
        ADD COLUMN IF NOT EXISTS awb_code TEXT,
        ADD COLUMN IF NOT EXISTS courier_name TEXT;
    `);
    console.log('✅ Shiprocket columns added to orders table');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
