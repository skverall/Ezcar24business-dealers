-- Add debts and debt payments for receivables/payables tracking

-- Tables
CREATE TABLE IF NOT EXISTS crm.debts (
    id uuid PRIMARY KEY,
    dealer_id uuid NOT NULL,
    counterparty_name text NOT NULL,
    counterparty_phone text,
    direction text NOT NULL DEFAULT 'owed_to_me',
    amount numeric NOT NULL DEFAULT 0,
    notes text,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS crm.debt_payments (
    id uuid PRIMARY KEY,
    dealer_id uuid NOT NULL,
    debt_id uuid NOT NULL REFERENCES crm.debts(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    date timestamptz NOT NULL,
    note text,
    payment_method text,
    account_id uuid REFERENCES crm.financial_accounts(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS crm_debts_dealer_updated_idx ON crm.debts (dealer_id, updated_at);
CREATE INDEX IF NOT EXISTS crm_debt_payments_dealer_updated_idx ON crm.debt_payments (dealer_id, updated_at);
CREATE INDEX IF NOT EXISTS crm_debt_payments_debt_idx ON crm.debt_payments (debt_id);

-- Sync RPCs
CREATE OR REPLACE FUNCTION public.sync_debts(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    item jsonb;
    result_record crm.debts%ROWTYPE;
    results jsonb := '[]'::jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        INSERT INTO crm.debts (
            id,
            dealer_id,
            counterparty_name,
            counterparty_phone,
            direction,
            amount,
            notes,
            due_date,
            created_at,
            updated_at,
            deleted_at
        )
        VALUES (
            (item->>'id')::uuid,
            (item->>'dealer_id')::uuid,
            item->>'counterparty_name',
            item->>'counterparty_phone',
            item->>'direction',
            (item->>'amount')::decimal,
            item->>'notes',
            (item->>'due_date')::date,
            (item->>'created_at')::timestamptz,
            (item->>'updated_at')::timestamptz,
            (item->>'deleted_at')::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET
            counterparty_name = EXCLUDED.counterparty_name,
            counterparty_phone = EXCLUDED.counterparty_phone,
            direction = EXCLUDED.direction,
            amount = EXCLUDED.amount,
            notes = EXCLUDED.notes,
            due_date = EXCLUDED.due_date,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at
        WHERE crm.debts.updated_at < EXCLUDED.updated_at
        RETURNING * INTO result_record;

        IF NOT FOUND THEN
            SELECT * INTO result_record FROM crm.debts WHERE id = (item->>'id')::uuid;
        END IF;

        results := results || to_jsonb(result_record);
    END LOOP;

    RETURN results;
END;
$function$;


CREATE OR REPLACE FUNCTION public.sync_debt_payments(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    item jsonb;
    result_record crm.debt_payments%ROWTYPE;
    results jsonb := '[]'::jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        INSERT INTO crm.debt_payments (
            id,
            dealer_id,
            debt_id,
            amount,
            date,
            note,
            payment_method,
            account_id,
            created_at,
            updated_at,
            deleted_at
        )
        VALUES (
            (item->>'id')::uuid,
            (item->>'dealer_id')::uuid,
            (item->>'debt_id')::uuid,
            (item->>'amount')::decimal,
            (item->>'date')::timestamptz,
            item->>'note',
            item->>'payment_method',
            (item->>'account_id')::uuid,
            (item->>'created_at')::timestamptz,
            (item->>'updated_at')::timestamptz,
            (item->>'deleted_at')::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET
            debt_id = EXCLUDED.debt_id,
            amount = EXCLUDED.amount,
            date = EXCLUDED.date,
            note = EXCLUDED.note,
            payment_method = EXCLUDED.payment_method,
            account_id = EXCLUDED.account_id,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at
        WHERE crm.debt_payments.updated_at < EXCLUDED.updated_at
        RETURNING * INTO result_record;

        IF NOT FOUND THEN
            SELECT * INTO result_record FROM crm.debt_payments WHERE id = (item->>'id')::uuid;
        END IF;

        results := results || to_jsonb(result_record);
    END LOOP;

    RETURN results;
END;
$function$;

-- Soft-delete RPCs
CREATE OR REPLACE FUNCTION public.delete_crm_debts(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.debts
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.delete_crm_debt_payments(p_id uuid, p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE crm.debt_payments
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_id
    AND dealer_id = p_dealer_id;
END;
$function$;

-- get_changes update
CREATE OR REPLACE FUNCTION public.get_changes(dealer_id uuid, since timestamp with time zone)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'expenses', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'amount', t.amount,
                    'date', t.date,
                    'description', COALESCE(t.description, t.expense_description),
                    'expense_description', COALESCE(t.expense_description, t.description),
                    'category', t.category,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at,
                    'vehicle_id', t.vehicle_id,
                    'user_id', t.user_id,
                    'account_id', t.account_id
                )
            ), '[]'::jsonb)
            FROM crm.expenses t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'vehicles', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'vin', t.vin,
                    'make', t.make,
                    'model', t.model,
                    'year', t.year,
                    'purchase_price', t.purchase_price,
                    'purchase_date', t.purchase_date,
                    'status', t.status,
                    'notes', t.notes,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at,
                    'sale_price', t.sale_price,
                    'sale_date', t.sale_date,
                    'photo_url', t.photo_url
                )
            ), '[]'::jsonb)
            FROM crm.vehicles t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'sales', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'vehicle_id', t.vehicle_id,
                    'amount', t.amount,
                    'date', t.date,
                    'buyer_name', t.buyer_name,
                    'buyer_phone', t.buyer_phone,
                    'payment_method', t.payment_method,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at
                )
            ), '[]'::jsonb)
            FROM crm.sales t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'debts', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'counterparty_name', t.counterparty_name,
                    'counterparty_phone', t.counterparty_phone,
                    'direction', t.direction,
                    'amount', t.amount,
                    'notes', t.notes,
                    'due_date', t.due_date,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at
                )
            ), '[]'::jsonb)
            FROM crm.debts t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'debt_payments', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'debt_id', t.debt_id,
                    'amount', t.amount,
                    'date', t.date,
                    'note', t.note,
                    'payment_method', t.payment_method,
                    'account_id', t.account_id,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at
                )
            ), '[]'::jsonb)
            FROM crm.debt_payments t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'clients', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'name', t.name,
                    'phone', t.phone,
                    'email', t.email,
                    'notes', t.notes,
                    'request_details', t.request_details,
                    'preferred_date', t.preferred_date,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at,
                    'status', t.status,
                    'vehicle_id', t.vehicle_id
                )
            ), '[]'::jsonb)
            FROM public.crm_dealer_clients t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'accounts', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'account_type', t.account_type,
                    'balance', t.balance,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at
                )
            ), '[]'::jsonb)
            FROM crm.financial_accounts t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'users', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'name', t.name,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at
                )
            ), '[]'::jsonb)
            FROM crm.dealer_users t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        ),
        'templates', (
            SELECT coalesce(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'dealer_id', t.dealer_id,
                    'name', t.name,
                    'category', t.category,
                    'default_description', t.default_description,
                    'default_amount', t.default_amount,
                    'updated_at', t.updated_at,
                    'deleted_at', t.deleted_at
                )
            ), '[]'::jsonb)
            FROM public.crm_expense_templates t
            WHERE t.dealer_id = get_changes.dealer_id AND t.updated_at > get_changes.since
        )
    ) INTO result;

    RETURN result;
END;
$function$;
