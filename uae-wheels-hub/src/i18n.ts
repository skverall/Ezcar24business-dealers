import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/common.json';
import ar from './locales/ar/common.json';

export const SUPPORTED_LANGS = ['ar', 'en'] as const;
export type AppLanguage = typeof SUPPORTED_LANGS[number];

// Helper to normalize language code to our supported set
export function normalizeLang(lng?: string | null): AppLanguage {
  const code = (lng || '').toLowerCase();
  if (code.startsWith('ar')) return 'ar';
  if (code.startsWith('en')) return 'en';
  return 'en'; // default language
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Prioritize saved choice over URL path to maintain user preference
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupFromPathIndex: 0,
    },
  }).then(() => {
    try {
      const normalized = normalizeLang(i18n.language);
      if (i18n.language !== normalized) {
        i18n.changeLanguage(normalized);
      }
      // sanitize bad localStorage values (e.g., 'auth')
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('i18nextLng');
        if (stored && normalizeLang(stored) !== 'ar' && normalizeLang(stored) !== 'en') {
          localStorage.setItem('i18nextLng', 'en');
        }
      }
    } catch {}
  });

export default i18n;

