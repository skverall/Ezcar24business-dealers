import { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RangeFilterProps {
  label: string;
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  presets?: { label: string; value: [number, number] }[];
  compact?: boolean;
}

const RangeFilter = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  presets = [],
  compact = false,
}: RangeFilterProps) => {
  const [minVal, maxVal] = value;

  const display = useMemo(() => {
    const f = (n: number) => (formatValue ? formatValue(n) : n.toString());
    return `${f(minVal)} - ${f(maxVal)}`;
  }, [minVal, maxVal, formatValue]);

  const handleSliderChange = (vals: number[]) => {
    if (!Array.isArray(vals) || vals.length < 2) return;
    const [first, second] = vals;
    if (first === undefined || second === undefined) return;
    const v: [number, number] = [Math.min(first, second), Math.max(first, second)];
    onChange(v);
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between">
        <h3 className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{label}</h3>
        <span className={`${compact ? 'text-xs' : 'text-xs'} text-muted-foreground`}>{display}</span>
      </div>

      <div className="px-1">
        <Slider
          value={[minVal, maxVal]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          className={compact ? 'h-6' : 'h-7'}
        />
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              className={`h-7 px-2 ${compact ? 'text-xs' : 'text-xs'}`}
              onClick={() => onChange(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      )}

      {!compact && <Separator className="my-1" />}
    </div>
  );
};

export default RangeFilter;
