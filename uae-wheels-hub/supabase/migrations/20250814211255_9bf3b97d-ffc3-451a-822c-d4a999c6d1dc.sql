-- Fix function search_path issues
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.update_conversation_timestamp() SET search_path = '';
ALTER FUNCTION public.get_public_profile(uuid) SET search_path = '';
ALTER FUNCTION public.get_current_user_role() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Add listing moderation system
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_reason text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderated_by uuid;

-- Create admin roles system
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = check_role
  );
$$;

-- Create activity logging table
CREATE TABLE IF NOT EXISTS public.admin_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_activities
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for admin activities
CREATE POLICY "Admins can view all activities" 
ON public.admin_activities 
FOR SELECT 
USING (public.has_role('admin') OR public.has_role('moderator'));

CREATE POLICY "Admins can insert activities" 
ON public.admin_activities 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id AND (public.has_role('admin') OR public.has_role('moderator')));

-- Update listings policies to include moderation
CREATE POLICY "Approved listings viewable by everyone" 
ON public.listings 
FOR SELECT 
USING (
  (moderation_status = 'approved' AND status = 'active' AND deleted_at IS NULL AND COALESCE(is_draft, false) = false) 
  OR (auth.uid() = user_id)
  OR public.has_role('admin') 
  OR public.has_role('moderator')
);

-- Drop conflicting policies first
DROP POLICY IF EXISTS "Active listings viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Listings readable public" ON public.listings;

-- Create function for content moderation
CREATE OR REPLACE FUNCTION public.moderate_listing(
  listing_id uuid,
  new_status text,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user has admin/moderator role
  IF NOT (public.has_role('admin') OR public.has_role('moderator')) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update listing moderation status
  UPDATE public.listings 
  SET 
    moderation_status = new_status,
    moderation_reason = reason,
    moderated_at = now(),
    moderated_by = auth.uid()
  WHERE id = listing_id;
  
  -- Log the activity
  INSERT INTO public.admin_activities (admin_id, action, target_type, target_id, details)
  VALUES (
    auth.uid(),
    'moderate_listing',
    'listing',
    listing_id,
    jsonb_build_object(
      'status', new_status,
      'reason', reason
    )
  );
END;
$$;

-- Create trigger to update listings timestamp
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();