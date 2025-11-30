import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import EzcarLogo from "./EzcarLogo";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';

  return (
    <footer className="relative overflow-hidden w-full max-w-[100vw] pb-safe-lg bg-[hsl(var(--background))] text-foreground dark:bg-[hsl(var(--panel))] border-t border-border/60 shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.05)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-luxury rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-luxury rounded-full blur-3xl animate-float" style={{
          animationDelay: '2s'
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-8 md:py-10">
          <div className="flex flex-col md:grid md:grid-cols-3 lg:grid-cols-3 gap-8 md:gap-10 items-start">

            {/* Company Info */}
            <div className="space-y-5 md:col-span-1">
              <Link to={pathPrefix} className="flex items-center gap-2 group">
                <EzcarLogo variant="footer" className="h-9 w-9 group-hover:scale-110 transition-transform duration-300" />
                <h2 className="text-xl font-bold tracking-wide text-luxury">EZCAR24</h2>
              </Link>
              <p className="text-foreground/80 text-sm leading-relaxed max-w-xs hidden md:block font-medium">
                Premium luxury car marketplace in Dubai. Buy and sell with confidence.
              </p>
              <div className="flex gap-3 pt-1">
                <a href="#" title="Facebook" aria-label="Facebook" className="p-2.5 bg-foreground/5 hover:bg-luxury/10 text-foreground/70 hover:text-luxury transition-all duration-300 hover:scale-110 rounded-full">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" title="Twitter" aria-label="Twitter" className="p-2.5 bg-foreground/5 hover:bg-luxury/10 text-foreground/70 hover:text-luxury transition-all duration-300 hover:scale-110 rounded-full">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/ezcar24.ae?igsh=eGhqM2Vzc2VtY29y&utm_source=qr" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram" className="p-2.5 bg-foreground/5 hover:bg-luxury/10 text-foreground/70 hover:text-luxury transition-all duration-300 hover:scale-110 rounded-full">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" title="LinkedIn" aria-label="LinkedIn" className="p-2.5 bg-foreground/5 hover:bg-luxury/10 text-foreground/70 hover:text-luxury transition-all duration-300 hover:scale-110 rounded-full">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-5 flex flex-col md:items-center md:text-center lg:items-start lg:text-left">
              <div className="w-full max-w-xs">
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90 mb-4">{t('footer.quickLinks')}</h3>
                <ul className="space-y-3">
                  {[
                    { to: `${pathPrefix}/browse`, label: t('footer.links.explore') },
                    { to: `${pathPrefix}/list-car`, label: t('footer.links.sell') },
                    { to: '#', label: t('footer.links.insurance') },
                    { to: `${pathPrefix}/about`, label: t('footer.links.about') },
                  ].map((item, idx) => (
                    <li key={idx}>
                      {item.to.startsWith('/') ? (
                        <Link to={item.to} className="text-sm font-medium text-foreground/70 hover:text-luxury transition-colors inline-block whitespace-nowrap">
                          {item.label}
                        </Link>
                      ) : (
                        <a href={item.to} className="text-sm font-medium text-foreground/70 hover:text-luxury transition-colors inline-block whitespace-nowrap">
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-5 md:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90 mb-4">{t('footer.contact')}</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4 group">
                  <div className="p-2 rounded-lg bg-luxury/5 group-hover:bg-luxury/10 transition-colors">
                    <Mail className="h-5 w-5 text-luxury" />
                  </div>
                  <div>
                    <p className="text-foreground/50 text-[10px] uppercase tracking-wide mb-0.5 font-semibold">{t('footer.email')}</p>
                    <a href="mailto:aydmaxx@gmail.com" className="text-sm font-medium text-foreground/90 hover:text-luxury transition-colors">
                      aydmaxx@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-2 rounded-lg bg-luxury/5 group-hover:bg-luxury/10 transition-colors">
                    <Phone className="h-5 w-5 text-luxury" />
                  </div>
                  <div>
                    <p className="text-foreground/50 text-[10px] uppercase tracking-wide mb-0.5 font-semibold">{t('footer.phone')}</p>
                    <div className="space-y-1">
                      <a href="tel:+971585263233" className="block text-sm font-medium text-foreground/90 hover:text-luxury transition-colors">
                        +971 58 526 3233
                      </a>
                      <a href="tel:+971545293233" className="block text-sm font-medium text-foreground/90 hover:text-luxury transition-colors">
                        +971 54 529 3233
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-2 rounded-lg bg-luxury/5 group-hover:bg-luxury/10 transition-colors">
                    <MapPin className="h-5 w-5 text-luxury" />
                  </div>
                  <div>
                    <p className="text-foreground/50 text-[10px] uppercase tracking-wide mb-0.5 font-semibold">{t('footer.location')}</p>
                    <p className="text-sm font-medium text-foreground/90">
                      {t('footer.uae')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/60 bg-foreground/[0.02]">
          <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-foreground/60 text-sm font-medium text-center md:text-left">
                {t('footer.copyright')}
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
                <Link to={`${pathPrefix}/privacy-policy`} className="text-foreground/60 hover:text-luxury transition-colors">
                  {t('footer.links.privacy')}
                </Link>
                <Link to={`${pathPrefix}/terms-of-service`} className="text-foreground/60 hover:text-luxury transition-colors">
                  {t('footer.links.terms')}
                </Link>
                <Link to={`${pathPrefix}/cookie-policy`} className="text-foreground/60 hover:text-luxury transition-colors">
                  {t('footer.links.cookie')}
                </Link>
              </div>
            </div>

            {/* Safe bottom filler matching footer background for iOS home indicator */}
            <div className="safe-bottom-fill" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;