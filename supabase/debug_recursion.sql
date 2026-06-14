-- Run this ENTIRE block in Supabase SQL Editor (not via REST API)
-- Step 1: Create a helper function to run arbitrary SQL (for debugging only)
CREATE OR REPLACE FUNCTION public.exec_sql(text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (%s) AS t', $1) INTO result;
  RETURN result;
END;
$$;

-- Step 2: Check existing policies that reference profiles table (the recursion source)
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (
  qual LIKE '%profiles%'
  OR with_check LIKE '%profiles%'
)
ORDER BY tablename, policyname;
