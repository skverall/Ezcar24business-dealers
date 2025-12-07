import { MechanicalStatus } from '@/components/MechanicalChecklistModal';
import { InteriorStatus } from '@/components/InteriorChecklist';
import { TiresStatus } from '@/types/inspection';
import { BodyStatus } from '../types/inspection.types';

export const calculateHealthScore = (
  mechanical: MechanicalStatus,
  bodyParts: Record<string, BodyStatus>,
  tires: TiresStatus,
  interior: InteriorStatus
): number => {
  let score = 100;

  // 1. Mechanical (Max deduction 40)
  let mechDeduction = 0;
  Object.values(mechanical).forEach((cat) => {
    if (cat.status === 'issue') mechDeduction += 5;
    if (cat.status === 'critical') mechDeduction += 15;
  });
  score -= Math.min(mechDeduction, 40);

  // 2. Body (Max deduction 30)
  let bodyDeduction = 0;
  Object.values(bodyParts).forEach((status) => {
    if (status === 'painted') bodyDeduction += 2;
    if (status === 'replaced') bodyDeduction += 4;
    if (status === 'putty') bodyDeduction += 5;
  });
  score -= Math.min(bodyDeduction, 30);

  // 3. Tires (Max deduction 15)
  let tireDeduction = 0;
  // Check main 4 tires
  const tireKeys: (keyof TiresStatus)[] = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
  tireKeys.forEach((key) => {
    const tire = tires[key];
    // @ts-ignore - covering base properties
    if (tire.condition === 'fair') tireDeduction += 1;
    // @ts-ignore
    if (tire.condition === 'poor') tireDeduction += 2;
    // @ts-ignore
    if (tire.condition === 'replace') tireDeduction += 4;
  });
  score -= Math.min(tireDeduction, 15);

  // 4. Interior (Max deduction 15)
  let interiorDeduction = 0;
  const interiorKeys = [
    'seats',
    'dashboard',
    'headliner',
    'carpets',
    'doorPanels',
    'controls',
  ] as const;
  interiorKeys.forEach((key) => {
    const condition = interior[key];
    if (condition === 'fair') interiorDeduction += 2;
    if (condition === 'worn') interiorDeduction += 3;
    if (condition === 'stained') interiorDeduction += 3;
    if (condition === 'torn') interiorDeduction += 5;
    if (condition === 'poor') interiorDeduction += 5;
  });
  if (['smoke', 'mold', 'other'].includes(interior.odor)) interiorDeduction += 5;
  score -= Math.min(interiorDeduction, 15);

  return Math.max(0, Math.round(score));
};
