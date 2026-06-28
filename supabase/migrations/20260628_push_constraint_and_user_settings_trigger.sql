-- ═══════════════════════════════════════════════════════════
-- Fix 1: Composite Unique Constraint on push_subscriptions
-- ═══════════════════════════════════════════════════════════

-- First, clean any duplicate rows (keep the most recent one per user_id+endpoint)
DELETE FROM public.push_subscriptions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, endpoint ORDER BY created_at DESC
    ) AS rn
    FROM public.push_subscriptions
  ) dup WHERE dup.rn > 1
);

-- Add the composite unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'push_subscriptions_user_id_endpoint_key'
    AND conrelid = 'public.push_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key
    UNIQUE (user_id, endpoint);
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- Fix 2a: Auto-create user_settings row on new user signup
-- ═══════════════════════════════════════════════════════════

-- Function that runs on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
