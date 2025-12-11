import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'EzCar24 - Buy & Sell Cars in UAE',
  description = 'Find the best deals on cars in UAE. Buy and sell new and used cars with EzCar24 - your trusted automotive marketplace.',
  keywords = 'cars UAE, buy cars Dubai, sell cars Abu Dhabi, used cars, new cars, automotive marketplace, cars24, cars 24, cars24 uae, dubizzle cars',
  image = '/og-image.jpg',
  url = 'https://ezcar24.com',
  type = 'website',
  noIndex = false
}) => {
  const fullTitle = title.includes('EzCar24') ? title : `${title} | EzCar24`;
  useTranslation();
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const lang = parts[0] === 'en' ? 'en' : 'ar';
  const isRTL = lang === 'ar';
  const hrefBase = `${window.location.origin}/${lang}`;
  const googleSiteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Google Site Verification */}
      {googleSiteVerification && (
        <meta name="google-site-verification" content={googleSiteVerification} />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="EzCar24" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="author" content="EzCar24" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content={lang} />

      {/* html attributes */}
      <html lang={lang} dir={isRTL ? 'rtl' : 'ltr'} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Alternate languages */}
      <link rel="alternate" hrefLang="ar-AE" href={`${hrefBase}${location.pathname.replace(/^\/(ar|en)/, '')}${location.search}`} />
      <link rel="alternate" hrefLang="en-AE" href={`${window.location.origin}/en${location.pathname.replace(/^\/(ar|en)/, '')}${location.search}`} />
      <link rel="alternate" hrefLang="x-default" href={`${window.location.origin}/ar${location.pathname.replace(/^\/(ar|en)/, '')}${location.search}`} />

      {/* Structured Data for Cars */}
      {type === 'product' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": title,
            "description": description,
            "image": image,
            "url": url,
            "brand": {
              "@type": "Brand",
              "name": "EzCar24"
            },
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/InStock",
              "priceCurrency": "AED"
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
