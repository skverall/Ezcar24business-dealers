import { useState, useEffect } from 'react';
import { Grid, List, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterPanel from '@/components/FilterPanel';
import FilterChips from '@/components/FilterChips';
import CarCard from '@/components/CarCardDubizzle';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/hooks/useFilters';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_FILTER_STATE } from '@/types/filters';
import { supabase } from '@/integrations/supabase/client';
import { formatMake, formatCity, formatSpec, formatTransmission, formatFuelType, capitalizeFirst } from '@/utils/formatters';
import { getProxiedImageUrl } from '@/utils/imageUrl';

const BrowseCars = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { filters, updateFilter, clearAllFilters, activeFiltersChips, isLoading } = useFilters();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [dbCars, setDbCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Initialize from URL params (only explicit query string)
  useEffect(() => {
    const query = searchParams.get('query') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Load cars from Supabase with search and pagination
  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      
      try {
        let query = supabase
          .from('listings')
          .select(`
            id, title, make, model, year, price, mileage, city, spec, created_at, user_id,
            body_type, transmission, fuel_type, condition, accident_history,
            warranty, seller_type, owners_count, tags, status, sold_price,
            listing_images(url, is_cover, sort_order)
          `, { count: 'exact' })
          .eq('is_draft', false)
          .in('status', ['active', 'sold'])
          .is('deleted_at', null);

        // Apply search query using full-text search
        if (searchQuery.trim()) {
          query = query.textSearch('search_vector', searchQuery.trim());
        }

        // Apply filters
        if (filters.spec.length > 0) {
          query = query.in('spec', filters.spec);
        }
        if (filters.make.length > 0) {
          query = query.in('make', filters.make);
        }
        if (filters.city.length > 0) {
          query = query.in('city', filters.city);
        }
        if (filters.bodyType.length > 0) {
          query = query.in('body_type', filters.bodyType);
        }
        if (filters.transmission.length > 0) {
          query = query.in('transmission', filters.transmission);
        }
        if (filters.fuelType.length > 0) {
          query = query.in('fuel_type', filters.fuelType);
        }
        if (filters.condition.length > 0) {
          query = query.in('condition', filters.condition);
        }
        if (filters.accidentHistory.length > 0) {
          query = query.in('accident_history', filters.accidentHistory);
        }
        if (filters.warranty.length > 0) {
          query = query.in('warranty', filters.warranty);
        }
        if (filters.seller.length > 0) {
          query = query.in('seller_type', filters.seller);
        }
        if (filters.ownersCount.length > 0) {
          query = query.in('owners_count', filters.ownersCount);
        }

        // Apply range filters
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        }
        if (filters.yearRange[0] > 2000 || filters.yearRange[1] < new Date().getFullYear()) {
          query = query.gte('year', filters.yearRange[0]).lte('year', filters.yearRange[1]);
        }
        if (filters.mileageRange[0] > 0 || filters.mileageRange[1] < 300000) {
          query = query.gte('mileage', filters.mileageRange[0]).lte('mileage', filters.mileageRange[1]);
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'year_desc':
            query = query.order('year', { ascending: false });
            break;
          case 'year_asc':
            query = query.order('year', { ascending: true });
            break;
          case 'mileage_asc':
            query = query.order('mileage', { ascending: true });
            break;
          case 'mileage_desc':
            query = query.order('mileage', { ascending: false });
            break;
          case 'updated':
            query = query.order('updated_at', { ascending: false });
            break;
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        // Apply pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (!error && data) {
          const transformedCars = data.map(car => {
            const imgs = (car.listing_images || []) as Array<{ url: string; is_cover?: boolean; sort_order?: number }>;
            const cover = imgs.find((i) => i?.is_cover);
            const byOrder = [...imgs].sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));
            const ordered = cover ? [getProxiedImageUrl(cover.url), ...byOrder.filter(i => i.url !== cover.url).map(i => getProxiedImageUrl(i.url))] : byOrder.map(i => getProxiedImageUrl(i.url));
            const imageUrl = ordered[0] || '';
            return {
              id: car.id,
              title: car.title,
              make: formatMake(car.make),
              model: capitalizeFirst(car.model),
              year: car.year,
              price: `AED ${car.price?.toLocaleString()}`,
              priceNum: car.price || 0,
              mileage: car.mileage ? `${car.mileage.toLocaleString()} km` : '0 km',
              mileageNum: car.mileage || 0,
              location: formatCity(car.city),
              spec: formatSpec(car.spec),
              bodyType: car.body_type || '',
              transmission: formatTransmission(car.transmission),
              fuelType: formatFuelType(car.fuel_type),
              condition: car.condition || 'used',
              accidentHistory: car.accident_history || 'clean',
              warranty: car.warranty || 'no',
              seller: car.seller_type || 'dealer',
              ownersCount: car.owners_count || '0',
              tags: car.tags || [],
              image: imageUrl,
              images: ordered,
              isNew: car.year && (new Date().getFullYear() - car.year) <= 1,
              dealer: 'EzCar',
              rating: 4.8,
              sellerId: car.user_id,
              status: car.status,
              soldPrice: car.sold_price || null,
            };
          });

          setDbCars(transformedCars);
          setFilteredCars(transformedCars);
          setTotalCount(count || 0);
        } else {
          console.error('Database error:', error);
          toast({ title: 'Failed to load cars', description: error?.message || 'Please try again later', variant: 'destructive' });
          setDbCars([]);
          setFilteredCars([]);
          setTotalCount(0);
        }
      } catch (error: any) {
        console.error('Error loading cars:', error);
        toast({ title: 'Error loading cars', description: error?.message || 'Please try again later', variant: 'destructive' });
        setDbCars([]);
        setFilteredCars([]);
        setTotalCount(0);
      }
      
      setLoading(false);
    };

    loadCars();
  }, [filters, searchQuery, currentPage, pageSize]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const handleRemoveChip = (key: string, value: string) => {
    try {
      if (key === 'priceRange' || key === 'yearRange' || key === 'mileageRange') {
        // For range filters, reset to default values
        const defaultValue = DEFAULT_FILTER_STATE[key as keyof typeof DEFAULT_FILTER_STATE];
        updateFilter(key as keyof typeof filters, defaultValue);
      } else {
        // Handle array filters
        const currentValues = filters[key as keyof typeof filters] as string[];
        const newValues = currentValues.filter(v => v !== value);
        updateFilter(key as keyof typeof filters, newValues);
      }
    } catch (error) {
      console.error('Error removing filter chip:', error);
      // Don't let the error break the UI - just log it
      // The UI will continue to work normally
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />

      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('nav.explore')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {/* TODO: move to i18n if we want a subtitle here */}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="flex-shrink-0">
              <FilterPanel />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button & View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {isMobile && <FilterPanel isMobile />}
                <span className="text-sm text-muted-foreground">
                  {loading || isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    `${totalCount} cars found ${searchQuery ? `for "${searchQuery}"` : ''}`
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filter Chips */}
            <FilterChips
              chips={activeFiltersChips}
              onRemoveChip={handleRemoveChip}
              onClearAll={clearAllFilters}
              isLoading={isLoading}
            />

            {/* Cars Grid/List */}
            <div className="container mx-auto px-4">
              <div className={
                viewMode === 'grid'
                  ? 'car-card-grid max-w-7xl mx-auto'
                  : 'space-y-4 max-w-7xl mx-auto'
              }>
                {filteredCars.map((car) => (
                  <div key={car.id} className={viewMode === 'list' ? 'w-full' : 'car-card-container'}>
                    <CarCard {...car} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(Math.ceil(totalCount / pageSize), currentPage + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredCars.length === 0 && !loading && !isLoading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold mb-2">No cars found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No results for "${searchQuery}". Try different keywords or adjust your filters.`
                    : 'Try adjusting your filters to see more results'
                  }
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BrowseCars;