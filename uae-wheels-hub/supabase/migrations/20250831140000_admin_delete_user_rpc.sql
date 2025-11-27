-- Admin RPC function to delete users
-- This function validates admin session and deletes a user from auth.users

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id uuid,
  p_session_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_record public.admin_sessions%ROWTYPE;
  admin_record public.admin_users%ROWTYPE;
  user_exists boolean := false;
BEGIN
  -- Validate session
  SELECT * INTO session_record 
  FROM public.admin_sessions 
  WHERE session_token = p_session_token 
    AND is_active = true 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;
  
  -- Get admin user
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE id = session_record.admin_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found or inactive');
  END IF;
  
  -- Check if user exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Delete user from auth.users (this will cascade to related tables)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- Log the activity
  PERFORM public.log_admin_activity(
    admin_record.id, 
    'delete_user',
    'user',
    p_user_id::text,
    jsonb_build_object('deleted_user_id', p_user_id)
  );
  
  -- Update session activity
  UPDATE public.admin_sessions 
  SET last_activity_at = now() 
  WHERE id = session_record.id;
  
  RETURN jsonb_build_object('success', true, 'message', 'User deleted successfully');
END;
$$;

-- Grant execute permission to authenticated users (admin validation is done inside the function)
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid, text) TO authenticated;
