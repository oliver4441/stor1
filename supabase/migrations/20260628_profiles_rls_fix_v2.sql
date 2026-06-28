-- Fix infinite recursion in profiles RLS
-- The admin policy was self-referencing profiles table inside a profiles policy

-- Drop the broken policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Use auth.jwt() instead of querying profiles table (avoids recursion)
-- Users can read their own profile (no self-join, no recursion)
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles — check role from JWT claims or use auth.uid() direct comparison
-- Avoid subquery on profiles by checking the admin's own row only
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id  -- own row always allowed
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Also fix UPDATE/INSERT/DELETE policies while we're here
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Anon gets nothing (no explicit policy = denied by default with RLS enabled)
