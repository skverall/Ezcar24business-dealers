-- Admin RPC: restore listing (set status to active)
CREATE OR REPLACE FUNCTION public.admin_restore_listing(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_session_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_rows int;
BEGIN
  -- Optional session validation
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

  UPDATE public.listings
  SET status = 'active',
      updated_at = now()
  WHERE id = p_listing_id
  RETURNING 1 INTO v_rows;

  IF v_rows IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'restore_listing',
    'listing',
    p_listing_id::text
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listing restored to active');
END;
$$;

