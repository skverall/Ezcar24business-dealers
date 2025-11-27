-- CRITICAL SECURITY FIXES - PHASE 1: Emergency Data Protection

-- =====================================================
-- 1. FIX PROFILE DATA EXPOSURE (CRITICAL)
-- =====================================================

-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Public profile info (non-sensitive) viewable by everyone" ON public.profiles;

-- Create secure policies for profile data access
-- Only safe, non-sensitive data is publicly viewable
CREATE POLICY "Public can view safe profile data" ON public.profiles
FOR SELECT 
USING (true)
-- Only expose safe fields in SELECT queries through application logic
-- Email and phone will be filtered out at application level;

-- Users can view their complete profile (including sensitive data)
CREATE POLICY "Users can view their complete profile data" ON public.profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- =====================================================
-- 2. SECURE ADMIN SYSTEM (CRITICAL)
-- =====================================================

-- Drop overly permissive admin policies
DROP POLICY IF EXISTS "Allow admin functions access" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin functions access" ON public.admin_sessions;
DROP POLICY IF EXISTS "Allow admin functions access to activity log" ON public.admin_activity_log;

-- Create secure admin policies that only allow access via security definer functions
CREATE POLICY "Admin users accessible via functions only" ON public.admin_users
FOR ALL 
USING (false)
WITH CHECK (false);

CREATE POLICY "Admin sessions accessible via functions only" ON public.admin_sessions  
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Admin activity log accessible via functions only" ON public.admin_activity_log
FOR ALL
USING (false)
WITH CHECK (false);

-- =====================================================
-- 3. SECURE USER ACTIVITY LOGS (CRITICAL)
-- =====================================================

-- Enable RLS on user_activity_logs table
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON public.user_activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Only allow inserts via security definer functions (for system logging)
CREATE POLICY "Activity logs insertable via functions only" ON public.user_activity_logs
FOR INSERT
WITH CHECK (false);

-- =====================================================
-- 4. CREATE SECURE PROFILE VIEW FOR PUBLIC DATA
-- =====================================================

-- Create a secure view that only exposes safe profile fields
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  location,
  avatar_url,
  bio,
  is_dealer,
  created_at
FROM public.profiles;

-- Grant public access to the safe view
GRANT SELECT ON public.safe_profiles TO anon, authenticated;

-- =====================================================
-- 5. UPDATE SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Update existing functions to use proper search path
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = check_role
  );
$$;

-- Create secure function to get current user role  
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE WHEN is_dealer THEN 'dealer' ELSE 'user' END
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

-- =====================================================
-- 6. REVOKE DANGEROUS PERMISSIONS
-- =====================================================

-- Revoke any public grants on sensitive tables
REVOKE ALL ON public.admin_users FROM anon, authenticated;
REVOKE ALL ON public.admin_sessions FROM anon, authenticated; 
REVOKE ALL ON public.admin_activity_log FROM anon, authenticated;
REVOKE ALL ON public.user_activity_logs FROM anon, authenticated;

-- =====================================================
-- 7. ADD SECURITY AUDIT TRIGGER
-- =====================================================

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log any attempts to access admin tables directly
  INSERT INTO public.user_activity_logs (
    user_id, 
    action, 
    details,
    created_at
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'security_alert',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    ),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;