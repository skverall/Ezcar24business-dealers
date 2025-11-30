import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Plus, Car, ShieldCheck, Tag, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-background-new.png";
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

      <div className="relative z-10 w-full max-w-none px-4 lg:px-6 xl:px-8 text-center text-primary-foreground pt-32 md:pt-40">
        <h1 className="text-4xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up">
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

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 hover:bg-black/30 transition-all duration-300 group">
            <div className="p-3 rounded-full bg-luxury/10 text-luxury group-hover:scale-110 transition-transform duration-300">
              <Car className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">15,000+</div>
              <div className="text-xs text-gray-300 uppercase tracking-wider">Cars Available</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 hover:bg-black/30 transition-all duration-300 group">
            <div className="p-3 rounded-full bg-luxury/10 text-luxury group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">Verified</div>
              <div className="text-xs text-gray-300 uppercase tracking-wider">Trusted Dealers</div>
            </div>
          </div>

          <div
            onClick={handleFreeListingsClick}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-luxury/10 backdrop-blur-md border border-luxury/20 hover:bg-luxury/20 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-luxury/0 via-luxury/5 to-luxury/0 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="p-3 rounded-full bg-luxury/20 text-luxury group-hover:scale-110 transition-transform duration-300 relative z-10">
              <Tag className="w-6 h-6" />
            </div>
            <div className="text-center relative z-10">
              <div className="font-bold text-white text-lg">100% Free</div>
              <div className="text-xs text-luxury-foreground/80 uppercase tracking-wider font-semibold">List Your Car</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 hover:bg-black/30 transition-all duration-300 group">
            <div className="p-3 rounded-full bg-luxury/10 text-luxury group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">Best Prices</div>
              <div className="text-xs text-gray-300 uppercase tracking-wider">Guaranteed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;