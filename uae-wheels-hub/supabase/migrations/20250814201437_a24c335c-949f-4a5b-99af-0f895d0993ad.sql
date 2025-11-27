-- Fix multiple cover images issue: only one cover image per listing
UPDATE listing_images 
SET is_cover = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (listing_id) id 
  FROM listing_images 
  WHERE is_cover = true 
  ORDER BY listing_id, created_at ASC
);