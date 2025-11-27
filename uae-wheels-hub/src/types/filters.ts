export interface FilterState {
  spec: string[];
  make: string[];
  model: string[];
  trim: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  mileageRange: [number, number];
  city: string[];
  bodyType: string[];
  transmission: string[];
  fuelType: string[];
  condition: string[];
  accidentHistory: string[];
  warranty: string[];
  seller: string[];
  ownersCount: string[];
  tags: string[];
  sortBy: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterFacet {
  key: keyof FilterState;
  label: string;
  type: 'multiselect' | 'range' | 'select';
  options?: FilterOption[];
  min?: number;
  max?: number;
  presets?: { label: string; value: [number, number] }[];
}

export interface CarMakeModel {
  make: string;
  models: {
    model: string;
    trims: string[];
  }[];
}

export const SPEC_OPTIONS: FilterOption[] = [
  { value: 'gcc', label: 'GCC', count: 0 },
  { value: 'us', label: 'US', count: 0 },
  { value: 'eu', label: 'European', count: 0 },
  { value: 'japanese', label: 'Japanese', count: 0 },
  { value: 'korean', label: 'Korean', count: 0 },
  { value: 'canadian', label: 'Canadian', count: 0 },
  { value: 'other', label: 'Other/Unknown', count: 0 },
];

export const PRICE_PRESETS = [
  { label: 'Under 50k', value: [0, 50000] as [number, number] },
  { label: '50k - 100k', value: [50000, 100000] as [number, number] },
  { label: '100k - 200k', value: [100000, 200000] as [number, number] },
  { label: '200k+', value: [200000, 1000000] as [number, number] },
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'newest', label: 'Newest', count: 0 },
  { value: 'price_asc', label: 'Price: Low to High', count: 0 },
  { value: 'price_desc', label: 'Price: High to Low', count: 0 },
  { value: 'year_desc', label: 'Year: Newest First', count: 0 },
  { value: 'year_asc', label: 'Year: Oldest First', count: 0 },
  { value: 'mileage_asc', label: 'Mileage: Low to High', count: 0 },
  { value: 'mileage_desc', label: 'Mileage: High to Low', count: 0 },
  { value: 'updated', label: 'Recently Updated', count: 0 },
];

export const UAE_CITIES: FilterOption[] = [
  { value: 'dubai', label: 'Dubai', count: 0 },
  { value: 'abu_dhabi', label: 'Abu Dhabi', count: 0 },
  { value: 'sharjah', label: 'Sharjah', count: 0 },
  { value: 'ajman', label: 'Ajman', count: 0 },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain', count: 0 },
  { value: 'ras_al_khaimah', label: 'Ras Al Khaimah', count: 0 },
  { value: 'fujairah', label: 'Fujairah', count: 0 },
];

export const BODY_TYPES: FilterOption[] = [
  { value: 'sedan', label: 'Sedan', count: 0 },
  { value: 'suv', label: 'SUV', count: 0 },
  { value: 'hatchback', label: 'Hatchback', count: 0 },
  { value: 'coupe', label: 'Coupe', count: 0 },
  { value: 'convertible', label: 'Convertible', count: 0 },
  { value: 'pickup', label: 'Pickup', count: 0 },
  { value: 'wagon', label: 'Wagon', count: 0 },
];

export const TRANSMISSION_TYPES: FilterOption[] = [
  { value: 'automatic', label: 'Automatic', count: 0 },
  { value: 'manual', label: 'Manual', count: 0 },
  { value: 'cvt', label: 'CVT', count: 0 },
];

export const FUEL_TYPES: FilterOption[] = [
  { value: 'petrol', label: 'Petrol', count: 0 },
  { value: 'diesel', label: 'Diesel', count: 0 },
  { value: 'hybrid', label: 'Hybrid', count: 0 },
  { value: 'electric', label: 'Electric', count: 0 },
];

export const CONDITION_OPTIONS: FilterOption[] = [
  { value: 'new', label: 'New', count: 0 },
  { value: 'used', label: 'Used', count: 0 },
];

export const ACCIDENT_HISTORY_OPTIONS: FilterOption[] = [
  { value: 'clean', label: 'Clean', count: 0 },
  { value: 'with_records', label: 'With Records', count: 0 },
];

export const WARRANTY_OPTIONS: FilterOption[] = [
  { value: 'yes', label: 'Yes', count: 0 },
  { value: 'no', label: 'No', count: 0 },
];

export const SELLER_OPTIONS: FilterOption[] = [
  { value: 'dealer', label: 'Dealer', count: 0 },
  { value: 'private', label: 'Private', count: 0 },
];

export const OWNERS_COUNT_OPTIONS: FilterOption[] = [
  { value: '0', label: 'First Owner', count: 0 },
  { value: '1', label: 'Second Owner', count: 0 },
  { value: '2+', label: '2+ Owners', count: 0 },
];

export const TAG_OPTIONS: FilterOption[] = [
  { value: 'agency_maintained', label: 'Agency Maintained', count: 0 },
  { value: 'full_service_history', label: 'Full Service History', count: 0 },
  { value: 'first_owner', label: 'First Owner', count: 0 },
  { value: 'negotiable', label: 'Negotiable', count: 0 },
  { value: 'featured', label: 'Featured', count: 0 },
];

export const DEFAULT_FILTER_STATE: FilterState = {
  spec: [],
  make: [],
  model: [],
  trim: [],
  priceRange: [0, 1000000],
  yearRange: [2000, new Date().getFullYear()],
  mileageRange: [0, 300000],
  city: [], // Start empty, no default city
  bodyType: [],
  transmission: [],
  fuelType: [],
  condition: [],
  accidentHistory: [],
  warranty: [],
  seller: [],
  ownersCount: [],
  tags: [],
  sortBy: 'newest',
};
