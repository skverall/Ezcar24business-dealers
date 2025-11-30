import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Search, LogOut, LogIn, UserPlus, Menu, X, Moon, Sun, MessageCircle, Building2, ChevronRight } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EzcarLogo from "./EzcarLogo";
import RealtimeChat from "./RealtimeChat";
import { useTheme } from "next-themes";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

const Header = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const { conversations } = useRealtimeChat();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Check if we are on the home page
  const isHome = location.pathname === '/' || location.pathname === '/en' || location.pathname === '/ar' || location.pathname === '/en/' || location.pathname === '/ar/';

  // Determine if header should be transparent/white text
  const isTransparent = isHome && !scrolled;

  // Calculate total unread messages
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b pt-safe",
          scrolled
            ? "glass-effect py-3 border-luxury/10"
            : "bg-gradient-to-b from-black/60 to-transparent py-5 border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-2 z-50">
              <Link
                to={pathPrefix}
                aria-label={t('nav.home')}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-luxury/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <EzcarLogo className="h-10 w-10 relative z-10 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className={cn(
                    "text-xl font-bold tracking-tight leading-none transition-colors",
                    isTransparent ? "text-white" : "text-foreground"
                  )}>EZCAR24</span>
                  <span className="text-[10px] tracking-[0.2em] text-luxury font-medium uppercase">Luxury Marketplace</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <NavLink to={`${pathPrefix}/browse`} isTransparent={isTransparent}>{t('nav.explore')}</NavLink>
              <button
                onClick={handleSellYourCar}
                className={cn(
                  "text-sm font-medium transition-colors duration-300 relative group",
                  isTransparent ? "text-white/90 hover:text-luxury" : "text-foreground/80 hover:text-luxury"
                )}
              >
                {t('nav.sell')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-luxury transition-all duration-300 group-hover:w-full" />
              </button>
              <NavLink to={`${pathPrefix}/about`} isTransparent={isTransparent}>{t('nav.about')}</NavLink>
              <NavLink to={`${pathPrefix}/business`} icon={<Building2 className="w-4 h-4" />} isTransparent={isTransparent}>
                For Business
              </NavLink>
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search Toggle */}
              <div className={cn(
                "flex items-center transition-all duration-300 overflow-hidden rounded-full border border-transparent",
                isSearchOpen
                  ? "w-64 px-3 border-luxury/20 bg-secondary/50"
                  : "w-10 bg-transparent hover:bg-white/10"
              )}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full hover:bg-transparent shrink-0",
                    isTransparent && !isSearchOpen ? "text-white hover:text-luxury" : "text-foreground/70"
                  )}
                  onClick={handleSearchToggle}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  placeholder={t('search.placeholder')}
                  className={cn(
                    "bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50",
                    !isSearchOpen && "opacity-0 pointer-events-none",
                    isTransparent && isSearchOpen ? "text-white" : "text-foreground"
                  )}
                />
                {isSearchOpen && searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-background/50 shrink-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <div className={cn("h-6 w-px mx-1", isTransparent ? "bg-white/20" : "bg-border/50")} />

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full transition-colors",
                  isTransparent ? "text-white hover:bg-white/10 hover:text-luxury" : "hover:bg-secondary/50"
                )}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <LanguageSwitcher />

              {user ? (
                <div className="flex items-center gap-3 pl-2">
                  <RealtimeChat className="flex" />

                  <div className="relative group">
                    <Link to={`${pathPrefix}/profile/my-listings`}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "rounded-full pl-2 pr-4 gap-2 border border-transparent",
                          isTransparent
                            ? "text-white hover:bg-white/10 hover:border-white/20"
                            : "hover:bg-secondary/50 hover:border-border/50"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-luxury/10 flex items-center justify-center text-luxury">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{t('nav.profile')}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-2">
                  <Link to={`${pathPrefix}/auth?tab=login`}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isTransparent ? "text-white hover:text-luxury hover:bg-white/10" : "hover:text-luxury"
                      )}
                    >
                      {t('nav.signIn')}
                    </Button>
                  </Link>
                  <Link to={`${pathPrefix}/auth?tab=signup`}>
                    <Button className="bg-luxury hover:bg-luxury/90 text-luxury-foreground rounded-full px-6 shadow-lg shadow-luxury/20 hover:shadow-luxury/40 transition-all duration-300 hover:-translate-y-0.5">
                      {t('nav.signUp')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative z-50 hover:bg-transparent",
                  isTransparent && !isMobileMenuOpen ? "text-white" : "text-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-40 bg-background/95 backdrop-blur-xl transition-all duration-500 md:hidden flex flex-col pt-24 px-6 pb-10",
        isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}>
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-secondary/50 border-none outline-none focus:ring-2 ring-luxury/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                  setIsMobileMenuOpen(false);
                }
              }}
            />
          </div>

          {/* Mobile Navigation */}
          <nav className="flex flex-col gap-2">
            <MobileNavLink to={`${pathPrefix}/browse`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav.explore')}
            </MobileNavLink>
            <button
              onClick={() => {
                handleSellYourCar();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-4 text-lg font-medium text-foreground hover:bg-secondary/30 rounded-xl transition-colors text-left group"
            >
              {t('nav.sell')}
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-luxury transition-colors" />
            </button>
            <MobileNavLink to={`${pathPrefix}/about`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav.about')}
            </MobileNavLink>
            <MobileNavLink to={`${pathPrefix}/business`} onClick={() => setIsMobileMenuOpen(false)} icon={<Building2 className="w-5 h-5" />}>
              For Business
            </MobileNavLink>
          </nav>

          {/* Mobile Auth & Settings */}
          <div className="mt-auto space-y-6">
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
              <span className="font-medium">{t('nav.theme')}</span>
              <div className="flex bg-background rounded-full p-1 border border-border/50">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    theme === 'light' ? "bg-white shadow-sm text-luxury" : "text-muted-foreground"
                  )}
                >
                  <Sun className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    theme === 'dark' ? "bg-slate-950 shadow-sm text-luxury" : "text-muted-foreground"
                  )}
                >
                  <Moon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {user ? (
              <div className="space-y-3">
                <Link to={`${pathPrefix}/profile/my-listings`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-12 justify-start gap-3 bg-secondary/50 hover:bg-secondary text-foreground border-none">
                    <User className="h-5 w-5" />
                    {t('nav.profile')}
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="destructive"
                  className="w-full h-12 justify-start gap-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none"
                >
                  <LogOut className="h-5 w-5" />
                  {t('nav.signOut')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link to={`${pathPrefix}/auth?tab=login`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border/50">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link to={`${pathPrefix}/auth?tab=signup`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-12 rounded-xl bg-luxury text-luxury-foreground hover:bg-luxury/90">
                    {t('nav.signUp')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const NavLink = ({ to, children, icon, isTransparent }: { to: string; children: React.ReactNode; icon?: React.ReactNode; isTransparent?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "text-sm font-medium transition-colors duration-300 relative group flex items-center gap-2",
      isTransparent ? "text-white/90 hover:text-luxury" : "text-foreground/80 hover:text-luxury"
    )}
  >
    {icon}
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-luxury transition-all duration-300 group-hover:w-full" />
  </Link>
);

const MobileNavLink = ({ to, children, onClick, icon }: { to: string; children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center justify-between p-4 text-lg font-medium text-foreground hover:bg-secondary/30 rounded-xl transition-colors group"
  >
    <span className="flex items-center gap-3">
      {icon}
      {children}
    </span>
    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-luxury transition-colors" />
  </Link>
);

export default Header;