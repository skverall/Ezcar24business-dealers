import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  smooth?: boolean;
}

const ScrollToTop = ({ smooth = true }: ScrollToTopProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Небольшая задержка для обеспечения полной загрузки DOM
    const scrollToTop = () => {
      if (smooth) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth' // Плавная прокрутка
        });
      } else {
        // Мгновенная прокрутка для лучшей производительности
        window.scrollTo(0, 0);
      }
    };

    // Используем setTimeout для обеспечения выполнения после рендера
    const timeoutId = setTimeout(scrollToTop, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname, smooth]);

  return null;
};

export default ScrollToTop;
