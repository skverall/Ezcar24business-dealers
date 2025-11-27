-- Admin listing notes and admin update functions

-- 1) Table for admin notes attached to listings
CREATE TABLE IF NOT EXISTS public.listing_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  note_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_admin_notes ENABLE ROW LEVEL SECURITY;

-- Allow owners and admins to read notes
DROP POLICY IF EXISTS "Notes readable by owner and admins" ON public.listing_admin_notes;
CREATE POLICY "Notes readable by owner and admins"
ON public.listing_admin_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_admin_notes.listing_id
      AND (
        auth.uid() = l.user_id
        OR public.has_role('admin')
        OR public.has_role('moderator')
      )
  )
);

-- Only admins/moderators can write notes directly
DROP POLICY IF EXISTS "Notes writable by admins" ON public.listing_admin_notes;
CREATE POLICY "Notes writable by admins"
ON public.listing_admin_notes
FOR ALL
USING (public.has_role('admin') OR public.has_role('moderator'))
WITH CHECK (public.has_role('admin') OR public.has_role('moderator'));


-- 2) Admin RPC: add listing note
CREATE OR REPLACE FUNCTION public.admin_add_listing_note(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_note_text text,
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
  IF p_note_text IS NULL OR length(trim(p_note_text)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Note text is required');
  END IF;

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
  PERFORM 1 FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  INSERT INTO public.listing_admin_notes (listing_id, admin_user_id, note_text)
  VALUES (p_listing_id, p_admin_user_id, p_note_text)
  RETURNING 1 INTO v_rows;

  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'add_listing_note',
    'listing',
    p_listing_id::text,
    jsonb_build_object('note_length', char_length(p_note_text))
  );

  RETURN jsonb_build_object('success', true, 'message', 'Note added');
END;
$$;


-- 3) Admin RPC: update listing fields (title, description, price, location)
CREATE OR REPLACE FUNCTION public.admin_update_listing_fields(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_location text DEFAULT NULL,
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
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    price = COALESCE(p_price, price),
    location = COALESCE(p_location, location),
    updated_at = now()
  WHERE id = p_listing_id
  RETURNING 1 INTO v_rows;

  IF v_rows IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'update_listing_fields',
    'listing',
    p_listing_id::text,
    jsonb_build_object(
      'title_updated', p_title IS NOT NULL,
      'description_updated', p_description IS NOT NULL,
      'price_updated', p_price IS NOT NULL,
      'location_updated', p_location IS NOT NULL
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listing updated');
END;
$$;


-- 4) Admin RPC: update listing images (set cover and/or reorder)
CREATE OR REPLACE FUNCTION public.admin_update_listing_images(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_cover_image_id uuid DEFAULT NULL,
  p_ordered_ids uuid[] DEFAULT NULL,
  p_session_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_rows int;
  v_id uuid;
  v_pos int := 0;
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

  -- Validate listing exists
  PERFORM 1 FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  -- Set cover image if provided
  IF p_cover_image_id IS NOT NULL THEN
    -- Ensure image belongs to listing
    PERFORM 1 FROM public.listing_images WHERE id = p_cover_image_id AND listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cover image does not belong to listing');
    END IF;

    UPDATE public.listing_images
    SET is_cover = (id = p_cover_image_id)
    WHERE listing_id = p_listing_id;
  END IF;

  -- Reorder images if array provided
  IF p_ordered_ids IS NOT NULL THEN
    v_pos := 0;
    FOREACH v_id IN ARRAY p_ordered_ids LOOP
      UPDATE public.listing_images
      SET sort_order = v_pos
      WHERE id = v_id AND listing_id = p_listing_id;
      v_pos := v_pos + 1;
    END LOOP;
  END IF;

  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'update_listing_images',
    'listing',
    p_listing_id::text,
    jsonb_build_object(
      'cover_updated', p_cover_image_id IS NOT NULL,
      'reordered', p_ordered_ids IS NOT NULL,
      'count', COALESCE(array_length(p_ordered_ids, 1), 0)
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Images updated');
END;
$$;


-- 5) Admin RPC: send message to listing owner
CREATE OR REPLACE FUNCTION public.admin_send_message_to_seller(
  p_listing_id uuid,
  p_admin_user_id uuid,
  p_message_content text,
  p_session_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_listing_owner_id uuid;
  v_message_id uuid;
BEGIN
  -- Validate message content
  IF p_message_content IS NULL OR length(trim(p_message_content)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message content is required');
  END IF;

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

  -- Get listing owner
  SELECT user_id INTO v_listing_owner_id
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_listing_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  -- Insert message
  INSERT INTO public.messages (listing_id, sender_id, receiver_id, content)
  VALUES (p_listing_id, p_admin_user_id, v_listing_owner_id, p_message_content)
  RETURNING id INTO v_message_id;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    p_admin_user_id,
    'send_message_to_seller',
    'listing',
    p_listing_id::text,
    jsonb_build_object(
      'message_id', v_message_id,
      'receiver_id', v_listing_owner_id,
      'content_length', char_length(p_message_content)
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Message sent to seller', 'message_id', v_message_id);
END;
$$;

