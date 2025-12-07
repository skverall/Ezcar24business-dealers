import CarCard from "./CarCardDubizzle";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Trans, useTranslation } from "react-i18next";

const CarGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const pathPrefix = location.pathname.startsWith('/en') ? '/en' : location.pathname.startsWith('/ar') ? '/ar' : '/ar';
  const { vehicles: cars, loading } = useFeaturedVehicles();

  // Only show real vehicles from database - no fallback to mock data
  const displayCars = cars;
  return <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden w-full">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5 overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-luxury rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl animate-float" style={{
        animationDelay: '2s'
      }}></div>
    </div>

    <div className="relative z-10">
      {/* Header Section - Full Width */}
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            <Trans i18nKey="carGrid.title">Featured <span className="gradient-text">Vehicles</span></Trans>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('carGrid.subtitle')}
          </p>
          <div className="mt-8 w-24 h-1 bg-gradient-to-r from-luxury to-luxury/50 mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Cards Grid - Constrained Width */}
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="car-card-grid max-w-7xl mx-auto">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="car-card-container">
                <div className="h-full bg-muted/50 rounded-lg animate-pulse min-h-[500px]" />
              </div>
            ))}
          </div>
        ) : displayCars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">{t('carGrid.empty')}</p>
            <Button
              variant="luxury"
              onClick={() => navigate(`${pathPrefix}/browse`)}
            >
              {t('carGrid.exploreAll')}
            </Button>
          </div>
        ) : (
          <div className="car-card-grid max-w-7xl mx-auto">
            {displayCars.map((car, index) => (
              <div key={car.id} style={{ animationDelay: `${index * 0.1}s` }} className="car-card-container animate-fade-in-up">
                <CarCard {...car} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Button Section - Full Width */}
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="text-center mt-16 animate-fade-in-up">
          <Button
            variant="luxury"
            size="lg"
            className="hover-lift px-12 py-4 text-lg"
            onClick={() => navigate(`${pathPrefix}/browse`)}
          >
            {t('carGrid.exploreAll')}
            <div className="ml-2 w-6 h-6 bg-luxury-foreground/20 rounded-full flex items-center justify-center">
              →
            </div>
          </Button>
        </div>
      </div>
    </div>
  </section>;
};
export default CarGrid;
