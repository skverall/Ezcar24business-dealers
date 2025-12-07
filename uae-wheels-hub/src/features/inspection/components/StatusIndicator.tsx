import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatusIndicatorProps {
  label: string;
  status: 'ok' | 'issue' | 'critical' | 'na' | undefined;
  issueCount?: number;
  onClick: () => void;
  icon: LucideIcon;
  readOnly?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  status,
  issueCount = 0,
  onClick,
  icon: Icon,
  readOnly,
}) => {
  let colorClass = 'bg-card hover:bg-accent/50 border-border/40';
  let iconColorClass = 'bg-gray-100 text-gray-500';
  let statusText = 'Not Checked';

  if (status === 'ok') {
    colorClass = 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20';
    iconColorClass = 'bg-emerald-500/10 text-emerald-600';
    statusText = 'Passed';
  }
  if (status === 'issue') {
    colorClass = 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20';
    iconColorClass = 'bg-amber-500/10 text-amber-600';
    statusText = `${issueCount} Issue${issueCount !== 1 ? 's' : ''}`;
  }
  if (status === 'critical') {
    colorClass = 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20';
    iconColorClass = 'bg-red-500/10 text-red-600';
    statusText = `${issueCount} Critical`;
  }
  if (status === 'na') {
    colorClass = 'bg-muted/30 border-border/20 opacity-70';
    statusText = 'N/A';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 w-full group text-left print-show print-break-inside-avoid',
        colorClass,
        !readOnly && 'hover:scale-[1.02] active:scale-[0.98]',
        readOnly && 'cursor-default'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0',
          iconColorClass
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{label}</div>
        <div
          className={cn(
            'text-xs font-medium truncate',
            status === 'ok'
              ? 'text-emerald-600'
              : status === 'issue'
                ? 'text-amber-600'
                : status === 'critical'
                  ? 'text-red-600'
                  : 'text-muted-foreground'
          )}
        >
          {statusText}
        </div>
      </div>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
        {/* Arrow or indicator could go here */}
      </div>
    </button>
  );
};
