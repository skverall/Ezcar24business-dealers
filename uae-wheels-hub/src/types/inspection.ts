export type TireCondition = 'good' | 'fair' | 'poor' | 'replace';

export type TireDetails = {
    brand: string;
    size: string;
    dot: string; // Week/Year
    treadDepth: string;
    condition: TireCondition;
    present?: boolean;
};

export type TiresStatus = {
    frontLeft: TireDetails;
    frontRight: TireDetails;
    rearLeft: TireDetails;
    rearRight: TireDetails;
    spare: TireDetails;
};

export const DEFAULT_TIRE_DETAILS: TireDetails = {
    brand: '',
    size: '',
    dot: '',
    treadDepth: '',
    condition: 'good',
};

export const DEFAULT_TIRES_STATUS: TiresStatus = {
    frontLeft: { ...DEFAULT_TIRE_DETAILS },
    frontRight: { ...DEFAULT_TIRE_DETAILS },
    rearLeft: { ...DEFAULT_TIRE_DETAILS },
    rearRight: { ...DEFAULT_TIRE_DETAILS },
    spare: { ...DEFAULT_TIRE_DETAILS },
};

export type ServiceRecord = {
    id: string;
    date: string;
    type: 'Service' | 'Repair' | 'Inspection' | 'Other';
    mileage: string;
    description: string;
    center?: string;
};
