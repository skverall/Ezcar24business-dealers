-- Car inspection report schema

-- Ensure UUID generator is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for report state
CREATE TYPE public.report_overall_condition AS ENUM ('excellent', 'good', 'fair', 'poor', 'salvage');
CREATE TYPE public.body_part_condition AS ENUM ('ok', 'minor_damage', 'major_damage', 'needs_replacement');

-- Who can author inspection reports
CREATE TABLE public.report_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'inspector',
  contact_email TEXT UNIQUE,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER trg_report_authors_updated_at
  BEFORE UPDATE ON public.report_authors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Main inspection report
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.report_authors(id) ON DELETE RESTRICT,
  vin TEXT NOT NULL CHECK (char_length(vin) BETWEEN 11 AND 17),
  odometer_km NUMERIC(10, 1) CHECK (odometer_km >= 0),
  inspection_date DATE NOT NULL DEFAULT current_date,
  location TEXT,
  overall_condition public.report_overall_condition NOT NULL DEFAULT 'fair',
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_author_id ON public.reports(author_id);
CREATE INDEX idx_reports_vin ON public.reports(vin);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Body part condition per report
CREATE TABLE public.report_body_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  part TEXT NOT NULL,
  condition public.body_part_condition NOT NULL DEFAULT 'ok',
  notes TEXT,
  severity SMALLINT NOT NULL DEFAULT 0 CHECK (severity BETWEEN 0 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (report_id, part)
);

CREATE INDEX idx_report_body_parts_report_id ON public.report_body_parts(report_id);

CREATE TRIGGER trg_report_body_parts_updated_at
  BEFORE UPDATE ON public.report_body_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Photos attached to reports (optionally tied to a specific body part)
CREATE TABLE public.report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  body_part_id UUID REFERENCES public.report_body_parts(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_photos_report_id ON public.report_photos(report_id);
CREATE INDEX idx_report_photos_body_part_id ON public.report_photos(body_part_id);
CREATE INDEX idx_report_photos_report_sort ON public.report_photos(report_id, sort_order);

CREATE TRIGGER trg_report_photos_updated_at
  BEFORE UPDATE ON public.report_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Guard to ensure body_part_id belongs to the same report when provided
CREATE OR REPLACE FUNCTION public.ensure_report_photo_body_part_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.body_part_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.report_body_parts rb
    WHERE rb.id = NEW.body_part_id
      AND rb.report_id = NEW.report_id
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'body_part_id % does not belong to report %', NEW.body_part_id, NEW.report_id
    USING ERRCODE = '23503';
END;
$$;

CREATE CONSTRAINT TRIGGER trg_report_photos_body_part_match
  AFTER INSERT OR UPDATE ON public.report_photos
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_report_photo_body_part_match();
