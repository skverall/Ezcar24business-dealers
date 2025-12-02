-- Additional admin system functions

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

-- Create function to get admin dashboard stats
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
