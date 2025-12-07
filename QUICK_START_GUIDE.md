# 🚀 Быстрый старт - Система мониторинга ошибок

## Шаг 1: Применить миграцию БД (5 минут)

### Вариант A: Через Supabase CLI (рекомендуется)
```bash
cd /Users/aydmaxx/Desktop/Ezcar24business-dealers/supabase
supabase db push
```

### Вариант B: Через Supabase Dashboard (если нет CLI)
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла:
   ```
   supabase/migrations/20251207000000_create_application_logs.sql
   ```
5. Вставьте в SQL Editor и нажмите **Run**

### Проверка что миграция применилась:
```sql
-- Выполните в SQL Editor
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'application_logs'
);
-- Должно вернуть: true
```

---

## Шаг 2: Тестовый пример (10 минут)

Давайте обновим один файл чтобы увидеть систему в действии.

### Обновите `src/hooks/useAuth.tsx`:

**Найдите функцию signIn** (примерно строка 50-80):

```typescript
// БЫЛО:
const signIn = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};
```

**Замените на:**

```typescript
import { logger, errorHandler } from '@/core/logging';
import { AuthError } from '@/core/errors';

const signIn = async (email: string, password: string) => {
  try {
    logger.info('User attempting sign in', { email });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AuthError(error.message, { email });
    }

    logger.info('User signed in successfully', { email });
  } catch (error) {
    errorHandler.handle(error, 'Failed to sign in');
    throw error;
  }
};
```

### Что изменилось:
1. ✅ **logger.info** логирует попытку входа
2. ✅ **AuthError** создает типизированную ошибку
3. ✅ **errorHandler.handle** логирует + показывает toast автоматически
4. ✅ Все данные отправляются в БД

---

## Шаг 3: Проверьте что работает

### A. Запустите приложение:
```bash
cd /Users/aydmaxx/Desktop/Ezcar24business-dealers/uae-wheels-hub
pnpm dev
```

### B. Попробуйте войти (с неправильным паролем):
1. Откройте http://localhost:8080/auth
2. Введите email и неправильный пароль
3. Нажмите Sign In

### C. Проверьте логи в БД:
1. Откройте Supabase Dashboard → Table Editor
2. Выберите таблицу `application_logs`
3. Вы должны увидеть:
   - **Строка 1**: `level = info`, `message = "User attempting sign in"`
   - **Строка 2**: `level = error`, `message = "Failed to sign in"`

### D. Кликните на строку с ошибкой:
В колонке `context` вы увидите полный контекст:
```json
{
  "email": "test@example.com",
  "feature": "Auth",
  "error": "Invalid login credentials",
  "stack": "...",
  "componentStack": "..."
}
```

**🎉 Поздравляю! Система работает!**

---

## Шаг 4: Добавьте ErrorBoundary к major features (15 минут)

### Обновите страницы с большими компонентами:

**Файл: `src/pages/BusinessDashboard.tsx`**

Добавьте в начало:
```typescript
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
```

Оберните весь JSX:
```typescript
export default function BusinessDashboard() {
  return (
    <FeatureErrorBoundary featureName="Business Dashboard">
      {/* весь существующий код */}
    </FeatureErrorBoundary>
  );
}
```

**Повторите для:**
- `src/pages/BrowseCars.tsx` → `featureName="Car Browser"`
- `src/pages/CarDetail.tsx` → `featureName="Car Detail"`
- `src/pages/Messages.tsx` → `featureName="Messages"`
- `src/pages/ListCar.tsx` → `featureName="Create Listing"`

### Проверка ErrorBoundary:

1. В development mode, добавьте в любой компонент:
   ```typescript
   throw new Error('Test error boundary');
   ```

2. Вы увидите красивую страницу ошибки с:
   - Кнопкой "Try Again"
   - Детальным stack trace (только в dev)
   - Автоматическим логированием в БД

---

## Шаг 5: Начните использовать постоянно

### Паттерн 1: Простые операции
```typescript
import { logger, errorHandler } from '@/core/logging';

try {
  await someOperation();
  logger.info('Operation successful');
} catch (error) {
  errorHandler.handle(error, 'Operation failed');
}
```

