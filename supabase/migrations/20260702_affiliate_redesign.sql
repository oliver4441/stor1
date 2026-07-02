-- ============================================================
-- AFFILIATE SYSTEM REDESIGN — Phase 1: Schema + RLS + Seeds
-- Migration date: 2026-07-02
-- ============================================================
-- Attribution: Last-touch model
-- Cookie consent: Required (GDPR-style)
-- Payout: M-Pesa B2C
-- Min payout: KES 2,000
-- Auto-calculate: Enabled (cron 1st of month)
-- Tiers: Bronze / Silver / Gold / Platinum
-- Referral reward: Configurable, default 1 loyalty point
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════
-- 0. DROP EXISTING OLD AFFILIATE TABLES (clean slate)
-- ═══════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.commission_order_details CASCADE;
DROP TABLE IF EXISTS public.monthly_commissions CASCADE;
DROP TABLE IF EXISTS public.payout_requests CASCADE;
DROP TABLE IF EXISTS public.referral_clicks CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.affiliate_logs CASCADE;
DROP TABLE IF EXISTS public.affiliates CASCADE;
DROP TABLE IF EXISTS public.affiliate_tiers CASCADE;
DROP TABLE IF EXISTS public.affiliate_settings CASCADE;

-- Remove old trigger and function if they exist
DROP TRIGGER IF EXISTS update_affiliates_modtime ON public.affiliates;
DROP TRIGGER IF EXISTS update_monthly_commissions_modtime ON public.monthly_commissions;
DROP FUNCTION IF EXISTS public.update_modified_column();

-- ═══════════════════════════════════════════════════════════════════
-- 1. AFFILIATE TIERS CONFIGURATION (configurable by admin)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.affiliate_tiers (
    id TEXT PRIMARY KEY, -- 'bronze', 'silver', 'gold', 'platinum'
    name TEXT NOT NULL,
    min_yearly_sales INT NOT NULL DEFAULT 0,    -- qualified orders per year to reach this tier
    commission_rate DECIMAL(4,4) NOT NULL,       -- e.g., 0.0500 = 5%
    benefits JSONB DEFAULT '{}',                 -- e.g., {"priority_support": true, "marketing_materials": true}
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 2. AFFILIATES (partner accounts)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    mpesa_number TEXT,                          -- validated: 2547XXXXXXXX or 2541XXXXXXXX
    referral_code TEXT UNIQUE NOT NULL,          -- format: AFF-XXXX
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
    tier TEXT DEFAULT 'bronze'
        REFERENCES public.affiliate_tiers(id) ON UPDATE CASCADE,
    tier_achieved_at TIMESTAMPTZ,
    commission_rate_override DECIMAL(4,4),      -- null = use tier default
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_ref_code ON public.affiliates(referral_code);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);
CREATE INDEX idx_affiliates_tier ON public.affiliates(tier);

-- ═══════════════════════════════════════════════════════════════════
-- 3. REFERRAL CLICKS (analytics — ephemeral, auto-deleted after 90 days)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.referral_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    session_id TEXT,                             -- random session token for cookie
    referrer_url TEXT,
    landing_url TEXT,
    user_agent TEXT,
    ip_hash TEXT,                                -- SHA256(ip + salt) for privacy
    gdpr_consent BOOLEAN DEFAULT false,          -- required consent
    converted_at TIMESTAMPTZ,                    -- set when user signs up
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_clicks_affiliate ON public.referral_clicks(affiliate_id);
CREATE INDEX idx_referral_clicks_session ON public.referral_clicks(session_id);
CREATE INDEX idx_referral_clicks_created ON public.referral_clicks(created_at);

-- ═══════════════════════════════════════════════════════════════════
-- 4. REFERRALS (permanent attribution — last-touch model)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_click_id UUID REFERENCES public.referral_clicks(id) ON DELETE SET NULL,
    attribution_model TEXT DEFAULT 'last_touch'
        CHECK (attribution_model IN ('last_touch', 'first_touch', 'manual')),
    source TEXT,                                 -- 'cookie', 'manual', 'import', 'qr_code'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(referred_user_id)                     -- one affiliate per user
);

