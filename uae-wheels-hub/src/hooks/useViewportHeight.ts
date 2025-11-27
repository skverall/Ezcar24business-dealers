import { useEffect } from 'react';

// Sets a CSS variable --app-vh that equals 1% of the current visual viewport height.
// Works around mobile browser issues when the virtual keyboard appears.
export function useViewportHeight() {
  useEffect(() => {
    const setVh = () => {
      const vh = (window.visualViewport?.height ?? window.innerHeight) * 0.01;
      document.documentElement.style.setProperty('--app-vh', `${vh}px`);
    };

    setVh();

    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    window.visualViewport?.addEventListener('resize', setVh);
    window.visualViewport?.addEventListener('scroll', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      window.visualViewport?.removeEventListener('resize', setVh);
      window.visualViewport?.removeEventListener('scroll', setVh);
    };
  }, []);
}

