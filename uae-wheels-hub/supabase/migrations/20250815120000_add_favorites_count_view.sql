-- Create a view to get favorites count for each listing
-- This can be used to enhance featured vehicle selection

CREATE OR REPLACE VIEW public.listing_stats AS
SELECT 
  l.id,
  l.title,
  l.make,
  l.model,
  l.year,
  l.price,
  l.views,
  l.created_at,
  l.tags,
  l.condition,
  l.accident_history,
  COALESCE(f.favorites_count, 0) as favorites_count
FROM public.listings l
LEFT JOIN (
  SELECT 
    listing_id,
    COUNT(*) as favorites_count
  FROM public.favorites
  GROUP BY listing_id
) f ON l.id = f.listing_id
WHERE l.is_draft = false 
  AND l.status = 'active' 
  AND l.moderation_status = 'approved'
  AND l.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON public.listing_stats TO authenticated;
GRANT SELECT ON public.listing_stats TO anon;

-- Create an index on the underlying favorites table for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);

-- Add a comment explaining the view
COMMENT ON VIEW public.listing_stats IS 'Provides listing statistics including favorites count for featured vehicle selection';
