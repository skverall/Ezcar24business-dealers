import { useLanguageSync } from '@/hooks/useLanguageSync';

/**
 * Component that handles language synchronization
 * Must be placed inside Router context
 */
const LanguageSync = () => {
  useLanguageSync();
  return null;
};

export default LanguageSync;
