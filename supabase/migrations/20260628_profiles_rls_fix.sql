-- Fix profiles RLS: block anon from reading sensitive fields
-- Currently anon can read ALL profile data including email, phone, role

-- First, ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove any existing overly-permissive SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "Anon can view profiles" ON profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anon users can only see non-sensitive fields (for listing seller info)
-- Create a view or use a function for public seller info
-- For now, block anon entirely from reading profiles table
-- The frontend gets seller info from listings table already (seller_name, seller_phone)
