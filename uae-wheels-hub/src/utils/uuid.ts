/**
 * UUID validation and utility functions
 */

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateUUIDs = (uuids: Record<string, string>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(uuids)) {
    if (!value) {
      errors.push(`${key} is missing`);
    } else if (!isValidUUID(value)) {
      errors.push(`${key} has invalid UUID format: ${value}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const logUUIDValidation = (context: string, uuids: Record<string, string>) => {
  const validation = validateUUIDs(uuids);
  
  if (!validation.isValid) {
    console.error(`UUID validation failed in ${context}:`, validation.errors);
    console.error('UUIDs:', uuids);
  } else {
    console.log(`UUID validation passed in ${context}`);
  }
  
  return validation.isValid;
};
