const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const redis = require('../config/redis');
const router = express.Router();

const CACHE_KEY = 'products:all';
const CACHE_TTL = 300; // 5 minutes

const invalidateCache = async () => {
  try { await redis.del(CACHE_KEY); } catch { /* silent */ }
};

const parse = (val, fallback) => {
  if (!val) return fallback;
  return typeof val === 'string' ? JSON.parse(val) : val;
};

const mapProduct = (p) => ({
  ...p,
  grams: parse(p.grams, []),
  prices: parse(p.prices, {}),
  originalPrices: parse(p.original_prices, {}),
  images: parse(p.images, []),
  colors: parse(p.colors, []),
  styleTags: parse(p.style_tags, []),
  gender: p.gender || null,
  washing_instructions: p.washing_instructions || '',
  festiveSeason: p.festive_season || false,
  videoUrl: p.video_url || '',
});

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    // try cache first
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return res.json({ success: true, products: JSON.parse(cached), fromCache: true });
    } catch { /* Redis unavailable — fall through to DB */ }

    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    const products = result.rows.map(mapProduct);

    // store in cache
    try { await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(products)); } catch { /* silent */ }

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add product (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, grams, prices, originalPrices, price, description, images, tag, gender, colors, styleTags, washingInstructions, festiveSeason, videoUrl } = req.body;
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await pool.query(
      'INSERT INTO products (name, category, grams, prices, original_prices, description, images, tag, gender, colors, style_tags, washing_instructions, festive_season, video_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [name, category, JSON.stringify(finalGrams), JSON.stringify(finalPrices), JSON.stringify(originalPrices || {}), description, JSON.stringify(images || []), tag || null, gender || null, JSON.stringify(colors || []), JSON.stringify(styleTags || []), washingInstructions || '', festiveSeason || false, videoUrl || null]
    );
    const product = mapProduct(result.rows[0]);
    await invalidateCache();
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
    const { name, category, grams, prices, originalPrices, price, description, images, tag, gender, colors, styleTags, washingInstructions, festiveSeason, videoUrl } = req.body;
    const finalGrams = Array.isArray(grams) ? grams : [grams];
    const finalPrices = prices || { [grams]: price };
    
    const result = await pool.query(
      'UPDATE products SET name=$1, category=$2, grams=$3, prices=$4, original_prices=$5, description=$6, images=$7, tag=$8, gender=$9, colors=$10, style_tags=$11, washing_instructions=$12, festive_season=$13, video_url=$14 WHERE id=$15 RETURNING *',
      [name, category, JSON.stringify(finalGrams), JSON.stringify(finalPrices), JSON.stringify(originalPrices || {}), description, JSON.stringify(images || []), tag || null, gender || null, JSON.stringify(colors || []), JSON.stringify(styleTags || []), washingInstructions || '', festiveSeason || false, videoUrl || null, id]
    );
    const product = mapProduct(result.rows[0]);
    await invalidateCache();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update stock per color+size (public — called from Checkout after order)
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { colorIndex, colorName, colorHex, size, add, decrease } = req.body;

    const result = await pool.query('SELECT colors FROM products WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });

    const colors = parse(result.rows[0].colors, []);
    if (!colors.length) return res.json({ success: true }); // no color tracking

    let idx = -1;
    if (add !== undefined) {
      idx = Number(colorIndex) || 0;
    } else {
      // try match by name/hex, fallback to index 0 if single color or no color info sent
      if (colorName || colorHex) {
        idx = colors.findIndex(c =>
          (colorName && c.name === colorName) ||
          (colorHex  && c.hex  === colorHex)
        );
      }
      if (idx === -1) idx = colors.length === 1 ? 0 : -1;
    }

    if (idx === -1 || idx >= colors.length) {
      return res.status(400).json({ success: false, error: 'Color not found' });
    }
    if (!size) return res.status(400).json({ success: false, error: 'size is required' });

    const color = colors[idx];
    if (!color.stock) color.stock = {};
    const current = Number(color.stock[size] || 0);

    color.stock[size] = add !== undefined
      ? current + Number(add)
      : Math.max(0, current - Number(decrease));

    colors[idx] = color;

    const updated = await pool.query(
      'UPDATE products SET colors = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(colors), id]
    );
    res.json({ success: true, product: mapProduct(updated.rows[0]) });
    await invalidateCache();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    await invalidateCache();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
