const express = require('express');
const sql = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all sliders (public)
router.get('/', async (req, res) => {
  try {
    const sliders = await sql`SELECT * FROM sliders ORDER BY id DESC`;
    const formattedSliders = sliders.map(s => ({
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
    
    const result = await sql`
      INSERT INTO sliders (image_url, title, description)
      VALUES (${finalImageUrl}, ${title || null}, ${description || null})
      RETURNING *
    `;
    const slider = {
      id: result[0].id,
      imageUrl: result[0].image_url,
      title: result[0].title,
      description: result[0].description
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
    
    const result = await sql`
      UPDATE sliders 
      SET image_url = ${finalImageUrl}, title = ${title || null}, description = ${description || null}
      WHERE id = ${id}
      RETURNING *
    `;
    const slider = {
      id: result[0].id,
      imageUrl: result[0].image_url,
      title: result[0].title,
      description: result[0].description
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
    await sql`DELETE FROM sliders WHERE id = ${id}`;
    res.json({ success: true, message: 'Slider deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
