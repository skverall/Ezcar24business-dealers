import React from 'react';
import { format } from 'date-fns';
import EzcarLogo from '@/components/EzcarLogo';
import { HealthScoreGauge } from './HealthScoreGauge';

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
  return (
    <div className="bg-[#0f172a] text-white p-6 print:p-4">
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
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-white/50 uppercase tracking-wider mb-1">
              Health Score
            </span>
            <HealthScoreGauge score={healthScore} />
          </div>
          <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
          <div className="text-right">
            <div className="text-xs text-white/60 mb-1">Report ID</div>
            <div className="text-xl font-mono font-bold text-luxury-400">
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
