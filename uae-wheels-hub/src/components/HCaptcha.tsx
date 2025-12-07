import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

declare global {
  interface Window {
    hcaptcha?: any;
  }
}

export interface HCaptchaProps {
  sitekey?: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}

export interface HCaptchaRef {
  reset: () => void;
}

const HCaptcha = forwardRef<HCaptchaRef, HCaptchaProps>(function HCaptcha(
  { sitekey, theme = 'light', size = 'normal', onVerify, onExpire, className }: HCaptchaProps,
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(typeof window !== 'undefined' && !!window.hcaptcha);

  const SITEKEY = sitekey || (import.meta as any).env.VITE_HCAPTCHA_SITEKEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.hcaptcha && widgetIdRef.current !== null) {
        try { window.hcaptcha.reset(widgetIdRef.current); } catch {}
      }
    }
  }), []);

  useEffect(() => {
    if (scriptLoaded) return;

    const existing = document.querySelector('script[src^="https://js.hcaptcha.com/1/api.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      // do not remove script to allow reuse across pages
    };
  }, [scriptLoaded]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!scriptLoaded || !window.hcaptcha) return;
    if (widgetIdRef.current !== null) return; // already rendered
    if (!SITEKEY) return;

    try {
      const id = window.hcaptcha.render(containerRef.current, {
        sitekey: SITEKEY,
        theme,
        size,
        callback: (token: string) => onVerify?.(token),
        'expired-callback': () => onExpire?.(),
      });
      widgetIdRef.current = id;
    } catch (e) {
      console.warn('hCaptcha render failed:', e);
    }
  }, [scriptLoaded, theme, size, onVerify, onExpire, SITEKEY]);

  if (!SITEKEY) {
    return null; // captcha disabled if no sitekey configured
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  );
});

export default HCaptcha;
