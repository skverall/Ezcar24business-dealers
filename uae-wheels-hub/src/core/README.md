# Core System - Error Handling & Logging

Централизованная система обработки ошибок и логирования для упрощения отладки и мониторинга.

## 📁 Структура

```
src/core/
├── errors/
│   ├── AppError.ts           # Базовый класс ошибок
│   ├── ApiError.ts           # Ошибки API (401, 404, 500)
│   ├── ValidationError.ts    # Ошибки валидации
│   └── index.ts
├── logging/
│   ├── Logger.ts             # Централизованное логирование
│   ├── ErrorHandler.ts       # Обработчик ошибок + Result type
│   └── index.ts
└── README.md
```

---

## 🚀 Быстрый старт

### 1. Логирование

```typescript
import { logger } from '@/core/logging';

// Debug (только в development)
logger.debug('User clicked button', { buttonId: 'submit' });

// Info
logger.info('User logged in', { userId: user.id, email: user.email });

// Warning
logger.warn('API slow response', { endpoint: '/api/listings', duration: 3000 });

// Error (автоматически отправляется в БД)
logger.error('Failed to save listing', {
  userId: user.id,
  listingId: listing.id,
  error: error.message
});
```

### 2. Обработка ошибок

#### Способ 1: Автоматическая обработка (рекомендуется)

```typescript
import { errorHandler } from '@/core/logging';
import { ApiError } from '@/core/errors';

async function saveListing(data: ListingData) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert(data);

    if (error) {
      throw new ApiError(error.message, 500);
    }

    return data;
  } catch (error) {
    // Логирует ошибку + показывает toast пользователю
    errorHandler.handle(error, 'Failed to save listing');
    throw error;
  }
}
```

#### Способ 2: Result Pattern (более функциональный)

```typescript
import { errorHandler, ok, err, type Result } from '@/core/logging';
import { ApiError } from '@/core/errors';

async function saveListing(data: ListingData): Promise<Result<Listing>> {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .insert(data)
      .single();

    if (error) {
      return err(new ApiError(error.message, 500));
    }

    return ok(listing);
  } catch (error) {
    errorHandler.handleSilent(error);
    return err(normalizeError(error));
  }
}

// Использование
const result = await saveListing(formData);

if (result.success) {
  console.log('Saved:', result.data);
} else {
  console.error('Error:', result.error.message);
}
```

### 3. Создание кастомных ошибок

```typescript
import { AppError } from '@/core/errors';

class InsufficientBalanceError extends AppError {
  constructor(balance: number, required: number) {
    super(
      'INSUFFICIENT_BALANCE',
      `Insufficient balance. Required: ${required}, Available: ${balance}`,
      422,
      { balance, required }
    );
  }

  getUserMessage(): string {
    return `You don't have enough balance. Please top up your account.`;
  }
}

// Использование
throw new InsufficientBalanceError(100, 500);
```

### 4. ErrorBoundary для features

```typescript
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

function DashboardPage() {
  return (
    <FeatureErrorBoundary featureName="Dashboard">
      <BusinessDashboard />
    </FeatureErrorBoundary>
  );
}
```

---

## 📊 Просмотр логов

### В Supabase Dashboard

1. Откройте Supabase Dashboard
2. Перейдите в Table Editor → `application_logs`
3. Фильтруйте по:
   - `level` = 'error' (только ошибки)
   - `user_id` = ваш ID (ваши ошибки)
   - `created_at` (последние 24 часа)

### SQL запросы для анализа

```sql
-- Топ 10 самых частых ошибок за последнюю неделю
SELECT
  message,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM application_logs
WHERE level = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY message
ORDER BY count DESC
LIMIT 10;

-- Ошибки конкретного пользователя
SELECT *
FROM application_logs
WHERE user_id = 'user-uuid-here'
  AND level = 'error'
ORDER BY created_at DESC
LIMIT 50;

-- Ошибки в конкретной feature
SELECT *
FROM application_logs
WHERE context->>'feature' = 'Dashboard'
  AND level = 'error'
ORDER BY created_at DESC;
```

---

## 🔧 Типы ошибок

### AppError (базовый)
```typescript
throw new AppError(
  'CUSTOM_ERROR',
  'Something went wrong',
  500,
  { customData: 'value' }
);
```

### ApiError (HTTP ошибки)
```typescript
throw new ApiError('Resource not found', 404);
// → Пользователь видит: "The requested resource was not found"

