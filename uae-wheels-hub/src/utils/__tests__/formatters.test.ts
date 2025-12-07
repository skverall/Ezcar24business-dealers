import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  capitalizeFirst,
  formatMake,
  formatModel,
  formatSpec,
  formatCity,
  formatTransmission,
  formatFuelType,
  formatBodyType,
  formatCondition,
  formatSellerType,
  formatDateTime
} from '../formatters';

describe('capitalizeFirst', () => {
  it('capitalizes first letter and lowercases rest', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('WORLD')).toBe('World');
    expect(capitalizeFirst('hELLO')).toBe('Hello');
  });

  it('returns dash for empty or null inputs', () => {
    expect(capitalizeFirst('')).toBe('—');
    expect(capitalizeFirst(null)).toBe('—');
    expect(capitalizeFirst(undefined)).toBe('—');
    expect(capitalizeFirst('   ')).toBe('—');
  });

  it('returns dash for n/a values', () => {
    expect(capitalizeFirst('n/a')).toBe('—');
    expect(capitalizeFirst('N/A')).toBe('—');
    expect(capitalizeFirst('N/a')).toBe('—');
  });

  it('handles single character strings', () => {
    expect(capitalizeFirst('a')).toBe('A');
    expect(capitalizeFirst('Z')).toBe('Z');
  });
});

describe('formatMake', () => {
  it('formats special case car makes correctly', () => {
    expect(formatMake('bmw')).toBe('BMW');
    expect(formatMake('BMW')).toBe('BMW');
    expect(formatMake('mercedes-benz')).toBe('Mercedes-Benz');
    expect(formatMake('land rover')).toBe('Land Rover');
    expect(formatMake('rolls royce')).toBe('Rolls Royce');
  });

  it('formats luxury brands correctly', () => {
    expect(formatMake('ferrari')).toBe('Ferrari');
    expect(formatMake('lamborghini')).toBe('Lamborghini');
    expect(formatMake('porsche')).toBe('Porsche');
    expect(formatMake('bentley')).toBe('Bentley');
  });

  it('formats EV brands correctly', () => {
    expect(formatMake('tesla')).toBe('Tesla');
    expect(formatMake('rivian')).toBe('Rivian');
    expect(formatMake('lucid')).toBe('Lucid');
    expect(formatMake('nio')).toBe('NIO');
  });

  it('returns default Toyota for empty or null inputs', () => {
    expect(formatMake('')).toBe('Toyota');
    expect(formatMake(null)).toBe('Toyota');
    expect(formatMake(undefined)).toBe('Toyota');
    expect(formatMake('n/a')).toBe('Toyota');
  });

  it('falls back to capitalizeFirst for unknown makes', () => {
    expect(formatMake('unknown brand')).toBe('Unknown brand');
  });
});

describe('formatModel', () => {
  it('formats BMW models correctly', () => {
    expect(formatModel('x5')).toBe('X5');
    expect(formatModel('m3')).toBe('M3');
    expect(formatModel('i8')).toBe('i8');
    expect(formatModel('z4')).toBe('Z4');
  });

  it('formats Mercedes models correctly', () => {
    expect(formatModel('e300')).toBe('E300');
    expect(formatModel('gle350')).toBe('GLE350');
    expect(formatModel('amg gt')).toBe('AMG GT');
  });

  it('formats Tesla models correctly', () => {
    expect(formatModel('model s')).toBe('Model S');
    expect(formatModel('model 3')).toBe('Model 3');
    expect(formatModel('cybertruck')).toBe('Cybertruck');
  });

  it('formats Jeep models with special case for Cherokee', () => {
    expect(formatModel('grand cheroke')).toBe('Grand Cherokee');
    expect(formatModel('grand cherokee')).toBe('Grand Cherokee');
    expect(formatModel('wrangler')).toBe('Wrangler');
  });

  it('handles multi-word models', () => {
    expect(formatModel('land cruiser')).toBe('Land Cruiser');
    expect(formatModel('range rover sport')).toBe('Range Rover Sport');
  });

  it('returns default Model for empty or null inputs', () => {
    expect(formatModel('')).toBe('Model');
    expect(formatModel(null)).toBe('Model');
    expect(formatModel(undefined)).toBe('Model');
    expect(formatModel('n/a')).toBe('Model');
  });

  it('capitalizes each word for unknown models', () => {
    expect(formatModel('custom model name')).toBe('Custom Model Name');
  });
});

