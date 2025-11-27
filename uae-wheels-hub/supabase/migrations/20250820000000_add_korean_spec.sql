-- Add Korean specification to car_specs table
INSERT INTO public.car_specs (name, display_name, sort_order) VALUES
('korean', 'Korean', 6)
ON CONFLICT (name) DO NOTHING;
