-- Allow public read access to listing images for active and sold listings
-- Previously restricted to active only, which hid photos on sold listings

DROP POLICY IF EXISTS listing_images_public_read ON public.listing_images;

CREATE POLICY listing_images_public_read
ON public.listing_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_images.listing_id
      AND l.deleted_at IS NULL
      AND COALESCE(l.is_draft, false) = false
      AND COALESCE(l.moderation_status, 'approved') = 'approved'
      AND l.status IN ('active', 'sold')
  )
  OR public.has_role('admin')
  OR public.has_role('moderator')
);
