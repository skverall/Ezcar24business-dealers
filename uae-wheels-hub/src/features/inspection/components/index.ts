// Simple, independent components
export { HealthScoreGauge } from './HealthScoreGauge';
export { StatusIndicator } from './StatusIndicator';
export { SpecField } from './SpecField';

// Section components
export { InspectionHeader } from './InspectionHeader';
export { PhotoGallerySection } from './PhotoGallerySection';
export { ServiceHistorySection } from './ServiceHistorySection';
export { MechanicalSection } from './MechanicalSection';
export { InteriorSection } from './InteriorSection';
export { TireSection } from './TireSection';
export { BodyConditionSection } from './BodyConditionSection';
export { VehicleIdentityCard } from './VehicleIdentityCard';
export { OverallConditionCard } from './OverallConditionCard';
export { SummarySection } from './SummarySection';
export { InspectionActions } from './InspectionActions';

// Re-export types
export type { CarInspectionReportProps, BodyStatus, CarInfo, LinkedListing } from '../types/inspection.types';

// Re-export utility
export { calculateHealthScore } from '../utils/calculateHealthScore';
