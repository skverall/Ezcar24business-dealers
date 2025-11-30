import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-background.png";
import { useTranslation, Trans } from "react-i18next";

const Hero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(t('cities.dubai'));
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  // Check screen size and set appropriate placeholder
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScreenSize('xs');
      } else if (width < 768) {
        setScreenSize('mobile');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get appropriate placeholder text based on screen size
  const getPlaceholderText = () => {
    switch (screenSize) {
      case 'xs':
        return t('hero.placeholder.xs');
      case 'mobile':
        return t('hero.placeholder.mobile');
      default:
        return t('hero.placeholder.desktop');
    }
  };

  const locations = [
    t('cities.abu_dhabi'),
    t('cities.dubai'),
    t('cities.sharjah'),
    t('cities.ajman'),
    t('cities.umm_al_quwain'),
    t('cities.ras_al_khaimah'),
    t('cities.fujairah'),
    t('cities.others')
  ];

  const handleSearch = () => {
    setIsSearching(true);

    // Create search params
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('query', searchQuery.trim());
    }
    if (selectedLocation && selectedLocation !== t('cities.others')) {
      params.set('city', selectedLocation.toLowerCase().replace(/\s+/g, '_'));
    }

    // Navigate to browse page with search params
    const searchUrl = `${pathPrefix}/browse${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(searchUrl);

    // Reset loading state
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFreeListingsClick = () => {
    if (user) {
      navigate('/list-car');
    } else {
      navigate('/auth?tab=signup&redirect=/list-car');
    }
  };

  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-luxury/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-luxury/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-luxury/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-none px-4 lg:px-6 xl:px-8 text-center text-primary-foreground">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up">
          <Trans i18nKey="hero.headline">
            Find Your Perfect Car in the <span className="gradient-text">UAE</span>
          </Trans>
        </h1>
        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {t('hero.sub')}
        </p>

        <div className="max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-effect rounded-3xl p-8 shadow-hero hover-glow transition-all duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search Input */}
              <div className="md:col-span-2 relative">
                <div className="relative">
                  <Search className={`absolute ${screenSize === 'xs' ? 'left-2' : 'left-4'} top-1/2 transform -translate-y-1/2 ${screenSize === 'xs' ? 'h-4 w-4' : 'h-5 w-5'} transition-all duration-300 ${isSearchFocused ? 'text-luxury scale-110' : 'text-gray-500'
                    } ${isSearching ? 'animate-spin' : ''}`} />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                      setIsSearchFocused(false);
                      // Additional iOS zoom reset on blur
                      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        setTimeout(() => {
                          window.scrollTo(window.scrollX, window.scrollY);
                        }, 100);
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={getPlaceholderText()}
                    className={`search-input h-14 ${screenSize === 'xs' ? 'pl-8 text-sm' : screenSize === 'mobile' ? 'pl-10 text-base' : 'pl-12 text-lg'} bg-white/90 backdrop-blur-sm border-white/30 focus:border-luxury focus:bg-white transition-all duration-300 text-gray-900 placeholder:text-gray-500 focus:placeholder:text-gray-400`}
                  />
                </div>
              </div>

              {/* Location Select */}
              <div className="relative">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-luxury z-10" />
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="select-trigger h-14 pl-12 bg-white/90 backdrop-blur-sm border-white/30 focus:border-luxury focus:bg-white transition-all duration-300 text-gray-900 [&>span]:text-gray-900 data-[placeholder]:text-gray-500">
                      <SelectValue placeholder={t('hero.selectLocation')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-luxury/20 shadow-xl">
                      {locations.map((location) => (
                        <SelectItem
                          key={location}
                          value={location}
                          className="text-gray-900 hover:bg-luxury/10 focus:bg-luxury/10 cursor-pointer transition-colors duration-200"
                        >
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search Button */}
              <Button
                variant="luxury"
                size="lg"
                className="h-14 hover-lift transition-all duration-300 disabled:opacity-50"
                onClick={handleSearch}
                disabled={isSearching}
              >
                <Search className={`h-5 w-5 mr-2 transition-all duration-300 ${isSearching ? 'animate-pulse scale-110' : 'group-hover:scale-110'
                  }`} />
                {isSearching ? t('hero.searching') : t('hero.searchCars')}
              </Button>
            </div>
          </div>
        </div>

        {/* List Your Car CTA Button */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Button
            onClick={handleFreeListingsClick}
            variant="luxury"
            size="lg"
            className="bg-luxury hover:bg-luxury/90 text-luxury-foreground font-semibold px-8 py-4 text-lg rounded-2xl shadow-[0_4px_15px_rgb(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.3)] transition-all duration-300 hover:scale-105 hover-lift"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('hero.ctaFree')}
          </Button>
          <p className="text-primary-foreground/80 text-sm mt-4">
            {t('hero.ctaFreeSub')}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <span className="glass-effect px-6 py-3 rounded-full hover-glow transition-all duration-300 cursor-default bg-primary/20 backdrop-blur-md border border-white/10">
            <Trans i18nKey="hero.badges.carsAvailable"><span className="font-semibold text-luxury">15,000+</span> <span className="text-white font-medium">Cars Available</span></Trans>
          </span>
          <span className="glass-effect px-6 py-3 rounded-full hover-glow transition-all duration-300 cursor-default bg-primary/20 backdrop-blur-md border border-white/10">
            <Trans i18nKey="hero.badges.verifiedDealers"><span className="font-semibold text-luxury">✓</span> <span className="text-white font-medium">Verified Dealers</span></Trans>
          </span>
          <span
            onClick={handleFreeListingsClick}
            className="glass-effect px-6 py-3 rounded-full hover-glow transition-all duration-300 cursor-pointer bg-primary/20 backdrop-blur-md border border-white/10 animate-free-badge-special animate-free-shimmer hover:scale-105 hover:bg-luxury/20"
          >
            <Trans i18nKey="hero.badges.freeListings"><span className="font-semibold text-luxury">🆓</span> <span className="text-white font-medium">Free Listings</span></Trans>
          </span>
          <span className="glass-effect px-6 py-3 rounded-full hover-glow transition-all duration-300 cursor-default bg-primary/20 backdrop-blur-md border border-white/10">
            <Trans i18nKey="hero.badges.bestPrices"><span className="font-semibold text-luxury">🏆</span> <span className="text-white font-medium">Best Prices Guaranteed</span></Trans>
          </span>
        </div>
      </div>
    </section>
  );
};

export default Hero;