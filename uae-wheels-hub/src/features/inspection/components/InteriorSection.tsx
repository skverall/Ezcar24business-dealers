import React from 'react';
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
      <div className="bg-card rounded-2xl p-6 border border-border/70 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)] card-print-clean">
        <InteriorChecklist data={interiorStatus} onChange={onInteriorChange} readOnly={readOnly} />
      </div>
    </div>
  );
};