CREATE INDEX idx_referrals_affiliate ON public.referrals(affiliate_id);
CREATE INDEX idx_referrals_user ON public.referrals(referred_user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. MONTHLY COMMISSIONS (calculated, auditable)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.monthly_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,           -- total sales from referred customers
    qualified_order_count INT DEFAULT 0,           -- number of qualifying orders
    commission_rate DECIMAL(4,4) NOT NULL,         -- snapshot of rate at calculation time
    commission_amount DECIMAL(12,2) DEFAULT 0,     -- ROUND(total_sales * commission_rate)
    status TEXT DEFAULT 'calculated'
        CHECK (status IN ('calculated', 'approved', 'paid', 'cancelled', 'disputed')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    payout_reference TEXT,                          -- M-Pesa receipt code / Paystack ref
    payout_method TEXT
        CHECK (payout_method IN ('mpesa', 'paystack_transfer', 'bank', 'manual')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(affiliate_id, year, month)
);

CREATE INDEX idx_monthly_commissions_affiliate ON public.monthly_commissions(affiliate_id);
CREATE INDEX idx_monthly_commissions_status ON public.monthly_commissions(status);
CREATE INDEX idx_monthly_commissions_period ON public.monthly_commissions(year, month);

-- ═══════════════════════════════════════════════════════════════════
-- 6. COMMISSION ORDER DETAILS (immutable audit — which orders contributed)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.commission_order_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID NOT NULL REFERENCES public.monthly_commissions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.omix_orders(id) ON DELETE CASCADE,
    order_amount DECIMAL(12,2) NOT NULL,
    commission_share DECIMAL(12,2) NOT NULL,       -- how much of the total commission this order generated
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_commission_order_details_commission ON public.commission_order_details(commission_id);
CREATE INDEX idx_commission_order_details_order ON public.commission_order_details(order_id);

-- ═══════════════════════════════════════════════════════════════════
-- 7. PAYOUT REQUESTS (affiliate-initiated)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    commission_ids UUID[] NOT NULL,                -- array of monthly_commission ids
    total_amount DECIMAL(12,2) NOT NULL,            -- sum of commissions being requested
    requested_mpesa_number TEXT,                    -- where to send the money
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'rejected', 'cancelled')),
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    paystack_transfer_code TEXT,
    mpesa_receipt_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payout_requests_affiliate ON public.payout_requests(affiliate_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);

-- ═══════════════════════════════════════════════════════════════════
-- 8. AFFILIATE LOGS (unified audit trail — immutable)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.affiliate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,                      -- see comment below
    actor_type TEXT
        CHECK (actor_type IN ('system', 'admin', 'affiliate', 'customer')),
    actor_id UUID,                                  -- user/admin id who triggered the action
    details JSONB DEFAULT '{}',                     -- structured event data
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Event types:
-- ACCOUNT_CREATED, ACCOUNT_APPROVED, ACCOUNT_SUSPENDED, ACCOUNT_TERMINATED
-- TIER_CHANGED, TIER_OVERRIDE
-- REFERRAL_CLICK, USER_LINKED
-- COMMISSION_CALCULATED, COMMISSION_APPROVED, COMMISSION_PAID
-- PAYOUT_REQUESTED, PAYOUT_PROCESSED, PAYOUT_FAILED, PAYOUT_REJECTED
-- M_PESA_UPDATED, SETTINGS_CHANGED

CREATE INDEX idx_affiliate_logs_affiliate ON public.affiliate_logs(affiliate_id);
CREATE INDEX idx_affiliate_logs_event ON public.affiliate_logs(event_type);
CREATE INDEX idx_affiliate_logs_created ON public.affiliate_logs(created_at);

-- ═══════════════════════════════════════════════════════════════════
-- 9. AFFILIATE SETTINGS (global config)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.affiliate_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- 10. UPDATED COLUMNS ON PROFILES
-- ═══════════════════════════════════════════════════════════════════

