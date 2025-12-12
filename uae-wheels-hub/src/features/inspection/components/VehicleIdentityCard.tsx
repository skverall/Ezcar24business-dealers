import React from 'react';
import { Car, FileText, Info, Calendar, Gauge, Check, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SpecField } from './SpecField';
import { AccidentHistory, CarInfo } from '../types/inspection.types';
import { useToast } from '@/hooks/use-toast';

interface VehicleIdentityCardProps {
  carInfo: CarInfo;
  onChange: (field: keyof CarInfo, value: string) => void;
  readOnly?: boolean;
}

export const VehicleIdentityCard: React.FC<VehicleIdentityCardProps> = ({
  carInfo,
  onChange,
  readOnly,
}) => {
  const { toast } = useToast();

  const accidentOptions: Array<{ value: AccidentHistory; label: string }> = [
    { value: 'clean', label: 'Clean / No accidents' },
    { value: 'minor', label: 'Minor accident' },
    { value: 'major', label: 'Major accident' },
    { value: 'not_reported', label: 'Not reported' },
  ];

  const accidentLabel =
    accidentOptions.find((o) => o.value === carInfo.accidentHistory)?.label || 'Not reported';

  const handleVinDecode = async () => {
    const vin = (carInfo.vin || '').trim();
    if (!vin || vin.length < 17) {
      toast({ title: 'Invalid VIN', description: 'Please enter a valid 17-character VIN.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Decoding VIN...', description: 'Fetching vehicle details...' });
    try {
      const isUseful = (val?: string | null) => {
        const v = (val || '').trim();
        if (!v) return false;
        const lower = v.toLowerCase();
        return !['0', 'not applicable', 'null', 'undefined'].includes(lower);
      };

      let make = '';
      let model = '';
      let year = '';

      // Prefer extended endpoint (more reliable for non‑US/European makes)
      const extendedResp = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${vin}?format=json`
      );
      const extendedData = await extendedResp.json();
      const ext = extendedData?.Results?.[0];
      if (ext) {
        if (isUseful(ext.Make)) make = ext.Make;
        if (isUseful(ext.Model)) model = ext.Model;
        if (isUseful(ext.ModelYear)) year = ext.ModelYear;
      }

      // Fallback to classic decodevin if any key field is missing
      if (!isUseful(make) || !isUseful(model) || !isUseful(year)) {
        const basicResp = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
        );
        const basicData = await basicResp.json();
        if (basicData?.Results) {
          const getVal = (id: number) =>
            basicData.Results.find((r: any) => r.VariableId === id)?.Value as string | undefined;
          if (!isUseful(make) && isUseful(getVal(26))) make = getVal(26) as string;
          if (!isUseful(model) && isUseful(getVal(28))) model = getVal(28) as string;
          if (!isUseful(year) && isUseful(getVal(29))) year = getVal(29) as string;
        }
      }

      if (isUseful(make) || isUseful(model) || isUseful(year)) {
        if (isUseful(make)) onChange('brand', make);
        if (isUseful(model)) onChange('model', model);
        if (isUseful(year)) onChange('year', year);
        toast({
          title: 'VIN Decoded',
          description: `Found: ${[year, make, model].filter(Boolean).join(' ')}`,
        });
      } else {
        toast({ title: 'No Data Found', description: 'Could not decode details.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch VIN details.', variant: 'destructive' });
    }
  };

  return (
    <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4 print-col-4">
      <div className="bg-card rounded-2xl p-6 border border-border/70 report-card flex flex-col h-full card-print-clean">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-luxury/5 rounded-lg border border-luxury/20 flex items-center justify-center text-luxury">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Vehicle Identity</h2>
            <p className="text-xs text-muted-foreground">Core details</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="relative">
            <SpecField
              label="VIN Number"
              value={carInfo.vin}
              onChange={(v) => onChange('vin', v)}
              icon={FileText}
              placeholder="17-Digit VIN"
              readOnly={readOnly}
              className={cn(carInfo.vin.length === 17 ? 'border-emerald-500/50 bg-emerald-500/5' : '')}
            />
            {carInfo.vin.length === 17 && (
              <div className="absolute right-3 top-3 text-emerald-500">
                <Check className="w-4 h-4" />
              </div>
            )}
            {!readOnly && (
              <button
                onClick={handleVinDecode}
                className="absolute right-2 bottom-2 p-1.5 bg-foreground/5 text-foreground rounded-md hover:bg-foreground/10 transition-colors"
                title="Auto-fill details from VIN"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SpecField label="Brand" value={carInfo.brand} onChange={(v) => onChange('brand', v)} icon={Car} placeholder="Toyota" readOnly={readOnly} />
            <SpecField label="Model" value={carInfo.model} onChange={(v) => onChange('model', v)} icon={Info} placeholder="Camry" readOnly={readOnly} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SpecField label="Year" value={carInfo.year} onChange={(v) => onChange('year', v)} icon={Calendar} placeholder="2024" readOnly={readOnly} />
            <SpecField label="Mileage" value={carInfo.mileage} onChange={(v) => onChange('mileage', v)} icon={Gauge} placeholder="0 km" readOnly={readOnly} />
          </div>

          <Separator className="my-2" />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SpecField label="Owners" value={carInfo.owners} onChange={(v) => onChange('owners', v)} icon={Info} placeholder="1" readOnly={readOnly} />
              <SpecField
                label="Mulkia Expiry"
                value={carInfo.mulkiaExpiry}
                onChange={(v) => onChange('mulkiaExpiry', v)}
                icon={Calendar}
                placeholder="YYYY-MM-DD"
                type="date"
                readOnly={readOnly}
              />
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accident History</h4>
            {readOnly ? (
              <div className="w-full p-3 rounded-lg border border-border/60 bg-background text-sm font-medium text-foreground">
                {accidentLabel}
              </div>
            ) : (
              <select
                value={carInfo.accidentHistory}
                onChange={(e) => onChange('accidentHistory', e.target.value as AccidentHistory)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all"
              >
                {accidentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-muted-foreground">
              Based on available records and inspection notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
