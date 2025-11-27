// Car trims data imported from UAE makes models trims JSON
import trimsData from '../../uae_makes_models_trims.json';

export interface TrimData {
  [brand: string]: {
    [model: string]: string[];
  };
}

// Type-safe access to the imported JSON data
export const CAR_TRIMS: TrimData = trimsData as TrimData;

// Helper function to get trims for a specific make and model
export const getTrimsForModel = (make: string, model: string): string[] => {
  // Normalize the make name to match the JSON structure (capitalize first letter)
  const normalizedMake = make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
  
  // Handle special cases for make names that don't follow simple capitalization
  const makeMapping: { [key: string]: string } = {
    'mercedes': 'Mercedes-Benz',
    'bmw': 'BMW',
    'mg': 'MG',
    'byd': 'BYD',
    'gac': 'GAC',
    'jac': 'JAC',
    'baic': 'BAIC',
    'gwm': 'GWM',
    'exeed': 'EXEED',
    'cupra': 'CUPRA',
    'mini': 'MINI',
    'ram': 'RAM',
    'gmc': 'GMC'
  };

  const mappedMake = makeMapping[make.toLowerCase()] || normalizedMake;
  
  if (!CAR_TRIMS[mappedMake]) {
    return [];
  }

  // Try to find the model with exact match first
  if (CAR_TRIMS[mappedMake][model]) {
    return CAR_TRIMS[mappedMake][model];
  }

  // Try to find the model with case-insensitive search
  const modelKeys = Object.keys(CAR_TRIMS[mappedMake]);
  const foundModel = modelKeys.find(key => 
    key.toLowerCase() === model.toLowerCase() ||
    key.toLowerCase().replace(/[^a-z0-9]/g, '') === model.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  if (foundModel) {
    return CAR_TRIMS[mappedMake][foundModel];
  }

  return [];
};

// Helper function to get all trims for a specific make
export const getTrimsForMake = (make: string): { [model: string]: string[] } => {
  const normalizedMake = make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
  
  const makeMapping: { [key: string]: string } = {
    'mercedes': 'Mercedes-Benz',
    'bmw': 'BMW',
    'mg': 'MG',
    'byd': 'BYD',
    'gac': 'GAC',
    'jac': 'JAC',
    'baic': 'BAIC',
    'gwm': 'GWM',
    'exeed': 'EXEED',
    'cupra': 'CUPRA',
    'mini': 'MINI',
    'ram': 'RAM',
    'gmc': 'GMC'
  };

  const mappedMake = makeMapping[make.toLowerCase()] || normalizedMake;
  
  return CAR_TRIMS[mappedMake] || {};
};

// Helper function to get all available makes that have trim data
export const getAvailableMakes = (): string[] => {
  return Object.keys(CAR_TRIMS);
};

// Helper function to get all models for a make that have trim data
export const getModelsWithTrims = (make: string): string[] => {
  const trims = getTrimsForMake(make);
  return Object.keys(trims);
};

// Helper function to search for trims across all makes and models
export const searchTrims = (searchTerm: string): { make: string; model: string; trims: string[] }[] => {
  const results: { make: string; model: string; trims: string[] }[] = [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  Object.entries(CAR_TRIMS).forEach(([make, models]) => {
    Object.entries(models).forEach(([model, trims]) => {
      const matchingTrims = trims.filter(trim => 
        trim.toLowerCase().includes(lowerSearchTerm)
      );
      
      if (matchingTrims.length > 0) {
        results.push({ make, model, trims: matchingTrims });
      }
    });
  });

  return results;
};