-- Ensure profiles has the correct referred_by column (FK to affiliates)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Add referral_code on profiles if not exists (for user's own referral link)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

-- ── Helper: admin check (reusable) ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ── Helper: get own affiliate id ──
CREATE OR REPLACE FUNCTION public.my_affiliate_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM public.affiliates WHERE user_id = auth.uid();
$$;

-- ── affiliate_tiers: public read, admin write ──
CREATE POLICY "tiers_read_all" ON public.affiliate_tiers
    FOR SELECT USING (true);

CREATE POLICY "tiers_admin_all" ON public.affiliate_tiers
    FOR ALL USING (public.is_admin());

-- ── affiliates: user reads own, admin reads all ──
CREATE POLICY "affiliates_self_read" ON public.affiliates
    FOR SELECT USING (
        user_id = auth.uid() OR public.is_admin()
    );

CREATE POLICY "affiliates_admin_write" ON public.affiliates
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "affiliates_admin_update" ON public.affiliates
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "affiliates_admin_delete" ON public.affiliates
    FOR DELETE USING (public.is_admin());

-- ── referrals: affiliate sees own, admin sees all ──
CREATE POLICY "referrals_affiliate_read" ON public.referrals
    FOR SELECT USING (
        affiliate_id = public.my_affiliate_id() OR public.is_admin()
    );

CREATE POLICY "referrals_admin_write" ON public.referrals
    FOR ALL USING (public.is_admin());

-- ── referral_clicks: admin only (analytics data) ──
CREATE POLICY "clicks_admin_read" ON public.referral_clicks
    FOR SELECT USING (public.is_admin());

CREATE POLICY "clicks_admin_write" ON public.referral_clicks
    FOR ALL USING (public.is_admin());

-- Allow anonymous insert for tracking clicks (public endpoint)
CREATE POLICY "clicks_anon_insert" ON public.referral_clicks
    FOR INSERT WITH CHECK (true);

-- ── monthly_commissions: affiliate reads own, admin all ──
CREATE POLICY "commissions_affiliate_read" ON public.monthly_commissions
    FOR SELECT USING (
        affiliate_id = public.my_affiliate_id() OR public.is_admin()
    );

CREATE POLICY "commissions_admin_write" ON public.monthly_commissions
    FOR ALL USING (public.is_admin());

-- ── commission_order_details: affiliate reads own, admin all ──
CREATE POLICY "order_details_affiliate_read" ON public.commission_order_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.monthly_commissions mc
            WHERE mc.id = commission_id
            AND (mc.affiliate_id = public.my_affiliate_id() OR public.is_admin())
        )
    );

CREATE POLICY "order_details_admin_write" ON public.commission_order_details
    FOR ALL USING (public.is_admin());

-- ── payout_requests: affiliate reads/creates own, admin manages ──
CREATE POLICY "payouts_affiliate_read" ON public.payout_requests
    FOR SELECT USING (
        affiliate_id = public.my_affiliate_id() OR public.is_admin()
    );

CREATE POLICY "payouts_affiliate_insert" ON public.payout_requests
    FOR INSERT WITH CHECK (
        affiliate_id = public.my_affiliate_id()
        AND status = 'pending'
    );

CREATE POLICY "payouts_affiliate_update" ON public.payout_requests
    FOR UPDATE USING (affiliate_id = public.my_affiliate_id())
    WITH CHECK (
        -- Can only cancel own pending requests
        affiliate_id = public.my_affiliate_id()
        AND status IN ('pending', 'cancelled')
    );

CREATE POLICY "payouts_admin_all" ON public.payout_requests
    FOR ALL USING (public.is_admin());

-- ── affiliate_logs: affiliate reads own, admin all ──
CREATE POLICY "logs_affiliate_read" ON public.affiliate_logs
    FOR SELECT USING (
        affiliate_id = public.my_affiliate_id() OR public.is_admin()
    );

-- Service role can insert logs (backend API)
CREATE POLICY "logs_service_insert" ON public.affiliate_logs
    FOR INSERT WITH CHECK (
        public.is_admin() OR auth.role() = 'service_role'
    );

-- ── affiliate_settings: admin only ──
CREATE POLICY "settings_admin_all" ON public.affiliate_settings
    FOR ALL USING (public.is_admin());

-- Allow public read for some settings (for frontend)
CREATE POLICY "settings_read_public" ON public.affiliate_settings
    FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════

-- ── Affiliate Tiers ──
INSERT INTO public.affiliate_tiers (id, name, min_yearly_sales, commission_rate, benefits, sort_order) VALUES
    ('bronze',   'Bronze',   0,   0.0300, '{"priority_support": false, "marketing_materials": false}'::jsonb, 1),
    ('silver',   'Silver',   10,  0.0500, '{"priority_support": true,  "marketing_materials": false}'::jsonb, 2),
    ('gold',     'Gold',     30,  0.0800, '{"priority_support": true,  "marketing_materials": true}'::jsonb,  3),
    ('platinum', 'Platinum', 100, 0.1000, '{"priority_support": true,  "marketing_materials": true, "dedicated_manager": true}'::jsonb, 4)
ON CONFLICT (id) DO NOTHING;

