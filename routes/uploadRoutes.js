const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const authMiddleware = require('../middleware/auth');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'house-of-ramya' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Image upload failed' });
      }
      res.json({ url: result.secure_url });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

module.exports = router;
