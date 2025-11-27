// Utility functions for proper capitalization and formatting

export const capitalizeFirst = (str: string | null | undefined): string => {
  if (!str || str.trim() === '' || str.toLowerCase() === 'n/a') return '—';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatMake = (make: string | null | undefined): string => {
  if (!make || make.trim() === '' || make.toLowerCase() === 'n/a') return 'Toyota';
  // Special cases for car makes
  const specialCases: { [key: string]: string } = {
    'bmw': 'BMW',
    'audi': 'Audi',
    'mercedes': 'Mercedes',
    'mercedes-benz': 'Mercedes-Benz',
    'tesla': 'Tesla',
    'toyota': 'Toyota',
    'honda': 'Honda',
    'nissan': 'Nissan',
    'ford': 'Ford',
    'chevrolet': 'Chevrolet',
    'hyundai': 'Hyundai',
    'kia': 'Kia',
    'volkswagen': 'Volkswagen',
    'lexus': 'Lexus',
    'infiniti': 'Infiniti',
    'porsche': 'Porsche',
    'jaguar': 'Jaguar',
    'land rover': 'Land Rover',
    'range rover': 'Range Rover',
    'jeep': 'Jeep',
    'cadillac': 'Cadillac',
    'lincoln': 'Lincoln',
    'volvo': 'Volvo',
    'subaru': 'Subaru',
    'mazda': 'Mazda',
    'mitsubishi': 'Mitsubishi',
    'acura': 'Acura',
    'genesis': 'Genesis',
    'alfa romeo': 'Alfa Romeo',
    'maserati': 'Maserati',
    'ferrari': 'Ferrari',
    'lamborghini': 'Lamborghini',
    'bentley': 'Bentley',
    'rolls royce': 'Rolls Royce',
    'mclaren': 'McLaren',
    'aston martin': 'Aston Martin',
    'mini': 'MINI',
    'gmc': 'GMC',
    'ram': 'RAM',
    'dodge': 'Dodge',
    'chrysler': 'Chrysler',
    'buick': 'Buick',
    'pontiac': 'Pontiac',
    'oldsmobile': 'Oldsmobile',
    'saturn': 'Saturn',
    'hummer': 'Hummer',
    'saab': 'Saab',
    'suzuki': 'Suzuki',
    'isuzu': 'Isuzu',
    'daihatsu': 'Daihatsu',
    'smart': 'Smart',
    'scion': 'Scion',
    'maybach': 'Maybach',
    'bugatti': 'Bugatti',
    'koenigsegg': 'Koenigsegg',
    'pagani': 'Pagani',
    'lotus': 'Lotus',
    'morgan': 'Morgan',
    'tvr': 'TVR',
    'caterham': 'Caterham',
    'ariel': 'Ariel',
    'noble': 'Noble',
    'spyker': 'Spyker',
    'wiesmann': 'Wiesmann',
    'donkervoort': 'Donkervoort',
    'gumpert': 'Gumpert',
    'zenvo': 'Zenvo',
    'rimac': 'Rimac',
    'lucid': 'Lucid',
    'rivian': 'Rivian',
    'polestar': 'Polestar',
    'byd': 'BYD',
    'nio': 'NIO',
    'xpeng': 'XPeng',
    'li auto': 'Li Auto',
    'geely': 'Geely',
    'chery': 'Chery',
    'great wall': 'Great Wall',
    'haval': 'Haval',
    'mg': 'MG',
    'ssangyong': 'SsangYong',
    'tata': 'Tata',
    'mahindra': 'Mahindra',
    'maruti suzuki': 'Maruti Suzuki',
    'bajaj': 'Bajaj',
    'tvs': 'TVS',
    'hero': 'Hero',
    'royal enfield': 'Royal Enfield'
  };
  
  const lowerMake = make.toLowerCase();
  return specialCases[lowerMake] || capitalizeFirst(make);
};

export const formatModel = (model: string | null | undefined): string => {
  if (!model || model.trim() === '' || model.toLowerCase() === 'n/a') return 'Model';

  // Special cases for car models that need proper capitalization
  const specialCases: { [key: string]: string } = {
    // BMW models
    'x1': 'X1', 'x2': 'X2', 'x3': 'X3', 'x4': 'X4', 'x5': 'X5', 'x6': 'X6', 'x7': 'X7',
    'i3': 'i3', 'i4': 'i4', 'i7': 'i7', 'i8': 'i8', 'ix': 'iX',
    'm3': 'M3', 'm4': 'M4', 'm5': 'M5', 'm6': 'M6', 'm8': 'M8',
    'z4': 'Z4', 'z8': 'Z8',

    // Mercedes models
    'e300': 'E300', 'e350': 'E350', 'e400': 'E400', 'e450': 'E450', 'e500': 'E500',
    'c200': 'C200', 'c250': 'C250', 'c300': 'C300', 'c350': 'C350', 'c400': 'C400',
    's350': 'S350', 's400': 'S400', 's450': 'S450', 's500': 'S500', 's550': 'S550',
    'gle350': 'GLE350', 'gle400': 'GLE400', 'gle450': 'GLE450', 'gle500': 'GLE500',
    'glc300': 'GLC300', 'glc350': 'GLC350', 'glc400': 'GLC400',
    'gls350': 'GLS350', 'gls400': 'GLS400', 'gls450': 'GLS450', 'gls500': 'GLS500',
    'amg gt': 'AMG GT', 'amg c63': 'AMG C63', 'amg e63': 'AMG E63',

    // Tesla models
    'model s': 'Model S', 'model 3': 'Model 3', 'model x': 'Model X', 'model y': 'Model Y',
    'roadster': 'Roadster', 'cybertruck': 'Cybertruck',

    // Audi models
    'a3': 'A3', 'a4': 'A4', 'a5': 'A5', 'a6': 'A6', 'a7': 'A7', 'a8': 'A8',
    'q3': 'Q3', 'q5': 'Q5', 'q7': 'Q7', 'q8': 'Q8',
    'rs3': 'RS3', 'rs4': 'RS4', 'rs5': 'RS5', 'rs6': 'RS6', 'rs7': 'RS7',
    'tt': 'TT', 'r8': 'R8', 'e-tron': 'e-tron',

    // Toyota models
    'camry': 'Camry', 'corolla': 'Corolla', 'prius': 'Prius', 'rav4': 'RAV4',
    'highlander': 'Highlander', 'land cruiser': 'Land Cruiser', 'prado': 'Prado',
    'fortuner': 'Fortuner', 'hilux': 'Hilux', 'yaris': 'Yaris',

    // Honda models
    'civic': 'Civic', 'accord': 'Accord', 'cr-v': 'CR-V', 'hr-v': 'HR-V',
    'pilot': 'Pilot', 'ridgeline': 'Ridgeline', 'odyssey': 'Odyssey',

    // Jeep models
    'grand cherokee': 'Grand Cherokee', 'grand cheroke': 'Grand Cherokee',
    'grand cheroke limited': 'Grand Cherokee Limited',
    'wrangler': 'Wrangler', 'compass': 'Compass', 'renegade': 'Renegade',
    'cherokee': 'Cherokee', 'gladiator': 'Gladiator',

    // Ford models
    'f-150': 'F-150', 'f-250': 'F-250', 'f-350': 'F-350',
    'mustang': 'Mustang', 'explorer': 'Explorer', 'escape': 'Escape',
    'edge': 'Edge', 'expedition': 'Expedition', 'bronco': 'Bronco',

    // Nissan models
    'altima': 'Altima', 'maxima': 'Maxima', 'sentra': 'Sentra',
    'rogue': 'Rogue', 'murano': 'Murano', 'pathfinder': 'Pathfinder',
    'armada': 'Armada', 'titan': 'Titan', '370z': '370Z', '350z': '350Z',

    // Lexus models
    'es350': 'ES350', 'is350': 'IS350', 'gs350': 'GS350', 'ls500': 'LS500',
    'rx350': 'RX350', 'gx460': 'GX460', 'lx570': 'LX570',

    // Range Rover models
    'range rover': 'Range Rover', 'range rover sport': 'Range Rover Sport',
    'range rover evoque': 'Range Rover Evoque', 'range rover velar': 'Range Rover Velar',
    'discovery': 'Discovery', 'discovery sport': 'Discovery Sport',
    'defender': 'Defender',

    // Porsche models
    '911': '911', 'cayenne': 'Cayenne', 'macan': 'Macan', 'panamera': 'Panamera',
    'boxster': 'Boxster', 'cayman': 'Cayman', 'taycan': 'Taycan'
  };

  const lowerModel = model.toLowerCase().trim();
  return specialCases[lowerModel] || model.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export const formatSpec = (spec: string | null | undefined): string => {
  if (!spec || spec.trim() === '' || spec.toLowerCase() === 'n/a') return 'GCC Spec';
  // Special cases for specifications
  const specialCases: { [key: string]: string } = {
    'gcc': 'GCC Spec',
    'us': 'American Spec',
    'american': 'American Spec',
    'eu': 'European Spec',
    'european': 'European Spec',
    'japanese': 'Japanese Spec',
    'korean': 'Korean Spec',
    'canadian': 'Canadian Spec',
    'other': 'Other Spec'
  };

  // Normalize noisy inputs like "spec.korean_", "GCC spec", etc.
  const normalizeToken = (value: string) =>
    value
      .toLowerCase()
      .replace(/spec/g, '') // drop the word 'spec'
      .replace(/[^a-z]/g, '') // keep only letters
      .trim();

  const token = normalizeToken(spec);
  if (specialCases[token]) return specialCases[token];

  // Fallback: Capitalize first word and append 'Spec'
  return `${capitalizeFirst(token || spec)} Spec`;
};

export const formatCity = (city: string | null | undefined): string => {
  if (!city || city.trim() === '' || city.toLowerCase() === 'n/a') return 'Dubai';
  // Special cases for UAE cities
  const specialCases: { [key: string]: string } = {
    'dubai': 'Dubai',
    'abu dhabi': 'Abu Dhabi',
    'sharjah': 'Sharjah',
    'ajman': 'Ajman',
    'fujairah': 'Fujairah',
    'ras al khaimah': 'Ras Al Khaimah',
    'umm al quwain': 'Umm Al Quwain',
    'al ain': 'Al Ain'
  };
  
  const lowerCity = city.toLowerCase();
  return specialCases[lowerCity] || capitalizeFirst(city);
};

export const formatTransmission = (transmission: string | null | undefined): string => {
  if (!transmission || transmission.trim() === '' || transmission.toLowerCase() === 'n/a') return 'Manual';
  // Special cases for transmission types
  const specialCases: { [key: string]: string } = {
    'automatic': 'Automatic',
    'manual': 'Manual',
    'cvt': 'CVT',
    'semi-automatic': 'Semi-Automatic',
    'dual-clutch': 'Dual-Clutch',
    'other': 'Other'
  };

  const lowerTransmission = transmission.toLowerCase();
  return specialCases[lowerTransmission] || capitalizeFirst(transmission);
};

export const formatFuelType = (fuelType: string | null | undefined): string => {
  if (!fuelType || fuelType.trim() === '' || fuelType.toLowerCase() === 'n/a') return 'Petrol';
  // Special cases for fuel types
  const specialCases: { [key: string]: string } = {
    'petrol': 'Petrol',
    'diesel': 'Diesel',
    'hybrid': 'Hybrid',
    'electric': 'Electric',
    'plug-in hybrid': 'Plug-in Hybrid',
    'cng': 'CNG',
    'lpg': 'LPG',
    'other': 'Other'
  };

  const lowerFuelType = fuelType.toLowerCase();
  return specialCases[lowerFuelType] || capitalizeFirst(fuelType);
};

export const formatBodyType = (bodyType: string | null | undefined): string => {
  if (!bodyType || bodyType.trim() === '' || bodyType.toLowerCase() === 'n/a') return 'Sedan';
  // Special cases for body types
  const specialCases: { [key: string]: string } = {
    'sedan': 'Sedan',
    'suv': 'SUV',
    'hatchback': 'Hatchback',
    'coupe': 'Coupe',
    'convertible': 'Convertible',
    'wagon': 'Wagon',
    'pickup': 'Pickup',
    'van': 'Van',
    'minivan': 'Minivan',
    'crossover': 'Crossover',
    'roadster': 'Roadster',
    'limousine': 'Limousine',
    'other': 'Other'
  };

  const lowerBodyType = bodyType.toLowerCase();
  return specialCases[lowerBodyType] || capitalizeFirst(bodyType);
};

export const formatCondition = (condition: string | null | undefined): string => {
  if (!condition) return 'Used';
  // Special cases for condition
  const specialCases: { [key: string]: string } = {
    'new': 'New',
    'used': 'Used',
    'certified': 'Certified Pre-Owned',
    'excellent': 'Excellent',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor'
  };
  
  const lowerCondition = condition.toLowerCase();
  return specialCases[lowerCondition] || capitalizeFirst(condition);
};

export const formatSellerType = (sellerType: string | null | undefined): string => {
  if (!sellerType) return 'Dealer';
  // Special cases for seller types
  const specialCases: { [key: string]: string } = {
    'dealer': 'Dealer',
    'individual': 'Individual',
    'company': 'Company',
    'other': 'Other'
  };
  
  const lowerSellerType = sellerType.toLowerCase();
  return specialCases[lowerSellerType] || capitalizeFirst(sellerType);
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // If it's today, show time only
  if (diffInDays < 1 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // If it's yesterday, show "Yesterday HH:MM"
  if (diffInDays < 2 && diffInDays >= 1) {
    return `Yesterday ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  }

  // If it's within a week, show day and time
  if (diffInDays < 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  }

  // If it's older, show date and time
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })} ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}`;
};
