import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMake, formatCity, formatSpec, formatTransmission, formatFuelType, formatBodyType, formatCondition, formatSellerType, capitalizeFirst } from '@/utils/formatters';

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemoveChip: (key: string, value: string) => void;
  onClearAll: () => void;
  isLoading?: boolean;
}

const FilterChips = ({ chips, onRemoveChip, onClearAll, isLoading }: FilterChipsProps) => {
  const { t } = useTranslation();
  if (chips.length === 0) return null;

  const handleRemoveChip = (key: string, value: string) => {
    try {
      onRemoveChip(key, value);
    } catch (error) {
      console.error('Error removing filter chip:', error);
      // Prevent the error from breaking the UI
    }
  };

  const formatLabel = (label: string) => {
    if (typeof label !== 'string') return String(label);
    return label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatValue = (key: string, value: string) => {
    if (typeof value !== 'string') return String(value);

    // Use specific formatters based on the filter key
    switch (key) {
      case 'make':
        return formatMake(value);
      case 'city':
        return formatCity(value);
      case 'spec':
        return formatSpec(value);
      case 'transmission':
        return formatTransmission(value);
      case 'fuelType':
        return formatFuelType(value);
      case 'bodyType':
        return formatBodyType(value);
      case 'condition':
        return formatCondition(value);
      case 'seller':
        return formatSellerType(value);
      default:
        // Fallback to generic capitalization
        return capitalizeFirst(value.replace(/_/g, ' '));
    }
  };

  return (
    <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">{t('filters.active')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t('filters.clearAll')}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <Badge
            key={`${chip.key}-${chip.value}-${index}`}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1 text-xs bg-luxury/10 text-luxury border border-luxury/20 hover:bg-luxury/20 transition-colors"
          >
            <span className="font-medium">{formatLabel(chip.label)}:</span>
            <span>{formatValue(chip.key, chip.value)}</span>
            <button
              type="button"
              onClick={() => handleRemoveChip(chip.key, chip.value)}
              disabled={isLoading}
              className="ml-1 hover:bg-luxury/30 rounded-full p-0.5 transition-colors"
              aria-label={`${t('filters.remove')} ${chip.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default FilterChips;
