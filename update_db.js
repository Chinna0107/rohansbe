require('dotenv').config();
const pool = require('./config/db');

async function updateDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add columns to users
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS otp VARCHAR(10),
      ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]';
    `);
    
    // Allow password to be null (for google auth or OTP only)
    await client.query(`
      ALTER TABLE users
      ALTER COLUMN password DROP NOT NULL;
    `);

    // Add columns to orders
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
      ADD COLUMN IF NOT EXISTS return_reason TEXT,
      ADD COLUMN IF NOT EXISTS return_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(255);
    `);
    
    await client.query('COMMIT');
    console.log('Database schema updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateDb();