-- ── Affiliate Settings ──
INSERT INTO public.affiliate_settings (key, value, description) VALUES
    ('attribution_window_days',   '30',              'Cookie/session attribution window in days'),
    ('attribution_model',         '"last_touch"',    'Attribution model: first_touch or last_touch'),
    ('cookie_consent_required',   'true',            'Require GDPR-style cookie consent before tracking'),
    ('min_payout_amount',         '2000',            'Minimum KES amount for payout request'),
    ('payout_schedule',           '"manual"',        'Payout schedule: manual, weekly, monthly'),
    ('auto_calculate_commissions','true',            'Run commission calculation via cron on 1st of month'),
    ('referral_reward_points',    '1',               'Loyalty points awarded to referrer when referral signs up'),
    ('notification_email_enabled','true',            'Send email notifications to affiliates'),
    ('notification_push_enabled', 'true',            'Send push notifications to affiliates'),
    ('default_new_affiliate_tier','"bronze"',        'Default tier assigned to new affiliates'),
    ('mpesa_b2c_api_key',         '""',              'M-Pesa B2C API key (set via admin)'),
    ('mpesa_b2c_shortcode',       '""',              'M-Pesa B2C shortcode/till number'),
    ('payout_method',             '"mpesa"',         'Default payout method: mpesa, paystack_transfer, bank, manual'),
    ('data_retention_days',       '90',              'Days before referral_clicks data is purged'),
    ('commission_calculation_day','1',               'Day of month to run auto-calculation (1 = 1st)')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Auto-update updated_at on affiliates
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_affiliates_modtime
    BEFORE UPDATE ON public.affiliates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_monthly_commissions_modtime
    BEFORE UPDATE ON public.monthly_commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_payout_requests_modtime
    BEFORE UPDATE ON public.payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: link_user_to_affiliate (called after signup)
