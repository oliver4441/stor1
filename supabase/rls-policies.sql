-- Run this in your Supabase SQL Editor
-- Drops all existing policies first, then recreates them cleanly

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'profiles','listings','omix_orders','referral_rewards',
      'points_transactions','omix_order_items','promo_codes',
      'product_reviews','wishlist','saved_addresses'
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ========================================
-- PROFILES
-- ========================================
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ========================================
-- LISTINGS
-- ========================================
CREATE POLICY "Anyone read active listings" ON listings
  FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers read own listings" ON listings
  FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Admins read all listings" ON listings
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Users create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers update own listings" ON listings
  FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "Admins update any listing" ON listings
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Sellers delete own listings" ON listings
  FOR DELETE USING (seller_id = auth.uid());
CREATE POLICY "Admins delete any listing" ON listings
  FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ========================================
-- OMIX ORDERS
-- ========================================
CREATE POLICY "Users read own orders" ON omix_orders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins read all orders" ON omix_orders
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Users create orders" ON omix_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users cancel own orders" ON omix_orders
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (status = 'cancelled');
CREATE POLICY "Admins update any order" ON omix_orders
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ========================================
-- REFERRAL REWARDS
-- ========================================
CREATE POLICY "Users read own referral rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id);

-- ========================================
-- POINTS TRANSACTIONS
-- ========================================
CREATE POLICY "Users read own points" ON points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- OMIX ORDER ITEMS
-- ========================================
CREATE POLICY "Users read own order items" ON omix_order_items
  FOR SELECT USING (order_id IN (SELECT id FROM omix_orders WHERE user_id = auth.uid()));
CREATE POLICY "Admins read all order items" ON omix_order_items
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Users create order items" ON omix_order_items
  FOR INSERT WITH CHECK (order_id IN (SELECT id FROM omix_orders WHERE user_id = auth.uid()));

-- ========================================
-- PROMO CODES
-- ========================================
CREATE POLICY "Anyone read active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage promo codes select" ON promo_codes
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins manage promo codes insert" ON promo_codes
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins manage promo codes update" ON promo_codes
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins manage promo codes delete" ON promo_codes
  FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ========================================
-- PRODUCT REVIEWS
-- ========================================
CREATE POLICY "Anyone read reviews" ON product_reviews
  FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- WISHLIST
-- ========================================
CREATE POLICY "Users read own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users add to wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove from wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- SAVED ADDRESSES
-- ========================================
CREATE POLICY "Users read own addresses" ON saved_addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users add addresses" ON saved_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own addresses" ON saved_addresses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own addresses" ON saved_addresses
  FOR DELETE USING (auth.uid() = user_id);
