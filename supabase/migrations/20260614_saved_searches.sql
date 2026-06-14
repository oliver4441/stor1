-- Run this in your Supabase SQL Editor
-- Adds saved_searches table for the Saved Searches feature
-- Safe to run multiple times (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_searches_select ON saved_searches;
CREATE POLICY saved_searches_select ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_searches_insert ON saved_searches;
CREATE POLICY saved_searches_insert ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_searches_delete ON saved_searches;
CREATE POLICY saved_searches_delete ON saved_searches
  FOR DELETE USING (auth.uid() = user_id);
