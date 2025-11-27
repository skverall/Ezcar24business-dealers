import { Navigate } from 'react-router-dom';
import { normalizeLang } from '@/i18n';

/**
 * Smart redirect component that redirects to user's preferred language
 * Uses saved language from localStorage or defaults to English
 */
const LanguageRedirect = () => {
  const savedLang = localStorage.getItem('i18nextLng');
  const preferredLang = normalizeLang(savedLang);
  
  return <Navigate to={`/${preferredLang}`} replace />;
};

export default LanguageRedirect;
