# PDF Generation Setup Guide

## 🎯 Overview

EZCAR24 теперь поддерживает профессиональную генерацию PDF-отчетов для inspection reports с брендингом, логотипами и оптимизированной типографикой.

## ✅ Что уже реализовано

### 1. **Frontend Changes**

- ✅ **Print-оптимизированные CSS стили** (`src/index.css`)
  - Professional headers с логотипом
  - Watermark EZCAR24
  - Оптимизация для A4 формата
  - Page break управление
  - Footer на каждой странице

- ✅ **Print Mode Detection** (`src/components/CarInspectionReport.tsx`)
  - Определение `?print=true` в URL
  - Специальный header для PDF
  - PDF-ready маркер для Playwright
  - Professional footer с inspector info

- ✅ **Download PDF Button** (`src/features/inspection/components/PublishShareSection.tsx`)
  - Кнопка "Download PDF" в UI
  - Открывает print dialog в новом окне
  - Loader состояние
  - Error handling

- ✅ **PDF Service** (`src/services/pdfService.ts`)
  - Client-side генерация через browser print
  - Fallback для server-side генерации
  - Download helpers

### 2. **Backend Changes**

- ✅ **Supabase Edge Function** (`supabase/functions/generate-pdf/index.ts`)
  - Proxy для external PDF services
  - Fallback на client-side print
  - CORS headers
  - Report validation

## 🚀 Deployment Options

### Option 1: Client-Side Generation (Текущая реализация)

**Как работает:**
1. Пользователь нажимает "Download PDF"
2. Открывается новое окно с `?print=true`
3. Автоматически открывается браузерный print dialog
4. Пользователь выбирает "Save as PDF"

**Преимущества:**
- ✅ Работает сразу без дополнительной настройки
- ✅ Не требует backend сервисов
- ✅ 100% точность рендеринга
- ✅ Все CSS эффекты работают

**Недостатки:**
- ❌ Требует действия пользователя
- ❌ Зависит от браузера пользователя

### Option 2: Server-Side Generation (Для production)

Для полностью автоматической генерации PDF нужно настроить один из сервисов:

#### A. **Browserless.io** (Рекомендуется)

```bash
# 1. Регистрация на browserless.io
# 2. Получить API ключ
# 3. Добавить env variables в Supabase:

supabase secrets set PDF_SERVICE_URL="https://chrome.browserless.io/pdf"
supabase secrets set PDF_SERVICE_API_KEY="your-browserless-api-key"
supabase secrets set PUBLIC_SITE_URL="https://www.ezcar24.com"
```

**Цены:** $50/month для 1000 PDFs

#### B. **PDFShift.io**

```bash
supabase secrets set PDF_SERVICE_URL="https://api.pdfshift.io/v3/convert/pdf"
supabase secrets set PDF_SERVICE_API_KEY="your-pdfshift-api-key"
supabase secrets set PUBLIC_SITE_URL="https://www.ezcar24.com"
```

**Цены:** $29/month для 500 PDFs

#### C. **Self-Hosted Playwright Service**

Создать отдельный Node.js микросервис:

```typescript
// server.js
import express from 'express';
import { chromium } from 'playwright';

const app = express();

app.post('/generate-pdf', async (req, res) => {
  const { url } = req.body;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-pdf-ready="true"]');

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });

  await browser.close();

  res.contentType('application/pdf');
  res.send(pdf);
});

app.listen(3001);
```

Deploy на Railway/Render:
```bash
# Railway
railway up

# Add env to Supabase
supabase secrets set PDF_SERVICE_URL="https://your-service.railway.app/generate-pdf"
supabase secrets set PUBLIC_SITE_URL="https://www.ezcar24.com"
```

## 📋 How to Test

### Test Client-Side PDF (Текущая версия)

1. Создайте inspection report
2. Заполните все поля
3. Нажмите "Generate Report" (publish)
4. Нажмите "Download PDF"
5. Откроется print dialog
6. Выберите "Save as PDF"

### Test Print Mode Directly

Откройте в браузере:
```
https://www.ezcar24.com/report/YOUR-REPORT-SLUG?print=true
```

Вы должны увидеть:
- Логотип EZCAR24 вверху
- Professional header с Report ID
- Watermark на фоне
- Footer внизу
- Все элементы оптимизированы для печати

## 🎨 Customization

### Изменить стили PDF

Отредактируйте `src/index.css` в секции `@media print`:

```css
@media print {
  /* Ваши кастомные стили */
  .print-header {
    border-bottom: 3px solid #YOUR_COLOR;
  }
}
```

### Изменить header/footer

Отредактируйте `src/components/CarInspectionReport.tsx`:

```tsx
{isPrintMode && (
  <div className="print-header">
    {/* Ваш кастомный header */}
  </div>
)}
```

## 🔧 Troubleshooting

### PDF выглядит неправильно

1. Проверьте, что открыли с `?print=true`
2. Убедитесь, что все изображения загрузились
3. В print preview включите "Background graphics"

### Кнопка не работает

1. Проверьте console на ошибки
2. Убедитесь, что report опубликован (status === 'frozen')
3. Проверьте, что `shareSlug` существует

### Popup заблокирован

Пользователь должен разрешить popups для сайта в настройках браузера.

## 🚀 Next Steps

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy generate-pdf
   ```

2. **Configure External PDF Service** (опционально):
   - Выберите Browserless.io, PDFShift, или self-hosted
   - Добавьте API ключи в Supabase secrets
   - Протестируйте генерацию

3. **Monitor Usage:**
   - Отслеживайте сколько PDFs генерируется
   - Оптимизируйте стили для меньшего размера файла

## 📞 Support

Вопросы? Проблемы?
- GitHub Issues: [создать issue]
- Email: support@ezcar24.com

---

**Generated by EZCAR24 Development Team**
**Last Updated:** December 2024
