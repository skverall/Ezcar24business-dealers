import { useEffect, useState } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { supabase } from '@/integrations/supabase/client';

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CitySelect = ({ value, onChange, placeholder = 'Select city', className }: CitySelectProps) => {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      const { data, error } = await supabase
        .from('cities' as any)
        .select('name, display_name')
        .order('sort_order');

      if (!error && data) {
        setOptions((data as any[]).map(city => ({
          value: city.name,
          label: city.display_name
        })));
      }
      setLoading(false);
    };

    loadCities();
  }, []);

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={loading ? 'Loading...' : placeholder}
      searchPlaceholder="Search cities..."
      emptyText="No city found."
      className={className}
    />
  );
};