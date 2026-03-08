const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all sliders (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sliders ORDER BY id DESC');
    const formattedSliders = result.rows.map(s => ({
      id: s.id,
      imageUrl: s.image_url,
      title: s.title,
      description: s.description,
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
    const { image_url, imageUrl, image, title, description } = req.body;
    const finalImageUrl = image_url || imageUrl || image;
    
    console.log('Received slider data:', req.body);
    
    if (!finalImageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO sliders (image_url, title, description) VALUES ($1, $2, $3) RETURNING *',
      [finalImageUrl, title || null, description || null]
    );
    const slider = {
      id: result.rows[0].id,
      imageUrl: result.rows[0].image_url,
      title: result.rows[0].title,
      description: result.rows[0].description
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
    const { image_url, imageUrl, image, title, description } = req.body;
    const finalImageUrl = image_url || imageUrl || image;
    
    const result = await pool.query(
      'UPDATE sliders SET image_url = $1, title = $2, description = $3 WHERE id = $4 RETURNING *',
      [finalImageUrl, title || null, description || null, id]
    );
    const slider = {
      id: result.rows[0].id,
      imageUrl: result.rows[0].image_url,
      title: result.rows[0].title,
      description: result.rows[0].description
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
