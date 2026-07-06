require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const tagRoutes = require('./routes/tagRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

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
      "https://houseoframya.in",
      "https://houseoframya.com"
    ],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/customer/orders', customerOrderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CMBE API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
