-- Security fixes for RLS policies and atomic promo increment
-- Run in Supabase Dashboard → SQL Editor

-- 1. Fix conversations RLS: scope to user's own conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Fix message_reads RLS: scope to user's own reads
DROP POLICY IF EXISTS "Users can view own message reads" ON public.message_reads;
CREATE POLICY "Users can view own message reads" ON public.message_reads
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Restrict points_transactions INSERT to service_role only (prevent users giving themselves points)
DROP POLICY IF EXISTS "System can insert points" ON public.points_transactions;
CREATE POLICY "System can insert points" ON public.points_transactions
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Restrict referral_rewards INSERT to service_role only (prevent self-rewards)
DROP POLICY IF EXISTS "System can create referral rewards" ON public.referral_rewards;
CREATE POLICY "System can create referral rewards" ON public.referral_rewards
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Create atomic promo usage increment function
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = promo_id;
END;
$$;
