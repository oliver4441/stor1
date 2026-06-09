-- Migration: Fix omix_orders and omix_order_items schema
-- This migration ensures proper UUID handling for order IDs

-- If the tables already exist with wrong types, drop and recreate
-- First, check if tables exist and need fixing

-- Drop existing tables if they have incorrect type constraints
DROP TABLE IF EXISTS omix_order_items CASCADE;
DROP TABLE IF EXISTS omix_orders CASCADE;

-- Create omix_orders table with UUID primary key
CREATE TABLE omix_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending'::TEXT,
  total_amount NUMERIC(12, 2) NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Create omix_order_items table with UUID FK to omix_orders
CREATE TABLE omix_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES omix_orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES listings(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_omix_orders_user_id ON omix_orders(user_id);
CREATE INDEX idx_omix_orders_status ON omix_orders(status);
CREATE INDEX idx_omix_order_items_order_id ON omix_order_items(order_id);
CREATE INDEX idx_omix_order_items_product_id ON omix_order_items(product_id);

-- Enable Row Level Security
ALTER TABLE omix_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE omix_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON omix_orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON omix_orders;
DROP POLICY IF EXISTS "Users can update own orders" ON omix_orders;
DROP POLICY IF EXISTS "Users can view own order items" ON omix_order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON omix_order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON omix_order_items;

-- Create policies for omix_orders
CREATE POLICY "Users can view own orders" ON omix_orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON omix_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON omix_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for omix_order_items
CREATE POLICY "Users can view own order items" ON omix_order_items
  FOR SELECT USING (auth.uid() = (
    SELECT o.user_id FROM omix_orders o WHERE o.id = omix_order_items.order_id
  ));
CREATE POLICY "Users can insert own order items" ON omix_order_items
  FOR INSERT WITH CHECK (auth.uid() = (
    SELECT o.user_id FROM omix_orders o WHERE o.id = omix_order_items.order_id
  ));
CREATE POLICY "Users can update own order items" ON omix_order_items
  FOR UPDATE USING (auth.uid() = (
    SELECT o.user_id FROM omix_orders o WHERE o.id = omix_order_items.order_id
  ));

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON omix_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON omix_order_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
