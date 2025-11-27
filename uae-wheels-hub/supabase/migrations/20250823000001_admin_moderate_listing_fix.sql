-- Ensure admin_moderate_listing enforces correct behavior and SECURITY DEFINER
-- and accepts optional session token for additional checks

CREATE OR REPLACE FUNCTION public.admin_moderate_listing(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_action text,
  p_reason text DEFAULT NULL,
  p_session_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_status text;
  v_rows integer;
BEGIN
  -- Map action to moderation status
  IF p_action = 'approve' THEN
    v_new_status := 'approved';
  ELSIF p_action = 'reject' THEN
    v_new_status := 'rejected';
  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- Optional: validate session token belongs to the same admin
  IF p_session_token IS NOT NULL THEN
    PERFORM 1 FROM public.admin_sessions s
    WHERE s.session_token = p_session_token
      AND s.admin_user_id = p_admin_user_id
      AND s.is_active = true
      AND s.expires_at > now();
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired admin session');
    END IF;
  END IF;

  -- Authorization: ensure p_admin_user_id is an active admin/moderator
  PERFORM 1 FROM public.admin_users au
  WHERE au.id = p_admin_user_id
    AND au.is_active = true
    AND au.role IN ('admin','moderator','super_admin');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update listing
  UPDATE public.listings
  SET
    moderation_status = v_new_status,
    moderation_reason = p_reason,
    moderated_at = now(),
    moderated_by = p_admin_user_id,
    status = CASE WHEN v_new_status = 'approved' THEN 'active' ELSE status END,
    is_draft = CASE WHEN v_new_status = 'approved' THEN false ELSE is_draft END
  WHERE id = p_listing_id
  RETURNING 1 INTO v_rows;

  IF v_rows IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  -- If rejected, make sure it's not active
  IF v_new_status = 'rejected' THEN
    UPDATE public.listings
    SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE status END
    WHERE id = p_listing_id;
  END IF;

  -- Log activity
  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'moderate_listing',
    'listing',
    p_listing_id::text,
    jsonb_build_object('status', v_new_status, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listing updated');
END;
$$;

