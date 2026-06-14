-- Run this in your Supabase SQL Editor
-- Adds saved_searches table for the Saved Searches feature

-- ========================================
-- 1. SAVED SEARCHES
-- ========================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- ========================================
-- ENABLE RLS
-- ========================================
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================
-- Users can only see their own saved searches
CREATE POLICY saved_searches_select ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved searches
CREATE POLICY saved_searches_insert ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY saved_searches_delete ON saved_searches
  FOR DELETE USING (auth.uid() = user_id);
