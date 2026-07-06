require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const alterTable = async () => {
  try {
    const queries = [
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS desktop VARCHAR(255);",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS mobile VARCHAR(255);",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS heading VARCHAR(255);",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS tag VARCHAR(255);",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS product_slug VARCHAR(255);",
      "ALTER TABLE sliders ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);"
    ];
    
    for (const q of queries) {
      await pool.query(q);
    }
    
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
};

alterTable();
