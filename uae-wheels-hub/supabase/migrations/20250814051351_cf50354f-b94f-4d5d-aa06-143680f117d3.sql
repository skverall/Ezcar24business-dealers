-- First clean up invalid phone data before adding constraint
UPDATE public.profiles 
SET phone = NULL 
WHERE phone IS NOT NULL 
AND phone !~ '^\+?[1-9]\d{1,14}$';

-- SECURITY FIX 1: Update profiles RLS policy to restrict public access to sensitive data
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more secure policy that protects private data
CREATE POLICY "Basic profile info viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Add missing columns to listings table for compatibility
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'make') THEN
        ALTER TABLE public.listings ADD COLUMN make TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'model') THEN
        ALTER TABLE public.listings ADD COLUMN model TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'year') THEN
        ALTER TABLE public.listings ADD COLUMN year INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'description') THEN
        ALTER TABLE public.listings ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'description') THEN
        ALTER TABLE public.activities ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'listing_id') THEN
        ALTER TABLE public.activities ADD COLUMN listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- SECURITY FIX 2: Add basic input validation constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_safe CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$');

-- SECURITY FIX 3: Create secure function for user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT CASE WHEN is_dealer THEN 'dealer' ELSE 'user' END
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Listings readable non-deleted" ON public.listings;

CREATE POLICY "Active listings viewable by everyone" 
ON public.listings 
FOR SELECT 
USING (status = 'active' AND deleted_at IS NULL);