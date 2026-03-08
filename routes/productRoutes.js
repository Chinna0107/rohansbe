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
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images
    }));
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add product (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, grams, prices, price, description, images, tag } = req.body;
    console.log('Received product data:', req.body);
    
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await pool.query(
      'INSERT INTO products (name, category, grams, prices, description, images, tag) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, category, JSON.stringify(finalGrams), JSON.stringify(finalPrices), description, JSON.stringify(images), tag || null]
    );
    const product = { 
      ...result.rows[0], 
      grams: typeof result.rows[0].grams === 'string' ? JSON.parse(result.rows[0].grams) : result.rows[0].grams,
      prices: typeof result.rows[0].prices === 'string' ? JSON.parse(result.rows[0].prices) : result.rows[0].prices,
      images: typeof result.rows[0].images === 'string' ? JSON.parse(result.rows[0].images) : result.rows[0].images
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
    const { name, category, grams, prices, price, description, images, tag } = req.body;
    console.log('Updating product:', req.body);
    
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2, grams = $3, prices = $4, description = $5, images = $6, tag = $7 WHERE id = $8 RETURNING *',
      [name, category, JSON.stringify(finalGrams), JSON.stringify(finalPrices), description, JSON.stringify(images), tag || null, id]
    );
    const product = { 
      ...result.rows[0], 
      grams: typeof result.rows[0].grams === 'string' ? JSON.parse(result.rows[0].grams) : result.rows[0].grams,
      prices: typeof result.rows[0].prices === 'string' ? JSON.parse(result.rows[0].prices) : result.rows[0].prices,
      images: typeof result.rows[0].images === 'string' ? JSON.parse(result.rows[0].images) : result.rows[0].images
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