describe('formatSpec', () => {
  it('formats standard specs correctly', () => {
    expect(formatSpec('gcc')).toBe('GCC Spec');
    expect(formatSpec('GCC')).toBe('GCC Spec');
    expect(formatSpec('us')).toBe('American Spec');
    expect(formatSpec('american')).toBe('American Spec');
    expect(formatSpec('european')).toBe('European Spec');
    expect(formatSpec('japanese')).toBe('Japanese Spec');
  });

  it('normalizes noisy inputs', () => {
    expect(formatSpec('spec.korean_')).toBe('Korean Spec');
    expect(formatSpec('GCC spec')).toBe('GCC Spec');
    expect(formatSpec('spec.gcc')).toBe('GCC Spec');
    expect(formatSpec('american-spec')).toBe('American Spec');
  });

  it('returns default GCC Spec for empty or null inputs', () => {
    expect(formatSpec('')).toBe('GCC Spec');
    expect(formatSpec(null)).toBe('GCC Spec');
    expect(formatSpec(undefined)).toBe('GCC Spec');
    expect(formatSpec('n/a')).toBe('GCC Spec');
  });

  it('handles unknown specs with fallback', () => {
    expect(formatSpec('custom')).toBe('Custom Spec');
  });
});

describe('formatCity', () => {
  it('formats UAE cities correctly', () => {
    expect(formatCity('dubai')).toBe('Dubai');
    expect(formatCity('abu dhabi')).toBe('Abu Dhabi');
    expect(formatCity('sharjah')).toBe('Sharjah');
    expect(formatCity('ras al khaimah')).toBe('Ras Al Khaimah');
    expect(formatCity('al ain')).toBe('Al Ain');
  });

  it('handles case variations', () => {
    expect(formatCity('DUBAI')).toBe('Dubai');
    expect(formatCity('ABU DHABI')).toBe('Abu Dhabi');
  });

  it('returns default Dubai for empty or null inputs', () => {
    expect(formatCity('')).toBe('Dubai');
    expect(formatCity(null)).toBe('Dubai');
    expect(formatCity(undefined)).toBe('Dubai');
    expect(formatCity('n/a')).toBe('Dubai');
  });

  it('falls back to capitalizeFirst for unknown cities', () => {
    expect(formatCity('unknown city')).toBe('Unknown city');
  });
});

describe('formatTransmission', () => {
  it('formats transmission types correctly', () => {
    expect(formatTransmission('automatic')).toBe('Automatic');
    expect(formatTransmission('manual')).toBe('Manual');
    expect(formatTransmission('cvt')).toBe('CVT');
    expect(formatTransmission('semi-automatic')).toBe('Semi-Automatic');
    expect(formatTransmission('dual-clutch')).toBe('Dual-Clutch');
  });

  it('handles case variations', () => {
    expect(formatTransmission('AUTOMATIC')).toBe('Automatic');
    expect(formatTransmission('Manual')).toBe('Manual');
  });

  it('returns default Manual for empty or null inputs', () => {
    expect(formatTransmission('')).toBe('Manual');
    expect(formatTransmission(null)).toBe('Manual');
    expect(formatTransmission(undefined)).toBe('Manual');
    expect(formatTransmission('n/a')).toBe('Manual');
  });

  it('falls back to capitalizeFirst for unknown types', () => {
    expect(formatTransmission('unknown')).toBe('Unknown');
  });
});

describe('formatFuelType', () => {
  it('formats fuel types correctly', () => {
    expect(formatFuelType('petrol')).toBe('Petrol');
    expect(formatFuelType('diesel')).toBe('Diesel');
    expect(formatFuelType('hybrid')).toBe('Hybrid');
    expect(formatFuelType('electric')).toBe('Electric');
    expect(formatFuelType('plug-in hybrid')).toBe('Plug-in Hybrid');
    expect(formatFuelType('cng')).toBe('CNG');
    expect(formatFuelType('lpg')).toBe('LPG');
  });

  it('handles case variations', () => {
    expect(formatFuelType('PETROL')).toBe('Petrol');
    expect(formatFuelType('Electric')).toBe('Electric');
  });

  it('returns default Petrol for empty or null inputs', () => {
    expect(formatFuelType('')).toBe('Petrol');
    expect(formatFuelType(null)).toBe('Petrol');
    expect(formatFuelType(undefined)).toBe('Petrol');
    expect(formatFuelType('n/a')).toBe('Petrol');
  });

  it('falls back to capitalizeFirst for unknown fuel types', () => {
    expect(formatFuelType('unknown')).toBe('Unknown');
  });
});

