-- 1) Tighten RLS on profiles: remove public SELECT and keep owner-only access
DROP POLICY IF EXISTS "Public can view safe profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their complete profile data" ON public.profiles;

-- Recreate a single owner-only SELECT policy
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 2) Create a SECURITY DEFINER function to expose only safe fields publicly
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  avatar_url text,
  is_dealer boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url, COALESCE(p.is_dealer, false), p.created_at
  FROM public.profiles p
$$;

-- 3) Create a view that uses the function (bypasses RLS safely) and grant access
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT * FROM public.get_public_profiles();

GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS 'Public-safe profile data (no email/phone/whatsapp). Backed by SECURITY DEFINER function.';