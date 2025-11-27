-- Fix security warnings by setting search_path for functions
-- Update existing functions to have secure search_path

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE WHEN is_dealer THEN 'dealer' ELSE 'user' END
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

-- Fix get_public_profile function
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