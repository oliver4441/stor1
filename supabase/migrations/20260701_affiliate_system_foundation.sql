-- 1. Affiliates Table
-- This table manages the private partner accounts.
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    mpesa_number TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Affiliate Logs (Audit Trail)
-- Immutable event log. No updates/deletes allowed on this table.
CREATE TABLE IF NOT EXISTS public.affiliate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id),
    event_type TEXT NOT NULL, -- 'ACCOUNT_CREATED', 'REFERRAL_CLICK', 'USER_LINKED', 'COMMISSION_CALCULATED', 'PAYOUT_EXECUTED'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Link Profiles to Affiliates
-- Add referred_by to profiles to permanently track who referred which customer.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.affiliates(id);

-- Index for performance on attribution lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_affiliates_ref_code ON public.affiliates(referral_code);

-- Trigger to update updated_at on affiliates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliates_modtime
    BEFORE UPDATE ON public.affiliates
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
