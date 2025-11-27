-- Admin System Setup Script
-- Execute this in Supabase SQL Editor to set up the admin authentication system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin users table for secure admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator', 'super_admin')),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamp with time zone,
  password_changed_at timestamp with time zone DEFAULT now(),
  failed_login_attempts integer DEFAULT 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.admin_users(id),
  
  -- Security constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  CONSTRAINT password_hash_not_empty CHECK (char_length(password_hash) > 0)
);

-- Create admin sessions table for secure session management
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  ip_address inet,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin activity log for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON public.admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON public.admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at);

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$;

-- Create function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO public.admin_activity_log (
    admin_user_id, action, resource_type, resource_id, 
    details, ip_address, user_agent
  ) VALUES (
    p_admin_user_id, p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Create function for admin authentication
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username text,
  p_password text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record public.admin_users%ROWTYPE;
  session_token text;
  session_id uuid;
  result jsonb;
BEGIN
  -- Check if user exists and is active
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE username = p_username AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Check if account is locked
  IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is temporarily locked');
  END IF;
  
  -- Verify password
  IF NOT public.verify_password(p_password, admin_record.password_hash) THEN
    -- Increment failed login attempts
    UPDATE public.admin_users 
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN now() + interval '30 minutes'
          ELSE NULL 
        END
    WHERE id = admin_record.id;
    
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session
  INSERT INTO public.admin_sessions (
    admin_user_id, session_token, expires_at, ip_address, user_agent
  ) VALUES (
    admin_record.id, 
    session_token, 
    now() + interval '8 hours',
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO session_id;
  
  -- Update user login info and reset failed attempts
  UPDATE public.admin_users 
  SET last_login_at = now(), 
      failed_login_attempts = 0,
      locked_until = NULL
  WHERE id = admin_record.id;
  
  -- Log activity
  PERFORM public.log_admin_activity(
    admin_record.id, 
    'login', 
    NULL, 
    NULL, 
    jsonb_build_object('ip_address', p_ip_address, 'user_agent', p_user_agent),
    p_ip_address,
    p_user_agent
  );
  
  result := jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'session_id', session_id,
    'user', jsonb_build_object(
      'id', admin_record.id,
      'username', admin_record.username,
      'role', admin_record.role,
      'full_name', admin_record.full_name,
      'email', admin_record.email
    )
  );
  
  RETURN result;
END;
$$;

-- Insert default admin user (username: admin, password: admin)
-- Note: This should be changed immediately after first login
INSERT INTO public.admin_users (
  username, 
  password_hash, 
  role, 
  full_name,
  email,
  is_active
) VALUES (
  'admin',
  public.hash_password('admin'),
  'super_admin',
  'System Administrator',
  'admin@ezcar24.com',
  true
) ON CONFLICT (username) DO NOTHING;

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record public.admin_sessions%ROWTYPE;
  admin_record public.admin_users%ROWTYPE;
  result jsonb;
BEGIN
  -- Get session
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired session');
  END IF;

  -- Get admin user
  SELECT * INTO admin_record
  FROM public.admin_users
  WHERE id = session_record.admin_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Admin user not found or inactive');
  END IF;

  -- Update last activity
  UPDATE public.admin_sessions
  SET last_activity_at = now()
  WHERE id = session_record.id;

  result := jsonb_build_object(
    'valid', true,
    'session_id', session_record.id,
    'user', jsonb_build_object(
      'id', admin_record.id,
      'username', admin_record.username,
      'role', admin_record.role,
      'full_name', admin_record.full_name,
      'email', admin_record.email
    )
  );

  RETURN result;
END;
$$;

-- Function to logout admin
CREATE OR REPLACE FUNCTION public.logout_admin(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record public.admin_sessions%ROWTYPE;
BEGIN
  -- Get session
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = p_session_token AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Deactivate session
  UPDATE public.admin_sessions
  SET is_active = false
  WHERE id = session_record.id;

  -- Log activity
  PERFORM public.log_admin_activity(
    session_record.admin_user_id,
    'logout'
  );

  RETURN true;
END;
$$;

-- Function to change admin password
CREATE OR REPLACE FUNCTION public.change_admin_password(
  p_session_token text,
  p_current_password text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record public.admin_sessions%ROWTYPE;
  admin_record public.admin_users%ROWTYPE;
  new_password_hash text;
BEGIN
  -- Validate session
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid session');
  END IF;

  -- Get admin user
  SELECT * INTO admin_record
  FROM public.admin_users
  WHERE id = session_record.admin_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;

  -- Verify current password
  IF NOT public.verify_password(p_current_password, admin_record.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Current password is incorrect');
  END IF;

  -- Validate new password strength
  IF char_length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'New password must be at least 8 characters long');
  END IF;

  -- Hash new password
  new_password_hash := public.hash_password(p_new_password);

  -- Update password
  UPDATE public.admin_users
  SET password_hash = new_password_hash,
      password_changed_at = now(),
      updated_at = now()
  WHERE id = admin_record.id;

  -- Log activity
  PERFORM public.log_admin_activity(
    admin_record.id,
    'password_change'
  );

  RETURN jsonb_build_object('success', true, 'message', 'Password changed successfully');
END;
$$;

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_listings integer;
  active_listings integer;
  pending_listings integer;
  total_users integer;
  active_users integer;
  total_messages integer;
  recent_activities jsonb;
BEGIN
  -- Get listing stats
  SELECT COUNT(*) INTO total_listings FROM public.listings;
  SELECT COUNT(*) INTO active_listings FROM public.listings WHERE status = 'active' AND is_draft = false;
  SELECT COUNT(*) INTO pending_listings FROM public.listings WHERE moderation_status = 'pending';

  -- Get user stats
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO active_users FROM auth.users WHERE last_sign_in_at > now() - interval '30 days';

  -- Get message stats
  SELECT COUNT(*) INTO total_messages FROM public.messages;

  -- Get recent activities (last 10)
  SELECT jsonb_agg(
    jsonb_build_object(
      'action', action,
      'resource_type', resource_type,
      'created_at', created_at,
      'admin_username', au.username
    ) ORDER BY created_at DESC
  ) INTO recent_activities
  FROM public.admin_activity_log aal
  LEFT JOIN public.admin_users au ON au.id = aal.admin_user_id
  WHERE aal.created_at > now() - interval '7 days'
  LIMIT 10;

  RETURN jsonb_build_object(
    'listings', jsonb_build_object(
      'total', total_listings,
      'active', active_listings,
      'pending', pending_listings
    ),
    'users', jsonb_build_object(
      'total', total_users,
      'active', active_users
    ),
    'messages', jsonb_build_object(
      'total', total_messages
    ),
    'recent_activities', COALESCE(recent_activities, '[]'::jsonb)
  );
END;
$$;

-- Grant necessary permissions (adjust as needed for your setup)
-- These might need to be adjusted based on your Supabase configuration
