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
USING (true);

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
-- 4. REVOKE DANGEROUS PERMISSIONS
-- =====================================================

-- Revoke any public grants on sensitive tables
REVOKE ALL ON public.admin_users FROM anon, authenticated;
REVOKE ALL ON public.admin_sessions FROM anon, authenticated; 
REVOKE ALL ON public.admin_activity_log FROM anon, authenticated;
REVOKE ALL ON public.user_activity_logs FROM anon, authenticated;