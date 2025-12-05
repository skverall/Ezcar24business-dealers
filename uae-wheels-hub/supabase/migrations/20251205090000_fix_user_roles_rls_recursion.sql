-- Create a secure function to check admin status without recursion
-- This function runs with the privileges of the creator (SECURITY DEFINER),
-- bypassing RLS on the user_roles table to avoid infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Drop existing policies to start fresh and avoid conflicts
-- We drop common names to ensure we clean up the recursive ones
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Allow individual read access" ON user_roles;
DROP POLICY IF EXISTS "Allow admin full access" ON user_roles;

-- Enable RLS (just in case)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own roles
-- This is safe and non-recursive
CREATE POLICY "Users can read own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Admins can do everything
-- This uses the security definer function to break the recursion loop
CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
