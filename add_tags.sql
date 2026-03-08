-- Add tag column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS tag VARCHAR(100);
