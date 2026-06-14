-- Run this in your Supabase SQL Editor
-- Adds tables for referral system, loyalty points, saved addresses, wishlist, and reviews

-- ========================================
-- 1. WISHLIST
-- ========================================
CREATE TABLE IF NOT EXISTS wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ========================================
-- 2. PRODUCT REVIEWS
-- ========================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ========================================
-- 3. SAVED ADDRESSES
-- ========================================
CREATE TABLE IF NOT EXISTS saved_addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  area TEXT NOT NULL,
  landmark TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. PROFILES — add referral + loyalty columns
-- ========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- ========================================
-- 5. REFERRAL REWARDS
-- ========================================
CREATE TABLE IF NOT EXISTS referral_rewards (
  id BIGSERIAL PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES omix_orders(id) ON DELETE SET NULL,
  reward_amount INTEGER DEFAULT 100,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referee_id)
);

-- ========================================
-- 6. POINTS TRANSACTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ENABLE RLS ON NEW TABLES
-- ========================================
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
