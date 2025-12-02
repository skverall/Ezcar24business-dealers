-- Harden admin bootstrap: remove default seeds, require first-login password change,
-- and gate privileged provisioning behind env token/IP checks.

-- Ensure password_change_required flag exists and defaults to true for new admins
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS password_change_required boolean DEFAULT true;
ALTER TABLE public.admin_users
  ALTER COLUMN password_change_required SET DEFAULT true;

-- Disable any leftover seeded accounts that were never used
UPDATE public.admin_users
SET
  password_hash = public.hash_password(gen_random_uuid()::text),
  password_change_required = true,
  password_changed_at = NULL,
  is_active = false,
  updated_at = now()
WHERE username IN ('admin', 'superadmin')
  AND (last_login_at IS NULL OR password_changed_at IS NULL);

-- Helper: check if request IP is whitelisted via app.settings.admin_seed_ips (comma-separated CIDRs)
CREATE OR REPLACE FUNCTION public._admin_ip_allowed(p_ip inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_list text;
  allowed_ip text;
BEGIN
  allowed_list := current_setting('app.settings.admin_seed_ips', true);

  -- If no whitelist is configured, allow all IPs
  IF allowed_list IS NULL OR allowed_list = '' THEN
    RETURN true;
  END IF;

  -- If whitelist exists, caller must provide an IP
  IF p_ip IS NULL THEN
    RETURN false;
  END IF;

  FOR allowed_ip IN
    SELECT trim(value) FROM unnest(string_to_array(allowed_list, ',')) value
  LOOP
    CONTINUE WHEN allowed_ip = '';
    BEGIN
      IF p_ip <<= allowed_ip::cidr THEN
        RETURN true;
      END IF;
    EXCEPTION WHEN others THEN
      -- Ignore malformed CIDRs
      CONTINUE;
    END;
  END LOOP;

  RETURN false;
END;
$$;

-- Secure admin provisioning function that requires a configured token and optional IP allow list
CREATE OR REPLACE FUNCTION public.provision_admin_user(
  p_token text,
  p_username text,
  p_password text,
  p_email text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_request_ip inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_token text := current_setting('app.settings.admin_seed_token', true);
  normalized_username text;
  new_admin_id uuid;
BEGIN
  IF expected_token IS NULL OR expected_token = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin seed token not configured');
  END IF;

  IF p_token IS DISTINCT FROM expected_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT public._admin_ip_allowed(p_request_ip) THEN
    RETURN jsonb_build_object('success', false, 'error', 'IP not allowed');
  END IF;

  IF char_length(coalesce(p_password, '')) < 12 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 12 characters');
  END IF;

  normalized_username := lower(trim(p_username));
  IF normalized_username IS NULL OR normalized_username = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username is required');
  END IF;

  INSERT INTO public.admin_users (
    username,
    password_hash,
    role,
    full_name,
    email,
    is_active,
    password_change_required,
    password_changed_at,
    created_at,
    updated_at
  ) VALUES (
    normalized_username,
    public.hash_password(p_password),
    'super_admin',
    p_full_name,
    p_email,
    true,
    true,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    password_change_required = true,
    password_changed_at = NULL,
    is_active = true,
    full_name = COALESCE(EXCLUDED.full_name, admin_users.full_name),
    email = COALESCE(EXCLUDED.email, admin_users.email),
    updated_at = now()
  RETURNING id INTO new_admin_id;

  PERFORM public.log_admin_activity(
    new_admin_id,
    'provision_admin',
    'admin_user',
    new_admin_id::text,
    jsonb_build_object('ip', p_request_ip)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin provisioned. Password change required on first login.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_admin_user(text, text, text, text, text, inet) FROM PUBLIC;

-- Require password reset to clear the flag
CREATE OR REPLACE FUNCTION public.change_admin_password(
  p_session_token text,
  p_current_password text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  IF char_length(p_new_password) < 12 THEN
    RETURN jsonb_build_object('success', false, 'error', 'New password must be at least 12 characters long');
  END IF;
  
  -- Hash new password
  new_password_hash := public.hash_password(p_new_password);
  
  -- Update password
  UPDATE public.admin_users 
  SET password_hash = new_password_hash,
      password_changed_at = now(),
      password_change_required = false,
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

-- Surface password_change_required state during authentication
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username text,
  p_password text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Enforce password rotation flag when password_changed_at is missing
  IF admin_record.password_changed_at IS NULL THEN
    UPDATE public.admin_users
    SET password_change_required = true
    WHERE id = admin_record.id;
    admin_record.password_change_required := true;
  END IF;
  
  -- Generate secure session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session with extended expiry for admin
  INSERT INTO public.admin_sessions (
    admin_user_id, session_token, expires_at, ip_address, user_agent
  ) VALUES (
    admin_record.id, 
    session_token, 
    now() + interval '12 hours',
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

-- Limit direct DML on admin tables to avoid bypassing function checks
REVOKE INSERT, UPDATE, DELETE ON public.admin_users FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_sessions FROM anon, authenticated;
