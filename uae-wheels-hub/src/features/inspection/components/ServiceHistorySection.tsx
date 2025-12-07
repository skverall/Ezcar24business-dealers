import React from 'react';
import ServiceHistoryTimeline from '@/components/ServiceHistoryTimeline';
import { ServiceRecord } from '@/types/inspection';

interface ServiceHistorySectionProps {
  serviceHistory: ServiceRecord[];
  onServiceHistoryChange: (history: ServiceRecord[]) => void;
  readOnly?: boolean;
}

export const ServiceHistorySection: React.FC<ServiceHistorySectionProps> = ({
  serviceHistory,
  onServiceHistoryChange,
  readOnly,
}) => {
  return (
    <div className="md:col-span-12 print-col-12 space-y-4 print-break-inside-avoid mt-8">
      <ServiceHistoryTimeline
        records={serviceHistory}
        onChange={onServiceHistoryChange}
        readOnly={readOnly}
      />
    </div>
  );
};
