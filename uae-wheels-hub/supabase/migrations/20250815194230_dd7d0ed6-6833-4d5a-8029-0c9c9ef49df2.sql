-- Delete test/demo listings completely
DELETE FROM listing_images WHERE listing_id IN (
  SELECT id FROM listings 
  WHERE title LIKE '%Test%' 
     OR title LIKE '%тест%' 
     OR make LIKE '%Test%'
     OR description LIKE '%test%'
     OR description LIKE '%demo%'
);

DELETE FROM favorites WHERE listing_id IN (
  SELECT id FROM listings 
  WHERE title LIKE '%Test%' 
     OR title LIKE '%тест%' 
     OR make LIKE '%Test%'
     OR description LIKE '%test%'
     OR description LIKE '%demo%'
);

DELETE FROM conversations WHERE listing_id IN (
  SELECT id FROM listings 
  WHERE title LIKE '%Test%' 
     OR title LIKE '%тест%' 
     OR make LIKE '%Test%'
     OR description LIKE '%test%'
     OR description LIKE '%demo%'
);

DELETE FROM messages WHERE listing_id IN (
  SELECT id FROM listings 
  WHERE title LIKE '%Test%' 
     OR title LIKE '%тест%' 
     OR make LIKE '%Test%'
     OR description LIKE '%test%'
     OR description LIKE '%demo%'
);

DELETE FROM activities WHERE listing_id IN (
  SELECT id FROM listings 
  WHERE title LIKE '%Test%' 
     OR title LIKE '%тест%' 
     OR make LIKE '%Test%'
     OR description LIKE '%test%'
     OR description LIKE '%demo%'
);

-- Finally delete the listings themselves
DELETE FROM listings 
WHERE title LIKE '%Test%' 
   OR title LIKE '%тест%' 
   OR make LIKE '%Test%'
   OR description LIKE '%test%'
   OR description LIKE '%demo%';