import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n, { normalizeLang } from '@/i18n';

/**
 * Hook to sync language between localStorage, URL, and i18n
 * Ensures user's language preference is maintained during navigation
 */
export const useLanguageSync = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const syncLanguage = () => {
      // Get current URL language
      const pathParts = location.pathname.split('/').filter(Boolean);
      const urlLang = pathParts[0] === 'en' || pathParts[0] === 'ar' ? pathParts[0] : null;
      
      // Get saved language from localStorage
      const savedLang = localStorage.getItem('i18nextLng');
      const preferredLang = normalizeLang(savedLang);
      
      // If URL has no language prefix or different from saved preference
      if (!urlLang || urlLang !== preferredLang) {
        // Build new path with preferred language
        const pathWithoutLang = pathParts[0] === 'en' || pathParts[0] === 'ar' 
          ? '/' + pathParts.slice(1).join('/') 
          : location.pathname;
        
        const newPath = `/${preferredLang}${pathWithoutLang === '/' ? '' : pathWithoutLang}${location.search}${location.hash}`;
        
        // Update URL without adding to history (replace current entry)
        navigate(newPath, { replace: true });
      }
      
      // Ensure i18n is using the correct language
      if (i18n.language !== preferredLang) {
        void i18n.changeLanguage(preferredLang);
      }
      
      // Update HTML attributes
      const html = document.documentElement;
      html.setAttribute('lang', preferredLang);
      html.setAttribute('dir', preferredLang === 'ar' ? 'rtl' : 'ltr');
    };

    // Small delay to ensure navigation is complete
    const timeoutId = setTimeout(syncLanguage, 0);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search, location.hash, navigate]);
};
