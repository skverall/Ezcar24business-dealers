# 📄 PDF Generation - Quick Start

## ✅ Что сделано

Интегрирована **профессиональная PDF-генерация** для inspection reports:

1. ✅ **Print-оптимизированные стили** - логотип, watermark, professional layout
2. ✅ **Кнопка "Download PDF"** - в PublishShareSection после публикации
3. ✅ **Client-side генерация** - использует браузерный print dialog
4. ✅ **Supabase Edge Function** - готов для server-side генерации
5. ✅ **Responsive дизайн** - A4 формат с правильными margin

## 🎯 Как использовать (для пользователей)

1. Создайте inspection report
2. Заполните все данные
3. Нажмите **"Generate Report"** (publish)
4. Нажмите **"Download PDF"** 📥
5. Откроется print dialog → выберите **"Save as PDF"**

## 🎨 Дизайн PDF

**Header (первая страница):**
```
┌─────────────────────────────────────┐
│ [LOGO]    Vehicle Inspection Report │
│ ───────────────────────────────────  │
│ Report ID: #ABC123   Date: 08/12/24 │
└─────────────────────────────────────┘
```

**Watermark:** EZCAR24 (полупрозрачный, по центру)

**Footer (каждая страница):**
```
EZCAR24 Premium Inspection Report | www.ezcar24.com
Inspector: [Name] | Generated: [Date]
```

## 🔧 Техническая реализация

### Файлы изменены:

1. **`src/index.css`** - Print стили (строки 1173-1244)
2. **`src/components/CarInspectionReport.tsx`** - Print mode detection
3. **`src/features/inspection/components/PublishShareSection.tsx`** - Download button
4. **`src/services/pdfService.ts`** - PDF service (новый файл)
5. **`supabase/functions/generate-pdf/index.ts`** - Edge function (новый)

### Как работает:

```
User clicks "Download PDF"
        ↓
Opens /report/{slug}?print=true in new window
        ↓
Special print styles applied
        ↓
Browser print dialog opens
        ↓
User saves as PDF
```

## 🚀 Production Setup (опционально)

Для автоматической server-side генерации:

```bash
# 1. Deploy Edge Function
supabase functions deploy generate-pdf

# 2. Add secrets
supabase secrets set PDF_SERVICE_URL="https://chrome.browserless.io/pdf"
supabase secrets set PDF_SERVICE_API_KEY="your-api-key"
supabase secrets set PUBLIC_SITE_URL="https://www.ezcar24.com"

# 3. Update pdfService.ts to use Edge Function instead of client-side
```

## ✨ Features

- ✅ Профессиональный брендинг с логотипом
- ✅ Watermark на каждой странице
- ✅ A4 формат с правильными margins
- ✅ Page break оптимизация
- ✅ Все изображения включены
- ✅ Сохранение всех стилей и градиентов
- ✅ Responsive для печати
- ✅ Health score badge
- ✅ Inspector информация

## 🧪 Тест

1. **Manual test:**
   ```
   https://www.ezcar24.com/report/YOUR-SLUG?print=true
   ```

2. **Check elements:**
   - [ ] Логотип виден
   - [ ] Header корректен
   - [ ] Watermark на фоне
   - [ ] Footer на каждой странице
   - [ ] Все секции на месте
   - [ ] Изображения загружены

## 💰 Стоимость

**Текущий вариант (client-side):** БЕСПЛАТНО ✅

**Server-side опции:**
- Browserless.io: $50/month (1000 PDFs)
- PDFShift.io: $29/month (500 PDFs)
- Self-hosted: стоимость сервера (~$10-20/month)

## 📊 Результат

Пользователи получают **профессиональный PDF-отчет**:
- Брендированный дизайн EZCAR24
- Все данные инспекции
- Фотографии автомобиля
- Mechanical checklist
- Tire details
- Service history
- Inspector signature

---

**Ready to use!** 🚀
