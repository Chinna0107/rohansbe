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

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for category filtering
CREATE INDEX idx_products_category ON products(category);

-- Insert a user
INSERT INTO users (email, password) 
VALUES ('user@example.com', 'password123');