-- Uses last-touch attribution: finds the most recent click session
-- that converted and links the user to that affiliate
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.link_user_to_affiliate(
    p_user_id UUID,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate_id UUID;
    v_click_id UUID;
    v_referral_reward INT;
    v_result JSONB;
BEGIN
    -- 1. Check if user already has a referral (first-touch or manual override)
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User already attributed to an affiliate'
        );
    END IF;

    -- 2. Find affiliate via session cookie (last-touch click)
    IF p_session_id IS NOT NULL THEN
        SELECT affiliate_id, id INTO v_affiliate_id, v_click_id
        FROM public.referral_clicks
        WHERE session_id = p_session_id
          AND converted_at IS NULL
          AND gdpr_consent = true
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- 3. If no session match, try via query param affiliate code in recent clicks
    IF v_affiliate_id IS NULL THEN
        SELECT affiliate_id, id INTO v_affiliate_id, v_click_id
        FROM public.referral_clicks
        WHERE converted_at IS NULL
          AND affiliate_id IS NOT NULL
          AND gdpr_consent = true
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- 4. No affiliate found
    IF v_affiliate_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No valid referral source found'
        );
    END IF;

    -- 5. Create the referral record (permanent)
    INSERT INTO public.referrals (affiliate_id, referred_user_id, referral_click_id, attribution_model, source)
    VALUES (v_affiliate_id, p_user_id, v_click_id, 'last_touch', 'cookie')
    ON CONFLICT (referred_user_id) DO NOTHING;

    -- 6. Update the click record
    IF v_click_id IS NOT NULL THEN
        UPDATE public.referral_clicks
        SET converted_at = now(), referred_user_id = p_user_id
        WHERE id = v_click_id;
    END IF;

    -- 7. Award referral reward (loyalty points for referrer)
    SELECT COALESCE((value::text)::int, 1)
    INTO v_referral_reward
    FROM public.affiliate_settings
    WHERE key = 'referral_reward_points';

    IF v_referral_reward > 0 THEN
        -- Award points to the affiliate's user account
        UPDATE public.profiles
        SET loyalty_points = COALESCE(loyalty_points, 0) + v_referral_reward
        WHERE id = (SELECT user_id FROM public.affiliates WHERE id = v_affiliate_id);
    END IF;

    -- 8. Log the attribution
    INSERT INTO public.affiliate_logs (affiliate_id, event_type, actor_type, actor_id, details)
    VALUES (
        v_affiliate_id, 'USER_LINKED', 'system', p_user_id,
        jsonb_build_object(
            'referred_user_id', p_user_id,
            'referral_click_id', v_click_id,
            'reward_points', v_referral_reward,
            'attribution_model', 'last_touch'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'affiliate_id', v_affiliate_id,
        'reward_points', v_referral_reward
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: calculate_affiliate_commission (single affiliate, single period)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission(
    p_affiliate_id UUID,
    p_year INT,
    p_month INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_total_sales DECIMAL(12,2) := 0;
    v_order_count INT := 0;
    v_commission_rate DECIMAL(4,4);
    v_commission_amount DECIMAL(12,2) := 0;
    v_commission_id UUID;
    v_tier TEXT;
    v_tier_config RECORD;
    v_yearly_count INT;
    v_commission_record RECORD;
    v_order RECORD;
BEGIN
    v_period_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0);
    v_period_end := make_timestamptz(p_year, p_month + 1, 1, 0, 0, 0);

    -- 1. Get qualified orders from referred users in this period
    SELECT
        COALESCE(SUM(o.total_amount::numeric), 0),
        COUNT(DISTINCT o.id)
    INTO v_total_sales, v_order_count
    FROM public.omix_orders o
    JOIN public.referrals r ON r.referred_user_id = o.user_id
    WHERE r.affiliate_id = p_affiliate_id
      AND o.created_at >= v_period_start
      AND o.created_at < v_period_end
      AND o.status IN ('paid', 'completed', 'delivered');

    -- 2. If no sales, skip
    IF v_order_count = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'No qualifying orders found',
            'affiliate_id', p_affiliate_id,
            'period', format('%s-%s', p_year, p_month)
        );
    END IF;

    -- 3. Determine tier based on yearly qualified order count
    SELECT COUNT(DISTINCT o.id) INTO v_yearly_count
    FROM public.omix_orders o
    JOIN public.referrals r ON r.referred_user_id = o.user_id
    WHERE r.affiliate_id = p_affiliate_id
      AND o.created_at >= make_timestamptz(p_year, 1, 1, 0, 0, 0)
      AND o.created_at < v_period_end
      AND o.status IN ('paid', 'completed', 'delivered');

    -- 4. Check for tier override
    SELECT tier, commission_rate_override INTO v_tier, v_commission_rate
    FROM public.affiliates WHERE id = p_affiliate_id;

    IF v_commission_rate IS NOT NULL THEN
        -- Use override rate
        NULL;
    ELSE
        -- Look up rate from tier config
        SELECT commission_rate INTO v_commission_rate
        FROM public.affiliate_tiers
        WHERE id = v_tier;
    END IF;

    -- If still null, default to bronze rate
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 0.03;
    END IF;

    -- 5. Calculate commission
    v_commission_amount := ROUND(v_total_sales * v_commission_rate);

    -- 6. Upsert commission record
    SELECT id INTO v_commission_id
    FROM public.monthly_commissions
    WHERE affiliate_id = p_affiliate_id AND year = p_year AND month = p_month;

    IF v_commission_id IS NOT NULL THEN
        UPDATE public.monthly_commissions
        SET total_sales = v_total_sales,
            qualified_order_count = v_order_count,
            commission_rate = v_commission_rate,
            commission_amount = v_commission_amount,
            period_start = v_period_start,
            period_end = v_period_end,
            status = 'calculated'
        WHERE id = v_commission_id
        RETURNING * INTO v_commission_record;
    ELSE
        INSERT INTO public.monthly_commissions
            (affiliate_id, year, month, period_start, period_end,
             total_sales, qualified_order_count, commission_rate, commission_amount)
        VALUES
            (p_affiliate_id, p_year, p_month, v_period_start, v_period_end,
             v_total_sales, v_order_count, v_commission_rate, v_commission_amount)
        RETURNING * INTO v_commission_record;
    END IF;

    -- 7. Store order-level details
    DELETE FROM public.commission_order_details
    WHERE commission_id = v_commission_record.id;

    FOR v_order IN
        SELECT o.id, o.total_amount
        FROM public.omix_orders o
        JOIN public.referrals r ON r.referred_user_id = o.user_id
        WHERE r.affiliate_id = p_affiliate_id
          AND o.created_at >= v_period_start
          AND o.created_at < v_period_end
          AND o.status IN ('paid', 'completed', 'delivered')
    LOOP
        INSERT INTO public.commission_order_details
            (commission_id, order_id, order_amount, commission_share)
        VALUES (
            v_commission_record.id,
            v_order.id,
            v_order.total_amount,
            ROUND(v_order.total_amount * v_commission_rate)
        );
    END LOOP;

    -- 8. Log
    INSERT INTO public.affiliate_logs (affiliate_id, event_type, actor_type, details)
    VALUES (
        p_affiliate_id, 'COMMISSION_CALCULATED', 'system',
        jsonb_build_object(
            'commission_id', v_commission_record.id,
            'year', p_year,
            'month', p_month,
            'total_sales', v_total_sales,
            'order_count', v_order_count,
            'rate', v_commission_rate,
            'commission_amount', v_commission_amount
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'commission_id', v_commission_record.id,
        'affiliate_id', p_affiliate_id,
        'year', p_year,
        'month', p_month,
        'total_sales', v_total_sales,
        'order_count', v_order_count,
        'commission_rate', v_commission_rate,
        'commission_amount', v_commission_amount
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: update_affiliate_tier (recalculate tier based on yearly sales)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_affiliate_tier(
    p_affiliate_id UUID,
    p_year INT DEFAULT EXTRACT(YEAR FROM now())::int
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_yearly_count INT;
    v_new_tier TEXT;
    v_old_tier TEXT;
    v_tier RECORD;
BEGIN
    -- Get current year qualified orders
    SELECT COUNT(DISTINCT o.id) INTO v_yearly_count
    FROM public.omix_orders o
    JOIN public.referrals r ON r.referred_user_id = o.user_id
    WHERE r.affiliate_id = p_affiliate_id
      AND o.created_at >= make_timestamptz(p_year, 1, 1, 0, 0, 0)
      AND o.created_at < make_timestamptz(p_year + 1, 1, 1, 0, 0, 0)
      AND o.status IN ('paid', 'completed', 'delivered');

    -- Find highest tier they qualify for
    SELECT id INTO v_new_tier
    FROM public.affiliate_tiers
    WHERE min_yearly_sales <= v_yearly_count
      AND is_active = true
    ORDER BY sort_order DESC
    LIMIT 1;

    -- Default to bronze if none found
    IF v_new_tier IS NULL THEN
        v_new_tier := 'bronze';
    END IF;

    -- Get current tier
    SELECT tier INTO v_old_tier
    FROM public.affiliates WHERE id = p_affiliate_id;

    -- Update if changed
    IF v_old_tier IS DISTINCT FROM v_new_tier THEN
        UPDATE public.affiliates
        SET tier = v_new_tier,
            tier_achieved_at = CASE WHEN v_new_tier != v_old_tier THEN now() ELSE tier_achieved_at END
        WHERE id = p_affiliate_id;

        INSERT INTO public.affiliate_logs (affiliate_id, event_type, actor_type, details)
        VALUES (
            p_affiliate_id, 'TIER_CHANGED', 'system',
            jsonb_build_object(
                'old_tier', v_old_tier,
                'new_tier', v_new_tier,
                'yearly_sales', v_yearly_count,
                'reason', 'auto_calculation'
            )
        );
    END IF;

    RETURN v_new_tier;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: calculate_all_commissions (for cron — loop all active affiliates)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.calculate_all_commissions(
    p_year INT DEFAULT EXTRACT(YEAR FROM now())::int,
    p_month INT DEFAULT EXTRACT(MONTH FROM now())::int - 1
)
RETURNS TABLE(
    affiliate_id UUID,
    affiliate_name TEXT,
    success BOOLEAN,
    commission_amount DECIMAL,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate RECORD;
    v_result JSONB;
BEGIN
    -- Default to previous month if no args
    IF p_month <= 0 THEN
        p_month := 12;
        p_year := p_year - 1;
    END IF;

    FOR v_affiliate IN
        SELECT a.id, a.full_name
        FROM public.affiliates a
        WHERE a.status = 'active'
    LOOP
        v_result := public.calculate_affiliate_commission(v_affiliate.id, p_year, p_month);

        affiliate_id := v_affiliate.id;
        affiliate_name := v_affiliate.full_name;
        success := (v_result->>'success')::boolean;
        commission_amount := COALESCE((v_result->>'commission_amount')::decimal, 0);
        message := COALESCE(v_result->>'message', 'calculated');

        -- Update tier after commission calculation
        PERFORM public.update_affiliate_tier(v_affiliate.id, p_year);

        RETURN NEXT;
    END LOOP;
END;
$$;
