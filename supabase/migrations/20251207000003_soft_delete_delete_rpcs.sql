-- Soft-delete RPCs so deletes sync across devices and don't fail on FK constraints.
-- These RPCs are used by the app when a record is already removed locally (only the id is available).
-- IMPORTANT: do not hard-delete rows, otherwise other devices will never receive a tombstone via get_changes().

CREATE OR REPLACE FUNCTION public.delete_crm_vehicles(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.vehicles
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.delete_crm_sales(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.sales
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.delete_crm_expenses(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.expenses
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.delete_crm_financial_accounts(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.financial_accounts
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.delete_crm_dealer_users(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.dealer_users
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


-- NOTE: clients and templates live in the public schema tables used by sync/get_changes.
CREATE OR REPLACE FUNCTION public.delete_crm_dealer_clients(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.crm_dealer_clients
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.delete_crm_expense_templates(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.crm_expense_templates
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;

