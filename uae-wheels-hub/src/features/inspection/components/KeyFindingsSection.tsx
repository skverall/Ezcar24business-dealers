import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FindingLevel = 'critical' | 'issue' | 'info';

export type KeyFinding = {
  level: FindingLevel;
  text: string;
};

interface KeyFindingsSectionProps {
  findings: KeyFinding[];
}

const levelToBadge = (level: FindingLevel) => {
  switch (level) {
    case 'critical':
      return 'border-red-500 text-red-600 bg-red-500/10';
    case 'issue':
      return 'border-amber-500 text-amber-600 bg-amber-500/10';
    default:
      return 'border-emerald-500 text-emerald-600 bg-emerald-500/10';
  }
};

const levelToLabel: Record<FindingLevel, string> = {
  critical: 'Critical',
  issue: 'Issue',
  info: 'Note',
};

export const KeyFindingsSection: React.FC<KeyFindingsSectionProps> = ({ findings }) => {
  const hasFindings = findings.length > 0;

  return (
    <div className="md:col-span-12 print-col-12 print-break-inside-avoid">
      <div className="bg-card rounded-2xl p-6 border border-border/70 report-card card-print-clean">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-luxury" />
          Key Findings
        </h3>

        {!hasFindings ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div className="text-sm font-medium text-emerald-700">
              No significant issues detected during inspection.
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {findings.map((finding, idx) => (
              <li
                key={`${finding.level}-${idx}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/80 border border-border/60"
              >
                <Badge
                  variant="outline"
                  className={cn('text-[10px] h-5 px-2 shrink-0', levelToBadge(finding.level))}
                >
                  {levelToLabel[finding.level]}
                </Badge>
                <div className="text-sm leading-snug text-foreground flex-1">{finding.text}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Info className="w-3.5 h-3.5" />
          Findings are automatically derived from the inspection checklist.
        </div>
      </div>
    </div>
  );
};
