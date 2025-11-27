-- Add tables for dropdowns with predefined data

-- Create car specifications table
CREATE TABLE IF NOT EXISTS public.car_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cities table  
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  country text DEFAULT 'UAE',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add missing columns to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS mileage integer,
ADD COLUMN IF NOT EXISTS spec text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS whatsapp text;

-- Insert predefined car specs
INSERT INTO public.car_specs (name, display_name, sort_order) VALUES
('gcc', 'GCC', 1),
('us', 'US', 2),
('eu', 'European', 3),
('japanese', 'Japanese', 4),
('other', 'Other', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert UAE cities
INSERT INTO public.cities (name, display_name, sort_order) VALUES
('dubai', 'Dubai', 1),
('abu_dhabi', 'Abu Dhabi', 2),
('sharjah', 'Sharjah', 3),
('ajman', 'Ajman', 4),
('fujairah', 'Fujairah', 5),
('ras_al_khaimah', 'Ras Al Khaimah', 6),
('umm_al_quwain', 'Umm Al Quwain', 7)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.car_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create public read policies for reference tables
CREATE POLICY "Car specs are publicly readable" 
ON public.car_specs 
FOR SELECT 
USING (true);

CREATE POLICY "Cities are publicly readable" 
ON public.cities 
FOR SELECT 
USING (true);