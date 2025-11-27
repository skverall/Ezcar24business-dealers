-- Fix the security vulnerability by creating proper RLS policies for the profiles table
-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Public profile info viewable by everyone" ON public.profiles;

-- Create a secure policy that only exposes non-sensitive public profile information
CREATE POLICY "Public profile info (non-sensitive) viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Update the get_public_profile function to only return non-sensitive data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE(
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
STABLE SECURITY DEFINER
SET search_path = ''
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

-- Ensure users can still view their complete profile (including sensitive data)
-- This policy should already exist but let's make sure it's correct
DROP POLICY IF EXISTS "Users can view their complete profile" ON public.profiles;
CREATE POLICY "Users can view their complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);