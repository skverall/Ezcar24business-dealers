import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Check, AlertTriangle, X, Info } from 'lucide-react';
import { OverallCondition } from '../types/inspection.types';

interface OverallConditionCardProps {
  condition: OverallCondition;
  onChange: (condition: OverallCondition) => void;
  readOnly?: boolean;
}

export const OverallConditionCard: React.FC<OverallConditionCardProps> = ({
  condition,
  onChange,
  readOnly,
}) => {
  const options: OverallCondition[] = ['excellent', 'good', 'fair', 'poor'];

  return (
    <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm card-print-clean">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          Overall Condition
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground focus:outline-none print:hidden"
                aria-label="Overall condition criteria"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
              Excellent: no meaningful issues. Good: minor wear or cosmetic repairs. Fair:
              several noticeable issues but drivable. Poor: major issues or needs immediate
              repair.
            </TooltipContent>
          </Tooltip>
        </h3>
        <Badge variant={condition === 'excellent' ? 'default' : 'outline'} className="capitalize text-xs">
          {condition}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Excellent = like new · Good = minor wear · Fair = noticeable issues · Poor = major issues
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={readOnly}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all border',
              condition === option
                ? 'bg-luxury text-white border-luxury shadow-md scale-[1.02]'
                : 'bg-background hover:bg-accent border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {option === 'excellent' && <Sparkles className="w-4 h-4" />}
            {option === 'good' && <Check className="w-4 h-4" />}
            {option === 'fair' && <AlertTriangle className="w-4 h-4" />}
            {option === 'poor' && <X className="w-4 h-4" />}
            <span className="capitalize">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
