-- Omix Wishlist RLS Policies
-- Enable RLS and add policies so authenticated users can manage their own wishlist

-- 1. Enable RLS (should already be enabled)
ALTER TABLE omix_wishlist ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (safe to re-run)
DROP POLICY IF EXISTS "Users can view own wishlist" ON omix_wishlist;
DROP POLICY IF EXISTS "Users can add to own wishlist" ON omix_wishlist;
DROP POLICY IF EXISTS "Users can delete from own wishlist" ON omix_wishlist;

-- 3. SELECT: users can only see their own wishlist items
CREATE POLICY "Users can view own wishlist" ON omix_wishlist
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. INSERT: users can only add items for themselves
CREATE POLICY "Users can add to own wishlist" ON omix_wishlist
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. DELETE: users can only remove their own items
CREATE POLICY "Users can delete from own wishlist" ON omix_wishlist
  FOR DELETE
  USING (user_id = auth.uid());

-- 6. UPDATE not needed (wishlist rows are inserted/deleted, never updated)
