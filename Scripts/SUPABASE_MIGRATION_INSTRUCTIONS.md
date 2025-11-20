# Supabase Migration Instructions

## Problem
The app is showing a sync error: **"Sync failed: column dealer_users.updated_at does not exist"**

## Solution
We need to add the `updated_at` column to the `dealer_users` table in Supabase.

## Steps to Fix

### 1. Open Supabase Dashboard
1. Go to https://texjdsagegkceahuufml.supabase.co
2. Navigate to **SQL Editor** in the left sidebar

### 2. Run the Migration Script
Copy and paste the entire content of `Scripts/supabase_migration_add_updated_at.sql` into the SQL Editor and click **Run**.

The script will:
- Add `updated_at` column to `dealer_users` table
- Set default value to current timestamp
- Create a trigger to automatically update `updated_at` on row updates
- Update existing rows to have `updated_at = created_at`
- Make the column NOT NULL

### 3. Verify the Migration
Run this query to verify the column was added:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'dealer_users';
```

You should see `updated_at` in the list with type `timestamp with time zone` and `is_nullable = NO`.

### 4. Test the App
1. Restart the app
2. Try to sync data
3. The error should be gone!

## What Changed in the App

The following files were updated to support `updated_at`:

1. **Ezcar24Business/Services/SupabaseModels.swift**
   - Added `updatedAt` field to `RemoteDealerUser` struct

2. **Ezcar24Business/Models/Ezcar24Business.xcdatamodeld/Ezcar24Business.xcdatamodel/contents**
   - Added `updatedAt` attribute to `User` entity

3. **Ezcar24Business/Services/CloudSyncManager.swift**
   - Updated `upsertUser()` to include `updatedAt`
   - Updated sync logic to read/write `updatedAt`

4. **Ezcar24Business/ViewModels/UserViewModel.swift**
   - Updated `addUser()` to set `updatedAt`

5. **Ezcar24Business/Models/PersistenceController.swift**
   - Updated sample data creation to include `updatedAt`

## Notes
- The migration is safe and won't affect existing data
- Existing users will have `updated_at` set to their `created_at` value
- Future updates will automatically update the `updated_at` timestamp

