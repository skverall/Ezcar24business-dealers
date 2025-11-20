-- Migration: Backups bucket + updated_at columns for full sync (idempotent, no created_at dependency)
-- Run in Supabase SQL editor or as a migration.

-- 1) Ensure update_updated_at_column() exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Add updated_at, backfill safely (skip created_at if not present), add trigger, add index.
DO $$
DECLARE
    t TEXT;
    has_created BOOLEAN;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'dealer_users',
        'financial_accounts',
        'vehicles',
        'expenses',
        'sales',
        'dealer_clients',
        'expense_templates'
    ]) LOOP
        -- Add column
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();', t);

        -- Check if created_at exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = t AND column_name = 'created_at'
        ) INTO has_created;

        -- Backfill using created_at when present, otherwise NOW()
        IF has_created THEN
            EXECUTE format('UPDATE %I SET updated_at = COALESCE(updated_at, created_at, NOW());', t);
        ELSE
            EXECUTE format('UPDATE %I SET updated_at = COALESCE(updated_at, NOW());', t);
        END IF;

        EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET NOT NULL;', t);
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;', t, t);
        EXECUTE format($f$
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        $f$, t, t);

        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_updated_at_idx ON %I (updated_at);', t, t);
    END LOOP;
END$$;

-- 3) Create storage bucket for backups (private).
INSERT INTO storage.buckets (id, name, public)
VALUES ('dealer-backups', 'dealer-backups', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 4) Storage policies for dealer-backups.
-- Service role: full access.
DROP POLICY IF EXISTS "dealer-backups service role full access" ON storage.objects;
CREATE POLICY "dealer-backups service role full access"
ON storage.objects
FOR ALL
USING (bucket_id = 'dealer-backups' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'dealer-backups' AND auth.role() = 'service_role');

-- Authenticated users: CRUD only within their own folder <uid>/backups/...
DROP POLICY IF EXISTS "dealer-backups user folder access" ON storage.objects;
CREATE POLICY "dealer-backups user folder access"
ON storage.objects
FOR ALL
USING (
    bucket_id = 'dealer-backups'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/backups/%'
)
WITH CHECK (
    bucket_id = 'dealer-backups'
    AND auth.role() = 'authenticated'
    AND name LIKE auth.uid()::text || '/backups/%'
    AND (owner IS NULL OR owner = auth.uid())
);
