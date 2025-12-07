import React from 'react';
import { Armchair } from 'lucide-react';
import InteriorChecklist, { InteriorStatus } from '@/components/InteriorChecklist';

interface InteriorSectionProps {
  interiorStatus: InteriorStatus;
  onInteriorChange: (status: InteriorStatus) => void;
  readOnly?: boolean;
}

export const InteriorSection: React.FC<InteriorSectionProps> = ({
  interiorStatus,
  onInteriorChange,
  readOnly,
}) => {
  return (
    <div className="md:col-span-12 lg:col-span-6 print-col-6 print-break-inside-avoid">
      <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm card-print-clean">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Armchair className="w-5 h-5 text-luxury" />
          Interior Condition
        </h3>
        <InteriorChecklist data={interiorStatus} onChange={onInteriorChange} readOnly={readOnly} />
      </div>
    </div>
  );
};
