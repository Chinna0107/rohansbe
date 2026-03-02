require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const app = express();
const PORT = 3000;

app.use(cors());
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
