/**
 * Script to apply application_logs migration
 *
 * Run with:
 *   npx tsx apply-migration.ts
 *
 * Or if tsx is not installed:
 *   pnpm add -D tsx
 *   pnpm exec tsx apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=').map(s => s.trim());
    if (key && value && !process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('');
  console.error('Please create a .env file in uae-wheels-hub/ with:');
  console.error('');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('');
  console.error('Find these in: Supabase Dashboard → Settings → API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  console.log('🚀 Checking Supabase connection...\n');

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError && !testError.message.includes('relation')) {
      console.error('❌ Connection failed:', testError.message);
      console.error('');
      console.error('Please check your Supabase credentials in .env');
      process.exit(1);
    }

    console.log('✅ Connected to Supabase:', SUPABASE_URL);
    console.log('');

    // Check if table already exists
    console.log('📝 Checking if application_logs table exists...');

    const { data: existingTable, error: checkError } = await supabase
      .from('application_logs')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('');
      console.log('⚠️  Table "application_logs" already exists!');
      console.log('');
      console.log('The migration has already been applied.');
      console.log('Your error logging system is ready to use! 🎉');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Read: QUICK_START_GUIDE.md');
      console.log('  2. Try the examples in src/core/README.md');
      console.log('  3. View logs: Supabase Dashboard → Table Editor → application_logs');
      console.log('');
      return;
    }

    console.log('Table does not exist yet. Preparing to create...');
    console.log('');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251207000000_create_application_logs.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration SQL loaded');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Manual Migration Required');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Supabase requires DDL operations (CREATE TABLE) to be run via:');
    console.log('');
    console.log('METHOD 1: Supabase Dashboard SQL Editor (EASIEST)');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
    console.log('1. Open: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click: SQL Editor (left sidebar)');
    console.log('4. Click: New Query');
    console.log('5. Copy the ENTIRE file content:');
    console.log('   📄 supabase/migrations/20251207000000_create_application_logs.sql');
    console.log('');
    console.log('6. Paste into SQL Editor');
    console.log('7. Click: Run (or Cmd+Enter)');
    console.log('');
    console.log('Expected result: "Success. No rows returned"');
    console.log('');
    console.log('METHOD 2: Supabase CLI');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
    console.log('  # Install CLI');
    console.log('  brew install supabase/tap/supabase');
    console.log('');
    console.log('  # Apply migration');
    console.log('  cd supabase');
    console.log('  supabase db push');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('After applying, run this script again to verify! ✅');
    console.log('');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('Please apply the migration manually via Supabase Dashboard.');
  }
}

applyMigration();
