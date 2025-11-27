/**
 * Input sanitization utilities for enhanced security
 */

export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';

  // Remove dangerous characters and limit length
  return text
    .replace(/[<>'"`;]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 1000); // Limit length
};

export const sanitizeDescription = (text: string | null | undefined): string => {
  if (!text) return '';

  // For descriptions, preserve line breaks and paragraphs but remove dangerous characters
  return text
    .replace(/[<>'"`;]/g, '') // Remove potentially dangerous characters
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Convert remaining \r to \n
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to max 2
    .trim()
    .substring(0, 2000); // Limit length for descriptions
};

export const sanitizeNumber = (value: string | number | null | undefined): number | null => {
  if (!value) return null;
  
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (isNaN(num) || num < 0) return null;
  return num;
};

export const sanitizePrice = (price: string | number | null | undefined): number | null => {
  const sanitized = sanitizeNumber(price);
  
  // Validate price range (1 AED to 10 million AED)
  if (sanitized && (sanitized < 1 || sanitized > 10000000)) {
    return null;
  }
  
  return sanitized;
};

export const sanitizeYear = (year: string | number | null | undefined): number | null => {
  const sanitized = sanitizeNumber(year);
  const currentYear = new Date().getFullYear();
  
  // Validate year range (1900 to current year + 1)
  if (sanitized && (sanitized < 1900 || sanitized > currentYear + 1)) {
    return null;
  }
  
  return sanitized;
};

export const sanitizeMileage = (mileage: string | number | null | undefined): number | null => {
  const sanitized = sanitizeNumber(mileage);
  
  // Validate mileage range (0 to 1 million km)
  if (sanitized && (sanitized < 0 || sanitized > 1000000)) {
    return null;
  }
  
  return sanitized;
};

export const validateForm = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required field validation
  const requiredFields = ['title', 'make', 'model', 'year', 'mileage', 'spec', 'city'];
  
  for (const field of requiredFields) {
    if (!formData[field] || !formData[field].toString().trim()) {
      errors.push(`${field} is required`);
    }
  }
  
  // Validate title length
  if (formData.title && formData.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }
  
  // Validate description length
  if (formData.description && formData.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};