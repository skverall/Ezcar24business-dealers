import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import MultiSelectFilter from './MultiSelectFilter';
import RangeFilter from './RangeFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFilters } from '@/hooks/useFilters';
import { BRAND_OPTIONS } from '@/data/brands';
import { getTrimsForModelByMake } from '@/data/models';
import {
  SPEC_OPTIONS,
  PRICE_PRESETS,
  SORT_OPTIONS,
  UAE_CITIES,
  BODY_TYPES,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
  CONDITION_OPTIONS,
  ACCIDENT_HISTORY_OPTIONS,
  WARRANTY_OPTIONS,
  SELLER_OPTIONS,
  OWNERS_COUNT_OPTIONS,
  TAG_OPTIONS,
} from '@/types/filters';

interface FilterPanelProps {
  isMobile?: boolean;
}

const FilterPanel = ({ isMobile = false }: FilterPanelProps) => {
  const { filters, updateFilter, clearAllFilters, applyFilters, isLoading, activeFilterCount } = useFilters();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Make options sourced from centralized brand data
  const MAKE_OPTIONS = BRAND_OPTIONS;

  const MODEL_OPTIONS = [
    { value: 'camry', label: 'Camry', count: 45 },
    { value: 'corolla', label: 'Corolla', count: 35 },
    { value: 'x5', label: 'X5', count: 30 },
    { value: 'c_class', label: 'C-Class', count: 25 },
  ];

  // Dynamic trim options based on selected make and model
  const getTrimOptions = () => {
    if (filters.make.length === 0 || filters.model.length === 0) {
      return [];
    }

    const trimSet = new Set<string>();

    // Get trims for all selected make/model combinations
    filters.make.forEach(make => {
      filters.model.forEach(model => {
        const trims = getTrimsForModelByMake(make, model);
        trims.forEach(trim => trimSet.add(trim));
      });
    });

    return Array.from(trimSet).map(trim => ({
      value: trim.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: trim,
      count: 0 // TODO: Get actual count from database
    })).sort((a, b) => a.label.localeCompare(b.label));
  };

  const TRIM_OPTIONS = getTrimOptions();

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const formatMileage = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k km`;
    return `${value} km`;
  };

  const FilterContent = () => (
    <div className="space-y-3">
      {/* Sort */}
      <div>
        <h3 className="font-medium text-sm mb-1.5">{t('filters.sortBy')}</h3>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full p-1.5 border border-border rounded-md bg-background text-sm h-8"
          aria-label={t('filters.sortBy')}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Separator className="my-2" />

      {/* Essential Filters */}
      <div className="space-y-2.5">
        {/* Spec/Market */}
        <MultiSelectFilter
          label={t('filters.labels.spec')}
          options={SPEC_OPTIONS}
          selectedValues={filters.spec}
          onChange={(values) => updateFilter('spec', values)}
          compact
        />

        {/* Make */}
        <MultiSelectFilter
          label={t('filters.labels.make')}
          options={MAKE_OPTIONS}
          selectedValues={filters.make}
          onChange={(values) => updateFilter('make', values)}
          searchable
          compact
        />

        {/* Price Range */}
        <RangeFilter
          label={t('filters.labels.priceRange')}
          value={filters.priceRange}
          min={0}
          max={1000000}
          step={5000}
          onChange={(value) => updateFilter('priceRange', value)}
          formatValue={formatPrice}
          presets={PRICE_PRESETS}
          compact
        />

        {/* Year Range */}
        <RangeFilter
          label={t('filters.labels.yearRange')}
          value={filters.yearRange}
          min={2000}
          max={new Date().getFullYear()}
          step={1}
          onChange={(value) => updateFilter('yearRange', value)}
          compact
        />

        {/* Mileage Range */}
        <RangeFilter
          label={t('filters.labels.mileageRange')}
          value={filters.mileageRange}
          min={0}
          max={300000}
          step={5000}
          onChange={(value) => updateFilter('mileageRange', value)}
          formatValue={formatMileage}
          compact
        />
      </div>

      {/* More Filters */}
      {isMobile ? (
        <div className="pt-1">
          <Button
            variant="ghost"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {showMoreFilters ? t('filters.hideMore') : t('filters.more')}
          </Button>
          {showMoreFilters && (
            <div className="space-y-2.5 pt-2 border-t border-border/50">
              {/* Model (only show if make is selected) */}
              {filters.make.length > 0 && (
                <MultiSelectFilter
                  label={t('filters.labels.model')}
                  options={MODEL_OPTIONS}
                  selectedValues={filters.model}
                  onChange={(values) => updateFilter('model', values)}
                  searchable
                  compact
                />
              )}

              {/* Trim (only show if model is selected) */}
              {filters.model.length > 0 && (
                <MultiSelectFilter
                  label={t('filters.labels.trim')}
                  options={TRIM_OPTIONS}
                  selectedValues={filters.trim}
                  onChange={(values) => updateFilter('trim', values)}
                  compact
                />
              )}

              {/* City */}
              <MultiSelectFilter
                label={t('filters.labels.city')}
                options={UAE_CITIES}
                selectedValues={filters.city}
                onChange={(values) => updateFilter('city', values)}
                compact
              />

              {/* Body Type */}
              <MultiSelectFilter
                label={t('filters.labels.bodyType')}
                options={BODY_TYPES}
                selectedValues={filters.bodyType}
                onChange={(values) => updateFilter('bodyType', values)}
                compact
              />

              {/* Transmission */}
              <MultiSelectFilter
                label={t('filters.labels.transmission')}
                options={TRANSMISSION_TYPES}
                selectedValues={filters.transmission}
                onChange={(values) => updateFilter('transmission', values)}
                compact
              />

              {/* Fuel Type */}
              <MultiSelectFilter
                label={t('filters.labels.fuelType')}
                options={FUEL_TYPES}
                selectedValues={filters.fuelType}
                onChange={(values) => updateFilter('fuelType', values)}
                compact
              />

              {/* Condition */}
              <MultiSelectFilter
                label={t('filters.labels.condition')}
                options={CONDITION_OPTIONS}
                selectedValues={filters.condition}
                onChange={(values) => updateFilter('condition', values)}
                compact
              />

              {/* Accident History */}
              <MultiSelectFilter
                label={t('filters.labels.accidentHistory')}
                options={ACCIDENT_HISTORY_OPTIONS}
                selectedValues={filters.accidentHistory}
                onChange={(values) => updateFilter('accidentHistory', values)}
                compact
              />

              {/* Warranty */}
              <MultiSelectFilter
                label={t('filters.labels.warranty')}
                options={WARRANTY_OPTIONS}
                selectedValues={filters.warranty}
                onChange={(values) => updateFilter('warranty', values)}
                compact
              />

              {/* Seller */}
              <MultiSelectFilter
                label={t('filters.labels.seller')}
                options={SELLER_OPTIONS}
                selectedValues={filters.seller}
                onChange={(values) => updateFilter('seller', values)}
                compact
              />

              {/* Owners Count */}
              <MultiSelectFilter
                label={t('filters.labels.ownersCount')}
                options={OWNERS_COUNT_OPTIONS}
                selectedValues={filters.ownersCount}
                onChange={(values) => updateFilter('ownersCount', values)}
                compact
              />

              {/* Tags */}
              <MultiSelectFilter
                label={t('filters.labels.tags')}
                options={TAG_OPTIONS}
                selectedValues={filters.tags}
                onChange={(values) => updateFilter('tags', values)}
                compact
              />
            </div>
          )}
        </div>
      ) : (
        <div className="pt-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-7 text-xs">
                <span>{t('filters.more')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <ScrollArea className="max-h-[70vh] pr-2">
                <div className="space-y-2">
                  {/* Model (only show if make is selected) */}
                  {filters.make.length > 0 && (
                    <MultiSelectFilter
                      label={t('filters.labels.model')}
                      options={MODEL_OPTIONS}
                      selectedValues={filters.model}
                      onChange={(values) => updateFilter('model', values)}
                      searchable
                      compact
                    />
                  )}

                  {/* Trim (only show if model is selected) */}
                  {filters.model.length > 0 && (
                    <MultiSelectFilter
                      label={t('filters.labels.trim')}
                      options={TRIM_OPTIONS}
                      selectedValues={filters.trim}
                      onChange={(values) => updateFilter('trim', values)}
                      compact
                    />
                  )}

                  {/* City */}
                  <MultiSelectFilter
                    label={t('filters.labels.city')}
                    options={UAE_CITIES}
                    selectedValues={filters.city}
                    onChange={(values) => updateFilter('city', values)}
                    compact
                  />

                  {/* Body Type */}
                  <MultiSelectFilter
                    label={t('filters.labels.bodyType')}
                    options={BODY_TYPES}
                    selectedValues={filters.bodyType}
                    onChange={(values) => updateFilter('bodyType', values)}
                    compact
                  />

                  {/* Transmission */}
                  <MultiSelectFilter
                    label={t('filters.labels.transmission')}
                    options={TRANSMISSION_TYPES}
                    selectedValues={filters.transmission}
                    onChange={(values) => updateFilter('transmission', values)}
                    compact
                  />

                  {/* Fuel Type */}
                  <MultiSelectFilter
                    label={t('filters.labels.fuelType')}
                    options={FUEL_TYPES}
                    selectedValues={filters.fuelType}
                    onChange={(values) => updateFilter('fuelType', values)}
                    compact
                  />

                  {/* Condition */}
                  <MultiSelectFilter
                    label={t('filters.labels.condition')}
                    options={CONDITION_OPTIONS}
                    selectedValues={filters.condition}
                    onChange={(values) => updateFilter('condition', values)}
                    compact
                  />

                  {/* Accident History */}
                  <MultiSelectFilter
                    label={t('filters.labels.accidentHistory')}
                    options={ACCIDENT_HISTORY_OPTIONS}
                    selectedValues={filters.accidentHistory}
                    onChange={(values) => updateFilter('accidentHistory', values)}
                    compact
                  />

                  {/* Warranty */}
                  <MultiSelectFilter
                    label={t('filters.labels.warranty')}
                    options={WARRANTY_OPTIONS}
                    selectedValues={filters.warranty}
                    onChange={(values) => updateFilter('warranty', values)}
                    compact
                  />

                  {/* Seller */}
                  <MultiSelectFilter
                    label={t('filters.labels.seller')}
                    options={SELLER_OPTIONS}
                    selectedValues={filters.seller}
                    onChange={(values) => updateFilter('seller', values)}
                    compact
                  />

                  {/* Owners Count */}
                  <MultiSelectFilter
                    label={t('filters.labels.ownersCount')}
                    options={OWNERS_COUNT_OPTIONS}
                    selectedValues={filters.ownersCount}
                    onChange={(values) => updateFilter('ownersCount', values)}
                    compact
                  />

                  {/* Tags */}
                  <MultiSelectFilter
                    label={t('filters.labels.tags')}
                    options={TAG_OPTIONS}
                    selectedValues={filters.tags}
                    onChange={(values) => updateFilter('tags', values)}
                    compact
                  />
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Mobile Apply/Clear Buttons */}
      {isMobile && (
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={isLoading}
            className="flex-1"
          >
            {t('filters.clearAll')}
          </Button>
          <Button
            onClick={() => {
              applyFilters();
              setIsOpen(false);
            }}
            disabled={isLoading}
            className="flex-1"
          >
            {t('filters.apply')}
          </Button>
        </div>
      )}

      {/* Desktop Clear All Button */}
      {!isMobile && (
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={isLoading || activeFilterCount === 0}
            className="w-full"
          >
            {t('filters.clearAllFilters')}
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {t('filters.title')}
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-luxury text-luxury-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{t('filters.title')}</span>
              {activeFilterCount > 0 && (
                <span className="text-sm bg-luxury text-luxury-foreground px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <FilterContent />
          </ScrollArea>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                {t('filters.cancel')}
              </Button>
              <Button
                onClick={() => {
                  applyFilters();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="flex-1"
              >
                {t('filters.apply')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className="w-60 bg-card border border-border rounded-lg p-2.5 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t('filters.title')}
        </h2>
        {activeFilterCount > 0 && (
          <span className="text-xs bg-luxury text-luxury-foreground px-2 py-1 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <FilterContent />
      </ScrollArea>
    </div>
  );
};

export default FilterPanel;
