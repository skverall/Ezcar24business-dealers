-- Insert test listings for demonstration
INSERT INTO public.listings (
  user_id, title, make, model, year, price, mileage, city, spec, 
  body_type, transmission, fuel_type, condition, accident_history,
  warranty, seller_type, owners_count, tags, description,
  is_draft, status, moderation_status
) VALUES 
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BMW 3 Series 2023',
  'bmw',
  '3 Series',
  2023,
  185000,
  15000,
  'Dubai',
  'GCC',
  'sedan',
  'automatic',
  'petrol',
  'excellent',
  'clean',
  'yes',
  'dealer',
  '1',
  ARRAY['featured', 'premium']::text[],
  'Well-maintained BMW 3 Series in excellent condition. Full service history available.',
  false,
  'active',
  'approved'
),
(
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Mercedes GLE 2022',
  'mercedes-benz',
  'GLE',
  2022,
  320000,
  22000,
  'Abu Dhabi',
  'GCC',
  'suv',
  'automatic',
  'petrol',
  'excellent',
  'clean',
  'yes',
  'dealer',
  '1',
  ARRAY['luxury', 'featured']::text[],
  'Luxury Mercedes GLE with premium features and full warranty.',
  false,
  'active',
  'approved'
),
(
  '00000000-0000-0000-0000-000000000003'::uuid,
  'Toyota Camry 2023',
  'toyota',
  'Camry',
  2023,
  95000,
  12000,
  'Sharjah',
  'GCC',
  'sedan',
  'automatic',
  'hybrid',
  'excellent',
  'clean',
  'yes',
  'dealer',
  '1',
  ARRAY['featured', 'eco']::text[],
  'Reliable Toyota Camry Hybrid with excellent fuel economy.',
  false,
  'active',
  'approved'
);

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