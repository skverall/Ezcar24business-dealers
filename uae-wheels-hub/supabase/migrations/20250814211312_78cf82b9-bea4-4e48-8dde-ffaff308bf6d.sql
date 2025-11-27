-- Drop the existing trigger first, then recreate it
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;