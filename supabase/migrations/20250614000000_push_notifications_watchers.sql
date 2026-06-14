-- Push subscriptions table for web push notifications
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

CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Price drop alert watchers
CREATE TABLE IF NOT EXISTS public.price_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  target_price DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id, COALESCE(target_price, -1))
);

ALTER TABLE public.price_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own price watchers"
  ON public.price_watchers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_price_watchers_user_id ON public.price_watchers(user_id);
CREATE INDEX idx_price_watchers_listing_id ON public.price_watchers(listing_id);

-- Back in stock alert watchers
CREATE TABLE IF NOT EXISTS public.stock_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.stock_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stock watchers"
  ON public.stock_watchers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_stock_watchers_user_id ON public.stock_watchers(user_id);
CREATE INDEX idx_stock_watchers_listing_id ON public.stock_watchers(listing_id);
