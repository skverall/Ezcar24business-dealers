-- Migration: Add updated_at column to dealer_users table
-- This fixes the sync error: "column dealer_users.updated_at does not exist"

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

