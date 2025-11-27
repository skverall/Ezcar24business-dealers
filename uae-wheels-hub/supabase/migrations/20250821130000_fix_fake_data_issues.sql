-- Fix fake data issues: Remove automatic verification and ensure honest user creation

-- 1. Update handle_new_user function to create users with proper unverified status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Create user profile with explicitly unverified status
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    email, 
    phone,
    verification_status,
    is_dealer,
    company_name
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    'unverified', -- Explicitly set as unverified
    COALESCE((NEW.raw_user_meta_data ->> 'is_dealer')::boolean, false),
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data ->> 'is_dealer')::boolean, false) = true 
      THEN NEW.raw_user_meta_data ->> 'company_name'
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$function$;

-- 2. Ensure all existing users without verification_status are set to unverified
UPDATE public.profiles 
SET verification_status = 'unverified' 
WHERE verification_status IS NULL;

-- 3. Create a function to get real seller statistics (no fake data)
CREATE OR REPLACE FUNCTION public.get_seller_stats(seller_user_id uuid)
RETURNS TABLE(
  total_listings integer,
  active_listings integer,
  total_views integer,
  member_since timestamp with time zone,
  verification_status text,
  is_dealer boolean,
  company_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    COUNT(l.id)::integer as total_listings,
    COUNT(CASE WHEN l.status = 'active' AND l.moderation_status = 'approved' THEN 1 END)::integer as active_listings,
    COALESCE(SUM(l.views), 0)::integer as total_views,
    p.created_at as member_since,
    p.verification_status,
    p.is_dealer,
    p.company_name
  FROM public.profiles p
  LEFT JOIN public.listings l ON l.user_id = p.user_id 
    AND l.deleted_at IS NULL 
    AND l.is_draft = false
  WHERE p.user_id = seller_user_id
  GROUP BY p.user_id, p.created_at, p.verification_status, p.is_dealer, p.company_name;
$function$;

-- 4. Add RLS policy for seller stats function
CREATE POLICY "Seller stats viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_verification ON public.profiles(user_id, verification_status);

-- 6. Add a comment to document the honest approach
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates new user profiles with unverified status - no fake data or automatic verification';
COMMENT ON FUNCTION public.get_seller_stats(uuid) IS 'Returns real seller statistics based on actual data - no fake reviews or ratings';

-- 7. Ensure verification_status column has proper constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT check_verification_status 
CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- 8. Create a view for honest user display (no fake data)
CREATE OR REPLACE VIEW public.honest_user_profiles AS
SELECT 
  p.user_id,
  p.full_name,
  p.location,
  p.avatar_url,
  p.bio,
  p.is_dealer,
  p.company_name,
  p.verification_status,
  p.created_at,
  -- Real statistics only
  COALESCE(stats.total_listings, 0) as total_listings,
  COALESCE(stats.active_listings, 0) as active_listings,
  COALESCE(stats.total_views, 0) as total_views
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*)::integer as total_listings,
    COUNT(CASE WHEN status = 'active' AND moderation_status = 'approved' THEN 1 END)::integer as active_listings,
    COALESCE(SUM(views), 0)::integer as total_views
  FROM public.listings 
  WHERE deleted_at IS NULL AND is_draft = false
  GROUP BY user_id
) stats ON stats.user_id = p.user_id;

-- 9. Add comment explaining the honest approach
COMMENT ON VIEW public.honest_user_profiles IS 'User profiles with real statistics only - no fake reviews, ratings, or verification badges';

-- 10. Log this migration for audit purposes
INSERT INTO public.admin_activities (
  admin_id, 
  action, 
  target_type, 
  target_id, 
  details
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- System user
  'remove_fake_data',
  'system',
  '00000000-0000-0000-0000-000000000000'::uuid,
  jsonb_build_object(
    'description', 'Removed fake data and automatic verification',
    'changes', jsonb_build_array(
      'Updated handle_new_user to create unverified users',
      'Created get_seller_stats function for real data',
      'Created honest_user_profiles view',
      'Added verification_status constraints'
    )
  )
) ON CONFLICT DO NOTHING;
