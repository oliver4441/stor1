-- =====================================================
-- Blue Prism Supabase Migration for Omix Store
-- Project: fdwoezyataxhdtgjlfxt
-- Date: June 2026
-- =====================================================

-- ==========================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- PROFILES: add email, role, referred_by
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);

-- LISTINGS: add seller_name, seller_phone, sku, model, weight
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_name text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_phone text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS description text;

-- OMIX_ORDERS: add all missing order fields
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS total_amount bigint DEFAULT 0;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS promo_code_id uuid;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS promo_code_text text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS delivery_discount integer DEFAULT 0;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS loyalty_points_used integer DEFAULT 0;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS paystack_reference text;
ALTER TABLE public.omix_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- CATEGORIES: add image_url if missing
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

-- REVIEWS: ensure it has the right columns
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ==========================================
-- 2. CREATE MISSING TABLES
-- ==========================================

-- OMIX_ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.omix_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.omix_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  product_sku text,
  product_image text,
  price bigint NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  subtotal bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- SAVED_ADDRESSES
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text DEFAULT 'Home',
  area text NOT NULL,
  landmark text,
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- REFERRAL_REWARDS
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.omix_orders(id),
  reward_amount integer DEFAULT 100,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- POINTS_TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points integer NOT NULL,
  description text,
  reference_type text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

-- STOCK_WATCHERS
CREATE TABLE IF NOT EXISTS public.stock_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- ==========================================
-- 3. ENABLE RLS ON ALL TABLES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omix_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omix_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omix_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. CREATE RLS POLICIES
-- ==========================================

-- PROFILES: users can read all, update own, admin can do all
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- LISTINGS: anyone can read active, seller/admin can manage own
CREATE POLICY "Active listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Sellers can insert own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON public.listings FOR UPDATE USING (
  seller_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);
CREATE POLICY "Sellers can delete own listings" ON public.listings FOR DELETE USING (
  seller_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- OMIX_ORDERS: users can manage own orders, admin can see all
CREATE POLICY "Users can view own orders" ON public.omix_orders FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);
CREATE POLICY "Users can create own orders" ON public.omix_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.omix_orders FOR UPDATE USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);
CREATE POLICY "Users can delete own orders" ON public.omix_orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- OMIX_ORDER_ITEMS: follow order access
CREATE POLICY "Users can view own order items" ON public.omix_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.omix_orders WHERE omix_orders.id = omix_order_items.order_id AND (omix_orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))))
);
CREATE POLICY "Users can insert own order items" ON public.omix_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.omix_orders WHERE omix_orders.id = omix_order_items.order_id AND omix_orders.user_id = auth.uid())
);
CREATE POLICY "Admin can manage order items" ON public.omix_order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- SAVED_ADDRESSES: users can manage own
CREATE POLICY "Users can view own addresses" ON public.saved_addresses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own addresses" ON public.saved_addresses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own addresses" ON public.saved_addresses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own addresses" ON public.saved_addresses FOR DELETE USING (user_id = auth.uid());

-- REFERRAL_REWARDS: users can view own (as referrer or referee)
CREATE POLICY "Users can view own referral rewards" ON public.referral_rewards FOR SELECT USING (
  referrer_id = auth.uid() OR referee_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);
CREATE POLICY "System can create referral rewards" ON public.referral_rewards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can manage referral rewards" ON public.referral_rewards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- POINTS_TRANSACTIONS: users can view own, system can insert
CREATE POLICY "Users can view own points" ON public.points_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert points" ON public.points_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can manage points" ON public.points_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- PROMO_CODES: anyone can read active, admin can manage
CREATE POLICY "Active promo codes are viewable" ON public.promo_codes FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
CREATE POLICY "Admin can manage promo codes" ON public.promo_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- REVIEWS: anyone can read, users can create own
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- OMIX_WISHLIST: users manage own
CREATE POLICY "Users can view own wishlist" ON public.omix_wishlist FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add to wishlist" ON public.omix_wishlist FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove from wishlist" ON public.omix_wishlist FOR DELETE USING (user_id = auth.uid());

-- LISTING_PAYMENTS: users manage own, admin all
CREATE POLICY "Users can view own payments" ON public.listing_payments FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);
CREATE POLICY "Users can create payments" ON public.listing_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage payments" ON public.listing_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- PRICE_WATCHERS: users manage own
CREATE POLICY "Users can view own price watchers" ON public.price_watchers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create price watchers" ON public.price_watchers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own price watchers" ON public.price_watchers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own price watchers" ON public.price_watchers FOR DELETE USING (user_id = auth.uid());

-- STOCK_WATCHERS: users manage own
CREATE POLICY "Users can view own stock watchers" ON public.stock_watchers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create stock watchers" ON public.stock_watchers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own stock watchers" ON public.stock_watchers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own stock watchers" ON public.stock_watchers FOR DELETE USING (user_id = auth.uid());

-- SAVED_SEARCHES: users manage own
CREATE POLICY "Users can view own searches" ON public.saved_searches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create searches" ON public.saved_searches FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own searches" ON public.saved_searches FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own searches" ON public.saved_searches FOR DELETE USING (user_id = auth.uid());

-- PUSH_SUBSCRIPTIONS: users manage own
CREATE POLICY "Users can view own push subs" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create push subs" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own push subs" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own push subs" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());

-- CATEGORIES: everyone can read, admin can manage
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- CONVERSATIONS: users see own
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- MESSAGE_READS: users see own
CREATE POLICY "Users can view own message reads" ON public.message_reads FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert message reads" ON public.message_reads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- 5. SET UP ADMIN PROFILE
-- ==========================================

-- Mark the first profile (Dorcas) as admin or create admin user
-- Update existing user with is_admin = true
UPDATE public.profiles SET is_admin = true, role = 'admin' WHERE phone = '+254****0001';

-- ==========================================
-- 6. CREATE STORAGE BUCKETS
-- ==========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images', 'listing-images', true, 5242880, '{"image/jpeg","image/png","image/webp","image/gif"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-pictures', 'profile-pictures', true, 2097152, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing-images
CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own listing images" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own listing images" ON storage.objects FOR DELETE USING (bucket_id = 'listing-images' AND auth.uid() IS NOT NULL);

-- Storage policies for profile-pictures
CREATE POLICY "Anyone can view profile pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can upload own profile picture" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile picture" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own profile picture" ON storage.objects FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

-- ==========================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_omix_orders_user_id ON public.omix_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_omix_orders_status ON public.omix_orders(status);
CREATE INDEX IF NOT EXISTS idx_omix_order_items_order_id ON public.omix_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_omix_wishlist_user_id ON public.omix_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_price_watchers_user_id ON public.price_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchers_user_id ON public.stock_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON public.referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id);

-- ==========================================
-- 8. CREATE TRIGGER: auto-update profiles on auth user creation
-- ==========================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role, loyalty_points, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    'customer',
    0,
    UPPER(REPLACE(NEW.id::text, '-', ''))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- ==========================================
