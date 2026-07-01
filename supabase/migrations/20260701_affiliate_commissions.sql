-- 4. Monthly Commissions Table
-- Stores calculated monthly commissions for admin approval workflow
CREATE TABLE IF NOT EXISTS public.monthly_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_sales DECIMAL(12, 2) DEFAULT 0,
    qualified_order_count INTEGER DEFAULT 0,
    commission_rate DECIMAL(4, 4) NOT NULL, -- e.g., 0.0500 for 5%
    commission_amount DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'calculated' CHECK (status IN ('calculated', 'approved', 'paid', 'cancelled')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    paid_at TIMESTAMPTZ,
    paystack_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(affiliate_id, year, month)
);

-- 5. Commission Order Details (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.commission_order_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES public.monthly_commissions(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.omix_orders(id),
    order_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_commissions_affiliate ON public.monthly_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_monthly_commissions_status ON public.monthly_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commission_order_details_commission ON public.commission_order_details(commission_id);

-- Trigger to update updated_at on monthly_commissions
CREATE TRIGGER update_monthly_commissions_modtime
    BEFORE UPDATE ON public.monthly_commissions
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
