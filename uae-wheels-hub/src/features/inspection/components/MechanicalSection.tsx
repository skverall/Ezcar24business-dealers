import React, { useRef, useState } from 'react';
import { useEffect } from 'react';
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
  const scrollPositionRef = useRef(0);
  const bodyScrollLockedRef = useRef(false);

  useEffect(() => () => {
    // Safety cleanup in case component unmounts while modal is open
    if (bodyScrollLockedRef.current) {
      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
      bodyScrollLockedRef.current = false;
    }
  }, []);

  const lockBodyScroll = () => {
    if (bodyScrollLockedRef.current) return;
    scrollPositionRef.current = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollPositionRef.current}px`;
    body.style.width = '100%';
    bodyScrollLockedRef.current = true;
  };

  const unlockBodyScroll = () => {
    if (!bodyScrollLockedRef.current) return;
    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
      bodyScrollLockedRef.current = false;
    });
  };

  const openMechanicalModal = (category: string) => {
    if (readOnly) return;
    lockBodyScroll();
    setActiveCategory(category);
    setIsModalOpen(true);
  };

  const closeModalAndRestoreScroll = () => {
    setIsModalOpen(false);
    unlockBodyScroll();
  };

  const handleMechanicalSave = (key: string, category: MechanicalCategory) => {
    onMechanicalChange({
      ...mechanicalStatus,
      [key]: category,
    });
    closeModalAndRestoreScroll();
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
          onClose={closeModalAndRestoreScroll}
          categoryKey={activeCategory}
          data={mechanicalStatus[activeCategory]}
          onSave={handleMechanicalSave}
        />
      )}
    </>
  );
};
