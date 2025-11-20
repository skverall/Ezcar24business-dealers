#!/usr/bin/env python3
"""
Script to run Supabase migration using the Supabase client
This adds the updated_at column to dealer_users table
"""

import os
import sys

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase-py is not installed")
    print("Install it with: pip3 install supabase")
    sys.exit(1)

# Supabase configuration
SUPABASE_URL = "https://texjdsagegkceahuufml.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM1Mzc4MywiZXhwIjoyMDc3OTI5NzgzfQ.0t_VrhnTAl-lNQs9lJgKHiHJTtiYqzx3EcIJWtOoqWQ"

# SQL migration script
SQL_MIGRATION = """
-- Add updated_at column to dealer_users table
ALTER TABLE dealer_users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
"""

def main():
    print("🚀 Starting Supabase Migration...")
    print("")
    
    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        print("✅ Connected to Supabase")
        
        # Execute SQL migration
        print("📝 Executing SQL migration...")
        result = supabase.rpc('exec_sql', {'query': SQL_MIGRATION}).execute()
        
        print("✅ Migration completed successfully!")
        print("")
        print("Next steps:")
        print("1. Restart your app")
        print("2. Try syncing data")
        print("3. The error should be gone!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("")
        print("⚠️  The Supabase Python client doesn't support direct SQL execution.")
        print("Please run the migration manually through Supabase Dashboard:")
        print("")
        print("1. Go to: https://texjdsagegkceahuufml.supabase.co")
        print("2. Navigate to: SQL Editor")
        print("3. Copy and paste the content of: Scripts/supabase_migration_add_updated_at.sql")
        print("4. Click 'Run'")
        print("")
        print("📝 See Scripts/SUPABASE_MIGRATION_INSTRUCTIONS.md for detailed instructions")
        sys.exit(1)

if __name__ == "__main__":
    main()

