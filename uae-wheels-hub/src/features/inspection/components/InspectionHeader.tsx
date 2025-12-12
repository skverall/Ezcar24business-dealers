import React from 'react';
import { format } from 'date-fns';
import EzcarLogo from '@/components/EzcarLogo';
import { HealthScoreGauge } from './HealthScoreGauge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Info, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface InspectionHeaderProps {
  reportDisplayId: string;
  inspectionDate: string;
  healthScore: number;
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({
  reportDisplayId,
  inspectionDate,
  healthScore,
}) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="bg-gradient-to-b from-[#0B0B0C] to-[#111316] text-white px-6 py-5 border-b border-white/10 print:p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <EzcarLogo className="h-8 w-auto text-white" />
            <div className="h-8 w-[1px] bg-white/20"></div>
            <span className="text-sm font-medium tracking-wider text-white/80">
              INSPECTION REPORT
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Condition Report</h1>
        </div>
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-full text-white/80 hover:text-white hover:bg-white/10 print:hidden"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs text-white/50 uppercase tracking-wider mb-1">
              <span>Health Score</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-white/40 hover:text-white/70 focus:outline-none print:hidden"
                    aria-label="How health score is calculated"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                  Score starts at 100 and is reduced by mechanical issues (up to 40 pts),
                  body repairs/paint (up to 30 pts), tire wear (up to 15 pts), and interior
                  wear/odor (up to 15 pts).
                </TooltipContent>
              </Tooltip>
            </div>
            <HealthScoreGauge score={healthScore} />
            <div className="mt-1 text-[10px] text-white/60">
              90–100 Excellent · 70–89 Good · 50–69 Fair · &lt;50 Poor
            </div>
          </div>
          <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
          <div className="text-right">
            <div className="text-xs text-white/60 mb-1">Report ID</div>
            <div className="text-xl font-mono font-bold text-luxury">
              {reportDisplayId || 'Generating...'}
            </div>
            <div className="text-xs text-white/60 mt-2">Inspection Date</div>
            <div className="font-medium">{format(new Date(inspectionDate), 'MMM dd, yyyy')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
