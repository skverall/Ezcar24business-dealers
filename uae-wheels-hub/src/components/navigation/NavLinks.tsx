import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";

interface NavLinksProps {
    pathPrefix: string;
    onSellClick: () => void;
}

const NavLinks = ({ pathPrefix, onSellClick }: NavLinksProps) => {
    const { t } = useTranslation();
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const linkClasses = (path: string) => `
    text-sm font-medium transition-all duration-300 relative py-2
    ${isActive(path) ? "text-luxury" : "text-muted-foreground hover:text-foreground"}
    after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 
    after:bg-luxury after:transition-all after:duration-300 
    ${isActive(path) ? "after:w-full" : "hover:after:w-full"}
  `;

    return (
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
                to={`${pathPrefix}/browse`}
                className={linkClasses(`${pathPrefix}/browse`)}
            >
                {t('nav.explore')}
            </Link>

            <button
                type="button"
                onClick={onSellClick}
                className={`
          text-sm font-medium transition-all duration-300 relative py-2
          text-muted-foreground hover:text-foreground
          after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 
          after:bg-luxury after:transition-all after:duration-300 hover:after:w-full
        `}
            >
                {t('nav.sell')}
            </button>

            <Link
                to={`${pathPrefix}/about`}
                className={linkClasses(`${pathPrefix}/about`)}
            >
                {t('nav.about')}
            </Link>

            <Link
                to={`${pathPrefix}/business`}
                className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          text-sm font-medium transition-all duration-300
          bg-luxury/5 text-luxury hover:bg-luxury/10
          border border-luxury/20 hover:border-luxury/30
        `}
            >
                <Building2 className="w-4 h-4" />
                <span>For Business</span>
            </Link>
        </nav>
    );
};

export default NavLinks;
