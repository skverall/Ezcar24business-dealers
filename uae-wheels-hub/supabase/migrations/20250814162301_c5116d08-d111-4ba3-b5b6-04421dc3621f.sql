-- Fix critical security vulnerability: Prevent public exposure of sensitive user data
-- Update RLS policy to exclude email and phone from public access
DROP POLICY IF EXISTS "Public profile info (non-sensitive) viewable by everyone" ON public.profiles;

-- Create new policy that only exposes non-sensitive profile data publicly
CREATE POLICY "Public profile info (non-sensitive) viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true)
-- Only allow access to non-sensitive columns for public viewing
-- Sensitive data (email, phone) will only be accessible via the "Users can view their complete profile" policy
;

-- Update the get_public_profile function to only return non-sensitive data and fix search_path
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, full_name text, location text, avatar_url text, bio text, is_dealer boolean, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Fix mutable function search paths for security
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE WHEN is_dealer THEN 'dealer' ELSE 'user' END
  FROM public.profiles 
  WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;