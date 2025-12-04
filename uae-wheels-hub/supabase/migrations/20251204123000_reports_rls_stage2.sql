-- Stage 2: tighten write access to reports; only admin + whitelisted dealers may write, everyone may read

-- Whitelist of dealers allowed to create/update reports
CREATE TABLE IF NOT EXISTS public.report_author_whitelist (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.report_author_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins manage the whitelist
DROP POLICY IF EXISTS report_author_whitelist_all_admin_only ON public.report_author_whitelist;
CREATE POLICY report_author_whitelist_all_admin_only ON public.report_author_whitelist
FOR ALL
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Helper predicate: current user is whitelisted
CREATE OR REPLACE FUNCTION public.is_whitelisted_report_author(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.report_author_whitelist w WHERE w.user_id = uid);
$$;

-- Update report_authors policies
ALTER TABLE public.report_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_authors_select_self_or_admin ON public.report_authors;
DROP POLICY IF EXISTS report_authors_insert_self_or_admin ON public.report_authors;
DROP POLICY IF EXISTS report_authors_update_self_or_admin ON public.report_authors;
DROP POLICY IF EXISTS report_authors_delete_self_or_admin ON public.report_authors;

-- Read allowed to anyone (FROZEN read-only for non-whitelisted users)
CREATE POLICY report_authors_select_all ON public.report_authors
FOR SELECT
USING (true);

-- Only admin or whitelisted user (for their own row) can insert/update/delete
CREATE POLICY report_authors_insert_whitelisted_self_or_admin ON public.report_authors
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR (auth.uid() = user_id AND public.is_whitelisted_report_author(auth.uid()))
);

CREATE POLICY report_authors_update_whitelisted_self_or_admin ON public.report_authors
FOR UPDATE
USING (
  public.has_role('admin')
  OR (auth.uid() = user_id AND public.is_whitelisted_report_author(auth.uid()))
)
WITH CHECK (
  public.has_role('admin')
  OR (auth.uid() = user_id AND public.is_whitelisted_report_author(auth.uid()))
);

CREATE POLICY report_authors_delete_whitelisted_self_or_admin ON public.report_authors
FOR DELETE
USING (
  public.has_role('admin')
  OR (auth.uid() = user_id AND public.is_whitelisted_report_author(auth.uid()))
);

-- Update reports policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_select_owner_or_admin ON public.reports;
DROP POLICY IF EXISTS reports_insert_owner_or_admin ON public.reports;
DROP POLICY IF EXISTS reports_update_owner_or_admin ON public.reports;
DROP POLICY IF EXISTS reports_delete_owner_or_admin ON public.reports;

-- Everyone can read reports
CREATE POLICY reports_select_all ON public.reports
FOR SELECT
USING (true);

-- Only admin or whitelisted author for this report can write
CREATE POLICY reports_insert_whitelisted_author ON public.reports
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.report_authors ra
    WHERE ra.id = reports.author_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

CREATE POLICY reports_update_whitelisted_author ON public.reports
FOR UPDATE
USING (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.report_authors ra
    WHERE ra.id = reports.author_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
)
WITH CHECK (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.report_authors ra
    WHERE ra.id = reports.author_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

CREATE POLICY reports_delete_whitelisted_author ON public.reports
FOR DELETE
USING (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.report_authors ra
    WHERE ra.id = reports.author_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

-- Update report_body_parts policies
ALTER TABLE public.report_body_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_body_parts_select_owner_or_admin ON public.report_body_parts;
DROP POLICY IF EXISTS report_body_parts_insert_owner_or_admin ON public.report_body_parts;
DROP POLICY IF EXISTS report_body_parts_update_owner_or_admin ON public.report_body_parts;
DROP POLICY IF EXISTS report_body_parts_delete_owner_or_admin ON public.report_body_parts;

-- Everyone can read body parts
CREATE POLICY report_body_parts_select_all ON public.report_body_parts
FOR SELECT
USING (true);

-- Only admin or whitelisted author for the parent report can write
CREATE POLICY report_body_parts_insert_whitelisted_author ON public.report_body_parts
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

CREATE POLICY report_body_parts_update_whitelisted_author ON public.report_body_parts
FOR UPDATE
USING (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
)
WITH CHECK (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

CREATE POLICY report_body_parts_delete_whitelisted_author ON public.report_body_parts
FOR DELETE
USING (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

-- Update report_photos policies
ALTER TABLE public.report_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_photos_select_owner_or_admin ON public.report_photos;
DROP POLICY IF EXISTS report_photos_insert_owner_or_admin ON public.report_photos;
DROP POLICY IF EXISTS report_photos_update_owner_or_admin ON public.report_photos;
DROP POLICY IF EXISTS report_photos_delete_owner_or_admin ON public.report_photos;

-- Everyone can read photos
CREATE POLICY report_photos_select_all ON public.report_photos
FOR SELECT
USING (true);

-- Only admin or whitelisted author for the parent report can write
CREATE POLICY report_photos_insert_whitelisted_author ON public.report_photos
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

CREATE POLICY report_photos_update_whitelisted_author ON public.report_photos
FOR UPDATE
USING (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
)
WITH CHECK (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);

CREATE POLICY report_photos_delete_whitelisted_author ON public.report_photos
FOR DELETE
USING (
  public.has_role('admin')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
      AND public.is_whitelisted_report_author(ra.user_id)
  )
);
