const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get all categories (public, used in forms and filters)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY created_at ASC');
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create category (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, styles, sizes, is_meters, image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    // Ensure styles and sizes are valid JSON strings or arrays
    const stylesJson = Array.isArray(styles) ? JSON.stringify(styles) : '[]';
    const sizesJson = Array.isArray(sizes) ? JSON.stringify(sizes) : '[]';
    const isMetersBool = Boolean(is_meters);

    const result = await pool.query(
      'INSERT INTO categories (name, description, styles, sizes, is_meters, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, stylesJson, sizesJson, isMetersBool, image_url]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, styles, sizes, is_meters, image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const stylesJson = Array.isArray(styles) ? JSON.stringify(styles) : '[]';
    const sizesJson = Array.isArray(sizes) ? JSON.stringify(sizes) : '[]';
    const isMetersBool = Boolean(is_meters);

    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, styles = $3, sizes = $4, is_meters = $5, image_url = $6 WHERE id = $7 RETURNING *',
      [name, description, stylesJson, sizesJson, isMetersBool, image_url, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
