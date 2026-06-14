-- Push subscriptions, price watchers, and stock watchers tables
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)

-- PUSH SUBSCRIPTIONS
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
DROP POLICY IF EXISTS "Users can manage their own push subscriptions select" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions select"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own push subscriptions insert" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own push subscriptions update" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions update"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own push subscriptions delete" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions delete"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- PRICE DROP WATCHERS
CREATE TABLE IF NOT EXISTS public.price_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  target_price DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id, COALESCE(target_price, -1))
);
ALTER TABLE public.price_watchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own price watchers select" ON public.price_watchers;
CREATE POLICY "Users can manage their own price watchers select"
  ON public.price_watchers FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own price watchers insert" ON public.price_watchers;
CREATE POLICY "Users can manage their own price watchers insert"
  ON public.price_watchers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own price watchers update" ON public.price_watchers;
CREATE POLICY "Users can manage their own price watchers update"
  ON public.price_watchers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own price watchers delete" ON public.price_watchers;
CREATE POLICY "Users can manage their own price watchers delete"
  ON public.price_watchers FOR DELETE
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_price_watchers_user_id ON public.price_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_price_watchers_listing_id ON public.price_watchers(listing_id);

-- BACK IN STOCK WATCHERS
CREATE TABLE IF NOT EXISTS public.stock_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
ALTER TABLE public.stock_watchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock watchers select" ON public.stock_watchers;
CREATE POLICY "Users can manage their own stock watchers select"
  ON public.stock_watchers FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own stock watchers insert" ON public.stock_watchers;
CREATE POLICY "Users can manage their own stock watchers insert"
  ON public.stock_watchers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own stock watchers update" ON public.stock_watchers;
CREATE POLICY "Users can manage their own stock watchers update"
  ON public.stock_watchers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own stock watchers delete" ON public.stock_watchers;
CREATE POLICY "Users can manage their own stock watchers delete"
  ON public.stock_watchers FOR DELETE
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchers_user_id ON public.stock_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchers_listing_id ON public.stock_watchers(listing_id);
