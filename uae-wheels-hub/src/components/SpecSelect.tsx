import { useEffect, useState } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { supabase } from '@/integrations/supabase/client';

interface SpecSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SpecSelect = ({ value, onChange, placeholder = 'Select spec', className }: SpecSelectProps) => {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpecs = async () => {
      const { data, error } = await supabase
        .from('car_specs' as any)
        .select('name, display_name')
        .order('sort_order');

      if (!error && data) {
        setOptions((data as any[]).map(spec => ({
          value: spec.name,
          label: spec.display_name
        })));
      }
      setLoading(false);
    };

    loadSpecs();
  }, []);

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={loading ? 'Loading...' : placeholder}
      searchPlaceholder="Search specs..."
      emptyText="No spec found."
      className={className}
    />
  );
};