#!/usr/bin/env node

/**
 * Script to apply the application_logs migration
 * Run: node scripts/apply-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from .env file if it exists
const envPath = path.join(__dirname, '../.env');
let SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const [key, value] = line.split('=').map(s => s.trim());
    if (key === 'VITE_SUPABASE_URL') {
      SUPABASE_URL = value;
    }
    if (key === 'VITE_SUPABASE_SERVICE_ROLE_KEY') {
      SUPABASE_SERVICE_ROLE_KEY = value;
    }
  }
}

// Fallback to process.env
SUPABASE_URL = SUPABASE_URL || process.env.VITE_SUPABASE_URL;
SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('You can find these in your Supabase project settings.');
  process.exit(1);
}

// Create Supabase client with service role key (has admin permissions)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Read migration SQL file
const migrationPath = path.join(__dirname, '../../supabase/migrations/20251207000000_create_application_logs.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Applying application_logs migration...\n');

async function applyMigration() {
  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('⚠️  exec_sql function not found, trying alternative method...\n');

      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Note: This requires the Supabase service role key
          // You might need to execute these manually in the SQL Editor
          console.log('Statement:', statement.substring(0, 100) + '...');
        } catch (err) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);
        }
      }

      console.log('\n⚠️  IMPORTANT: Direct SQL execution from Node.js is limited.');
      console.log('Please apply the migration manually using one of these methods:\n');
      console.log('Method 1: Supabase Dashboard');
      console.log('  1. Go to https://supabase.com/dashboard');
      console.log('  2. Select your project');
      console.log('  3. Go to SQL Editor');
      console.log('  4. Copy the contents of:');
      console.log('     supabase/migrations/20251207000000_create_application_logs.sql');
      console.log('  5. Paste and click "Run"\n');

      console.log('Method 2: Install Supabase CLI');
      console.log('  brew install supabase/tap/supabase');
      console.log('  cd supabase');
      console.log('  supabase db push\n');

      return;
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('Verifying table creation...');

    // Verify the table was created
    const { data: tables, error: verifyError } = await supabase
      .from('application_logs')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      console.log('\nPlease check the Supabase Dashboard to verify the table was created.');
    } else {
      console.log('✅ Table "application_logs" verified successfully!\n');
      console.log('🎉 Migration complete! The error logging system is now ready to use.\n');
      console.log('Next steps:');
      console.log('  1. Read the Quick Start Guide: QUICK_START_GUIDE.md');
      console.log('  2. Try the example in src/hooks/useAuth.tsx');
      console.log('  3. Check logs in Supabase Dashboard → Table Editor → application_logs\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\nPlease apply the migration manually via Supabase Dashboard:');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Select your project');
    console.log('  3. Go to SQL Editor');
    console.log('  4. Copy and run the SQL from:');
    console.log('     supabase/migrations/20251207000000_create_application_logs.sql\n');
  }
}

applyMigration();
