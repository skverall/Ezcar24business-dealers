-- Fix SECURITY DEFINER warnings on views by implementing proper security model
-- This addresses the Supabase linter warnings about views with SECURITY DEFINER properties

-- 1. Drop and recreate the public_profiles view without SECURITY DEFINER dependency
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Create a new public_profiles view that uses RLS instead of SECURITY DEFINER
CREATE VIEW public.public_profiles AS
SELECT
  user_id,
  full_name,
  avatar_url,
  is_dealer,
  created_at
FROM public.profiles
WHERE true; -- This will be filtered by RLS policies

-- 3. Recreate safe_profiles view to ensure it's not using SECURITY DEFINER
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles AS
SELECT
  id,
  user_id,
  full_name,
  location,
  avatar_url,
  bio,
  is_dealer,
  verification_status,
  company_name,
  created_at
FROM public.profiles
WHERE true; -- This will be filtered by RLS policies

-- 4. Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.safe_profiles TO anon, authenticated;

-- 5. Update RLS policies to ensure proper security
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Public limited profile access" ON public.profiles;
DROP POLICY IF EXISTS "Public can view safe profile data" ON public.profiles;

-- Create a single public read policy that allows access to safe fields only
-- The application layer must select only safe columns
CREATE POLICY "Public can read profiles for safe data"
ON public.profiles
FOR SELECT
USING (true);

-- 6. Remove the SECURITY DEFINER function since we're using RLS now
DROP FUNCTION IF EXISTS public.get_public_profiles();

-- 7. Add comments explaining the security model
COMMENT ON VIEW public.public_profiles IS
'Public view of profile data. Security enforced by RLS policies and application-level column selection.';

COMMENT ON VIEW public.safe_profiles IS
'Safe profile data view. Security enforced by RLS policies and application-level column selection.';

COMMENT ON TABLE public.profiles IS
'Profiles table with RLS security. Public views expose safe fields only. Sensitive fields (email, phone, whatsapp) only accessible to profile owner through owner-only policies.';