import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import EzcarLogo from "./EzcarLogo";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./navigation/NavLinks";
import SearchBar from "./navigation/SearchBar";
import UserActions from "./navigation/UserActions";
import MobileMenu from "./navigation/MobileMenu";

const Header = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { conversations } = useRealtimeChat();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSellYourCar = () => {
    if (user) {
      navigate('/list-car');
    } else {
      navigate('/auth?tab=signup&redirect=/list-car');
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set('query', query.trim());
      navigate(`/browse?${params.toString()}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled || isSearchOpen ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"}
        pt-safe
      `}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Left: Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link
              to={pathPrefix}
              aria-label={t('nav.home')}
              className="flex items-center gap-2 group focus:outline-none"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-luxury/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <EzcarLogo className="h-9 w-9 md:h-10 md:w-10 relative z-10 transition-transform duration-500 group-hover:scale-110" />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground hidden sm:block">
                EZCAR<span className="text-luxury">24</span>
              </span>
            </Link>

            <NavLinks pathPrefix={pathPrefix} onSellClick={handleSellYourCar} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <SearchBar
              isOpen={isSearchOpen}
              onToggle={() => setIsSearchOpen(!isSearchOpen)}
              onClose={() => setIsSearchOpen(false)}
            />

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hover:bg-luxury/10 hover:text-luxury transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <LanguageSwitcher />
            </div>

            <div className="hidden md:flex items-center gap-3 pl-2 border-l border-border/50">
              <UserActions pathPrefix={pathPrefix} />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-luxury/10 hover:text-luxury transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathPrefix={pathPrefix}
        onSellClick={handleSellYourCar}
        totalUnread={totalUnread}
        onSearch={handleSearch}
      />
    </header>
  );
};

export default Header;