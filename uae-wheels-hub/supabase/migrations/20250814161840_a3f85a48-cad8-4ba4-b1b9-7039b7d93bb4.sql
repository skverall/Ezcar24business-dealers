-- Ensure the listing_images table exists with proper structure
CREATE TABLE IF NOT EXISTS public.listing_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- Create policies for listing images
CREATE POLICY IF NOT EXISTS "Images readable public" 
ON public.listing_images 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Images manageable by owner" 
ON public.listing_images 
FOR ALL 
USING (EXISTS (
  SELECT 1 
  FROM listings l 
  WHERE l.id = listing_images.listing_id 
  AND auth.uid() = l.user_id
))
WITH CHECK (EXISTS (
  SELECT 1 
  FROM listings l 
  WHERE l.id = listing_images.listing_id 
  AND auth.uid() = l.user_id
));