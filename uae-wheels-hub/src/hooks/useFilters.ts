import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterState, DEFAULT_FILTER_STATE } from '@/types/filters';

export const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // Parse URL params to filter state
  const parseFiltersFromURL = useCallback((): FilterState => {
    const urlFilters: FilterState = { ...DEFAULT_FILTER_STATE };

    // Parse array parameters
    const arrayParams = ['spec', 'make', 'model', 'trim', 'city', 'bodyType', 'transmission', 'fuelType', 'condition', 'accidentHistory', 'warranty', 'seller', 'ownersCount', 'tags'];
    arrayParams.forEach(param => {
      const value = searchParams.get(param);
      if (value && value.trim() !== '') {
        (urlFilters as any)[param] = value.split(',').filter(v => v.trim() !== '');
      }
    });

    // Parse range parameters
    const priceRange = searchParams.get('priceRange');
    if (priceRange && priceRange.trim() !== '') {
      const [min, max] = priceRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        urlFilters.priceRange = [min || 0, max || 1000000];
      }
    }

    const yearRange = searchParams.get('yearRange');
    if (yearRange && yearRange.trim() !== '') {
      const [min, max] = yearRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        urlFilters.yearRange = [min || 2000, max || new Date().getFullYear()];
      }
    }

    const mileageRange = searchParams.get('mileageRange');
    if (mileageRange && mileageRange.trim() !== '') {
      const [min, max] = mileageRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        urlFilters.mileageRange = [min || 0, max || 300000];
      }
    }

    // Parse sort parameter
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      urlFilters.sortBy = sortBy;
    }

    return urlFilters;
  }, [searchParams]);

  // Update URL params from filter state
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();

    // Set array parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      } else if (key === 'priceRange' && Array.isArray(value)) {
        const [min, max] = value;
        if (min !== DEFAULT_FILTER_STATE.priceRange[0] || max !== DEFAULT_FILTER_STATE.priceRange[1]) {
          params.set(key, `${min}-${max}`);
        }
      } else if (key === 'yearRange' && Array.isArray(value)) {
        const [min, max] = value;
        if (min !== DEFAULT_FILTER_STATE.yearRange[0] || max !== DEFAULT_FILTER_STATE.yearRange[1]) {
          params.set(key, `${min}-${max}`);
        }
      } else if (key === 'mileageRange' && Array.isArray(value)) {
        const [min, max] = value;
        if (min !== DEFAULT_FILTER_STATE.mileageRange[0] || max !== DEFAULT_FILTER_STATE.mileageRange[1]) {
          params.set(key, `${min}-${max}`);
        }
      } else if (key === 'sortBy' && value !== DEFAULT_FILTER_STATE.sortBy) {
        params.set(key, value as string);
      }
    });

    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Initialize filters from URL on mount
  useEffect(() => {
    // Only parse from URL if there are actual search params
    if (searchParams.toString()) {
      const urlFilters = parseFiltersFromURL();
      setFilters(urlFilters);
    }
    // Otherwise keep default empty state
  }, [parseFiltersFromURL]);

  // Update filter value
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setIsLoading(true);
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
    
    // Simulate API call delay
    setTimeout(() => setIsLoading(false), 300);
  }, [filters, updateURL]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setIsLoading(true);
    setFilters(DEFAULT_FILTER_STATE);
    updateURL(DEFAULT_FILTER_STATE);
    setTimeout(() => setIsLoading(false), 300);
  }, [updateURL]);

  // Apply filters (for mobile)
  const applyFilters = useCallback(() => {
    setIsLoading(true);
    updateURL(filters);
    setTimeout(() => setIsLoading(false), 300);
  }, [filters, updateURL]);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    
    // Count array filters
    const arrayKeys = ['spec', 'make', 'model', 'trim', 'bodyType', 'transmission', 'fuelType', 'condition', 'accidentHistory', 'warranty', 'seller', 'ownersCount', 'tags'];
    arrayKeys.forEach(key => {
      const value = filters[key as keyof FilterState] as string[];
      if (value && value.length > 0) count += value.length;
    });

    // Count city filters
    if (filters.city.length > 0) {
      count += filters.city.length;
    }

    // Count range filters if different from default
    if (filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] || 
        filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1]) {
      count += 1;
    }
    
    if (filters.yearRange[0] !== DEFAULT_FILTER_STATE.yearRange[0] || 
        filters.yearRange[1] !== DEFAULT_FILTER_STATE.yearRange[1]) {
      count += 1;
    }
    
    if (filters.mileageRange[0] !== DEFAULT_FILTER_STATE.mileageRange[0] || 
        filters.mileageRange[1] !== DEFAULT_FILTER_STATE.mileageRange[1]) {
      count += 1;
    }

    return count;
  }, [filters]);

  // Get active filters as chips
  const getActiveFiltersChips = useCallback(() => {
    const chips: { key: string; label: string; value: string }[] = [];

    // Add array filter chips (exclude city and range arrays)
    Object.entries(filters).forEach(([key, value]) => {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        !['city', 'priceRange', 'yearRange', 'mileageRange'].includes(key)
      ) {
        (value as string[]).forEach((item) => {
          chips.push({ key, label: key, value: String(item) });
        });
      }
    });

    // Add city chips
    if (Array.isArray(filters.city) && filters.city.length > 0) {
      filters.city.forEach((city) => {
        chips.push({ key: 'city', label: 'city', value: city });
      });
    }

    // Add range chips (only when different from defaults)
    if (
      filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] ||
      filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1]
    ) {
      chips.push({
        key: 'priceRange',
        label: 'price',
        value: `${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()} AED`,
      });
    }

    return chips;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearAllFilters,
    applyFilters,
    isLoading,
    activeFilterCount: getActiveFilterCount(),
    activeFiltersChips: getActiveFiltersChips(),
  };
};
