-- Fix RLS recursion on user_roles by removing self-referential policies
-- and delegating admin checks to a security definer helper.

-- Helper to check admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  );
$$;

-- Clean up previous policies that referenced user_roles directly
DROP POLICY IF EXISTS user_roles_admin_write ON public.user_roles;
DROP POLICY IF EXISTS user_roles_select_self ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Users can read their own roles; service role can read everything
CREATE POLICY user_roles_select_self
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Admins (via helper) or the service role can manage roles
CREATE POLICY user_roles_admin_manage
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role' OR public.is_admin())
WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
