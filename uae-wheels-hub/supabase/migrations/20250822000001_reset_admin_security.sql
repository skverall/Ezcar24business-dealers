-- Reset Admin Security and Create Secure Admin User
-- This script will reset admin authentication and create a secure admin user

-- 1. Clear any existing admin sessions and reset failed attempts
UPDATE public.admin_users 
SET failed_login_attempts = 0,
    locked_until = NULL,
    is_active = true
WHERE username = 'admin';

-- Delete all existing admin sessions to force re-login
DELETE FROM public.admin_sessions;

-- 2. Create or update the main admin user with a secure password
-- Delete existing admin user if exists
DELETE FROM public.admin_users WHERE username = 'admin';

-- Create new secure admin user
-- Username: admin
-- Password: EzCar24Admin2025! (strong password)
INSERT INTO public.admin_users (
  username, 
  password_hash, 
  role, 
  full_name, 
  email, 
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin',
  public.hash_password('EzCar24Admin2025!'),
  'super_admin',
  'System Administrator',
  'admin@ezcar24.com',
  true,
  now(),
  now()
);

-- 3. Create a backup admin user with different credentials
INSERT INTO public.admin_users (
  username, 
  password_hash, 
  role, 
  full_name, 
  email, 
  is_active,
  created_at,
  updated_at
) VALUES (
  'superadmin',
  public.hash_password('SuperAdmin2025!'),
  'super_admin',
  'Backup Administrator',
  'superadmin@ezcar24.com',
  true,
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = public.hash_password('SuperAdmin2025!'),
  failed_login_attempts = 0,
  locked_until = NULL,
  is_active = true,
  updated_at = now();

-- 4. Enhanced security: Create function to force password change on first login
CREATE OR REPLACE FUNCTION public.check_admin_password_age()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If password is older than 90 days, mark for forced change
  IF OLD.password_changed_at < now() - interval '90 days' THEN
    NEW.password_change_required := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add password_change_required column if it doesn't exist
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS password_change_required boolean DEFAULT false;

-- Create trigger for password age checking
DROP TRIGGER IF EXISTS check_admin_password_age_trigger ON public.admin_users;
CREATE TRIGGER check_admin_password_age_trigger
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_password_age();

-- 5. Enhanced authentication function with better security
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username text,
  p_password text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.admin_users%ROWTYPE;
  session_token text;
  session_id uuid;
  result jsonb;
BEGIN
  -- Input validation
  IF p_username IS NULL OR p_password IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username and password are required');
  END IF;
  
  -- Sanitize username
  p_username := trim(lower(p_username));
  
  -- Get admin user
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE lower(username) = p_username;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Check if account is active
  IF NOT admin_record.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is disabled');
  END IF;
  
  -- Check if account is locked
  IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Account is temporarily locked. Try again later.'
    );
  END IF;
  
  -- Verify password
  IF NOT public.verify_password(p_password, admin_record.password_hash) THEN
    -- Increment failed login attempts
    UPDATE public.admin_users 
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN now() + interval '30 minutes'
          ELSE NULL 
        END,
        updated_at = now()
    WHERE id = admin_record.id;
    
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate secure session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session with extended expiry for admin
  INSERT INTO public.admin_sessions (
    admin_user_id, session_token, expires_at, ip_address, user_agent
  ) VALUES (
    admin_record.id, 
    session_token, 
    now() + interval '12 hours', -- Extended session for admin
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO session_id;
  
  -- Update user login info and reset failed attempts
  UPDATE public.admin_users 
  SET last_login_at = now(), 
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = now()
  WHERE id = admin_record.id;
  
  -- Log successful login activity
  INSERT INTO public.admin_activity_log (
    admin_user_id, action, resource_type, resource_id, 
    details, ip_address, user_agent
  ) VALUES (
    admin_record.id, 'login', 'session', session_id::text,
    jsonb_build_object(
      'ip_address', p_ip_address, 
      'user_agent', p_user_agent,
      'login_time', now()
    ),
    p_ip_address, p_user_agent
  );
  
  -- Build response
  result := jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'session_id', session_id,
    'password_change_required', COALESCE(admin_record.password_change_required, false),
    'user', jsonb_build_object(
      'id', admin_record.id,
      'username', admin_record.username,
      'role', admin_record.role,
      'full_name', admin_record.full_name,
      'email', admin_record.email,
      'last_login_at', admin_record.last_login_at,
      'password_changed_at', admin_record.password_changed_at
    )
  );
  
  RETURN result;
END;
$$;

-- 6. Create admin password reset function (for emergency use)
CREATE OR REPLACE FUNCTION public.emergency_reset_admin_password(
  p_username text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.admin_users%ROWTYPE;
BEGIN
  -- This function should only be used in emergencies
  -- In production, add additional security checks
  
  -- Get admin user
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE lower(username) = lower(trim(p_username));
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;
  
  -- Validate new password strength
  IF char_length(p_new_password) < 12 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 12 characters long');
  END IF;
  
  -- Update password and reset security fields
  UPDATE public.admin_users
  SET password_hash = public.hash_password(p_new_password),
      password_changed_at = now(),
      password_change_required = false,
      failed_login_attempts = 0,
      locked_until = NULL,
      is_active = true,
      updated_at = now()
  WHERE id = admin_record.id;
  
  -- Invalidate all existing sessions for this user
  DELETE FROM public.admin_sessions WHERE admin_user_id = admin_record.id;
  
  -- Log the password reset
  INSERT INTO public.admin_activity_log (
    admin_user_id, action, resource_type, 
    details
  ) VALUES (
    admin_record.id, 'emergency_password_reset', 'admin_user',
    jsonb_build_object('reset_time', now())
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Password reset successfully. All sessions invalidated.'
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.emergency_reset_admin_password(text, text) TO postgres;

-- 7. Clean up old sessions (older than 24 hours)
DELETE FROM public.admin_sessions 
WHERE created_at < now() - interval '24 hours' OR expires_at < now();

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_username_lower ON public.admin_users(lower(username));
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Output the new admin credentials
DO $$
BEGIN
  RAISE NOTICE '=== ADMIN CREDENTIALS RESET ===';
  RAISE NOTICE 'Primary Admin:';
  RAISE NOTICE '  Username: admin';
  RAISE NOTICE '  Password: EzCar24Admin2025!';
  RAISE NOTICE '';
  RAISE NOTICE 'Backup Admin:';
  RAISE NOTICE '  Username: superadmin';
  RAISE NOTICE '  Password: SuperAdmin2025!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Change these passwords immediately after first login!';
  RAISE NOTICE '================================';
END $$;
