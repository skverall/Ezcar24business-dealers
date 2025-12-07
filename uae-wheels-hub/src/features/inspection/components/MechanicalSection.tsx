import React, { useState } from 'react';
import { Wrench, Cog, Disc } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import MechanicalChecklistModal, {
  MechanicalStatus,
  MechanicalCategory,
  DEFAULT_CHECKLISTS,
} from '@/components/MechanicalChecklistModal';

interface MechanicalSectionProps {
  mechanicalStatus: MechanicalStatus;
  onMechanicalChange: (status: MechanicalStatus) => void;
  readOnly?: boolean;
}

export const MechanicalSection: React.FC<MechanicalSectionProps> = ({
  mechanicalStatus,
  onMechanicalChange,
  readOnly,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openMechanicalModal = (category: string) => {
    if (readOnly) return;
    setActiveCategory(category);
    setIsModalOpen(true);
  };

  const handleMechanicalSave = (key: string, category: MechanicalCategory) => {
    onMechanicalChange({
      ...mechanicalStatus,
      [key]: category,
    });
    setIsModalOpen(false);
  };

  const getIconForCategory = (key: string) => {
    switch (key) {
      case 'engine':
        return Wrench;
      case 'transmission':
        return Cog;
      case 'suspension':
      case 'brakes':
      case 'ac':
      default:
        return Disc;
    }
  };

  return (
    <>
      <div className="bg-card/50 backdrop-blur-md rounded-3xl p-5 border border-border/50 flex-1">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Wrench className="w-4 h-4 text-luxury" />
          Mechanical Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 print-mechanical-grid">
          {Object.entries(DEFAULT_CHECKLISTS).map(([key, def]) => {
            const categoryData = mechanicalStatus[key];
            const status = categoryData?.status;
            const issueCount =
              categoryData?.items?.filter((i) => i.condition !== 'ok' && i.condition !== 'na')
                .length || 0;

            return (
              <div key={key} className="print-mechanical-item">
                <StatusIndicator
                  label={def.label}
                  icon={getIconForCategory(key)}
                  status={status}
                  issueCount={issueCount}
                  onClick={() => openMechanicalModal(key)}
                  readOnly={readOnly}
                />
              </div>
            );
          })}
        </div>
      </div>

      {activeCategory && (
        <MechanicalChecklistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categoryKey={activeCategory}
          data={mechanicalStatus[activeCategory]}
          onSave={handleMechanicalSave}
        />
      )}
    </>
  );
};
