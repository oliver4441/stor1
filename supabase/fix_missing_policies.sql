-- ========================================
-- Fix missing RLS policies for new tables
-- ========================================

-- ========================================
-- 1. PRODUCT REVIEWS (0 policies)
-- ========================================
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read reviews" ON product_reviews
  FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 2. SAVED ADDRESSES (0 policies)
-- ========================================
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own addresses" ON saved_addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users add addresses" ON saved_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own addresses" ON saved_addresses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own addresses" ON saved_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. WISHLIST (0 policies)
-- ========================================
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users add to wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove from wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 4. PUSH SUBSCRIPTIONS (table doesn't exist yet)
-- ========================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- ========================================
-- 5. PRICE WATCHERS (table doesn't exist yet)
-- ========================================
CREATE TABLE IF NOT EXISTS public.price_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  target_price DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.price_watchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own price watchers" ON public.price_watchers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own price watchers" ON public.price_watchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own price watchers" ON public.price_watchers
  FOR DELETE USING (auth.uid() = user_id);
-- Add unique constraint separately (COALESCE not allowed in UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_watcher_unique
  ON public.price_watchers (user_id, listing_id, COALESCE(target_price, -1));
CREATE INDEX IF NOT EXISTS idx_price_watchers_user_id ON public.price_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_price_watchers_listing_id ON public.price_watchers(listing_id);

-- ========================================
-- 6. STOCK WATCHERS (table doesn't exist yet)
-- ========================================
CREATE TABLE IF NOT EXISTS public.stock_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
ALTER TABLE public.stock_watchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stock watchers" ON public.stock_watchers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stock watchers" ON public.stock_watchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stock watchers" ON public.stock_watchers
  FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchers_user_id ON public.stock_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchers_listing_id ON public.stock_watchers(listing_id);
