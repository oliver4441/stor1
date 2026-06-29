-- Migration: Create user_settings table with RLS and auto-creation trigger
-- Run this in Supabase Dashboard → SQL Editor

-- =============================================
-- 1. Ensure the table has all required columns
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_updates BOOLEAN DEFAULT true,
  price_drops BOOLEAN DEFAULT true,
  back_in_stock BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Add missing columns if table already exists without them
DO $$ BEGIN
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS order_updates BOOLEAN DEFAULT true;
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS price_drops BOOLEAN DEFAULT true;
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS back_in_stock BOOLEAN DEFAULT true;
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS promotions BOOLEAN DEFAULT false;
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column additions skipped: %', SQLERRM;
END $$;

-- =============================================
-- 2. Enable Row Level Security
-- =============================================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. RLS Policies (drop existing first to avoid conflicts)
-- =============================================
DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can upsert own settings" ON public.user_settings;

CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 4. Auto-create settings row when new user signs up
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- =============================================
-- 5. Backfill settings for existing users
-- =============================================
INSERT INTO public.user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- 6. Auto-update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
