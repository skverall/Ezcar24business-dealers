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
      <div className="bg-card rounded-3xl p-6 shadow-luxury hover:shadow-xl transition-all duration-500 ease-out border border-border/40 flex flex-col h-full hoverable-card group">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
            <Car className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-bold text-xl tracking-tight text-foreground">Vehicle Identity</h2>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mt-0.5">Core Specs</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {/* VIN Section */}
          <div className="relative p-1 bg-surface-subtle/30 rounded-2xl">
            <SpecField
              label="VIN Number"
              value={carInfo.vin}
              onChange={(v) => onChange('vin', v)}
              icon={FileText}
              placeholder="17-Digit VIN"
              readOnly={readOnly}
              className={cn(
                "bg-transparent border-none shadow-none focus-within:ring-0 px-2",
                carInfo.vin.length === 17 ? 'text-emerald-600 font-medium' : ''
              )}
            />
            {carInfo.vin.length === 17 && (
              <div className="absolute right-4 top-4 text-emerald-500 bg-white dark:bg-black rounded-full p-0.5 shadow-sm">
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
            )}
            {!readOnly && (
              <button
                onClick={handleVinDecode}
                className="absolute right-2 bottom-2 p-2 bg-white dark:bg-black text-primary shadow-sm rounded-xl hover:bg-primary hover:text-white transition-all duration-300"
                title="Auto-fill details from VIN"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SpecField label="Brand" value={carInfo.brand} onChange={(v) => onChange('brand', v)} icon={Car} placeholder="Toyota" readOnly={readOnly} />
            <SpecField label="Model" value={carInfo.model} onChange={(v) => onChange('model', v)} icon={Info} placeholder="Camry" readOnly={readOnly} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SpecField label="Year" value={carInfo.year} onChange={(v) => onChange('year', v)} icon={Calendar} placeholder="2024" readOnly={readOnly} />
            <SpecField label="Mileage" value={carInfo.mileage} onChange={(v) => onChange('mileage', v)} icon={Gauge} placeholder="0 km" readOnly={readOnly} />
          </div>

          <Separator className="bg-border/40" />

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Registration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Separator className="bg-border/40" />

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Accident History</h4>
            {readOnly ? (
              <div className={cn(
                "w-full p-4 rounded-xl border border-border/40 text-sm font-medium flex items-center gap-2",
                accidentLabel.includes("Clean") ? "bg-emerald-50/50 text-emerald-700 border-emerald-100" : "bg-card"
              )}>
                {accidentLabel.includes("Clean") && <Check className="w-4 h-4" />}
                {accidentLabel}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={carInfo.accidentHistory}
                  onChange={(e) => onChange('accidentHistory', e.target.value as AccidentHistory)}
                  className="w-full h-11 px-4 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none shadow-sm"
                >
                  {accidentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <Info className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
