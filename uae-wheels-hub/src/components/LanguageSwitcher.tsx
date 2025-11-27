import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import i18n from '@/i18n';
import { useLanguageSync } from '@/hooks/useLanguageSync';

function withLang(pathname: string, lang: 'ar' | 'en') {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'ar' || parts[0] === 'en') {
    parts[0] = lang;
  } else {
    parts.unshift(lang);
  }
  return '/' + parts.join('/');
}

const LanguageSwitcher = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Use language sync hook
  useLanguageSync();

  const currentLang = useMemo(() => {
    const p = pathname.split('/').filter(Boolean);
    return p[0] === 'en' ? 'en' : 'ar';
  }, [pathname]);

  const otherLang = currentLang === 'ar' ? 'en' : 'ar';

  const handleLanguageChange = () => {
    // Save new language preference
    localStorage.setItem('i18nextLng', otherLang);

    // Change i18n language
    void i18n.changeLanguage(otherLang);

    // Navigate to new language URL
    const target = withLang(pathname, otherLang);
    navigate(target, { replace: true });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLanguageChange}
      aria-label={otherLang === 'ar' ? 'العربية' : 'English'}
    >
      {otherLang === 'ar' ? 'العربية' : 'English'}
    </Button>
  );
};

export default LanguageSwitcher;