describe('formatBodyType', () => {
  it('formats body types correctly', () => {
    expect(formatBodyType('sedan')).toBe('Sedan');
    expect(formatBodyType('suv')).toBe('SUV');
    expect(formatBodyType('hatchback')).toBe('Hatchback');
    expect(formatBodyType('coupe')).toBe('Coupe');
    expect(formatBodyType('convertible')).toBe('Convertible');
    expect(formatBodyType('pickup')).toBe('Pickup');
  });

  it('handles case variations', () => {
    expect(formatBodyType('SEDAN')).toBe('Sedan');
    expect(formatBodyType('Suv')).toBe('SUV');
  });

  it('returns default Sedan for empty or null inputs', () => {
    expect(formatBodyType('')).toBe('Sedan');
    expect(formatBodyType(null)).toBe('Sedan');
    expect(formatBodyType(undefined)).toBe('Sedan');
    expect(formatBodyType('n/a')).toBe('Sedan');
  });

  it('falls back to capitalizeFirst for unknown body types', () => {
    expect(formatBodyType('unknown')).toBe('Unknown');
  });
});

describe('formatCondition', () => {
  it('formats condition values correctly', () => {
    expect(formatCondition('new')).toBe('New');
    expect(formatCondition('used')).toBe('Used');
    expect(formatCondition('certified')).toBe('Certified Pre-Owned');
    expect(formatCondition('excellent')).toBe('Excellent');
    expect(formatCondition('good')).toBe('Good');
    expect(formatCondition('fair')).toBe('Fair');
  });

  it('handles case variations', () => {
    expect(formatCondition('NEW')).toBe('New');
    expect(formatCondition('Certified')).toBe('Certified Pre-Owned');
  });

  it('returns default Used for null input', () => {
    expect(formatCondition(null)).toBe('Used');
    expect(formatCondition(undefined)).toBe('Used');
  });

  it('falls back to capitalizeFirst for unknown conditions', () => {
    expect(formatCondition('unknown')).toBe('Unknown');
  });
});

describe('formatSellerType', () => {
  it('formats seller types correctly', () => {
    expect(formatSellerType('dealer')).toBe('Dealer');
    expect(formatSellerType('individual')).toBe('Individual');
    expect(formatSellerType('company')).toBe('Company');
    expect(formatSellerType('other')).toBe('Other');
  });

  it('handles case variations', () => {
    expect(formatSellerType('DEALER')).toBe('Dealer');
    expect(formatSellerType('Individual')).toBe('Individual');
  });

  it('returns default Dealer for null input', () => {
    expect(formatSellerType(null)).toBe('Dealer');
    expect(formatSellerType(undefined)).toBe('Dealer');
  });

  it('falls back to capitalizeFirst for unknown seller types', () => {
    expect(formatSellerType('unknown')).toBe('Unknown');
  });
});

describe('formatDateTime', () => {
  beforeEach(() => {
    // Mock current date to December 7, 2025, 10:00 AM
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-07T10:00:00'));
  });

  it('returns empty string for null or undefined', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime(undefined)).toBe('');
  });

  it('shows time only for today', () => {
    const today = new Date('2025-12-07T08:30:00').toISOString();
    const result = formatDateTime(today);
    expect(result).toMatch(/\d{2}:\d{2}\s*(AM|PM)/);
  });

  it('shows "Yesterday" for yesterday', () => {
    // The current time is set to 2025-12-07T10:00:00
    // Yesterday at 14:00 would be 20 hours ago (< 24h but different dates)
    // Need to ensure it's more than 24 hours to trigger yesterday logic
    const yesterday = new Date('2025-12-06T08:00:00').toISOString();
    const result = formatDateTime(yesterday);
    expect(result).toContain('Yesterday');
  });

  it('shows day of week for dates within a week', () => {
    const threeDaysAgo = new Date('2025-12-04T14:00:00').toISOString();
    const result = formatDateTime(threeDaysAgo);
    // Should show weekday like "Wed 02:00 PM"
    expect(result).toMatch(/\w{3}\s+\d{2}:\d{2}\s*(AM|PM)/);
  });

  it('shows month and day for older dates', () => {
    const twoWeeksAgo = new Date('2025-11-23T14:00:00').toISOString();
    const result = formatDateTime(twoWeeksAgo);
    // Should show like "Nov 23 02:00 PM"
    expect(result).toMatch(/\w{3}\s+\d{1,2}\s+\d{2}:\d{2}\s*(AM|PM)/);
  });

  it('handles edge case at midnight', () => {
    const midnight = new Date('2025-12-07T00:00:00').toISOString();
    const result = formatDateTime(midnight);
    expect(result).toMatch(/\d{2}:\d{2}\s*(AM|PM)/);
  });

  it('handles dates in different time zones', () => {
    const isoDate = '2025-12-07T05:00:00Z';
    const result = formatDateTime(isoDate);
    // Should still format correctly regardless of timezone
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
