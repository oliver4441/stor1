-- Phase 5: Admin Dashboard Settings + Final Polish
-- Adds admin policies for notes, preparation for settings table

-- Ensure admin role can manage all orders (notes was already in schema)
-- This migration is idempotent — safe to run multiple times

-- Add admin_notes column if not exists (for future use, separate from customer notes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'omix_orders' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE omix_orders ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Admin policies for orders
DROP POLICY IF EXISTS "Admins can view all orders" ON omix_orders;
CREATE POLICY "Admins can view all orders" ON omix_orders
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON omix_orders;
CREATE POLICY "Admins can update all orders" ON omix_orders
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete all orders" ON omix_orders;
CREATE POLICY "Admins can delete all orders" ON omix_orders
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Admin policies for order items
DROP POLICY IF EXISTS "Admins can view all order items" ON omix_order_items;
CREATE POLICY "Admins can view all order items" ON omix_order_items
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Admin policies for listings (full CRUD)
DROP POLICY IF EXISTS "Admins can manage all listings" ON listings;
CREATE POLICY "Admins can manage all listings" ON listings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
