-- Enable RLS and add policies for car inspection report tables

-- report_authors
ALTER TABLE public.report_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_authors_select_self_or_admin ON public.report_authors
FOR SELECT
USING (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('moderator'));

CREATE POLICY report_authors_insert_self_or_admin ON public.report_authors
FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('moderator'));

CREATE POLICY report_authors_update_self_or_admin ON public.report_authors
FOR UPDATE
USING (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('moderator'))
WITH CHECK (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('moderator'));

CREATE POLICY report_authors_delete_self_or_admin ON public.report_authors
FOR DELETE
USING (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('moderator'));

-- reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select_owner_or_admin ON public.reports
FOR SELECT
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1 FROM public.report_authors ra
    WHERE ra.id = reports.author_id AND ra.user_id = auth.uid()
  )
);

CREATE POLICY reports_insert_owner_or_admin ON public.reports
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1 FROM public.report_authors ra
    WHERE ra.id = reports.author_id AND ra.user_id = auth.uid()
  )
);

CREATE POLICY reports_update_owner_or_admin ON public.reports
FOR UPDATE
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1 FROM public.report_authors ra
    WHERE ra.id = reports.author_id AND ra.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1 FROM public.report_authors ra
    WHERE ra.id = reports.author_id AND ra.user_id = auth.uid()
  )
);

CREATE POLICY reports_delete_owner_or_admin ON public.reports
FOR DELETE
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1 FROM public.report_authors ra
    WHERE ra.id = reports.author_id AND ra.user_id = auth.uid()
  )
);

-- report_body_parts
ALTER TABLE public.report_body_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_body_parts_select_owner_or_admin ON public.report_body_parts
FOR SELECT
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
  )
);

CREATE POLICY report_body_parts_insert_owner_or_admin ON public.report_body_parts
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
  )
);

CREATE POLICY report_body_parts_update_owner_or_admin ON public.report_body_parts
FOR UPDATE
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
  )
);

CREATE POLICY report_body_parts_delete_owner_or_admin ON public.report_body_parts
FOR DELETE
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_body_parts.report_id
      AND ra.user_id = auth.uid()
  )
);

-- report_photos
ALTER TABLE public.report_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_photos_select_owner_or_admin ON public.report_photos
FOR SELECT
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
  )
);

CREATE POLICY report_photos_insert_owner_or_admin ON public.report_photos
FOR INSERT
WITH CHECK (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
  )
);

CREATE POLICY report_photos_update_owner_or_admin ON public.report_photos
FOR UPDATE
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
  )
);

CREATE POLICY report_photos_delete_owner_or_admin ON public.report_photos
FOR DELETE
USING (
  public.has_role('admin')
  OR public.has_role('moderator')
  OR EXISTS (
    SELECT 1
    FROM public.reports r
    JOIN public.report_authors ra ON ra.id = r.author_id
    WHERE r.id = report_photos.report_id
      AND ra.user_id = auth.uid()
  )
);
