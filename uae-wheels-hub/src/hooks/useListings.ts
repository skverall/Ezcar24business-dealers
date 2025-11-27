import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import type { FilterState } from '@/types/filters';

interface UseListingsParams {
  filters: FilterState;
  searchQuery?: string;
  page: number;
  pageSize: number;
}

interface ListingData {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: string;
  priceNum: number;
  mileage: string;
  mileageNum: number;
  location: string;
  spec: string;
  bodyType: string;
  transmission: string;
  fuelType: string;
  condition: string;
  accidentHistory: string;
  warranty: string;
  seller: string;
  ownersCount: string;
  tags: string[];
  image: string;
  isNew: boolean;
  dealer: string;
  rating: number;
}

export const useListings = ({ filters, searchQuery, page, pageSize }: UseListingsParams) => {
  const [data, setData] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('listings')
          .select(`
            id, title, make, model, year, price, mileage, city, spec, created_at,
            body_type, transmission, fuel_type, condition, accident_history,
            warranty, seller_type, owners_count, tags,
            listing_images(url, is_cover)
          `, { count: 'exact' })
          .eq('is_draft', false)
          .eq('status', 'active')
          .is('deleted_at', null);

        // Apply search query using full-text search
        if (searchQuery?.trim()) {
          query = query.textSearch('search_vector', searchQuery.trim().replace(/\s+/g, ' & '));
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
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data: results, error: queryError, count } = await query;

        if (queryError) {
          throw queryError;
        }

        if (results) {
          const transformedData: ListingData[] = results.map(listing => ({
            id: listing.id,
            title: listing.title || '',
            make: listing.make?.toLowerCase() || '',
            model: listing.model || '',
            year: listing.year || 0,
            price: `AED ${listing.price?.toLocaleString() || '0'}`,
            priceNum: listing.price || 0,
            mileage: listing.mileage ? `${listing.mileage.toLocaleString()} km` : '0 km',
            mileageNum: listing.mileage || 0,
            location: listing.city || 'UAE',
            spec: listing.spec || '',
            bodyType: listing.body_type || '',
            transmission: listing.transmission || 'automatic',
            fuelType: listing.fuel_type || 'petrol',
            condition: listing.condition || 'used',
            accidentHistory: listing.accident_history || 'clean',
            warranty: listing.warranty || 'no',
            seller: listing.seller_type || 'dealer',
            ownersCount: listing.owners_count || '0',
            tags: listing.tags || [],
            image: getProxiedImageUrl(listing.listing_images?.[0]?.url || ''),
            isNew: listing.year && (new Date().getFullYear() - listing.year) <= 1,
            dealer: 'EzCar',
            rating: 4.8
          }));
          
          setData(transformedData);
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error('Error loading listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [filters, searchQuery, page, pageSize]);

  return {
    data,
    loading,
    error,
    totalCount
  };
};