-- Step 1: Create a function that can be called via REST API to run the migration
-- This function will add the updated_at column to dealer_users table

CREATE OR REPLACE FUNCTION run_dealer_users_migration()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Add updated_at column to dealer_users table
    ALTER TABLE dealer_users 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Create a trigger to automatically update updated_at on row updates
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $trigger$ language 'plpgsql';

    -- Drop trigger if exists and create new one
    DROP TRIGGER IF EXISTS update_dealer_users_updated_at ON dealer_users;
    CREATE TRIGGER update_dealer_users_updated_at
        BEFORE UPDATE ON dealer_users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Update existing rows to have updated_at = created_at if they don't have it
    UPDATE dealer_users 
    SET updated_at = created_at 
    WHERE updated_at IS NULL;

    -- Make updated_at NOT NULL after setting default values
    ALTER TABLE dealer_users 
    ALTER COLUMN updated_at SET NOT NULL;

    result := json_build_object(
        'success', true,
        'message', 'Migration completed successfully. Column updated_at added to dealer_users table.'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Migration failed: ' || SQLERRM
        );
        RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION run_dealer_users_migration() TO authenticated;
GRANT EXECUTE ON FUNCTION run_dealer_users_migration() TO service_role;

