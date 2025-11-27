import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Gauge, Fuel, MapPin, Cog, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatSpec, formatFuelType, formatCity, formatBodyType } from '@/utils/formatters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CarKeySpecsProps {
  year?: number;
  mileage?: number;
  fuelType?: string;
  spec?: string;
  city?: string;
  bodyType?: string;
  className?: string;
}

const CarKeySpecs: React.FC<CarKeySpecsProps> = ({
  year,
  mileage,
  fuelType,
  spec,
  city,
  bodyType,
  className
}) => {
  const { t } = useTranslation();
  const specs = [
    {
      icon: Calendar,
      label: year ? year.toString() : 'N/A',
      tooltip: t('carSpecs.year')
    },
    {
      icon: Gauge,
      label: mileage ? `${mileage.toLocaleString()} km` : 'N/A',
      tooltip: t('carSpecs.mileage')
    },
    {
      icon: Fuel,
      label: formatFuelType(fuelType),
      tooltip: t('carSpecs.fuel')
    },
    {
      icon: Cog,
      label: formatSpec(spec),
      tooltip: t('carSpecs.spec')
    },
    {
      icon: MapPin,
      label: formatCity(city),
      tooltip: t('carSpecs.location')
    },
    {
      icon: Car,
      label: formatBodyType(bodyType),
      tooltip: t('carSpecs.body')
    }
  ];

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-3 py-3 px-4 rounded-xl bg-muted/40 ${className}`}
    >
      {specs.map((spec, index) => {
        const Icon = spec.icon;
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-help min-w-0">
                  <Icon className="h-4 w-4 flex-shrink-0 text-luxury" />
                  <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                    {spec.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{spec.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default CarKeySpecs;
