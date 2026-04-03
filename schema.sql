-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  grams JSONB NOT NULL,
  prices JSONB NOT NULL,
  original_prices JSONB DEFAULT '{}',
  description TEXT NOT NULL,
  images JSONB NOT NULL,
  tag VARCHAR(50),
  gender VARCHAR(20),
  colors JSONB DEFAULT '[]',
  style_tags JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sliders table
CREATE TABLE sliders (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  total_savings NUMERIC(10,2) DEFAULT 0,
  coupon_code VARCHAR(50),
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  final_total NUMERIC(10,2),
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  order_status VARCHAR(50) DEFAULT 'pending',
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  order_date DATE DEFAULT CURRENT_DATE,
  order_time TIME DEFAULT CURRENT_TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for category filtering
CREATE INDEX idx_products_category ON products(category);

-- Insert a user
INSERT INTO users (email, password) 
VALUES ('user@example.com', 'password123');
