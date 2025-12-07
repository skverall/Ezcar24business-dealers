import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatMake, formatCity, formatSpec, formatFuelType, capitalizeFirst } from '@/utils/formatters';
import { getProxiedImageUrl } from '@/utils/imageUrl';

interface FeaturedVehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: string;
  priceNum: number;
  mileage: string;
  location: string;
  image: string; // cover image
  images: string[]; // ordered gallery (cover first)
  isNew: boolean;
  condition: string;
  dealer: string;
  rating: number;
  fuelType: string;
  spec: string;
  sellerId?: string;
  status?: string;
  soldPrice?: number | null;
}

interface UseFeaturedVehiclesReturn {
  vehicles: FeaturedVehicle[];
  loading: boolean;
  error: string | null;
}

// Premium brands that get higher scoring
const PREMIUM_BRANDS = [
  'bmw', 'mercedes', 'mercedes-benz', 'audi', 'lexus', 'porsche',
  'jaguar', 'land rover', 'range rover', 'bentley', 'rolls-royce',
  'maserati', 'ferrari', 'lamborghini', 'aston martin', 'tesla'
];

// Calculate vehicle score for featured selection
const calculateVehicleScore = (vehicle: any): number => {
  let score = 0;

  // Featured tag gets highest priority
  if (vehicle.tags?.includes('featured')) {
    score += 100;
  }

  // Premium brand bonus
  if (PREMIUM_BRANDS.includes(vehicle.make?.toLowerCase())) {
    score += 50;
  }

  // Condition bonus
  if (vehicle.condition === 'excellent') {
    score += 30;
  } else if (vehicle.condition === 'good') {
    score += 20;
  }

  // Clean accident history
  if (vehicle.accident_history === 'clean') {
    score += 20;
  }

  // Recent year bonus (2020+)
  if (vehicle.year >= 2020) {
    score += 15;
  }

  // Favorites bonus (popularity indicator)
  if (vehicle.favorites_count > 10) {
    score += 15;
  } else if (vehicle.favorites_count > 5) {
    score += 10;
  } else if (vehicle.favorites_count > 0) {
    score += 5;
  }

  // Views bonus (if available)
  if (vehicle.views > 100) {
    score += 10;
  } else if (vehicle.views > 50) {
    score += 5;
  }

  // Recent listing bonus (within last 30 days)
  const daysSinceCreated = (Date.now() - new Date(vehicle.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 30) {
    score += 5;
  }

  return score;
};

// Transform database result to FeaturedVehicle
const transformVehicle = (vehicle: any): FeaturedVehicle => {
  const imgs = (vehicle.listing_images || []) as Array<{ url: string; is_cover?: boolean; sort_order?: number }>;
  const cover = imgs.find((i) => i?.is_cover);
  const byOrder = [...imgs].sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));
  const ordered = cover ? [getProxiedImageUrl(cover.url), ...byOrder.filter(i => i.url !== cover.url).map(i => getProxiedImageUrl(i.url))] : byOrder.map(i => getProxiedImageUrl(i.url));
  const imageUrl = ordered[0] || '';
  return {
    id: vehicle.id,
    title: vehicle.title || `${formatMake(vehicle.make)} ${capitalizeFirst(vehicle.model)}`,
    make: formatMake(vehicle.make),
    model: capitalizeFirst(vehicle.model),
    year: vehicle.year || 0,
    price: `AED ${vehicle.price?.toLocaleString() || '0'}`,
    priceNum: vehicle.price || 0,
    mileage: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '0 km',
    location: formatCity(vehicle.city),
    image: imageUrl,
    images: ordered,
    isNew: vehicle.year && (new Date().getFullYear() - vehicle.year) <= 1,
    condition: vehicle.condition || 'Good',
    dealer: 'EzCar',
    rating: 4.8,
    fuelType: formatFuelType(vehicle.fuel_type),
    spec: formatSpec(vehicle.spec),
    sellerId: vehicle.user_id,
    status: vehicle.status,
    soldPrice: vehicle.sold_price ?? null
  };
};

export const useFeaturedVehicles = (): UseFeaturedVehiclesReturn => {
  const [vehicles, setVehicles] = useState<FeaturedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadFeaturedVehicles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Public-friendly query for featured listings
        let query = supabase
          .from('listings')
          .select(`
            id, title, make, model, year, price, mileage, city, created_at, user_id,
            condition, accident_history, tags, views, fuel_type, spec, status, sold_price,
            listing_images(url, is_cover, sort_order)
          `)
          .eq('is_draft', false)
          .in('status', ['active', 'sold'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50);

        // Do NOT exclude the user's listings; featured is public for all users
        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        if (!data || data.length === 0) {
          // Fallback: use the same constraints and smaller limit
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('listings')
            .select(`
              id, title, make, model, year, price, mileage, city, created_at, user_id,
              condition, accident_history, tags, views, fuel_type, spec, status, sold_price,
              listing_images!inner(url, is_cover, sort_order)
            `)
            .eq('is_draft', false)
            .in('status', ['active', 'sold'])
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(12);

          if (fallbackError) {
            throw fallbackError;
          }

          const fallbackVehicles = (fallbackData || []).map(transformVehicle);
          setVehicles(fallbackVehicles);
          return;
        }

        // Score and sort vehicles, adding favorites count
        const scoredVehicles = data.map(vehicle => ({
          ...vehicle,
          favorites_count: 0, // We're not fetching favorites in this query
          score: calculateVehicleScore({
            ...vehicle,
            favorites_count: 0
          })
        }));

        // Sort by creation date (newest first) as the primary criterion
        // Score is used as a secondary tiebreaker for listings with the same date
        scoredVehicles.sort((a, b) => {
          // Primary: sort by created_at (newest first)
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          if (dateB !== dateA) {
            return dateB - dateA;
          }
          // Secondary: sort by score (highest first) if dates are equal
          return b.score - a.score;
        });

        // Take top 12 vehicles (4 rows of 3)
        const topVehicles = scoredVehicles.slice(0, 12);

        // Transform to FeaturedVehicle format
        const featuredVehicles = topVehicles.map(transformVehicle);

        setVehicles(featuredVehicles);

      } catch (err) {
        console.error('Error loading featured vehicles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load featured vehicles');

        // Final fallback: empty array (component should handle this gracefully)
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedVehicles();
  }, [user]); // Re-run when user authentication changes

  return {
    vehicles,
    loading,
    error
  };
};
