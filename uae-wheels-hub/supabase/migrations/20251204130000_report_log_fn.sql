-- Audit helper for report actions

CREATE OR REPLACE FUNCTION public.log_report_action(
  p_action text,
  p_report_id uuid,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_activity_logs (user_id, action, details, created_at)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    CONCAT('report:', p_action),
    jsonb_build_object(
      'report_id', p_report_id,
      'details', p_details
    ),
    now()
  );
END;
$$;
