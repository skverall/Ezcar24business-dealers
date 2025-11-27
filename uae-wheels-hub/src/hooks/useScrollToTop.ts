import { useCallback } from 'react';

interface ScrollToTopOptions {
  smooth?: boolean;
  delay?: number;
}

export const useScrollToTop = () => {
  const scrollToTop = useCallback((options: ScrollToTopOptions = {}) => {
    const { smooth = true, delay = 0 } = options;
    
    const performScroll = () => {
      if (smooth) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo(0, 0);
      }
    };

    if (delay > 0) {
      setTimeout(performScroll, delay);
    } else {
      performScroll();
    }
  }, []);

  return scrollToTop;
};
