import React from 'react';
import { Car, FileText, Info, Calendar, Gauge, Check, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SpecField } from './SpecField';
import { CarInfo } from '../types/inspection.types';
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

  const handleVinDecode = async () => {
    if (!carInfo.vin || carInfo.vin.length < 17) {
      toast({ title: 'Invalid VIN', description: 'Please enter a valid 17-character VIN.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Decoding VIN...', description: 'Fetching vehicle details...' });
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${carInfo.vin}?format=json`);
      const data = await response.json();
      if (data.Results) {
        const getVal = (id: number) => data.Results.find((r: any) => r.VariableId === id)?.Value;
        const make = getVal(26);
        const model = getVal(28);
        const year = getVal(29);
        if (make || model || year) {
          if (make) onChange('brand', make);
          if (model) onChange('model', model);
          if (year) onChange('year', year);
          toast({ title: 'VIN Decoded', description: `Found: ${year} ${make} ${model}` });
        } else {
          toast({ title: 'No Data Found', description: 'Could not decode details.', variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch VIN details.', variant: 'destructive' });
    }
  };

  return (
    <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 space-y-4 print-col-4">
      <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm flex flex-col h-full card-print-clean">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-luxury/10 rounded-xl flex items-center justify-center text-luxury">
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
                className="absolute right-2 bottom-2 p-1.5 bg-luxury/10 text-luxury rounded-lg hover:bg-luxury/20 transition-colors"
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
        </div>
      </div>
    </div>
  );
};
