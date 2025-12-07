import { TireDetails as TireDetailsType, TiresStatus } from '@/types/inspection';
import { ReportBodyPartInput, ReportStatus } from '@/services/reportsService';

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export type CarInspectionReportProps = {
  reportId?: string;
  readOnly?: boolean;
  initialData?: any;
};

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface TireDetails extends TireDetailsType {
  present?: boolean;
}

export type BodyStatus = 'original' | 'painted' | 'replaced' | 'putty' | 'ppf';

export type OverallCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'salvage';

export interface BodyPartKey {
  key: string;
  label: string;
}

export interface CarInfo {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
  location: string;
  date: string;
  owners: string;
  mulkiaExpiry: string;
  regionalSpecs: string;
  bodyType: string;
  fuelType: string;
  engineSize: string;
  horsepower: string;
  color: string;
  cylinders: string;
  transmission: string;
  keys: string;
  options: string;
}

export interface LinkedListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BODY_PART_KEYS: BodyPartKey[] = [
  { key: 'hood', label: 'Hood' },
  { key: 'roof', label: 'Roof' },
  { key: 'trunk', label: 'Trunk' },
  { key: 'frontBumper', label: 'Front bumper' },
  { key: 'rearBumper', label: 'Rear bumper' },
  { key: 'frontLeftFender', label: 'Front left fender' },
  { key: 'frontRightFender', label: 'Front right fender' },
  { key: 'rearLeftFender', label: 'Rear left fender' },
  { key: 'rearRightFender', label: 'Rear right fender' },
  { key: 'frontLeftDoor', label: 'Front L Door' },
  { key: 'frontRightDoor', label: 'Front R Door' },
  { key: 'rearLeftDoor', label: 'Rear L Door' },
  { key: 'rearRightDoor', label: 'Rear R Door' },
];

export const PAINT_COLORS: Record<BodyStatus, string> = {
  original: 'url(#silver-gradient)',
  painted: '#EF4444',
  replaced: '#F59E0B',
  putty: '#8B5CF6', // Purple
  ppf: '#06b6d4', // Cyan
};

export const DEFAULT_TIRES: TiresStatus = {
  frontLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  frontRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  rearLeft: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  rearRight: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '' },
  spare: { condition: 'good', dot: '', brand: '', size: '', treadDepth: '', present: true },
};

export const DEFAULT_CAR_INFO: CarInfo = {
  brand: '',
  model: '',
  year: '',
  mileage: '',
  vin: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  owners: '',
  mulkiaExpiry: '',
  regionalSpecs: '',
  bodyType: '',
  fuelType: '',
  engineSize: '',
  horsepower: '',
  color: '',
  cylinders: '',
  transmission: '',
  keys: '',
  options: '',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const normalizeStatus = (status?: BodyStatus): BodyStatus => status ?? 'original';

export const statusToCondition = (
  status?: BodyStatus
): { condition: ReportBodyPartInput['condition']; severity: number } => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'original':
      return { condition: 'ok', severity: 0 };
    case 'ppf':
      return { condition: 'ok', severity: 0 };
    case 'painted':
      return { condition: 'minor_damage', severity: 1 };
    case 'putty':
      return { condition: 'major_damage', severity: 3 };
    case 'replaced':
      return { condition: 'needs_replacement', severity: 4 };
    default:
      return { condition: 'ok', severity: 0 };
  }
};

export const conditionToStatus = (condition: string, notes?: string | null): BodyStatus => {
  if (notes === 'PPF') return 'ppf';
  switch (condition) {
    case 'minor_damage':
      return 'painted';
    case 'major_damage':
      return 'putty';
    case 'needs_replacement':
      return 'replaced';
    default:
      return 'original';
  }
};

export const encodeSummary = (payload: any): string => JSON.stringify(payload);

export const decodeSummary = (summary?: string | null): any | null => {
  if (!summary) return null;
  try {
    return JSON.parse(summary);
  } catch {
    return null;
  }
};

export const getTireColor = (condition: string): string => {
  switch (condition) {
    case 'good':
      return '#10b981'; // Emerald
    case 'fair':
      return '#f59e0b'; // Amber
    case 'worn':
      return '#ef4444'; // Red
    case 'needs_replacement':
      return '#dc2626'; // Dark Red
    default:
      return '#9ca3af'; // Gray
  }
};

export const fillForStatus = (status: BodyStatus): string => {
  return PAINT_COLORS[status] || PAINT_COLORS.original;
};
