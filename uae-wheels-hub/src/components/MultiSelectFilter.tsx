import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FilterOption } from '@/types/filters';

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  compact?: boolean;
}

const MultiSelectFilter = ({
  label,
  options,
  selectedValues,
  onChange,
  searchable = false,
  collapsible = true,
  defaultOpen = true,
  compact = false,
}: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const selectedCount = selectedValues.length;

  const content = (
    <div className="space-y-2">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t('filters.search')} ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${compact ? 'h-7 text-xs' : 'h-8 text-sm'}`}
          />
        </div>
      )}
      
      <div className={`${compact ? 'space-y-1' : 'space-y-1.5'} max-h-40 overflow-y-auto`}>
        {filteredOptions.map((option) => (
          <div
            key={option.value}
            className={`flex items-center space-x-2 ${compact ? 'p-1' : 'p-1.5'} rounded-md hover:bg-muted/50 cursor-pointer transition-colors`}
            onClick={() => handleToggle(option.value)}
          >
            <Checkbox
              id={`${label}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="data-[state=checked]:bg-luxury data-[state=checked]:border-luxury"
            />
            <label
              htmlFor={`${label}-${option.value}`}
              className={`flex-1 ${compact ? 'text-xs' : 'text-sm'} leading-tight cursor-pointer flex items-center justify-between`}
            >
              <span>{option.label}</span>
              {option.count > 0 && (
                <span className={`${compact ? 'text-xs' : 'text-xs'} text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full`}>
                  {option.count}
                </span>
              )}
            </label>
          </div>
        ))}
        
        {filteredOptions.length === 0 && (
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground text-center py-3`}>
            {t('filters.noOptions')}
          </div>
        )}
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{label}</h3>
          {selectedCount > 0 && (
            <span className={`${compact ? 'text-xs' : 'text-xs'} bg-luxury text-luxury-foreground px-1.5 py-0.5 rounded-full`}>
              {selectedCount}
            </span>
          )}
        </div>
        {content}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-between p-0 h-auto font-medium ${compact ? 'text-xs' : 'text-sm'} hover:bg-transparent`}
        >
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {selectedCount > 0 && (
              <span className={`${compact ? 'text-xs' : 'text-xs'} bg-luxury text-luxury-foreground px-1.5 py-0.5 rounded-full`}>
                {selectedCount}
              </span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className={`${compact ? 'mt-1.5' : 'mt-2'}`}>
        {content}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MultiSelectFilter;
