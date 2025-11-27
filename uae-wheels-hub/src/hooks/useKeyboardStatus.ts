import { useEffect, useState } from 'react';

export function useKeyboardStatus(threshold = 120) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      if (vv) {
        const open = window.innerHeight - vv.height > threshold;
        setKeyboardOpen(open);
      }
    };

    update();

    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    window.addEventListener('orientationchange', update);

    // Fallback for browsers without visualViewport
    const onFocusIn = () => setKeyboardOpen(true);
    const onFocusOut = () => setKeyboardOpen(false);
    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, [threshold]);

  return keyboardOpen;
}

