-- Fix expenses "description" mapping for cross-device sync.
-- iOS clients use JSON key "description", while legacy backend used "expense_description".
-- Keep backward compatibility by accepting/emitting both keys and writing both columns.

CREATE OR REPLACE FUNCTION public.sync_expenses(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    item jsonb;
    result_record crm.expenses%ROWTYPE;
    results jsonb := '[]'::jsonb;
    desc_text text;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        desc_text := COALESCE(item->>'description', item->>'expense_description');

        INSERT INTO crm.expenses (
            id,
            dealer_id,
            amount,
            date,
            description,
            expense_description,
            category,
            created_at,
            updated_at,
            deleted_at,
            vehicle_id,
            user_id,
            account_id
        )
        VALUES (
            (item->>'id')::uuid,
            (item->>'dealer_id')::uuid,
            (item->>'amount')::decimal,
            (item->>'date')::timestamptz,
            desc_text,
            desc_text,
            item->>'category',
            (item->>'created_at')::timestamptz,
            (item->>'updated_at')::timestamptz,
            (item->>'deleted_at')::timestamptz,
            (item->>'vehicle_id')::uuid,
            (item->>'user_id')::uuid,
            (item->>'account_id')::uuid
        )
        ON CONFLICT (id) DO UPDATE
        SET
            amount = EXCLUDED.amount,
            date = EXCLUDED.date,
            description = EXCLUDED.description,
            expense_description = EXCLUDED.expense_description,
            category = EXCLUDED.category,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at,
            vehicle_id = EXCLUDED.vehicle_id,
            user_id = EXCLUDED.user_id,
            account_id = EXCLUDED.account_id
        WHERE crm.expenses.updated_at < EXCLUDED.updated_at
        RETURNING * INTO result_record;

        IF NOT FOUND THEN
            SELECT * INTO result_record FROM crm.expenses WHERE id = (item->>'id')::uuid;
        END IF;

        results := results || to_jsonb(result_record);
    END LOOP;

    RETURN results;
END;
$function$;


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

