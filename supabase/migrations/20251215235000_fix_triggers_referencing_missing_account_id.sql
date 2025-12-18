-- Fix Postgres trigger crash: `record "new" has no field "account_id"`
--
-- This happens when a trigger function references `NEW.account_id` but the table
-- the trigger runs on doesn't have an `account_id` column (often after schema
-- refactors). Any INSERT/UPDATE on that table will fail and bubble up to clients
-- as PostgrestError(code=42703).
--
-- We remove only the broken triggers (those referencing `NEW.account_id` on
-- tables without the `account_id` column) so RPC sync calls stop failing.

DO $$
DECLARE
  r record;
  func_def text;
  has_account_id boolean;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS table_schema,
      c.relname AS table_name,
      tg.tgname AS trigger_name,
      pn.nspname AS function_schema,
      p.proname AS function_name,
      p.oid AS function_oid
    FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = tg.tgfoid
    JOIN pg_namespace pn ON pn.oid = p.pronamespace
    WHERE NOT tg.tgisinternal
      AND n.nspname IN ('crm', 'public')
  LOOP
    func_def := lower(pg_get_functiondef(r.function_oid));

    IF func_def LIKE '%new.account_id%' THEN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = r.table_schema
          AND table_name = r.table_name
          AND column_name = 'account_id'
      ) INTO has_account_id;

      IF NOT has_account_id THEN
        RAISE NOTICE 'Dropping trigger "%" on %.% (function %.% references NEW.account_id but table has no account_id column)',
          r.trigger_name,
          r.table_schema,
          r.table_name,
          r.function_schema,
          r.function_name;

        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I;', r.trigger_name, r.table_schema, r.table_name);
      END IF;
    END IF;
  END LOOP;
END $$;

