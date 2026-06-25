-- Migration: User profile photos & order cancellation
-- Adds avatar_url to profiles, cancellation fields to orders
-- Run this in Supabase SQL Editor

-- 1. Add avatar_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add cancellation fields to omix_orders
ALTER TABLE omix_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE omix_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 3. Create storage bucket for profile pictures (if not already done)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-pictures', 'profile-pictures', true, 2097152, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policy: allow authenticated users to upload own avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND auth.role() = 'authenticated'
  );

-- 5. Storage policy: allow public read for avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-pictures');

-- 6. Storage policy: allow users to update own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-pictures'
    AND auth.uid() = (owner_id::uuid)
  );

-- 7. Storage policy: allow users to delete own avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-pictures'
    AND auth.uid() = (owner_id::uuid)
  );
