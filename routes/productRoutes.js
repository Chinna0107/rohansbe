const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    const products = result.rows.map(p => ({
      ...p,
      grams: typeof p.grams === 'string' ? JSON.parse(p.grams) : p.grams,
      prices: typeof p.prices === 'string' ? JSON.parse(p.prices) : p.prices,
      originalPrices: typeof p.original_prices === 'string' ? JSON.parse(p.original_prices) : (p.original_prices || {}),
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      gender: p.gender || null
    }));
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add product (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, grams, prices, originalPrices, price, description, images, tag, gender } = req.body;
    console.log('Received product data:', req.body);
    
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await pool.query(
      'INSERT INTO products (name, category, grams, prices, original_prices, description, images, tag, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, category, JSON.stringify(finalGrams), JSON.stringify(finalPrices), JSON.stringify(originalPrices || {}), description, JSON.stringify(images), tag || null, gender || null]
    );
    const row = result.rows[0];
    const product = { 
      ...row, 
      grams: typeof row.grams === 'string' ? JSON.parse(row.grams) : row.grams,
      prices: typeof row.prices === 'string' ? JSON.parse(row.prices) : row.prices,
      originalPrices: typeof row.original_prices === 'string' ? JSON.parse(row.original_prices) : (row.original_prices || {}),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
    };
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update product (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, grams, prices, originalPrices, price, description, images, tag, gender } = req.body;
    console.log('Updating product:', req.body);
    
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2, grams = $3, prices = $4, original_prices = $5, description = $6, images = $7, tag = $8, gender = $9 WHERE id = $10 RETURNING *',
      [name, category, JSON.stringify(finalGrams), JSON.stringify(finalPrices), JSON.stringify(originalPrices || {}), description, JSON.stringify(images), tag || null, gender || null, id]
    );
    const row = result.rows[0];
    const product = { 
      ...row, 
      grams: typeof row.grams === 'string' ? JSON.parse(row.grams) : row.grams,
      prices: typeof row.prices === 'string' ? JSON.parse(row.prices) : row.prices,
      originalPrices: typeof row.original_prices === 'string' ? JSON.parse(row.original_prices) : (row.original_prices || {}),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
    };
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete product (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
