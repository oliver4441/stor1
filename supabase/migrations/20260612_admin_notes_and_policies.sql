-- Add admin_notes column to omix_orders if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'omix_orders' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE omix_orders ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Add admin policy to view all orders (if not exists)
DROP POLICY IF EXISTS "Admins can view all orders" ON omix_orders;
CREATE POLICY "Admins can view all orders" ON omix_orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add admin policy to update all orders (if not exists)
DROP POLICY IF EXISTS "Admins can update all orders" ON omix_orders;
CREATE POLICY "Admins can update all orders" ON omix_orders
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add admin policy to delete all orders (if not exists)
DROP POLICY IF EXISTS "Admins can delete all orders" ON omix_orders;
CREATE POLICY "Admins can delete all orders" ON omix_orders
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add admin policy to view all order items (if not exists)
DROP POLICY IF EXISTS "Admins can view all order items" ON omix_order_items;
CREATE POLICY "Admins can view all order items" ON omix_order_items
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Grant full access to authenticated for listings (admin needs this)
DROP POLICY IF EXISTS "Admins can manage all listings" ON listings;
CREATE POLICY "Admins can manage all listings" ON listings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