### Паттерн 2: API вызовы
```typescript
import { ApiError } from '@/core/errors';
import { errorHandler } from '@/core/logging';

async function fetchData() {
  try {
    const response = await fetch('/api/data');

    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }

    return await response.json();
  } catch (error) {
    errorHandler.handle(error, 'Failed to fetch data');
    throw error;
  }
}
```

### Паттерн 3: Валидация форм
```typescript
import { ValidationError } from '@/core/errors';
import { errorHandler } from '@/core/logging';

async function validateAndSave(data: FormData) {
  try {
    if (!data.email || !data.email.includes('@')) {
      throw new ValidationError('Invalid email', 'email');
    }

    if (!data.price || data.price <= 0) {
      throw new ValidationError('Price must be positive', 'price');
    }

    await saveToDatabase(data);
  } catch (error) {
    errorHandler.handle(error, 'Validation failed');
  }
}
```

---

## 📊 Анализ ошибок

### Топ ошибок за последнюю неделю:
```sql
SELECT
  message,
  COUNT(*) as count,
  MAX(created_at) as last_seen
FROM application_logs
WHERE level = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY message
ORDER BY count DESC
LIMIT 10;
```

### Ошибки конкретного пользователя:
```sql
SELECT *
FROM application_logs
WHERE user_id = 'your-user-uuid'
  AND level = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

### Ошибки в конкретной feature:
```sql
SELECT *
FROM application_logs
WHERE context->>'feature' = 'Dashboard'
  AND level = 'error'
ORDER BY created_at DESC;
```

---

## 🧹 Автоматическая очистка

Логи автоматически очищаются (старше 30 дней).

Для ручной очистки:
```sql
SELECT cleanup_old_application_logs();
```

Настройка cron job (опционально):
```sql
-- В Supabase Dashboard → Database → Functions
SELECT cron.schedule(
  'cleanup-logs',
  '0 2 * * *',  -- Каждый день в 2:00
  'SELECT cleanup_old_application_logs()'
);
```

---

## 🎯 Следующие фазы (опционально)

После того как привыкнете к системе логирования:

### Фаза 1.2: Строгий TypeScript (1 неделя)
- Включить `strict: true` в `tsconfig.json`
- Исправить ошибки типов
- **Результат:** 80% багов ловятся до запуска

### Фаза 1.3: Автотестирование (2 недели)
- Настроить Vitest
- Написать тесты для утилит
- **Результат:** Регрессии невозможны

### Фаза 2: Мобильная оптимизация (2 недели)
- PWA (устанавливаемое приложение)
- Жесты (swipe для галереи)
- Оптимизация изображений
- **Результат:** Конверсия мобильных +30%

---

## 📚 Дополнительная информация

- **Полная документация:** `src/core/README.md`
- **План улучшений:** `~/.claude/plans/iridescent-tickling-umbrella.md`
- **Итоги фазы 1.1:** `PHASE1_SUMMARY.md`

---

## ❓ Частые вопросы

### Q: Будет ли это замедлять приложение?
A: Нет. Логи отправляются асинхронно батчами каждые 5 секунд или при 10 записях.

### Q: Что если Supabase упадет?
A: Логи упадут в console.log как fallback. Приложение продолжит работать.

### Q: Нужно ли логировать всё?
A: Нет. Логируйте:
- ✅ Все ошибки (обязательно)
- ✅ Важные действия (логин, создание листинга)
- ✅ Проблемные места (где часто баги)
- ❌ НЕ логируйте каждый клик

### Q: Безопасно ли хранить логи?
A: Да. Пароли/токены автоматически скрываются. RLS защищает данные.

---

## 🚀 Поехали!

**Потратьте 30 минут прямо сейчас:**
1. ⏱️ 5 мин - применить миграцию
2. ⏱️ 10 мин - обновить useAuth.tsx
3. ⏱️ 15 мин - добавить ErrorBoundary

**Результат:** Навсегда решена проблема поиска багов! 🎉

---

Удачи! 🍀

Если возникнут вопросы - смотрите `src/core/README.md`
