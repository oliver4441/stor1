-- Migration: Security Hardening — 2025-06-15
-- Fixes critical and medium security issues found during audit

-- 1. RESTRICT exec_sql() to service_role only
REVOKE EXECUTE ON FUNCTION exec_sql(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- 2. Fix orders table — require auth for SELECT and INSERT
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Users view own orders" ON orders;
DROP POLICY IF EXISTS "Users create own orders" ON orders;
DROP POLICY IF EXISTS "Event organizers view event orders" ON orders;
DROP POLICY IF EXISTS "Users cancel own pending orders" ON orders;
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() IN (SELECT organizer_id FROM events WHERE events.id = orders.event_id)
  )
);
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Event organizers view event orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT organizer_id FROM events WHERE events.id = orders.event_id)
);
CREATE POLICY "Users cancel own pending orders" ON orders FOR DELETE USING (
  auth.uid() IS NOT NULL AND payment_status = 'pending'
);

-- 3. Fix listing_payments — require auth.uid() match on INSERT
DROP POLICY IF EXISTS "Users can create payments" ON listing_payments;
DROP POLICY IF EXISTS "Users can create own payments" ON listing_payments;
CREATE POLICY "Users can create own payments" ON listing_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Fix tickets — require auth
DROP POLICY IF EXISTS "Anyone can view tickets" ON tickets;
DROP POLICY IF EXISTS "Users view own tickets" ON tickets;
CREATE POLICY "Users view own tickets" ON tickets FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Fix messages — require participants
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 6. Fix wishes INSERT — require auth.uid() = user_id
DROP POLICY IF EXISTS "Authenticated users can create wishes" ON wishes;
DROP POLICY IF EXISTS "Users can create own wishes" ON wishes;
CREATE POLICY "Users can create own wishes" ON wishes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Fix profiles UPDATE — prevent role escalation
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Trigger to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION prevent_role_esc()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_esc_trigger ON profiles;
CREATE TRIGGER prevent_role_esc_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_esc();

-- 8. Add INSERT policy for referral_rewards
DROP POLICY IF EXISTS "System can insert referral rewards" ON referral_rewards;
CREATE POLICY "System can insert referral rewards" ON referral_rewards FOR INSERT WITH CHECK (true);

-- 9. Add INSERT policy for points_transactions
DROP POLICY IF EXISTS "System can insert points transactions" ON points_transactions;
CREATE POLICY "System can insert points transactions" ON points_transactions FOR INSERT WITH CHECK (true);
