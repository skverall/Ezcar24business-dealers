-- Ensure CRM client writes pass RLS for dealer owners/team members.

CREATE OR REPLACE FUNCTION public.crm_can_access(p_dealer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND (
    auth.uid() = p_dealer_id OR
    EXISTS (
      SELECT 1 FROM public.crm_dealer_users du
      WHERE du.dealer_id = p_dealer_id
        AND du.id = auth.uid()
        AND du.deleted_at IS NULL
    )
  );
END;
$$;

ALTER TABLE public.crm_dealer_clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_dealer_clients'
      AND policyname = 'crm_dealer_clients_select'
  ) THEN
    EXECUTE 'CREATE POLICY crm_dealer_clients_select ON public.crm_dealer_clients FOR SELECT USING (public.crm_can_access(dealer_id))';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_dealer_clients'
      AND policyname = 'crm_dealer_clients_write'
  ) THEN
    EXECUTE 'CREATE POLICY crm_dealer_clients_write ON public.crm_dealer_clients FOR ALL USING (public.crm_can_access(dealer_id)) WITH CHECK (public.crm_can_access(dealer_id))';
  END IF;
END;
$$;
