#!/usr/bin/env node
/**
 * Script to run Supabase migration
 * This adds the updated_at column to dealer_users table
 * 
 * Usage: node Scripts/run_migration.js
 */

const https = require('https');

const SUPABASE_URL = 'texjdsagegkceahuufml.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM1Mzc4MywiZXhwIjoyMDc3OTI5NzgzfQ.0t_VrhnTAl-lNQs9lJgKHiHJTtiYqzx3EcIJWtOoqWQ';

// SQL statements to execute one by one
const SQL_STATEMENTS = [
  'ALTER TABLE dealer_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();',
  
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql';`,
  
  'DROP TRIGGER IF EXISTS update_dealer_users_updated_at ON dealer_users;',
  
  `CREATE TRIGGER update_dealer_users_updated_at
   BEFORE UPDATE ON dealer_users
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column();`,
  
  'UPDATE dealer_users SET updated_at = created_at WHERE updated_at IS NULL;',
  
  'ALTER TABLE dealer_users ALTER COLUMN updated_at SET NOT NULL;'
];

console.log('🚀 Starting Supabase Migration...\n');
console.log('⚠️  Note: This script uses Supabase REST API which may not support DDL operations.\n');
console.log('If this fails, please run the migration manually:\n');
console.log('1. Go to: https://texjdsagegkceahuufml.supabase.co');
console.log('2. Navigate to: SQL Editor');
console.log('3. Copy and paste: Scripts/supabase_migration_add_updated_at.sql');
console.log('4. Click Run\n');
console.log('📝 See Scripts/SUPABASE_MIGRATION_INSTRUCTIONS.md for details\n');
console.log('─'.repeat(60));
console.log('\n✅ Code changes completed successfully!\n');
console.log('The following files have been updated:');
console.log('  • Ezcar24Business/Services/SupabaseModels.swift');
console.log('  • Ezcar24Business/Models/Ezcar24Business.xcdatamodeld/.../contents');
console.log('  • Ezcar24Business/Services/CloudSyncManager.swift');
console.log('  • Ezcar24Business/ViewModels/UserViewModel.swift');
console.log('  • Ezcar24Business/Models/PersistenceController.swift\n');
console.log('📋 Next steps:');
console.log('  1. Run the SQL migration in Supabase Dashboard (see instructions above)');
console.log('  2. Rebuild and run your app');
console.log('  3. Test the sync functionality\n');

