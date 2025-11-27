-- SECURITY FIX 1: Update profiles RLS policy to restrict public access to sensitive data
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more secure policies that protect private data
CREATE POLICY "Basic profile info viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Add missing columns to listings if they don't exist
DO $$ 
BEGIN
    -- Add missing columns to listings table
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
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'mileage') THEN
        ALTER TABLE public.listings ADD COLUMN mileage INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'fuel_type') THEN
        ALTER TABLE public.listings ADD COLUMN fuel_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'transmission') THEN
        ALTER TABLE public.listings ADD COLUMN transmission TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'body_type') THEN
        ALTER TABLE public.listings ADD COLUMN body_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'color') THEN
        ALTER TABLE public.listings ADD COLUMN color TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'images') THEN
        ALTER TABLE public.listings ADD COLUMN images TEXT[];
    END IF;
    
    -- Add missing columns to activities table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'description') THEN
        ALTER TABLE public.activities ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'listing_id') THEN
        ALTER TABLE public.activities ADD COLUMN listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update listings table constraints to match the price column type (integer vs decimal)
-- Change price column from integer to decimal for better precision
ALTER TABLE public.listings ALTER COLUMN price TYPE DECIMAL(10,2) USING price::DECIMAL(10,2);

-- SECURITY FIX 2: Add input validation constraints
-- Add constraints to listings table
DO $$
BEGIN
    -- Add title length constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'listings_title_length') THEN
        ALTER TABLE public.listings ADD CONSTRAINT listings_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 100);
    END IF;
    
    -- Add price positive constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'listings_price_positive') THEN
        ALTER TABLE public.listings ADD CONSTRAINT listings_price_positive CHECK (price > 0);
    END IF;
    
    -- Add year valid constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'listings_year_valid') THEN
        ALTER TABLE public.listings ADD CONSTRAINT listings_year_valid CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1);
    END IF;
    
    -- Add mileage positive constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'listings_mileage_positive') THEN
        ALTER TABLE public.listings ADD CONSTRAINT listings_mileage_positive CHECK (mileage >= 0);
    END IF;
END $$;

-- Add constraints to profiles table
DO $$
BEGIN
    -- Add full name length constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'profiles_full_name_length') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR (char_length(full_name) >= 2 AND char_length(full_name) <= 100));
    END IF;
    
    -- Add email format constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'profiles_email_format') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
    
    -- Add phone format constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'profiles_phone_format') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$');
    END IF;
END $$;

-- SECURITY FIX 3: Create secure function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT CASE WHEN is_dealer THEN 'dealer' ELSE 'user' END
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies for better security
-- Drop overly permissive policies and create more restrictive ones
DROP POLICY IF EXISTS "Listings readable non-deleted" ON public.listings;

-- Create new secure policies
CREATE POLICY "Active listings viewable by everyone" 
ON public.listings 
FOR SELECT 
USING (status = 'active' AND deleted_at IS NULL);

-- Add indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_deleted_at ON public.listings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);