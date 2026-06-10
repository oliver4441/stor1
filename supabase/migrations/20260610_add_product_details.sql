-- Add new product detail columns to listings table
-- Run this in Supabase SQL Editor

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_listings_quantity ON listings(quantity);
CREATE INDEX IF NOT EXISTS idx_listings_brand ON listings(brand);
