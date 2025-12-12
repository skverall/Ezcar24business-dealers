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
  carDetails?: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
  };
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({
  reportDisplayId,
  inspectionDate,
  healthScore,
  carDetails,
}) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const hasCarTitle = carDetails?.make || carDetails?.model;
  const title = hasCarTitle
    ? `${carDetails?.year || ''} ${carDetails?.make || ''} ${carDetails?.model || ''}`.trim()
    : 'Vehicle Condition';
  const subtitle = hasCarTitle ? `${carDetails?.trim || ''} Inspection Report`.trim() : 'Inspection Completed';

  return (
    <div className="relative overflow-hidden bg-gradient-hero border-b border-border/40 print:p-6 print:border-none transition-colors duration-500">
      {/* Ambient Background Mesh */}
      <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none dark:bg-blue-900/10" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[80px] pointer-events-none dark:bg-amber-900/10" />

      {/* Ultra-Reduced padding on mobile */}
      <div className="relative px-4 py-3 md:px-6 md:py-10 container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-6">

        {/* Left: Brand & Title */}
        <div className="flex flex-col gap-1 md:gap-4 z-10 w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-start">
            <div className="flex items-center gap-3 opacity-90 transition-opacity hover:opacity-100">
              <EzcarLogo className="h-5 md:h-8 w-auto text-foreground" />
              <div className="h-4 md:h-6 w-[1px] bg-foreground/10" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                Official Report
              </span>
            </div>
            {/* Mobile Theme Toggle (Top Right) */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="rounded-full h-8 w-8 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="mt-2 md:mt-0 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {title}
                </h1>

                {/* Mobile Inline Health Score Badge */}
                <div className="md:hidden flex items-center gap-1.5 bg-white/60 dark:bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10 shadow-sm">
                  <div className={
                    `text-sm font-black ${healthScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                      healthScore >= 70 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                    }`
                  }>
                    {healthScore}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Score</div>
                </div>
              </div>

              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 font-medium flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Scores & Meta */}
        <div className="flex flex-row flex-wrap items-center justify-between w-full md:w-auto gap-4 md:gap-8 z-10 mt-1 md:mt-0 md:border-t-0 md:pt-0">

          {/* Health Score Hero - Desktop Only now */}
          <div className="hidden md:flex items-center gap-3 md:gap-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm p-2.5 md:p-3 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm flex-1 md:flex-none justify-center md:justify-start">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                Health Score
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="hover:text-foreground transition-colors">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    Score calculated based on mechanical, body, tire, and interior condition.
                    100 is perfect.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground/50 font-medium">
                0-100 Scale
              </div>
            </div>
            <div className="relative group">
              <HealthScoreGauge score={healthScore} />
              <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(217,119,6,0.2)] dark:shadow-[0_0_30px_rgba(217,119,6,0.1)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          </div>

          <div className="w-px h-12 bg-border hidden md:block" />

          {/* Meta Data - Compact on Mobile */}
          <div className="flex flex-row md:flex-col gap-4 md:gap-1 w-full md:w-auto justify-between md:justify-start border-t border-border/40 pt-2 md:border-t-0 md:pt-0 mt-2 md:mt-0">
            <div className="flex md:block items-baseline gap-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-0 md:mb-0.5">
                Report ID
              </div>
              <div className="font-mono text-sm md:text-lg font-bold text-luxury tracking-tight truncate">
                {reportDisplayId || '...'}
              </div>
            </div>
            <div className="flex md:block items-baseline gap-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-0 md:mb-0.5 text-right md:text-left">
                Evaluated On
              </div>
              <div className="text-sm font-semibold text-foreground/90 text-right md:text-left">
                {format(new Date(inspectionDate), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          {/* Theme Toggle - Desktop Only */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground w-8 h-8"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};
