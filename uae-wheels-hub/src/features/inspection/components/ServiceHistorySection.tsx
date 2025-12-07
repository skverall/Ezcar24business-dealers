import React from 'react';
import ServiceHistoryTimeline from '@/components/ServiceHistoryTimeline';
import { ServiceRecord } from '@/types/inspection';

interface ServiceHistorySectionProps {
  serviceHistory: ServiceRecord[];
  onServiceHistoryChange: (history: ServiceRecord[]) => void;
  readOnly?: boolean;
}

// Temporary restoration data
const LEGACY_HISTORY_DATA: ServiceRecord[] = [
  { id: 'leg-1', date: "2022-12-15", type: "Service", mileage: "130,591", description: "11/130000KM SERVICE", center: "Al Tayer Motors" },
  { id: 'leg-2', date: "2022-06-14", type: "Service", mileage: "123,442", description: "26/Periodic Maint. Service", center: "Al Tayer Motors" },
  { id: 'leg-3', date: "2021-12-23", type: "Service", mileage: "112,345", description: "12/Periodic Maint. Service", center: "Al Tayer Motors" },
  { id: 'leg-4', date: "2021-10-31", type: "Service", mileage: "102,821", description: "12/CARRIED OUT 100K SERVICE", center: "Al Tayer Motors" },
  { id: 'leg-5', date: "2021-06-07", type: "Service", mileage: "86,063", description: "12/CARRIED OUT 80 K SERVICE", center: "Al Tayer Motors" },
  { id: 'leg-6', date: "2021-01-27", type: "Service", mileage: "68,419", description: "12/CARRIED OUT 70,000 KM", "center": "Al Tayer Motors" },
  { id: 'leg-7', date: "2020-09-01", type: "Service", mileage: "51,975", description: "12/CARRIED OUT 50000 KMS SER", center: "Al Tayer Motors" },
  { id: 'leg-8', date: "2020-05-19", type: "Service", mileage: "41,506", description: "12/CARRIED OUT 40000 KMS", center: "Al Tayer Motors" },
  { id: 'leg-9', date: "2020-02-02", type: "Service", mileage: "30,714", description: "12/CARRIED OUT 30K SERVICE E", center: "Al Tayer Motors" },
  { id: 'leg-10', date: "2019-11-24", type: "Service", mileage: "21,680", description: "12/CARRY OUT 20000 KM SERVIC", center: "Al Tayer Motors" },
  { id: 'leg-11', date: "2019-09-02", type: "Service", mileage: "11,112", description: "12/CARRY OUT 10000 KM SERVIC", center: "Al Tayer Motors" }
];

export const ServiceHistorySection: React.FC<ServiceHistorySectionProps> = ({
  serviceHistory,
  onServiceHistoryChange,
  readOnly,
}) => {
  return (
    <div className="md:col-span-12 print-col-12 space-y-4 print-break-inside-avoid mt-8">
      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={() => onServiceHistoryChange(LEGACY_HISTORY_DATA)}
            className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 transition-colors"
          >
            ⚠ Import Legacy Data
          </button>
        </div>
      )}
      <ServiceHistoryTimeline
        records={serviceHistory}
        onChange={onServiceHistoryChange}
        readOnly={readOnly}
      />
    </div>
  );
};
