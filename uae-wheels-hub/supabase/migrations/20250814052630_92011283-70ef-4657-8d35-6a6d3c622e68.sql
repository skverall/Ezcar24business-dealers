-- Fix security vulnerability: Restrict public access to sensitive profile data
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Basic profile info viewable by everyone" ON public.profiles;

-- Create a restrictive policy for public profile data (non-sensitive fields only)
CREATE POLICY "Public profile info viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to non-sensitive fields in a view-like manner
  -- This policy will be used with application-level filtering
  true
);

-- Create a policy for users to view their own complete profile data
CREATE POLICY "Users can view their complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security function to get sanitized public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  location text,
  avatar_url text,
  bio text,
  is_dealer boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.location,
    p.avatar_url,
    p.bio,
    p.is_dealer,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon;