-- Check and add missing columns to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS trim text,
ADD COLUMN IF NOT EXISTS body_type text,
ADD COLUMN IF NOT EXISTS transmission text,
ADD COLUMN IF NOT EXISTS fuel_type text,
ADD COLUMN IF NOT EXISTS condition text,
ADD COLUMN IF NOT EXISTS accident_history text,
ADD COLUMN IF NOT EXISTS warranty text,
ADD COLUMN IF NOT EXISTS seller_type text,
ADD COLUMN IF NOT EXISTS owners_count text,
ADD COLUMN IF NOT EXISTS tags text[];

-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verification_date timestamp with time zone;

-- Create moderate_listing RPC function
CREATE OR REPLACE FUNCTION public.moderate_listing(
  listing_id uuid, 
  new_status text, 
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user has admin/moderator role
  IF NOT (public.has_role('admin'::text) OR public.has_role('moderator'::text)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update listing moderation status
  UPDATE public.listings 
  SET 
    moderation_status = new_status,
    moderation_reason = reason,
    moderated_at = now(),
    moderated_by = auth.uid()
  WHERE id = listing_id;
  
  -- Log the activity
  INSERT INTO public.admin_activities (admin_id, action, target_type, target_id, details)
  VALUES (
    auth.uid(),
    'moderate_listing',
    'listing',
    listing_id,
    jsonb_build_object(
      'status', new_status,
      'reason', reason
    )
  );
END;
$$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_main ON public.listings(is_draft, status, deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_images_main ON public.listing_images(listing_id, is_cover);
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings(make, model, title) WHERE is_draft = false AND status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_price_year ON public.listings(price, year) WHERE is_draft = false AND status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city) WHERE is_draft = false AND status = 'active' AND deleted_at IS NULL;

-- Add full-text search column and index
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_listings_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
DROP TRIGGER IF EXISTS listings_search_vector_update ON public.listings;
CREATE TRIGGER listings_search_vector_update
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_listings_search_vector();

-- Create search vector index
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON public.listings USING gin(search_vector);

-- Update existing records
UPDATE public.listings SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(make, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C')
WHERE search_vector IS NULL;