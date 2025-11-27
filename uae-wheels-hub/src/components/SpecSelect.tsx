import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Spec {
  name: string;
  display_name: string;
}

interface SpecSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SpecSelect = ({ value, onChange, placeholder = 'Select spec', className }: SpecSelectProps) => {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpecs = async () => {
      const { data, error } = await supabase
        .from('car_specs')
        .select('name, display_name')
        .order('sort_order');
      
      if (!error && data) {
        setSpecs(data);
      }
      setLoading(false);
    };
    
    loadSpecs();
  }, []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`select-trigger ${className ?? ''}`}>
        <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {specs.map((spec) => (
          <SelectItem key={spec.name} value={spec.name}>
            {spec.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};