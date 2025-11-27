-- RLS Policies for admin system

-- Admin users policies - only admins can manage admin users
CREATE POLICY "Admin users can view other admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions s 
    WHERE s.admin_user_id = auth.uid()::uuid 
    AND s.is_active = true 
    AND s.expires_at > now()
  )
);

CREATE POLICY "Super admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.admin_sessions s ON s.admin_user_id = au.id
    WHERE s.admin_user_id = auth.uid()::uuid 
    AND au.role = 'super_admin'
    AND s.is_active = true 
    AND s.expires_at > now()
  )
);

-- Admin sessions policies - users can only manage their own sessions
CREATE POLICY "Admin users can view their own sessions" 
ON public.admin_sessions 
FOR SELECT 
USING (admin_user_id = auth.uid()::uuid);

CREATE POLICY "Admin users can manage their own sessions" 
ON public.admin_sessions 
FOR ALL 
USING (admin_user_id = auth.uid()::uuid);

-- Admin activity log policies - read-only for admins
CREATE POLICY "Admin users can view activity logs" 
ON public.admin_activity_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions s 
    WHERE s.admin_user_id = auth.uid()::uuid 
    AND s.is_active = true 
    AND s.expires_at > now()
  )
);

-- Create function to hash passwords (using pgcrypto extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
