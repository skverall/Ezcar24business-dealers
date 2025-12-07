import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://haordpdxyyreliyzmire.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3JkcGR4eXlyZWxpeXptaXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzIxNTAsImV4cCI6MjA3MDY0ODE1MH0.3cc_tkF4So5g0JbbPLEiKlZ_3JyaqW6u_cxV6rxKFQg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Checking application_logs table...\n');

const { data, error, count } = await supabase
  .from('application_logs')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('❌ Error fetching logs:', error.message);
  console.error('\nПричина:', error.hint || error.details || 'Unknown');

  if (error.code === 'PGRST116') {
    console.log('\n⚠️  Таблица существует, но пустая или политики RLS блокируют доступ.');
    console.log('Это нормально, если вы не авторизованы.');
  }
} else if (!data || data.length === 0) {
  console.log('📝 Таблица существует, но логов пока нет.');
  console.log('\nВозможные причины:');
  console.log('  1. Код с logger еще не был запущен');
  console.log('  2. Logger не успел отправить логи (буфер не заполнен)');
  console.log('  3. Политики RLS блокируют просмотр логов анонимным пользователем');
  console.log('\nЧто проверить:');
  console.log('  1. Откройте Supabase Dashboard → Table Editor → application_logs');
  console.log('  2. Проверьте есть ли там записи');
  console.log('  3. Если записей нет - добавьте logger в код и попробуйте снова');
} else {
  console.log(`✅ Найдено ${count} логов в базе данных!\n`);
  console.log('Последние 10 логов:\n');

  data.forEach((log, index) => {
    const time = new Date(log.created_at).toLocaleString();
    const levelEmoji = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🐛'
    }[log.level] || '📝';

    console.log(`${index + 1}. ${levelEmoji} [${log.level.toUpperCase()}] ${time}`);
    console.log(`   Message: ${log.message}`);
    if (log.url) console.log(`   URL: ${log.url}`);
    if (log.user_id) console.log(`   User ID: ${log.user_id}`);
    if (log.context) {
      const contextStr = JSON.stringify(log.context, null, 2);
      const lines = contextStr.split('\n');
      console.log(`   Context: ${lines[0]}`);
      for (let i = 1; i < lines.length; i++) {
        console.log(`            ${lines[i]}`);
      }
    }
    console.log('');
  });
}
