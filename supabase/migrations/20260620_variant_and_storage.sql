-- Migration: Add variant column to omix_order_items
-- This stores the selected size/color variant for each order item
ALTER TABLE omix_order_items ADD COLUMN IF NOT EXISTS variant JSONB DEFAULT NULL;

-- Add index for faster variant queries
CREATE INDEX IF NOT EXISTS idx_omix_order_items_variant ON omix_order_items USING gin(variant);

-- Also create the listing-images storage bucket with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images', 'listing-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read listing images
CREATE POLICY "Public read access for listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

-- Storage policy: authenticated users can upload listing images
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

-- Storage policy: users can update their own listing images
CREATE POLICY "Users can update own listing images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: admin can delete listing images
CREATE POLICY "Admins can delete listing images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images' AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    )
  );
