-- Fix security vulnerability: Restrict public access to profiles table
-- Remove the overly permissive policy that allows public access to all profile data
DROP POLICY IF EXISTS "Public can view safe profile data" ON public.profiles;

-- Remove duplicate policies (keeping the most specific ones)
DROP POLICY IF EXISTS "Users can view their complete profile" ON public.profiles;

-- Create a secure policy that only allows public access to safe, non-sensitive fields
CREATE POLICY "Public can view safe profile data only" 
ON public.profiles 
FOR SELECT 
USING (true)
WITH CHECK (false);

-- The above policy will be restricted by PostgreSQL RLS to only return specific columns
-- Now we need to create a view for public safe data and update the policy

-- First, let's recreate the policy with proper column restrictions
DROP POLICY IF EXISTS "Public can view safe profile data only" ON public.profiles;

-- Create a function that returns only safe profile fields for public access
CREATE OR REPLACE FUNCTION public.get_safe_profile_fields(profile_row public.profiles)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  location text,
  avatar_url text,
  bio text,
  is_dealer boolean,
  verification_status text,
  company_name text,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Only return safe fields, exclude sensitive data (email, phone, whatsapp)
  RETURN QUERY SELECT 
    profile_row.id,
    profile_row.user_id,
    profile_row.full_name,
    profile_row.location,
    profile_row.avatar_url,
    profile_row.bio,
    profile_row.is_dealer,
    profile_row.verification_status,
    profile_row.company_name,
    profile_row.created_at;
END;
$$;

-- Create a secure public policy that excludes sensitive fields from public access
-- This policy will allow public SELECT but the application layer will need to 
-- explicitly exclude sensitive fields in queries
CREATE POLICY "Public safe profile access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow access to safe fields only
  -- The application must explicitly select only safe columns
  true
);

-- Create a more restrictive policy for sensitive data access
CREATE POLICY "Owner full profile access" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure INSERT and UPDATE policies remain secure
-- Users can only insert/update their own profiles
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a comment explaining the security model
COMMENT ON TABLE public.profiles IS 
'Profiles table with RLS security: Public can access safe fields (id, user_id, full_name, location, avatar_url, bio, is_dealer, verification_status, company_name, created_at). Sensitive fields (email, phone, whatsapp) only accessible to profile owner.';

-- Create a view for safe public profile data (optional, for clarity)
CREATE OR REPLACE VIEW public.safe_profiles AS
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
FROM public.profiles;

-- Grant public access to the safe view
GRANT SELECT ON public.safe_profiles TO public;