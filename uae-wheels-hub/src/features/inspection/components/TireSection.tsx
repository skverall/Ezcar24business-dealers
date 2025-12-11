import React, { useState, useRef } from 'react';
import { Disc, CheckCircle2, Trash2, Gauge, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TiresStatus } from '@/types/inspection';
import TireDetailsModal from '@/components/TireDetailsModal';
import { getTireColor } from '../types/inspection.types';
import type { TireDetails } from '../types/inspection.types';
import { DEFAULT_TIRE_DETAILS } from '@/types/inspection';

interface TireSectionProps {
  tiresStatus: TiresStatus;
  onTiresChange: (tires: TiresStatus) => void;
  readOnly?: boolean;
}

export const TireSection: React.FC<TireSectionProps> = ({
  tiresStatus,
  onTiresChange,
  readOnly,
}) => {
  const [activeTire, setActiveTire] = useState<keyof TiresStatus | null>(null);
  const [isTireModalOpen, setIsTireModalOpen] = useState(false);
  const [tempTireData, setTempTireData] = useState<TireDetails>(DEFAULT_TIRE_DETAILS);
  const scrollPositionRef = useRef(0);

  const getScrollElement = () =>
    (document.scrollingElement || document.documentElement) as HTMLElement;

  const handleTireClick = (tireKey: keyof TiresStatus) => {
    if (readOnly) return;
    scrollPositionRef.current = getScrollElement().scrollTop;
    setActiveTire(tireKey);
    setTempTireData(tiresStatus[tireKey] || DEFAULT_TIRE_DETAILS);
    setIsTireModalOpen(true);
  };

  const closeModalAndRestoreScroll = () => {
    setIsTireModalOpen(false);
    requestAnimationFrame(() => {
      const scrollEl = getScrollElement();
      scrollEl.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
    });
  };

  const handleTireSave = (data: TireDetails) => {
    if (!activeTire) return;
    onTiresChange({
      ...tiresStatus,
      [activeTire]: data,
    });
    closeModalAndRestoreScroll();
  };

  const handleSetAllGood = () => {
    const allGood: TiresStatus = {
      frontLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
      frontRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
      rearLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
      rearRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
      spare: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '', present: true },
    };
    onTiresChange(allGood);
  };

  const handleClearAllTires = () => {
    onTiresChange({
      frontLeft: DEFAULT_TIRE_DETAILS,
      frontRight: DEFAULT_TIRE_DETAILS,
      rearLeft: DEFAULT_TIRE_DETAILS,
      rearRight: DEFAULT_TIRE_DETAILS,
      spare: { ...DEFAULT_TIRE_DETAILS, present: true },
    });
  };

  const handleSpareToggle = () => {
    onTiresChange({
      ...tiresStatus,
      spare: { ...tiresStatus.spare, present: !tiresStatus.spare?.present },
    });
  };

  return (
    <>
      <div className="md:col-span-12 lg:col-span-6 print-col-12 print-break-inside-avoid">
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm h-full flex flex-col card-print-clean">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-luxury/10 rounded-xl text-luxury">
                <Disc className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Tires & Wheels</h3>
                <p className="text-xs text-muted-foreground">Condition & Manufacturing Date</p>
              </div>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSetAllGood}
                      className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Set All to Good</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleClearAllTires}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear All</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {(Object.entries(tiresStatus) as [keyof TiresStatus, TireDetails][])
              .filter(([key]) => key !== 'spare')
              .map(([key, _]) => {
                const details = tiresStatus[key];
                if (!details) return null;

                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase());
                const color = getTireColor(details.condition);

                return (
                  <div
                    key={key}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTireClick(key);
                    }}
                    className={cn(
                      'group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.98]',
                      activeTire === key
                        ? 'bg-accent border-luxury/50 ring-1 ring-luxury/20'
                        : 'bg-card hover:bg-accent/50 border-border/40'
                    )}
                  >
                    <div
                      className="w-1.5 self-stretch rounded-full shrink-0 my-1"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {label}
                        </div>
                        {details.condition !== 'good' && (
                          <Badge variant="outline" className="text-[10px] h-5 px-2 bg-background capitalize items-center justify-center border-luxury/30 text-luxury/80">
                            {details.condition}
                          </Badge>
                        )}
                      </div>

                      {/* Manufacturing Date (DOT) - Prominent */}
                      <div className="font-semibold text-sm">
                        {details.dot ? (
                          <span className="text-foreground font-mono">{details.dot}</span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">No Date</span>
                        )}
                      </div>

                      {/* Brand and other details - Secondary */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {details.brand ? (
                          <span>{details.brand}</span>
                        ) : (
                          <span className="opacity-50">No Brand</span>
                        )}
                        {details.size && <span className="font-mono">{details.size}</span>}
                        {details.treadDepth && (
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            <span>{details.treadDepth}mm</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1.5 rounded-full bg-background border shadow-sm">
                        <Sparkles className="w-3 h-3 text-luxury" />
                      </div>
                    </div>
                  </div>
                );
              })}
            {/* Spare Tire Checkbox */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                  <Disc className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Spare Tire Present</span>
              </div>
              {readOnly ? (
                <div className="flex items-center gap-2">
                  {tiresStatus.spare?.present !== false ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {tiresStatus.spare?.present !== false ? 'Yes' : 'No'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleSpareToggle}>
                  <div
                    className={cn(
                      'w-6 h-6 rounded border flex items-center justify-center transition-colors',
                      tiresStatus.spare?.present !== false
                        ? 'bg-luxury border-luxury text-white'
                        : 'border-input bg-background'
                    )}
                  >
                    {tiresStatus.spare?.present !== false && <Check className="w-4 h-4" />}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-4 text-sm justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" /> Good
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500" /> Fair
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500" /> Poor
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500" /> Replace
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTire && (
        <TireDetailsModal
          isOpen={isTireModalOpen}
          onClose={closeModalAndRestoreScroll}
          tireData={tempTireData}
          onDataChange={setTempTireData}
          onSave={() => handleTireSave(tempTireData)}
          onApplyToAll={() => {
            const newData = { ...tiresStatus };
            (['frontLeft', 'frontRight', 'rearLeft', 'rearRight', 'spare'] as const).forEach((key) => {
              newData[key] = { ...newData[key], ...tempTireData, present: newData[key]?.present ?? true };
            });
            onTiresChange(newData);
            closeModalAndRestoreScroll();
          }}
          readOnly={readOnly}
        />
      )}
    </>
  );
};
