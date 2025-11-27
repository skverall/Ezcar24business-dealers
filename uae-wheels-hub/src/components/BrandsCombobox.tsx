import { ALL_BRANDS } from '@/data/brands';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

interface BrandsComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const BrandsCombobox = ({ value, onChange, placeholder = 'Select or type make', className }: BrandsComboboxProps) => {
  // Convert brands to combobox options
  const options: ComboboxOption[] = ALL_BRANDS.map(brand => ({
    value: brand.value,
    label: brand.label
  }));

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search makes..."
      emptyText="No make found."
      className={className}
    />
  );
};

export default BrandsCombobox;
