-- Allow public to view approved active or sold listings
-- This migration updates the RLS policy to include status 'sold' for public read access

-- Drop old restrictive policy if present
DROP POLICY IF EXISTS "Approved listings viewable by everyone" ON public.listings;

-- Create new policy allowing active or sold approved listings to be publicly readable
CREATE POLICY "Public can view approved active or sold listings"
ON public.listings
FOR SELECT
USING (
  (moderation_status = 'approved' AND status IN ('active','sold') AND deleted_at IS NULL AND COALESCE(is_draft, false) = false)
  OR (auth.uid() = user_id)
  OR public.has_role('admin')
  OR public.has_role('moderator')
);

