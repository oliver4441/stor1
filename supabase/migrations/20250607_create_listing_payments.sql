-- Migration: Create listing_payments table
-- Description: Stores KES 5 listing fee payments via Paystack before a listing is created

CREATE TABLE IF NOT EXISTS listing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 5,
  paystack_reference text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  listing_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE listing_payments ENABLE ROW LEVEL SECURITY;

-- Policies: users can read and insert their own payment records
CREATE POLICY "Users can view own listing payments"
  ON listing_payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own listing payments"
  ON listing_payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: users can update their own payment records (for status updates)
CREATE POLICY "Users can update own listing payments"
  ON listing_payments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for faster lookups by reference
CREATE INDEX IF NOT EXISTS idx_listing_payments_paystack_ref
  ON listing_payments (paystack_reference);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_listing_payments_user_id
  ON listing_payments (user_id);
