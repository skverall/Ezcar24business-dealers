-- Fix listing-images storage bucket and policies
-- This migration ensures the listing-images bucket exists with proper RLS policies

-- =====================================================
-- 1. CREATE LISTING-IMAGES STORAGE BUCKET
-- =====================================================

-- Create storage bucket for listing images if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'listing-images', 
  'listing-images', 
  true,
  52428800, -- 50MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- 2. CREATE RLS POLICIES FOR LISTING-IMAGES BUCKET
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Listing images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their listing images" ON storage.objects;

-- Create RLS policies for listing-images bucket
CREATE POLICY "Listing images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'listing-images');

CREATE POLICY "Users can upload listing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

CREATE POLICY "Users can update their listing images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their listing images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 3. ADD CONSTRAINTS TO LISTING_IMAGES TABLE
-- =====================================================

-- Add constraint to ensure only one cover image per listing
CREATE OR REPLACE FUNCTION public.ensure_single_cover_image()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If setting a new cover image, unset all other cover images for this listing
  IF NEW.is_cover = true THEN
    UPDATE public.listing_images 
    SET is_cover = false 
    WHERE listing_id = NEW.listing_id 
    AND id != NEW.id 
    AND is_cover = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure single cover image
DROP TRIGGER IF EXISTS ensure_single_cover_trigger ON public.listing_images;
CREATE TRIGGER ensure_single_cover_trigger
  BEFORE INSERT OR UPDATE ON public.listing_images
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_cover_image();

-- =====================================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_cover ON public.listing_images(listing_id, is_cover) WHERE is_cover = true;
CREATE INDEX IF NOT EXISTS idx_listing_images_sort ON public.listing_images(listing_id, sort_order);

-- =====================================================
-- 5. CLEAN UP EXISTING DATA
-- =====================================================

-- Fix any existing multiple cover images (keep the first one created)
WITH ranked_covers AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY created_at ASC) as rn
  FROM public.listing_images 
  WHERE is_cover = true
)
UPDATE public.listing_images 
SET is_cover = false 
WHERE id IN (
  SELECT id FROM ranked_covers WHERE rn > 1
);

-- Ensure every listing has at least one cover image
WITH listings_without_cover AS (
  SELECT l.id as listing_id
  FROM public.listings l
  LEFT JOIN public.listing_images li ON l.id = li.listing_id AND li.is_cover = true
  WHERE li.id IS NULL
  AND EXISTS (SELECT 1 FROM public.listing_images WHERE listing_id = l.id)
)
UPDATE public.listing_images 
SET is_cover = true 
WHERE id IN (
  SELECT DISTINCT ON (listing_id) id
  FROM public.listing_images li
  WHERE li.listing_id IN (SELECT listing_id FROM listings_without_cover)
  ORDER BY listing_id, sort_order ASC, created_at ASC
);

-- =====================================================
-- 6. ADD HELPFUL FUNCTIONS
-- =====================================================

-- Function to get listing images with proper ordering
CREATE OR REPLACE FUNCTION public.get_listing_images(p_listing_id uuid)
RETURNS TABLE (
  id uuid,
  url text,
  sort_order integer,
  is_cover boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT li.id, li.url, li.sort_order, li.is_cover, li.created_at
  FROM public.listing_images li
  WHERE li.listing_id = p_listing_id
  ORDER BY li.is_cover DESC, li.sort_order ASC, li.created_at ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_listing_images(uuid) TO authenticated;
