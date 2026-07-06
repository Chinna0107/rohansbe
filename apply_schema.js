require('dotenv').config();
const fs = require('fs');
const pool = require('./config/db');

async function applySchema() {
  const schema = fs.readFileSync('schema.sql', 'utf8');
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Schema applied successfully');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

applySchema();
