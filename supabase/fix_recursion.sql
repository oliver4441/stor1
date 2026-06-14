-- Fix infinite recursion in profiles policies
-- Step 1: Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' LIMIT 1
  );
$$;

-- Step 2: Drop the recursive policies on profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;

-- Step 3: Recreate them using the is_admin() function (no recursion)
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (is_admin());
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE USING (is_admin());

-- Step 4: Fix listings policies that also reference profiles
DROP POLICY IF EXISTS "Admins read all listings" ON listings;
DROP POLICY IF EXISTS "Admins update any listing" ON listings;
DROP POLICY IF EXISTS "Admins delete any listing" ON listings;

CREATE POLICY "Admins read all listings" ON listings
  FOR SELECT USING (is_admin());
CREATE POLICY "Admins update any listing" ON listings
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete any listing" ON listings
  FOR DELETE USING (is_admin());

-- Step 5: Fix omix_orders policies that reference profiles
DROP POLICY IF EXISTS "Admins read all orders" ON omix_orders;
DROP POLICY IF EXISTS "Admins update any order" ON omix_orders;

CREATE POLICY "Admins read all orders" ON omix_orders
  FOR SELECT USING (is_admin());
CREATE POLICY "Admins update any order" ON omix_orders
  FOR UPDATE USING (is_admin());

-- Step 6: Fix omix_order_items policies that reference profiles
DROP POLICY IF EXISTS "Admins read all order items" ON omix_order_items;
CREATE POLICY "Admins read all order items" ON omix_order_items
  FOR SELECT USING (is_admin());

-- Step 7: Fix promo_codes policies that reference profiles
DROP POLICY IF EXISTS "Admins manage promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins manage promo codes select" ON promo_codes;
DROP POLICY IF EXISTS "Admins manage promo codes insert" ON promo_codes;
DROP POLICY IF EXISTS "Admins manage promo codes update" ON promo_codes;
DROP POLICY IF EXISTS "Admins manage promo codes delete" ON promo_codes;

CREATE POLICY "Admins manage promo codes" ON promo_codes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
