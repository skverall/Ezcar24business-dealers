import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface City {
  name: string;
  display_name: string;
}

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CitySelect = ({ value, onChange, placeholder = 'Select city', className }: CitySelectProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('name, display_name')
        .order('sort_order');
      
      if (!error && data) {
        setCities(data);
      }
      setLoading(false);
    };
    
    loadCities();
  }, []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`select-trigger ${className ?? ''}`}>
        <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city.name} value={city.name}>
            {city.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};