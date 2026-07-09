require('dotenv').config();
const pool = require('./config/db');

async function addSettingsTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);
    
    await client.query(`
      INSERT INTO settings (key, value) 
      VALUES ('top_banner_text', 'Order for above 499 to get free delivery')
      ON CONFLICT (key) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Settings table added successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding settings table:', err);
  } finally {
    client.release();
    pool.end();
  }
}

addSettingsTable();
