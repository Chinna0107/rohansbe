require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const sliderRoutes = require('./routes/sliderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://cmsupermart.vercel.app",
      "https://cmsupermart-git-main-chinna0107s-projects.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sliders', sliderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CMBE API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
