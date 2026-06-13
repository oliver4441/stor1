-- =============================================
-- PROMO CODES — Run in Supabase SQL Editor
-- =============================================

-- 1. Create the promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'free_delivery' CHECK (discount_type IN ('free_delivery', 'percentage', 'fixed')),
  discount_value integer DEFAULT 0,
  max_uses integer,
  times_used integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

-- 3. Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- 4. Policies (drop existing first to avoid errors)
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON promo_codes;

CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can read active promo codes" ON promo_codes
  FOR SELECT
  USING (is_active = true);

-- 5. Add promo columns to orders table
ALTER TABLE omix_orders ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES promo_codes(id);
ALTER TABLE omix_orders ADD COLUMN IF NOT EXISTS promo_code_text text;
ALTER TABLE omix_orders ADD COLUMN IF NOT EXISTS delivery_fee integer DEFAULT 0;
ALTER TABLE omix_orders ADD COLUMN IF NOT EXISTS delivery_discount integer DEFAULT 0;

-- 6. RPC function for atomic increment (optional but recommended)
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes SET times_used = times_used + 1 WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
