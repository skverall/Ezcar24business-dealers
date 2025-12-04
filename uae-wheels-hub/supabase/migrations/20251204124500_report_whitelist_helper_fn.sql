-- Helper to whitelist a user and upsert their report_author row (admin only)

CREATE OR REPLACE FUNCTION public.add_report_author_whitelisted(
  p_user_id uuid,
  p_full_name text,
  p_role text default 'inspector',
  p_contact_email text default null,
  p_contact_phone text default null,
  p_note text default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only admin may whitelist report authors' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.report_author_whitelist (user_id, added_by, note)
  VALUES (p_user_id, auth.uid(), p_note)
  ON CONFLICT (user_id) DO UPDATE
    SET note = COALESCE(EXCLUDED.note, report_author_whitelist.note),
        added_by = EXCLUDED.added_by;

  INSERT INTO public.report_authors (user_id, full_name, role, contact_email, contact_phone)
  VALUES (p_user_id, p_full_name, p_role, p_contact_email, p_contact_phone)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        contact_email = COALESCE(EXCLUDED.contact_email, public.report_authors.contact_email),
        contact_phone = COALESCE(EXCLUDED.contact_phone, public.report_authors.contact_phone),
        updated_at = now();
END;
$$;
