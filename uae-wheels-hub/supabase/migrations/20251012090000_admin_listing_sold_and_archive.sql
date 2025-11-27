-- Add sold fields and admin listing actions

-- 1) Add sold_price and sold_at columns if not exist
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS sold_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- 2) Admin RPC: mark listing as sold (with optional sold price)
CREATE OR REPLACE FUNCTION public.admin_mark_listing_sold(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_sold_price numeric DEFAULT NULL,
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
  -- Optional session validation tying token to admin user
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

  -- Ensure listing exists
  UPDATE public.listings
  SET status = 'sold',
      sold_price = p_sold_price,
      sold_at = now(),
      updated_at = now()
  WHERE id = p_listing_id
  RETURNING 1 INTO v_rows;

  IF v_rows IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  -- Log activity
  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'mark_listing_sold',
    'listing',
    p_listing_id::text,
    jsonb_build_object('sold_price', p_sold_price)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listing marked as sold');
END;
$$;

-- 3) Admin RPC: archive listing (set status to inactive)
CREATE OR REPLACE FUNCTION public.admin_archive_listing(
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
  SET status = 'inactive',
      updated_at = now()
  WHERE id = p_listing_id
  RETURNING 1 INTO v_rows;

  IF v_rows IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'archive_listing',
    'listing',
    p_listing_id::text
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listing archived');
END;
$$;

