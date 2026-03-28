require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const tagRoutes = require('./routes/tagRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // "http://localhost:5174",
      // // "http://localhost:3000",
      // "https://cmsupermart.com",
      // "https://cmsupermart.vercel.app",
      "https://thealphazone.in"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/tags', tagRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CMBE API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
