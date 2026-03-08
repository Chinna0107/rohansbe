const express = require('express');
const router = express.Router();

// Get predefined tags
router.get('/', async (req, res) => {
  const tags = [
    { id: 1, name: 'New Arrival' },
    { id: 2, name: 'Best Seller' },
    { id: 3, name: 'Organic' },
    { id: 4, name: 'Discount' },
    { id: 5, name: 'Featured' }
  ];
  res.json({ success: true, tags });
});

module.exports = router;
