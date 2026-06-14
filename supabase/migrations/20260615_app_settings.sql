-- ── App Settings table (key-value store for global app config) ──
-- Used for maintenance mode, feature flags, etc.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'false',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed maintenance_mode default (off)
INSERT INTO app_settings (key, value, description)
VALUES ('maintenance_mode', 'false', 'When true, disables add-to-cart and checkout for all users')
ON CONFLICT (key) DO NOTHING;

-- RLS: anyone can read (needed for frontend to check maintenance status)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Anyone can read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can manage app_settings" ON app_settings;

-- Anyone can read settings (public, no auth needed)
CREATE POLICY "Anyone can read app_settings" ON app_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);
