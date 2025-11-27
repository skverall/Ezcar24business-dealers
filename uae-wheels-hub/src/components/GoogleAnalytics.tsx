import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

interface GoogleAnalyticsProps {
  trackingId: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ trackingId }) => {
  const location = useLocation();

  useEffect(() => {
    // Skip if no tracking ID or using placeholder
    if (!trackingId || trackingId === 'G-XXXXXXXXXX') {
      return;
    }

    // Check if scripts already exist
    const existingScript = document.querySelector(`script[src*="${trackingId}"]`);
    if (existingScript) {
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}', {
        page_title: document.title,
        page_location: window.location.href,
      });
    `;
    document.head.appendChild(script2);

    return () => {
      try {
        if (document.head.contains(script1)) {
          document.head.removeChild(script1);
        }
        if (document.head.contains(script2)) {
          document.head.removeChild(script2);
        }
      } catch (error) {
        console.warn('Error removing GA scripts:', error);
      }
    };
  }, [trackingId]);

  // Track page views on route changes
  useEffect(() => {
    if (typeof window.gtag !== 'undefined' && trackingId && trackingId !== 'G-XXXXXXXXXX') {
      window.gtag('config', trackingId, {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location, trackingId]);

  return null;
};

// Helper functions for tracking events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  try {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  } catch (error) {
    console.warn('GA tracking error:', error);
  }
};

export const trackCarView = (carId: string, carTitle: string) => {
  trackEvent('view_item', 'car', `${carTitle} (${carId})`);
};

export const trackCarContact = (carId: string, contactMethod: 'phone' | 'whatsapp' | 'chat') => {
  trackEvent('contact_seller', 'car', `${contactMethod}_${carId}`);
};

export const trackCarFavorite = (carId: string, action: 'add' | 'remove') => {
  trackEvent(`${action}_to_favorites`, 'car', carId);
};

export const trackCarShare = (carId: string, platform: string) => {
  trackEvent('share', 'car', `${platform}_${carId}`);
};

export const trackSearch = (query: string, filters?: any) => {
  trackEvent('search', 'cars', query);
};

export default GoogleAnalytics;
