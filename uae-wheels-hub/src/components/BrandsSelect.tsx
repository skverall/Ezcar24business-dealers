import { BRAND_GROUPS, Brand } from '@/data/brands';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BrandsSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const BrandsSelect = ({ value, onChange, placeholder = 'Select make', className }: BrandsSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`select-trigger ${className ?? ''}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {BRAND_GROUPS.map((group) => (
          <SelectGroup key={group.region}>
            <SelectLabel>{group.region}</SelectLabel>
            {group.brands.map((brand: Brand) => (
              <SelectItem key={brand.value} value={brand.value}>
                {brand.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BrandsSelect;

