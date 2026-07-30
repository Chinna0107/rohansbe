require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'thehouseoframya@gmail.com';
  const password = 'Admin@1234';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    await pool.query('UPDATE users SET password = $1, name = $2 WHERE email = $3', [hashed, 'Admin', email]);
    console.log('Admin password updated.');
  } else {
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      ['Admin', email, hashed]
    );
    console.log('Admin user created.');
  }

  console.log(`\nAdmin Credentials:\n  Email:    ${email}\n  Password: ${password}`);
  process.exit(0);
}

seedAdmin().catch(err => { console.error(err); process.exit(1); });
