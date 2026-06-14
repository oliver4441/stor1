# Supabase RLS Policies — Omix Marketplace
# Run these in your Supabase SQL Editor (https://supabase.com/dashboard/project/gbviaoofrxqlmyanzsps/sql)

-- ========================================
-- PROFILES
-- ========================================
-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Admins can update any profile
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Service role can insert (for signup)
-- This is handled by default for authenticated users

-- ========================================
-- LISTINGS
-- ========================================
-- Anyone can read active listings
CREATE POLICY "Anyone read active listings" ON listings
  FOR SELECT USING (status = 'active');

-- Sellers can read their own listings (any status)
CREATE POLICY "Sellers read own listings" ON listings
  FOR SELECT USING (seller_id = auth.uid());

-- Admins can read all listings
CREATE POLICY "Admins read all listings" ON listings
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Authenticated users can create listings
CREATE POLICY "Users create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own listings
CREATE POLICY "Sellers update own listings" ON listings
  FOR UPDATE USING (seller_id = auth.uid());

-- Admins can update any listing
CREATE POLICY "Admins update any listing" ON listings
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Sellers can delete their own listings
CREATE POLICY "Sellers delete own listings" ON listings
  FOR DELETE USING (seller_id = auth.uid());

-- Admins can delete any listing
CREATE POLICY "Admins delete any listing" ON listings
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ========================================
-- OMIX ORDERS
-- ========================================
-- Users can read their own orders
CREATE POLICY "Users read own orders" ON omix_orders
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read all orders
CREATE POLICY "Admins read all orders" ON omix_orders
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Authenticated users can create orders
CREATE POLICY "Users create orders" ON omix_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own orders (e.g., cancel)
CREATE POLICY "Users cancel own orders" ON omix_orders
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (status = 'cancelled');

-- Admins can update any order
CREATE POLICY "Admins update any order" ON omix_orders
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ========================================
-- REFERRAL REWARDS
-- ========================================
-- Referrers can read their own rewards
CREATE POLICY "Users read own referral rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id);

-- System can insert referral rewards (via API with service key)
-- Users can read rewards where they are the referrer or referee

-- ========================================
-- POINTS TRANSACTIONS
-- ========================================
-- Users can read their own points transactions
CREATE POLICY "Users read own points" ON points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert points (via API with service key)


-- ========================================
-- OMIX ORDER ITEMS
-- ========================================
-- Users can read their own order items
CREATE POLICY "Users read own order items" ON omix_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM omix_orders WHERE user_id = auth.uid())
  );

-- Admins can read all order items
CREATE POLICY "Admins read all order items" ON omix_order_items
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Authenticated users can create order items (via their orders)
CREATE POLICY "Users create order items" ON omix_order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM omix_orders WHERE user_id = auth.uid())
  );

-- ========================================
-- PROMO CODES
-- ========================================
-- Anyone can read active promo codes (to validate at checkout)
CREATE POLICY "Anyone read active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true);

-- Admins can manage all promo codes
CREATE POLICY "Admins manage promo codes" ON promo_codes
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ========================================
-- PRODUCT REVIEWS
-- ========================================
-- Anyone can read reviews
CREATE POLICY "Anyone read reviews" ON product_reviews
  FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Users create reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users delete own reviews" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- WISHLIST
-- ========================================
-- Users can read their own wishlist
CREATE POLICY "Users read own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add to their wishlist
CREATE POLICY "Users add to wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove from their wishlist
CREATE POLICY "Users remove from wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- SAVED ADDRESSES
-- ========================================
-- Users can read their own saved addresses
CREATE POLICY "Users read own addresses" ON saved_addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add addresses
CREATE POLICY "Users add addresses" ON saved_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their addresses
CREATE POLICY "Users update own addresses" ON saved_addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their addresses
CREATE POLICY "Users delete own addresses" ON saved_addresses
  FOR DELETE USING (auth.uid() = user_id);
