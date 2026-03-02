const express = require('express');
const sql = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await sql`SELECT * FROM products ORDER BY id DESC`;
    const parsedProducts = products.map(p => ({
      ...p,
      grams: typeof p.grams === 'string' ? JSON.parse(p.grams) : p.grams,
      prices: typeof p.prices === 'string' ? JSON.parse(p.prices) : p.prices,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images
    }));
    res.json({ success: true, products: parsedProducts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add product (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, grams, prices, price, description, images } = req.body;
    console.log('Received product data:', req.body);
    
    // Support both old (single price) and new (multiple prices) format
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await sql`
      INSERT INTO products (name, category, grams, prices, description, images)
      VALUES (${name}, ${category}, ${JSON.stringify(finalGrams)}, ${JSON.stringify(finalPrices)}, ${description}, ${JSON.stringify(images)})
      RETURNING *
    `;
    const product = { 
      ...result[0], 
      grams: typeof result[0].grams === 'string' ? JSON.parse(result[0].grams) : result[0].grams,
      prices: typeof result[0].prices === 'string' ? JSON.parse(result[0].prices) : result[0].prices,
      images: typeof result[0].images === 'string' ? JSON.parse(result[0].images) : result[0].images
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
    const { name, category, grams, prices, price, description, images } = req.body;
    console.log('Updating product:', req.body);
    
    // Support both old (single price) and new (multiple prices) format
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await sql`
      UPDATE products 
      SET name = ${name}, category = ${category}, grams = ${JSON.stringify(finalGrams)}, 
          prices = ${JSON.stringify(finalPrices)}, description = ${description}, images = ${JSON.stringify(images)}
      WHERE id = ${id}
      RETURNING *
    `;
    const product = { 
      ...result[0], 
      grams: typeof result[0].grams === 'string' ? JSON.parse(result[0].grams) : result[0].grams,
      prices: typeof result[0].prices === 'string' ? JSON.parse(result[0].prices) : result[0].prices,
      images: typeof result[0].images === 'string' ? JSON.parse(result[0].images) : result[0].images
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
    await sql`DELETE FROM products WHERE id = ${id}`;
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
