require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const redis = require('./config/redis');

async function seed() {
  try {
    // 1. Add User
    const email = 'chinnakancharla1@gmail.com';
    const password = 'test123';
    const hashed = await bcrypt.hash(password, 10);
    
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (userRes.rows.length === 0) {
      const res = await pool.query(
        'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Chinna Kancharla', email, '9876543210', hashed]
      );
      user = res.rows[0];
      console.log('User created:', user.email);
    } else {
      user = userRes.rows[0];
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, email]);
      console.log('User password updated:', user.email);
    }

    // 2. Add some products (LEHENGAS, KURTIS, DRESSES, ANARKALIS) for Women
    const products = [
      {
        name: 'Bridal Velvet Lehenga Choli', category: 'LEHENGAS', gender: 'Female', tag: 'trending',
        grams: ['Free Size'], prices: { 'Free Size': 8999 }, originalPrices: { 'Free Size': 12999 },
        description: 'Exquisite bridal velvet lehenga with heavy zari embroidery.',
        images: ['https://images.pexels.com/photos/10129758/pexels-photo-10129758.jpeg', 'https://images.pexels.com/photos/10129757/pexels-photo-10129757.jpeg'],
        colors: [{ name: 'Maroon', hex: '#800000', images: [], stock: {'Free Size': 10} }],
        styleTags: ['Bridal', 'Velvet', 'Wedding']
      },
      {
        name: 'Pastel Organza Lehenga', category: 'LEHENGAS', gender: 'Female', tag: 'new',
        grams: ['Free Size'], prices: { 'Free Size': 5499 }, originalPrices: { 'Free Size': 7999 },
        description: 'Lightweight pastel organza lehenga with mirror work.',
        images: ['https://images.pexels.com/photos/10129755/pexels-photo-10129755.jpeg'],
        colors: [{ name: 'Mint Green', hex: '#98FF98', images: [], stock: {'Free Size': 25} }],
        styleTags: ['Party Wear', 'Organza']
      },
      {
        name: 'Cotton Printed Anarkali Suit', category: 'ANARKALIS', gender: 'Female', tag: 'bestseller',
        grams: ['M', 'L', 'XL'], prices: { 'M': 2499, 'L': 2499, 'XL': 2499 }, originalPrices: { 'M': 3999, 'L': 3999, 'XL': 3999 },
        description: 'Comfortable pure cotton printed Anarkali suit with dupatta.',
        images: ['https://images.pexels.com/photos/3315264/pexels-photo-3315264.jpeg'],
        colors: [{ name: 'Indigo Blue', hex: '#4B0082', images: [], stock: {'M': 10, 'L': 15, 'XL': 12} }],
        styleTags: ['Daily Wear', 'Cotton']
      },
      {
        name: 'Georgette Sharara Suit', category: 'KURTIS', gender: 'Female', tag: 'popular',
        grams: ['S', 'M', 'L'], prices: { 'S': 3299, 'M': 3299, 'L': 3299 }, originalPrices: { 'S': 4999, 'M': 4999, 'L': 4999 },
        description: 'Trendy georgette sharara suit set for festive occasions.',
        images: ['https://images.pexels.com/photos/3315265/pexels-photo-3315265.jpeg'],
        colors: [{ name: 'Mustard Yellow', hex: '#FFDB58', images: [], stock: {'S': 5, 'M': 8, 'L': 6} }],
        styleTags: ['Festive', 'Georgette']
      },
      {
        name: 'Chikankari Maxi Dress', category: 'DRESSES', gender: 'Female', tag: 'limited',
        grams: ['S', 'M', 'L'], prices: { 'S': 1999, 'M': 1999, 'L': 1999 }, originalPrices: { 'S': 2999, 'M': 2999, 'L': 2999 },
        description: 'Elegant chikankari maxi dress perfect for summer brunches.',
        images: ['https://images.pexels.com/photos/3315266/pexels-photo-3315266.jpeg'],
        colors: [{ name: 'White', hex: '#FFFFFF', images: [], stock: {'S': 20, 'M': 20, 'L': 20} }],
        styleTags: ['Casual', 'Summer', 'Chikankari']
      }
    ];

    let insertedProducts = [];
    for (const p of products) {
      const res = await pool.query(
        'INSERT INTO products (name, category, grams, prices, original_prices, description, images, tag, gender, colors, style_tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
        [p.name, p.category, JSON.stringify(p.grams), JSON.stringify(p.prices), JSON.stringify(p.originalPrices), p.description, JSON.stringify(p.images), p.tag, p.gender, JSON.stringify(p.colors), JSON.stringify(p.styleTags)]
      );
      insertedProducts.push(res.rows[0]);
    }
    console.log('Inserted', insertedProducts.length, 'products');

    // 3. Place a dummy order
    const p1 = insertedProducts[0];
    const orderItems = [
      {
        id: p1.id, name: p1.name, category: p1.category,
        image: p1.images[0], price: 8999,
        size: 'Free Size', color: 'Maroon', qty: 1
      }
    ];

    const subtotal = 8999;
    const orderRes = await pool.query(
      'INSERT INTO orders (customer, items, subtotal, final_total, payment_method, payment_status, order_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [
        JSON.stringify({ id: user.id, name: user.name, email: user.email, phone: user.phone, address: { line1: '123 Dummy Street', city: 'Hyderabad', state: 'TS', pincode: '500001' } }),
        JSON.stringify(orderItems),
        subtotal, subtotal, 'cod', 'pending', 'confirmed'
      ]
    );
    console.log('Order created successfully with ID:', orderRes.rows[0].id);

    // Invalidate cache
    try { await redis.del('products:all'); } catch(e) {}

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

seed();
