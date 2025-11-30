import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import EzcarLogo from "./EzcarLogo";
import { useTranslation } from "react-i18next";
const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  return <footer className="relative overflow-hidden w-full max-w-[100vw] pb-safe-lg bg-[hsl(var(--background))] text-foreground dark:bg-[hsl(var(--panel))] border-t border-border/60">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5 overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-32 bg-luxury rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-luxury rounded-full blur-3xl animate-float" style={{
        animationDelay: '2s'
      }}></div>
    </div>

    <div className="relative z-10">
      {/* Main Footer Content */}
      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 lg:gap-12 items-start">

          {/* Company Info */}
          <div className="space-y-4">
            <Link to={pathPrefix} className="flex items-center gap-2 group">
              <EzcarLogo variant="footer" className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
              <h2 className="text-lg font-semibold tracking-wide text-luxury">EZCAR24</h2>
            </Link>
            <p className="text-foreground/70 text-sm leading-relaxed max-w-xs">
              {t('footer.companyDesc')}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" title="Facebook" aria-label="Facebook" className="text-foreground/60 hover:text-luxury transition-colors duration-300 hover:scale-110 transform">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" title="Twitter" aria-label="Twitter" className="text-foreground/60 hover:text-luxury transition-colors duration-300 hover:scale-110 transform">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/ezcar24.ae?igsh=eGhqM2Vzc2VtY29y&utm_source=qr" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram" className="text-foreground/60 hover:text-luxury transition-colors duration-300 hover:scale-110 transform">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" title="LinkedIn" aria-label="LinkedIn" className="text-foreground/60 hover:text-luxury transition-colors duration-300 hover:scale-110 transform">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-luxury/90">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {[
                { to: `${pathPrefix}/browse`, label: t('footer.links.explore') },
                { to: `${pathPrefix}/list-car`, label: t('footer.links.sell') },

                { to: '#', label: t('footer.links.insurance') },
                { to: `${pathPrefix}/about`, label: t('footer.links.about') },
              ].map((item, idx) => (
                <li key={idx}>
                  {item.to.startsWith('/') ? (
                    <Link to={item.to} className="text-sm leading-6 text-foreground/70 hover:text-luxury transition-colors inline-block whitespace-nowrap">
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.to} className="text-sm leading-6 text-foreground/70 hover:text-luxury transition-colors inline-block whitespace-nowrap">
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-luxury/90">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              {[
                { to: `${pathPrefix}/privacy-policy`, label: t('footer.links.privacy') },
                { to: `${pathPrefix}/terms-of-service`, label: t('footer.links.terms') },
                { to: `${pathPrefix}/cookie-policy`, label: t('footer.links.cookie') },
                { to: '#', label: t('footer.links.support') },
              ].map((item, idx) => (
                <li key={idx}>
                  {item.to.startsWith('/') ? (
                    <Link to={item.to} className="text-sm leading-6 text-foreground/70 hover:text-luxury transition-colors inline-block whitespace-nowrap">
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.to} className="text-sm leading-6 text-foreground/70 hover:text-luxury transition-colors inline-block whitespace-nowrap">
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-luxury/90">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-luxury/80 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground/50 text-xs uppercase tracking-wide mb-0.5">{t('footer.email')}</p>
                  <a href="mailto:aydmaxx@gmail.com" className="text-sm leading-6 text-foreground/80 hover:text-luxury transition-colors">
                    aydmaxx@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-luxury/80 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground/50 text-xs uppercase tracking-wide mb-0.5">{t('footer.phone')}</p>
                  <div className="space-y-0.5">
                    <a href="tel:+971585263233" className="block text-sm leading-6 text-foreground/80 hover:text-luxury transition-colors">
                      +971 58 526 3233
                    </a>
                    <a href="tel:+971545293233" className="block text-sm leading-6 text-foreground/80 hover:text-luxury transition-colors">
                      +971 54 529 3233
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-luxury/80 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground/50 text-xs uppercase tracking-wide mb-0.5">{t('footer.location')}</p>
                  <p className="text-sm leading-6 text-foreground/80">
                    {t('footer.uae')}
                  </p>
                  <p className="text-sm leading-6 text-foreground/60 max-w-sm hidden md:block">
                    {t('footer.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/60 bg-[hsl(var(--background))] dark:bg-[hsl(var(--panel))]">
        <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-foreground/50 text-xs">
              {t('footer.copyright')}
            </div>
            <div className="flex gap-6 text-xs">
              <Link to={`${pathPrefix}/privacy-policy`} className="text-foreground/50 hover:text-luxury transition-colors">
                {t('footer.links.privacy')}
              </Link>
              <Link to={`${pathPrefix}/terms-of-service`} className="text-foreground/50 hover:text-luxury transition-colors">
                {t('footer.links.terms')}
              </Link>
              <Link to={`${pathPrefix}/cookie-policy`} className="text-foreground/50 hover:text-luxury transition-colors">
                {t('footer.links.cookie')}
              </Link>
            </div>
          </div>

          {/* Safe bottom filler matching footer background for iOS home indicator */}
          <div className="safe-bottom-fill" />
        </div>
      </div>
    </div>
  </footer>;
};
export default Footer;