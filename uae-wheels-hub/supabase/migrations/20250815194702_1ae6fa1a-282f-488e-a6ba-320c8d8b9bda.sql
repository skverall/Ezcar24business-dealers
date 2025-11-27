-- Remove seeded demo listings by exact titles
DELETE FROM listing_images WHERE listing_id IN (
  SELECT id FROM listings WHERE title IN ('BMW 3 Series 2023','Toyota Camry 2023','Mercedes GLE 2022')
);
DELETE FROM favorites WHERE listing_id IN (
  SELECT id FROM listings WHERE title IN ('BMW 3 Series 2023','Toyota Camry 2023','Mercedes GLE 2022')
);
DELETE FROM messages WHERE listing_id IN (
  SELECT id FROM listings WHERE title IN ('BMW 3 Series 2023','Toyota Camry 2023','Mercedes GLE 2022')
);
DELETE FROM conversations WHERE listing_id IN (
  SELECT id FROM listings WHERE title IN ('BMW 3 Series 2023','Toyota Camry 2023','Mercedes GLE 2022')
);
DELETE FROM activities WHERE listing_id IN (
  SELECT id FROM listings WHERE title IN ('BMW 3 Series 2023','Toyota Camry 2023','Mercedes GLE 2022')
);
DELETE FROM listings WHERE title IN ('BMW 3 Series 2023','Toyota Camry 2023','Mercedes GLE 2022');

-- Approve user's active Tesla listing so it appears on Browse
UPDATE listings 
SET moderation_status = 'approved'
WHERE make ILIKE 'tesla' 
  AND is_draft = false 
  AND deleted_at IS NULL;