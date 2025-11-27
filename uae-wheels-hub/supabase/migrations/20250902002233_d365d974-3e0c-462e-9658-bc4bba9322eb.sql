-- Drop the problematic view first
DROP VIEW IF EXISTS public.public_profiles;

-- Remove all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Public can view safe profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their complete profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a single owner-only policy for the profiles table
CREATE POLICY "Owner only access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a secure function to get public-safe profile data
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

-- Create the public view using the secure function
CREATE VIEW public.public_profiles AS
SELECT * FROM public.get_public_profiles();

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS 'Secure public profile data - excludes sensitive fields like email, phone, whatsapp';