import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://haordpdxyyreliyzmire.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3JkcGR4eXlyZWxpeXptaXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzIxNTAsImV4cCI6MjA3MDY0ODE1MH0.3cc_tkF4So5g0JbbPLEiKlZ_3JyaqW6u_cxV6rxKFQg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Testing logger by inserting a test log...\n');

// Try to insert a test log
const testLog = {
  timestamp: new Date().toISOString(),
  level: 'error',
  message: 'Test error from logger test script',
  context: {
    test: true,
    timestamp: Date.now()
  },
  url: 'http://localhost:8080/test',
  user_agent: 'Test Script',
  user_id: null // Anonymous user
};

const { data, error } = await supabase
  .from('application_logs')
  .insert([testLog])
  .select();

if (error) {
  console.error('❌ Failed to insert test log:', error.message);
  console.error('Code:', error.code);
  console.error('Details:', error.details);
  console.error('Hint:', error.hint);

  console.log('\nВозможные причины:');
  console.log('  1. Политика RLS блокирует INSERT для анонимных пользователей');
  console.log('  2. Проверьте политики в Supabase Dashboard');
  console.log('     → Table Editor → application_logs → Policies');
  console.log('\nПолитика должна быть:');
  console.log('  "Allow anonymous error logs"');
  console.log('  WITH CHECK (level = \'error\' AND user_id IS NULL)');
} else {
  console.log('✅ SUCCESS! Test log inserted!');
  console.log('\nInserted log:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n🎉 Logger работает! Теперь проверьте в Supabase:');
  console.log('   Dashboard → Table Editor → application_logs');
}

// Now try to read it back
console.log('\n📖 Trying to read logs back...');

const { data: readData, error: readError } = await supabase
  .from('application_logs')
  .select('*')
  .eq('message', 'Test error from logger test script')
  .limit(1);

if (readError) {
  console.log('⚠️  Cannot read logs (expected - RLS policy)');
  console.log('   Политика разрешает только аутентифицированным пользователям читать логи');
  console.log('   Это НОРМАЛЬНО и правильно для безопасности!');
} else if (readData && readData.length > 0) {
  console.log('✅ Log found:', readData[0].message);
} else {
  console.log('📝 Log not found (but might exist - check Dashboard)');
}
