import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BodyStatus } from '../types/inspection.types';

interface SummarySectionProps {
  summary: string;
  onSummaryChange: (text: string) => void;
  bodyParts: Record<string, BodyStatus>;
  onAutoFill: () => void;
  readOnly?: boolean;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  summary,
  onSummaryChange,
  bodyParts,
  onAutoFill,
  readOnly,
}) => {
  return (
    <div className="md:col-span-12 print-col-12 print-break-inside-avoid">
      <div className="bg-card rounded-2xl p-6 border border-border/70 report-card card-print-clean">
        <h3 className="font-semibold mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-luxury" />
            Report Summary
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={onAutoFill}
              className="text-[11px] flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background px-3 py-1.5 rounded-md transition-colors font-semibold tracking-wide"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fill Template
            </button>
          )}
        </h3>

        <div className="space-y-6">
          {/* Painted Parts List */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2">
              PAINTED PARTS / BODY ANALYSIS
            </h4>
            {Object.values(bodyParts).every((s) => s === 'original') ? (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                <span className="text-sm font-medium text-emerald-600">Clean Title</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(bodyParts)
                  .filter(([_, status]) => status !== 'original')
                  .map(([part, status]) => {
                    let badgeColorClass = '';
                    if (status === 'painted')
                      badgeColorClass = 'border-red-500 text-red-500 bg-red-500/10';
                    else if (status === 'replaced')
                      badgeColorClass = 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
                    else if (status === 'putty')
                      badgeColorClass = 'border-orange-500 text-orange-500 bg-orange-500/10';

                    return (
                      <Badge
                        key={part}
                        variant="outline"
                        className={cn('capitalize text-[10px] px-2 py-0.5', badgeColorClass)}
                      >
                        {part.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Unified Notes Input */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2">INSPECTOR NOTES</h4>
            {readOnly ? (
              <div className="w-full min-h-[150px] p-4 rounded-xl border border-border bg-card text-base font-medium text-foreground leading-relaxed whitespace-pre-wrap shadow-sm">
                {summary || (
                  <span className="text-muted-foreground italic font-normal">No notes added.</span>
                )}
              </div>
            ) : (
              <textarea
                value={summary || ''}
                onChange={(e) => onSummaryChange(e.target.value)}
                placeholder="Enter detailed summary notes here..."
                className="w-full min-h-[150px] p-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 resize-y text-sm leading-relaxed"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
