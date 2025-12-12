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
    <div className="relative overflow-hidden bg-gradient-hero border-b border-border/40 print:p-6 print:border-none transition-colors duration-500">
      {/* Ambient Background Mesh - Adds life without being 'dark' */}
      <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none dark:bg-blue-900/10" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[80px] pointer-events-none dark:bg-amber-900/10" />

      <div className="relative px-6 py-8 md:py-10 container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

        {/* Left: Brand & Title */}
        <div className="flex flex-col gap-4 z-10">
          <div className="flex items-center gap-3 opacity-90 transition-opacity hover:opacity-100">
            <EzcarLogo className="h-8 w-auto text-foreground" />
            <div className="h-6 w-[1px] bg-foreground/10" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
              Official Report
            </span>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Vehicle Condition
            </h1>
            <p className="text-muted-foreground mt-1 font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Inspection Completed
            </p>
          </div>
        </div>

        {/* Right: Scores & Meta */}
        <div className="flex flex-wrap items-center gap-6 md:gap-8 z-10">

          {/* Health Score Hero */}
          <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm p-3 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm">
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

          {/* Meta Data */}
          <div className="flex flex-col gap-1 min-w-[100px]">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-0.5">
                Report ID
              </div>
              <div className="font-mono text-lg font-bold text-luxury tracking-tight truncate">
                {reportDisplayId || '...'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-0.5">
                Evaluated On
              </div>
              <div className="text-sm font-semibold text-foreground/90">
                {format(new Date(inspectionDate), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          {/* Theme Toggle - Subtle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground print:hidden w-8 h-8"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

        </div>
      </div>
    </div>
  );
};
