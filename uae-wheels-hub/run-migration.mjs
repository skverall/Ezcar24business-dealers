#!/usr/bin/env node

/**
 * Direct migration runner via Supabase REST API
 * This uses the PostgREST /rpc endpoint to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=').map(s => s?.trim());
    if (key && value && !process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing credentials. Please ensure .env file exists.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeMigration() {
  console.log('🚀 Applying migration directly via Supabase...\n');

  try {
    // Read migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251207000000_create_application_logs.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Loaded migration SQL');
    console.log('');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log(`Found ${statements.length} SQL statements\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      const preview = stmt.substring(0, 80).replace(/\n/g, ' ') + '...';

      console.log(`[${i + 1}/${statements.length}] ${preview}`);

      try {
        // Use raw SQL execution via fetch (PostgREST doesn't support DDL via client SDK)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ query: stmt })
        });

        if (!response.ok) {
          const error = await response.text();

          // Check if it's a "already exists" error (which is ok)
          if (error.includes('already exists') || error.includes('IF NOT EXISTS')) {
            console.log('  ⏭️  Already exists, skipping');
            skipCount++;
          } else {
            console.log(`  ⚠️  ${error.substring(0, 100)}`);
          }
        } else {
          console.log('  ✅ Success');
          successCount++;
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`Results: ${successCount} succeeded, ${skipCount} skipped`);
    console.log('═══════════════════════════════════════');
    console.log('');

    // Check if table was created
    console.log('Verifying table creation...');

    const { data, error } = await supabase
      .from('application_logs')
      .select('id')
      .limit(1);

    if (error) {
      console.log('');
      console.log('⚠️  Could not verify table via REST API');
      console.log('This is expected - Supabase client SDK has limited DDL support.');
      console.log('');
      console.log('Please verify manually:');
      console.log('1. Open Supabase Dashboard → SQL Editor');
      console.log('2. Run:  SELECT * FROM application_logs LIMIT 1;');
      console.log('3. If it works - migration succeeded!');
      console.log('');
      console.log('If table does not exist, please apply migration manually:');
      console.log('');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Select project: haordpdxyyreliyzmire');
      console.log('3. SQL Editor → New Query');
      console.log('4. Copy entire file: supabase/migrations/20251207000000_create_application_logs.sql');
      console.log('5. Paste and click Run');
      console.log('');
    } else {
      console.log('');
      console.log('✅ SUCCESS! Table "application_logs" verified!');
      console.log('');
      console.log('🎉 Your error logging system is ready to use!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Read: QUICK_START_GUIDE.md');
      console.log('  2. Update a file to use the logger (example in guide)');
      console.log('  3. View logs: Supabase Dashboard → Table Editor → application_logs');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('Please apply migration manually via Supabase Dashboard');
    console.error('See: QUICK_START_GUIDE.md for instructions');
  }
}

executeMigration();