throw new ApiError('Unauthorized', 401);
// → Пользователь видит: "Please sign in to continue"
```

### NetworkError (сеть)
```typescript
throw new NetworkError('Failed to fetch');
// → Пользователь видит: "Connection issue. Please check your internet connection"
```

### AuthError (аутентификация)
```typescript
throw new AuthError('Invalid credentials');
// → Пользователь видит: "Authentication failed. Please sign in again"
```

### ValidationError (валидация)
```typescript
throw new ValidationError('Price must be positive', 'price');
// → Пользователь видит: "price: Price must be positive"
```

### FileValidationError (файлы)
```typescript
throw new FileValidationError('File too large', 'image.jpg');
// → Пользователь видит: "image.jpg: File too large"
```

### BusinessRuleError (бизнес-логика)
```typescript
throw new BusinessRuleError('Cannot delete listing with active offers');
// → Пользователь видит: "Cannot delete listing with active offers"
```

---

## 🎯 Примеры из реальных ситуаций

### 1. Форма создания листинга

```typescript
import { errorHandler, ValidationError } from '@/core';

async function handleSubmit(data: FormData) {
  try {
    // Валидация
    if (!data.price || data.price <= 0) {
      throw new ValidationError('Price must be positive', 'price');
    }

    // Сохранение
    const { error } = await supabase.from('listings').insert(data);

    if (error) {
      throw new ApiError(error.message, 500);
    }

    toast({ title: 'Success', description: 'Listing created!' });
  } catch (error) {
    errorHandler.handle(error, 'Failed to create listing');
  }
}
```

### 2. Загрузка данных с ретраем

```typescript
import { logger, errorHandler, NetworkError } from '@/core';

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new ApiError(`HTTP ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error) {
      logger.warn(`Fetch attempt ${i + 1} failed`, { url, error });

      if (i === retries - 1) {
        errorHandler.handle(error, 'Failed to load data');
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 3. Обработка ошибок в React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { errorHandler } from '@/core/logging';

function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*');

      if (error) {
        throw new ApiError(error.message, 500);
      }

      return data;
    },
    onError: (error) => {
      errorHandler.handle(error, 'Failed to load listings');
    }
  });
}
```

---

## ⚙️ Конфигурация

### Отключить логирование в тестах

```typescript
import { logger } from '@/core/logging';

beforeAll(() => {
  logger.setEnabled(false);
});

afterAll(() => {
  logger.setEnabled(true);
});
```

### Очистка буфера логов

```typescript
// Принудительно отправить все логи в БД
await logger.flush();

// Очистить буфер без отправки
logger.clear();
```

---

## 🧹 Автоматическая очистка логов

Логи старше 30 дней автоматически удаляются. Для ручной очистки:

```sql
SELECT cleanup_old_application_logs();
```

Или настройте cron job в Supabase:

```sql
-- В Supabase Dashboard → Database → Cron Jobs
SELECT cron.schedule(
  'cleanup-logs',
  '0 2 * * *',  -- Каждый день в 2:00
  'SELECT cleanup_old_application_logs()'
);
```

---

## 🔒 Безопасность

### Логи автоматически sanitize:
- `password` → `[REDACTED]`
- `token` → `[REDACTED]`
- `secret` → `[REDACTED]`
- `apiKey` → `[REDACTED]`

### Row Level Security:
- Пользователи видят только свои логи
- Админы видят все логи
- Анонимные пользователи могут логировать только ошибки

---

## 📈 Метрики

После внедрения этой системы вы сможете:

✅ Видеть все ошибки пользователей в реальном времени
✅ Знать контекст: кто, когда, где, что делал
✅ Воспроизвести любой баг
✅ Анализировать частоту ошибок
✅ Ошибки не ломают весь UI (благодаря ErrorBoundary)

---

## 🚀 Следующие шаги

1. Применить миграцию БД:
   ```bash
   cd ../supabase
   supabase db push
   ```

2. Заменить `console.log` → `logger.*` во всех файлах

3. Обернуть major features в `FeatureErrorBoundary`

4. Использовать `errorHandler.handle()` вместо простых `try-catch`

5. Создать кастомные классы ошибок для вашей бизнес-логики
