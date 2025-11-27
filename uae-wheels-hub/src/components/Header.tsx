import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Search, LogOut, LogIn, UserPlus, Menu, X, Moon, Sun, MessageCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EzcarLogo from "./EzcarLogo";
import RealtimeChat from "./RealtimeChat";
import { useTheme } from "next-themes";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";


const Header = () => {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const { conversations } = useRealtimeChat();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate total unread messages
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  const handleSellYourCar = () => {
    if (user) {
      navigate('/list-car');
    } else {
      navigate('/auth?tab=signup&redirect=/list-car');
    }
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('query', searchQuery.trim());
      navigate(`/browse?${params.toString()}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    } else {
      navigate('/browse');
      setIsSearchOpen(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <header className="glass-effect border-b border-luxury/10 sticky top-0 z-50 backdrop-blur-xl w-full pt-safe">
      <div className="relative w-full py-4 px-4 md:px-6 xl:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-[auto,1fr,auto] items-center gap-2">
          {/* Left: Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="hover:scale-110 transition-transform"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Center: Logo + Nav */}
          <div className="col-span-2 md:col-span-1 flex items-center justify-center">
            <div className="flex items-center gap-4 md:gap-6 lg:gap-8 flex-wrap md:flex-nowrap">
              <Link
                to={pathPrefix}
                aria-label={t('nav.home')}
                title={t('nav.home')}
                className="flex items-center space-x-2 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="p-1 rounded-full border border-border bg-background/70 sm:p-0 sm:border-0 sm:bg-transparent transition-transform active:scale-95">
                  <EzcarLogo className="h-10 w-10 group-hover:scale-110 transition-transform duration-300" />
                </span>
                <h1 className="text-xl lg:text-2xl font-bold text-luxury hidden sm:block">EZCAR24</h1>
                <span className="sm:hidden text-sm font-medium text-foreground">{t('nav.home')}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 flex-nowrap">
                <Link to={`${pathPrefix}/browse`} className="text-foreground hover:text-luxury transition-all duration-300 font-medium relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-luxury after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap">
                  {t('nav.explore')}
                </Link>
                <button
                  type="button"
                  onClick={handleSellYourCar}
                  className="text-foreground hover:text-luxury transition-all duration-300 font-medium relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-luxury after:transition-all after:duration-300 hover:after:w-full hover:drop-shadow-lg whitespace-nowrap"
                >
                  {t('nav.sell')}
                </button>
                <Link to={`${pathPrefix}/about`} className="text-foreground hover:text-luxury transition-all duration-300 font-medium relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-luxury after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap">
                  {t('nav.about')}
                </Link>
              </nav>
            </div>
          </div>

          {/* Right: Actions (hidden on mobile, compact on md) */}
          <div className="hidden md:flex justify-end items-center gap-2">
            {/* Search only on lg+ to save space */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex hover:scale-110 transition-transform"
              aria-label={t('nav.search')}
              onClick={handleSearchToggle}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('nav.theme')}
              className="hover:scale-110 transition-transform"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? t('nav.light') : t('nav.dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <LanguageSwitcher />

            {user ? (
              <>
                <RealtimeChat className="flex" />
                <Link to={`${pathPrefix}/profile/my-listings`}>
                  <Button variant="ghost" size="sm" className="hover:scale-110 transition-transform">
                    <User className="h-5 w-5 mr-0 lg:mr-2" />
                    <span className="hidden lg:inline">{t('nav.profile')}</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="hover:scale-110 transition-transform"
                >
                  <LogOut className="h-5 w-5 mr-0 lg:mr-2" />
                  <span className="hidden lg:inline">{t('nav.signOut')}</span>
                </Button>
                <Link to={`${pathPrefix}/list-car`} className="hidden lg:inline-flex">
                  <Button variant="luxury" size="sm" className="hover-lift">
                    {t('nav.sell')}
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={`${pathPrefix}/auth?tab=login`}>
                  <Button variant="ghost" size="sm" className="hover:scale-110 transition-transform">
                    <LogIn className="h-5 w-5 mr-0 lg:mr-2" />
                    <span className="hidden lg:inline">{t('nav.signIn')}</span>
                  </Button>
                </Link>
                <Link to={`${pathPrefix}/auth?tab=signup`}>
                  <Button variant="luxury" size="sm" className="hover-lift">
                    <UserPlus className="h-5 w-5 mr-0 lg:mr-2" />
                    <span className="hidden lg:inline">{t('nav.signUp')}</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-luxury/10 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  placeholder={t('search.placeholder')}
                  className="pl-10 h-12 text-base bg-background border-border focus:border-luxury"
                />
              </div>
              <Button
                onClick={handleSearchSubmit}
                variant="luxury"
                size="sm"
                className="h-12 px-6"
              >
                {t('search.button')}
              </Button>
              <Button
                onClick={handleSearchToggle}
                variant="ghost"
                size="sm"
                className="h-12 px-3"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {searchQuery && (
              <div className="mt-3 text-sm text-muted-foreground">
                Press Enter to search for "{searchQuery}" or click Search button
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-luxury/10">
          <div className="px-4 py-4 space-y-4">
            {/* Theme Toggle (Mobile) */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('nav.theme')}</span>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? t('nav.light') : t('nav.dark')}
              </Button>
            </div>

            {/* Mobile Navigation Links */}
            <Link
              to={`${pathPrefix}/browse`}
              className="block text-foreground hover:text-luxury transition-colors duration-300 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.explore')}
            </Link>
            <button
              type="button"
              onClick={() => {
                handleSellYourCar();
                setIsMobileMenuOpen(false);
              }}
              className="block text-foreground hover:text-luxury transition-colors duration-300 font-medium py-2"
            >
              {t('nav.sell')}
            </button>
            <Link
              to={`${pathPrefix}/about`}
              className="block text-foreground hover:text-luxury transition-colors duration-300 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>

            {/* Mobile Search */}
            <div className="pt-2 border-t border-border/20">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit();
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    placeholder={t('search.placeholder')}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button
                  onClick={() => {
                    handleSearchSubmit();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="luxury"
                  size="sm"
                  className="w-full"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t('nav.searchCars')}
                </Button>
              </div>
            </div>

            {/* Mobile Auth Buttons */}
            <div className="pt-2 border-t border-border/20 space-y-2">
              {user ? (
                <>
                  <Link to="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start hover:scale-105 transition-transform relative">
                      <MessageCircle className="h-5 w-5 mr-3" />
                      Messages
                      {totalUnread > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 w-5 rounded-full p-0 text-xs font-bold flex items-center justify-center min-w-[20px] shadow-lg bg-gradient-to-r from-red-500 to-red-600"
                        >
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to={`${pathPrefix}/profile/my-listings`} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start hover:scale-105 transition-transform">
                      <User className="h-5 w-5 mr-3" />
                      {t('nav.profile')}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start hover:scale-105 transition-transform"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    {t('nav.signOut')}
                  </Button>
                  <Link to={`${pathPrefix}/list-car`} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="luxury" size="sm" className="w-full hover-lift">
                      {t('nav.sell')}
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleSellYourCar();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-foreground hover:text-luxury transition-colors duration-300 font-medium py-2"
                  >
                    {t('nav.sell')}
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link to={`${pathPrefix}/auth?tab=login`} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start hover:scale-105 transition-transform">
                      <LogIn className="h-5 w-5 mr-3" />
                      {t('nav.signIn')}
                    </Button>
                  </Link>
                  <Link to={`${pathPrefix}/auth?tab=signup`} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="luxury" size="sm" className="w-full hover-lift">
                      <UserPlus className="h-5 w-5 mr-3" />
                      {t('nav.signUp')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;