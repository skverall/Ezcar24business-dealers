-- Add corresponding images for the listings
INSERT INTO public.listing_images (listing_id, url, is_cover, sort_order)
SELECT 
  l.id,
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
  true,
  0
FROM public.listings l
WHERE l.title = 'BMW 3 Series 2023';

INSERT INTO public.listing_images (listing_id, url, is_cover, sort_order)
SELECT 
  l.id,
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
  true,
  0
FROM public.listings l
WHERE l.title = 'Mercedes GLE 2022';

INSERT INTO public.listing_images (listing_id, url, is_cover, sort_order)
SELECT 
  l.id,
  'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
  true,
  0
FROM public.listings l
WHERE l.title = 'Toyota Camry 2023';