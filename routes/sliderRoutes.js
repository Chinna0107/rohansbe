const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all sliders (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sliders ORDER BY sort_order ASC, id DESC');
    const formattedSliders = result.rows.map(s => ({
      id: s.id,
      imageUrl: s.image_url,
      desktop: s.desktop || s.image_url,
      mobile: s.mobile || s.image_url,
      title: s.title,
      heading: s.heading,
      description: s.description,
      desc: s.desc || s.description,
      tag: s.tag,
      order: s.sort_order,
      productId: s.product_id,
      productSlug: s.product_slug,
      productName: s.product_name,
      created_at: s.created_at
    }));
    res.json({ success: true, sliders: formattedSliders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add slider (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { image_url, imageUrl, image, title, description, desktop, mobile, heading, desc, tag, order, productId, productSlug, productName } = req.body;
    const finalImageUrl = desktop || image_url || imageUrl || image;
    
    console.log('Received slider data:', req.body);
    
    if (!finalImageUrl) {
      return res.status(400).json({ success: false, error: 'desktop (imageUrl) is required' });
    }
    
    const result = await pool.query(
      `INSERT INTO sliders 
        (image_url, title, description, desktop, mobile, heading, tag, sort_order, product_id, product_slug, product_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [finalImageUrl, title || null, description || desc || null, desktop || finalImageUrl, mobile || finalImageUrl, heading || null, tag || null, order || 1, productId || null, productSlug || null, productName || null]
    );
    const slider = {
      id: result.rows[0].id,
      imageUrl: result.rows[0].image_url,
      desktop: result.rows[0].desktop,
      mobile: result.rows[0].mobile,
      title: result.rows[0].title,
      heading: result.rows[0].heading,
      description: result.rows[0].description,
      desc: result.rows[0].description,
      tag: result.rows[0].tag,
      order: result.rows[0].sort_order,
      productId: result.rows[0].product_id,
      productSlug: result.rows[0].product_slug,
      productName: result.rows[0].product_name
    };
    res.json({ success: true, slider });
  } catch (error) {
    console.error('Error adding slider:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update slider (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, imageUrl, image, title, description, desktop, mobile, heading, desc, tag, order, productId, productSlug, productName } = req.body;
    const finalImageUrl = desktop || image_url || imageUrl || image;
    
    const result = await pool.query(
      `UPDATE sliders SET 
        image_url = $1, title = $2, description = $3, 
        desktop = $4, mobile = $5, heading = $6, tag = $7, sort_order = $8, 
        product_id = $9, product_slug = $10, product_name = $11 
       WHERE id = $12 RETURNING *`,
      [finalImageUrl, title || null, description || desc || null, desktop || finalImageUrl, mobile || finalImageUrl, heading || null, tag || null, order || 1, productId || null, productSlug || null, productName || null, id]
    );
    const slider = {
      id: result.rows[0].id,
      imageUrl: result.rows[0].image_url,
      desktop: result.rows[0].desktop,
      mobile: result.rows[0].mobile,
      title: result.rows[0].title,
      heading: result.rows[0].heading,
      description: result.rows[0].description,
      desc: result.rows[0].description,
      tag: result.rows[0].tag,
      order: result.rows[0].sort_order,
      productId: result.rows[0].product_id,
      productSlug: result.rows[0].product_slug,
      productName: result.rows[0].product_name
    };
    res.json({ success: true, slider });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete slider (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sliders WHERE id = $1', [id]);
    res.json({ success: true, message: 'Slider deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
