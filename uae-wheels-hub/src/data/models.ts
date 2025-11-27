// Car models data organized by make
export interface CarModel {
  value: string;
  label: string;
  trims?: string[];
}

export interface MakeModels {
  make: string;
  models: CarModel[];
}

export const CAR_MODELS: MakeModels[] = [
  {
    make: 'toyota',
    models: [
      { value: 'camry', label: 'Camry' },
      { value: 'corolla', label: 'Corolla' },
      { value: 'corolla_cross', label: 'Corolla Cross' },
      { value: 'prius', label: 'Prius' },
      { value: 'rav4', label: 'RAV4' },
      { value: 'rush', label: 'Rush' },
      { value: 'raize', label: 'Raize' },
      { value: 'highlander', label: 'Highlander' },
      { value: 'land_cruiser', label: 'Land Cruiser' },
      { value: 'land_cruiser_300', label: 'Land Cruiser 300' },
      { value: 'land_cruiser_70', label: 'Land Cruiser 70' },
      { value: 'fj_cruiser', label: 'FJ Cruiser' },
      { value: 'prado', label: 'Prado' },
      { value: 'fortuner', label: 'Fortuner' },
      { value: 'hilux', label: 'Hilux' },
      { value: 'hiace', label: 'Hiace' },
      { value: 'coaster', label: 'Coaster' },
      { value: 'granvia', label: 'Granvia' },
      { value: 'innova_hycross', label: 'Innova HyCross' },
      { value: 'yaris', label: 'Yaris' },
      { value: 'avalon', label: 'Avalon' },
      { value: 'sienna', label: 'Sienna' },
      { value: 'tacoma', label: 'Tacoma' },
      { value: 'tundra', label: 'Tundra' },
      { value: 'sequoia', label: 'Sequoia' },
      { value: '4runner', label: '4Runner' },
      { value: 'c-hr', label: 'C-HR' },
      { value: 'venza', label: 'Venza' },
    ]
  },
  {
    make: 'mercedes',
    models: [
      { value: 'c_class', label: 'C-Class' },
      { value: 'e_class', label: 'E-Class' },
      { value: 's_class', label: 'S-Class' },
      { value: 'a_class', label: 'A-Class' },
      { value: 'b_class', label: 'B-Class' },
      { value: 'cla', label: 'CLA' },
      { value: 'cls', label: 'CLS' },
      { value: 'gle', label: 'GLE' },
      { value: 'glc', label: 'GLC' },
      { value: 'gls', label: 'GLS' },
      { value: 'gla', label: 'GLA' },
      { value: 'glb', label: 'GLB' },
      { value: 'g_class', label: 'G-Class' },
      { value: 'amg_gt', label: 'AMG GT' },
      { value: 'eqa', label: 'EQA' },
      { value: 'eqb', label: 'EQB' },
      { value: 'eqc', label: 'EQC' },
      { value: 'eqs', label: 'EQS' },
      { value: 'eqe', label: 'EQE' },
      { value: 'maybach', label: 'Maybach' },
    ]
  },
  {
    make: 'bmw',
    models: [
      { value: '1_series', label: '1 Series' },
      { value: '2_series', label: '2 Series' },
      { value: '3_series', label: '3 Series' },
      { value: '4_series', label: '4 Series' },
      { value: '5_series', label: '5 Series' },
      { value: '6_series', label: '6 Series' },
      { value: '7_series', label: '7 Series' },
      { value: '8_series', label: '8 Series' },
      { value: 'x1', label: 'X1' },
      { value: 'x2', label: 'X2' },
      { value: 'x3', label: 'X3' },
      { value: 'x4', label: 'X4' },
      { value: 'x5', label: 'X5' },
      { value: 'x6', label: 'X6' },
      { value: 'x7', label: 'X7' },
      { value: 'z4', label: 'Z4' },
      { value: 'i3', label: 'i3' },
      { value: 'i4', label: 'i4' },
      { value: 'i5', label: 'i5' },
      { value: 'i7', label: 'i7' },
      { value: 'i8', label: 'i8' },
      { value: 'ix', label: 'iX' },
      { value: 'ix3', label: 'iX3' },
      { value: 'm3', label: 'M3' },
      { value: 'm4', label: 'M4' },
      { value: 'm5', label: 'M5' },
      { value: 'm8', label: 'M8' },
    ]
  },
  {
    make: 'audi',
    models: [
      { value: 'a1', label: 'A1' },
      { value: 'a3', label: 'A3' },
      { value: 'a4', label: 'A4' },
      { value: 'a5', label: 'A5' },
      { value: 'a6', label: 'A6' },
      { value: 'a7', label: 'A7' },
      { value: 'a8', label: 'A8' },
      { value: 'q2', label: 'Q2' },
      { value: 'q3', label: 'Q3' },
      { value: 'q4', label: 'Q4' },
      { value: 'q5', label: 'Q5' },
      { value: 'q7', label: 'Q7' },
      { value: 'q8', label: 'Q8' },
      { value: 'tt', label: 'TT' },
      { value: 'r8', label: 'R8' },
      { value: 'e-tron', label: 'e-tron' },
      { value: 'e-tron_gt', label: 'e-tron GT' },
      { value: 'q8_e-tron', label: 'Q8 e-tron' },
      { value: 'rs3', label: 'RS3' },
      { value: 'rs4', label: 'RS4' },
      { value: 'rs5', label: 'RS5' },
      { value: 'rs6', label: 'RS6' },
      { value: 'rs7', label: 'RS7' },
      { value: 'rsq8', label: 'RSQ8' },
    ]
  },
  {
    make: 'tesla',
    models: [
      { value: 'model_s', label: 'Model S' },
      { value: 'model_3', label: 'Model 3' },
      { value: 'model_x', label: 'Model X' },
      { value: 'model_y', label: 'Model Y' },
      { value: 'roadster', label: 'Roadster' },
      { value: 'cybertruck', label: 'Cybertruck' },
    ]
  },
  {
    make: 'honda',
    models: [
      { value: 'civic', label: 'Civic' },
      { value: 'accord', label: 'Accord' },
      { value: 'cr-v', label: 'CR-V' },
      { value: 'hr-v', label: 'HR-V' },
      { value: 'pilot', label: 'Pilot' },
      { value: 'ridgeline', label: 'Ridgeline' },
      { value: 'odyssey', label: 'Odyssey' },
      { value: 'passport', label: 'Passport' },
      { value: 'insight', label: 'Insight' },
      { value: 'fit', label: 'Fit' },
      { value: 'city', label: 'City' },
    ]
  },
  {
    make: 'nissan',
    models: [
      { value: 'sunny', label: 'Sunny' },
      { value: 'altima', label: 'Altima' },
      { value: 'sentra', label: 'Sentra' },
      { value: 'maxima', label: 'Maxima' },
      { value: 'kicks', label: 'Kicks' },
      { value: 'x-trail', label: 'X-Trail' },
      { value: 'x-terra', label: 'X-Terra' },
      { value: 'rogue', label: 'Rogue' },
      { value: 'murano', label: 'Murano' },
      { value: 'pathfinder', label: 'Pathfinder' },
      { value: 'patrol', label: 'Patrol' },
      { value: 'patrol_nismo', label: 'Patrol NISMO' },
      { value: 'patrol_safari', label: 'Patrol Safari (Y61)' },
      { value: 'armada', label: 'Armada' },
      { value: 'navara', label: 'Navara' },
      { value: 'urvan', label: 'Urvan' },
      { value: 'frontier', label: 'Frontier' },
      { value: 'titan', label: 'Titan' },
      { value: 'leaf', label: 'Leaf' },
      { value: 'z', label: 'Z' },
      { value: 'gt-r', label: 'GT-R' },
    ]
  },
  {
    make: 'ford',
    models: [
      { value: 'f-150', label: 'F-150' },
      { value: 'mustang', label: 'Mustang' },
      { value: 'explorer', label: 'Explorer' },
      { value: 'escape', label: 'Escape' },
      { value: 'edge', label: 'Edge' },
      { value: 'expedition', label: 'Expedition' },
      { value: 'ranger', label: 'Ranger' },
      { value: 'bronco', label: 'Bronco' },
      { value: 'maverick', label: 'Maverick' },
      { value: 'ecosport', label: 'EcoSport' },
      { value: 'focus', label: 'Focus' },
      { value: 'fiesta', label: 'Fiesta' },
      { value: 'fusion', label: 'Fusion' },
      { value: 'taurus', label: 'Taurus' },
    ]
  },
  {
    make: 'lexus',
    models: [
      { value: 'es', label: 'ES' },
      { value: 'is', label: 'IS' },
      { value: 'gs', label: 'GS' },
      { value: 'ls', label: 'LS' },
      { value: 'rx', label: 'RX' },
      { value: 'gx', label: 'GX' },
      { value: 'lx', label: 'LX' },
      { value: 'nx', label: 'NX' },
      { value: 'ux', label: 'UX' },
      { value: 'lc', label: 'LC' },
      { value: 'rc', label: 'RC' },
      { value: 'ct', label: 'CT' },
    ]
  },
  {
    make: 'porsche',
    models: [
      { value: '718', label: '718' },
      { value: '911', label: '911' },
      { value: 'panamera', label: 'Panamera' },
      { value: 'macan', label: 'Macan' },
      { value: 'cayenne', label: 'Cayenne' },
      { value: 'boxster', label: 'Boxster' },
      { value: 'cayman', label: 'Cayman' },
      { value: 'taycan', label: 'Taycan' },
    ]
  },
  {
    make: 'jeep',
    models: [
      { value: 'wrangler', label: 'Wrangler' },
      { value: 'grand_cherokee', label: 'Grand Cherokee' },
      { value: 'cherokee', label: 'Cherokee' },
      { value: 'compass', label: 'Compass' },
      { value: 'renegade', label: 'Renegade' },
      { value: 'gladiator', label: 'Gladiator' },
      { value: 'patriot', label: 'Patriot' },
      { value: 'liberty', label: 'Liberty' },
    ]
  },
  {
    make: 'land_rover',
    models: [
      { value: 'range_rover', label: 'Range Rover' },
      { value: 'range_rover_sport', label: 'Range Rover Sport' },
      { value: 'range_rover_evoque', label: 'Range Rover Evoque' },
      { value: 'range_rover_velar', label: 'Range Rover Velar' },
      { value: 'discovery', label: 'Discovery' },
      { value: 'discovery_sport', label: 'Discovery Sport' },
      { value: 'defender', label: 'Defender' },
      { value: 'freelander', label: 'Freelander' },
    ]
  },
  {
    make: 'volkswagen',
    models: [
      { value: 'golf', label: 'Golf' },
      { value: 'golf_gti', label: 'Golf GTI' },
      { value: 'golf_r', label: 'Golf R' },
      { value: 'jetta', label: 'Jetta' },
      { value: 'passat', label: 'Passat' },
      { value: 'arteon', label: 'Arteon' },
      { value: 't-roc', label: 'T-Roc' },
      { value: 'tiguan', label: 'Tiguan' },
      { value: 'teramont', label: 'Teramont (Atlas)' },
      { value: 'touareg', label: 'Touareg' },
      { value: 'atlas', label: 'Atlas' },
      { value: 'id4', label: 'ID.4' },
      { value: 'beetle', label: 'Beetle' },
      { value: 'polo', label: 'Polo' },
    ]
  },
  {
    make: 'hyundai',
    models: [
      { value: 'i10', label: 'i10' },
      { value: 'accent', label: 'Accent' },
      { value: 'elantra', label: 'Elantra' },
      { value: 'sonata', label: 'Sonata' },
      { value: 'azera', label: 'Azera (Grandeur)' },
      { value: 'venue', label: 'Venue' },
      { value: 'creta', label: 'Creta' },
      { value: 'kona', label: 'Kona' },
      { value: 'tucson', label: 'Tucson' },
      { value: 'santa_fe', label: 'Santa Fe' },
      { value: 'palisade', label: 'Palisade' },
      { value: 'staria', label: 'Staria' },
      { value: 'h1', label: 'H-1 (Starex)' },
      { value: 'ioniq', label: 'Ioniq' },
      { value: 'ioniq_5', label: 'IONIQ 5' },
      { value: 'ioniq_6', label: 'IONIQ 6' },
      { value: 'genesis', label: 'Genesis' },
      { value: 'veloster', label: 'Veloster' },
    ]
  },
  {
    make: 'kia',
    models: [
      { value: 'picanto', label: 'Picanto' },
      { value: 'rio', label: 'Rio' },
      { value: 'cerato', label: 'Cerato (Forte)' },
      { value: 'k5', label: 'K5 (Optima)' },
      { value: 'soul', label: 'Soul' },
      { value: 'seltos', label: 'Seltos' },
      { value: 'sportage', label: 'Sportage' },
      { value: 'sorento', label: 'Sorento' },
      { value: 'telluride', label: 'Telluride' },
      { value: 'sonet', label: 'Sonet' },
      { value: 'carnival', label: 'Carnival' },
      { value: 'ev6', label: 'EV6' },
      { value: 'ev9', label: 'EV9' },
      { value: 'optima', label: 'Optima' },
      { value: 'forte', label: 'Forte' },
      { value: 'stinger', label: 'Stinger' },
      { value: 'niro', label: 'Niro' },
    ]
  },
  {
    make: 'mitsubishi',
    models: [
      { value: 'attrage', label: 'Attrage' },
      { value: 'mirage', label: 'Mirage' },
      { value: 'asx', label: 'ASX' },
      { value: 'eclipse_cross', label: 'Eclipse Cross' },
      { value: 'outlander', label: 'Outlander' },
      { value: 'montero_sport', label: 'Montero Sport (Pajero Sport)' },
      { value: 'pajero', label: 'Pajero' },
      { value: 'xpander', label: 'Xpander' },
      { value: 'l200', label: 'L200 (Triton)' },
    ]
  },
  {
    make: 'mazda',
    models: [
      { value: 'mazda2', label: 'Mazda2' },
      { value: 'mazda3', label: 'Mazda3' },
      { value: 'mazda6', label: 'Mazda6' },
      { value: 'cx-3', label: 'CX-3' },
      { value: 'cx-30', label: 'CX-30' },
      { value: 'cx-5', label: 'CX-5' },
      { value: 'cx-8', label: 'CX-8' },
      { value: 'cx-9', label: 'CX-9' },
      { value: 'cx-60', label: 'CX-60' },
      { value: 'cx-90', label: 'CX-90' },
    ]
  },
  {
    make: 'subaru',
    models: [
      { value: 'impreza', label: 'Impreza' },
      { value: 'wrx', label: 'WRX' },
      { value: 'forester', label: 'Forester' },
      { value: 'outback', label: 'Outback' },
      { value: 'xv', label: 'XV (Crosstrek)' },
    ]
  },
  {
    make: 'suzuki',
    models: [
      { value: 'swift', label: 'Swift' },
      { value: 'dzire', label: 'Dzire' },
      { value: 'baleno', label: 'Baleno' },
      { value: 'ciaz', label: 'Ciaz' },
      { value: 'vitara', label: 'Vitara' },
      { value: 's-cross', label: 'S-Cross' },
      { value: 'jimny', label: 'Jimny' },
      { value: 'ertiga', label: 'Ertiga' },
    ]
  },
  {
    make: 'isuzu',
    models: [
      { value: 'd-max', label: 'D-MAX' },
      { value: 'mu-x', label: 'MU-X' },
    ]
  },
  {
    make: 'genesis',
    models: [
      { value: 'g70', label: 'G70' },
      { value: 'g80', label: 'G80' },
      { value: 'g90', label: 'G90' },
      { value: 'gv70', label: 'GV70' },
      { value: 'gv80', label: 'GV80' },
      { value: 'gv60', label: 'GV60' },
    ]
  },
  {
    make: 'changan',
    models: [
      { value: 'alsvin', label: 'Alsvin' },
      { value: 'eado_plus', label: 'Eado Plus' },
      { value: 'cs35_plus', label: 'CS35 Plus' },
      { value: 'cs55_plus', label: 'CS55 Plus' },
      { value: 'cs75_plus', label: 'CS75 Plus' },
      { value: 'cs85', label: 'CS85' },
      { value: 'cs95', label: 'CS95' },
      { value: 'uni-k', label: 'UNI-K' },
      { value: 'uni-t', label: 'UNI-T' },
      { value: 'uni-v', label: 'UNI-V' },
      { value: 'hunter', label: 'Hunter' },
      { value: 'hunter_plus', label: 'Hunter Plus' },
    ]
  },
  {
    make: 'jetour',
    models: [
      { value: 'x70', label: 'X70' },
      { value: 'x70_plus', label: 'X70 Plus' },
      { value: 'x70_pro', label: 'X70 Pro' },
      { value: 'x90', label: 'X90' },
      { value: 'dashing', label: 'Dashing' },
      { value: 'traveller', label: 'Traveller' },
      { value: 't2', label: 'T2' },
    ]
  },
  {
    make: 'mg',
    models: [
      { value: 'mg3', label: 'MG3' },
      { value: 'mg5', label: 'MG5' },
      { value: 'mg6', label: 'MG6' },
      { value: 'gt', label: 'GT' },
      { value: 'zs', label: 'ZS' },
      { value: 'hs', label: 'HS' },
      { value: 'rx5', label: 'RX5' },
      { value: 'rx8', label: 'RX8' },
      { value: 'one', label: 'ONE' },
    ]
  },
  {
    make: 'geely',
    models: [
      { value: 'emgrand', label: 'Emgrand' },
      { value: 'coolray', label: 'Coolray' },
      { value: 'monjaro', label: 'Monjaro' },
      { value: 'tugella', label: 'Tugella' },
      { value: 'geometry_c', label: 'Geometry C' },
      { value: 'starray', label: 'Starray' },
    ]
  },
  {
    make: 'haval',
    models: [
      { value: 'jolion', label: 'Jolion' },
      { value: 'h6', label: 'H6' },
      { value: 'h6_gt', label: 'H6 GT' },
      { value: 'dargo', label: 'Dargo' },
      { value: 'h9', label: 'H9' },
    ]
  },
  {
    make: 'gac',
    models: [
      { value: 'gs3_emzoom', label: 'GS3 Emzoom' },
      { value: 'gs4', label: 'GS4' },
      { value: 'gs5', label: 'GS5' },
      { value: 'gs8', label: 'GS8' },
      { value: 'empow', label: 'Empow' },
      { value: 'emkoo', label: 'Emkoo' },
    ]
  },
  {
    make: 'byd',
    models: [
      { value: 'atto_3', label: 'Atto 3' },
      { value: 'dolphin', label: 'Dolphin' },
      { value: 'seal', label: 'Seal' },
      { value: 'han', label: 'Han' },
      { value: 'tang', label: 'Tang' },
    ]
  },
  {
    make: 'chery',
    models: [
      { value: 'arrizo_6', label: 'Arrizo 6' },
      { value: 'arrizo_8', label: 'Arrizo 8' },
      { value: 'tiggo_4_pro', label: 'Tiggo 4 Pro' },
      { value: 'tiggo_7_pro', label: 'Tiggo 7 Pro' },
      { value: 'tiggo_8_pro', label: 'Tiggo 8 Pro' },
      { value: 'tiggo_8_pro_max', label: 'Tiggo 8 Pro Max' },
    ]
  },
  {
    make: 'omoda',
    models: [
      { value: 'omoda_5', label: 'Omoda 5' },
    ]
  },
  {
    make: 'jaecoo',
    models: [
      { value: 'j7', label: 'J7' },
      { value: 'j8', label: 'J8' },
    ]
  },
  {
    make: 'exeed',
    models: [
      { value: 'lx', label: 'LX' },
      { value: 'txl', label: 'TXL' },
      { value: 'rx', label: 'RX' },
      { value: 'vx', label: 'VX' },
    ]
  },
  {
    make: 'jac',
    models: [
      { value: 'j7', label: 'J7' },
      { value: 'js4', label: 'JS4' },
      { value: 't8_pro', label: 'T8 Pro' },
      { value: 'm4', label: 'M4' },
    ]
  },
  {
    make: 'baic',
    models: [
      { value: 'bj40', label: 'BJ40' },
      { value: 'bj40_plus', label: 'BJ40 Plus' },
      { value: 'x7', label: 'X7' },
    ]
  },
  {
    make: 'hongqi',
    models: [
      { value: 'h5', label: 'H5' },
      { value: 'h6', label: 'H6' },
      { value: 'h9', label: 'H9' },
      { value: 'hs5', label: 'HS5' },
      { value: 'hs7', label: 'HS7' },
      { value: 'e-hs9', label: 'E-HS9' },
    ]
  },
  {
    make: 'gwm',
    models: [
      { value: 'poer', label: 'POER' },
      { value: 'wingle_7', label: 'Wingle 7' },
    ]
  },
  {
    make: 'foton',
    models: [
      { value: 'tunland', label: 'Tunland' },
      { value: 'g7', label: 'G7' },
    ]
  },
  {
    make: 'chevrolet',
    models: [
      { value: 'spark', label: 'Spark' },
      { value: 'malibu', label: 'Malibu' },
      { value: 'groove', label: 'Groove' },
      { value: 'captiva', label: 'Captiva' },
      { value: 'trailblazer', label: 'Trailblazer' },
      { value: 'blazer', label: 'Blazer' },
      { value: 'traverse', label: 'Traverse' },
      { value: 'tahoe', label: 'Tahoe' },
      { value: 'suburban', label: 'Suburban' },
      { value: 'silverado', label: 'Silverado' },
      { value: 'camaro', label: 'Camaro' },
      { value: 'corvette', label: 'Corvette' },
    ]
  },
  {
    make: 'gmc',
    models: [
      { value: 'terrain', label: 'Terrain' },
      { value: 'acadia', label: 'Acadia' },
      { value: 'yukon', label: 'Yukon' },
      { value: 'yukon_xl', label: 'Yukon XL' },
      { value: 'sierra', label: 'Sierra' },
    ]
  },
  {
    make: 'dodge',
    models: [
      { value: 'charger', label: 'Charger' },
      { value: 'challenger', label: 'Challenger' },
      { value: 'durango', label: 'Durango' },
    ]
  },
  {
    make: 'ram',
    models: [
      { value: '1500', label: '1500' },
      { value: '2500', label: '2500' },
      { value: '3500', label: '3500' },
    ]
  },
  {
    make: 'cadillac',
    models: [
      { value: 'ct4', label: 'CT4' },
      { value: 'ct5', label: 'CT5' },
      { value: 'xt4', label: 'XT4' },
      { value: 'xt5', label: 'XT5' },
      { value: 'xt6', label: 'XT6' },
      { value: 'escalade', label: 'Escalade' },
      { value: 'lyriq', label: 'Lyriq' },
    ]
  },
  {
    make: 'lincoln',
    models: [
      { value: 'corsair', label: 'Corsair' },
      { value: 'nautilus', label: 'Nautilus' },
      { value: 'aviator', label: 'Aviator' },
      { value: 'navigator', label: 'Navigator' },
    ]
  },
  {
    make: 'skoda',
    models: [
      { value: 'octavia', label: 'Octavia' },
      { value: 'superb', label: 'Superb' },
      { value: 'karoq', label: 'Karoq' },
      { value: 'kodiaq', label: 'Kodiaq' },
      { value: 'kamiq', label: 'Kamiq' },
    ]
  },
  {
    make: 'mini',
    models: [
      { value: '3_door_hatch', label: '3-Door Hatch' },
      { value: '5_door_hatch', label: '5-Door Hatch' },
      { value: 'convertible', label: 'Convertible' },
      { value: 'clubman', label: 'Clubman' },
      { value: 'countryman', label: 'Countryman' },
      { value: 'jcw', label: 'JCW' },
    ]
  },
  {
    make: 'jaguar',
    models: [
      { value: 'xe', label: 'XE' },
      { value: 'xf', label: 'XF' },
      { value: 'e-pace', label: 'E-PACE' },
      { value: 'f-pace', label: 'F-PACE' },
      { value: 'f-type', label: 'F-TYPE' },
      { value: 'i-pace', label: 'I-PACE' },
    ]
  },
  {
    make: 'bentley',
    models: [
      { value: 'continental_gt', label: 'Continental GT' },
      { value: 'flying_spur', label: 'Flying Spur' },
      { value: 'bentayga', label: 'Bentayga' },
    ]
  },
  {
    make: 'rolls_royce',
    models: [
      { value: 'ghost', label: 'Ghost' },
      { value: 'phantom', label: 'Phantom' },
      { value: 'cullinan', label: 'Cullinan' },
      { value: 'spectre', label: 'Spectre' },
    ]
  },
  {
    make: 'aston_martin',
    models: [
      { value: 'vantage', label: 'Vantage' },
      { value: 'db12', label: 'DB12' },
      { value: 'dbx', label: 'DBX' },
      { value: 'dbs', label: 'DBS' },
    ]
  },
  {
    make: 'mclaren',
    models: [
      { value: 'gt', label: 'GT' },
      { value: 'artura', label: 'Artura' },
      { value: '750s', label: '750S' },
      { value: '765lt', label: '765LT' },
    ]
  },
  {
    make: 'ferrari',
    models: [
      { value: 'roma', label: 'Roma' },
      { value: '296_gtb', label: '296 GTB' },
      { value: '296_gts', label: '296 GTS' },
      { value: 'sf90_stradale', label: 'SF90 Stradale' },
      { value: 'sf90_spider', label: 'SF90 Spider' },
      { value: 'purosangue', label: 'Purosangue' },
    ]
  },
  {
    make: 'lamborghini',
    models: [
      { value: 'huracan', label: 'Huracán' },
      { value: 'revuelto', label: 'Revuelto' },
      { value: 'urus', label: 'Urus' },
    ]
  },
  {
    make: 'maserati',
    models: [
      { value: 'ghibli', label: 'Ghibli' },
      { value: 'quattroporte', label: 'Quattroporte' },
      { value: 'levante', label: 'Levante' },
      { value: 'grecale', label: 'Grecale' },
      { value: 'mc20', label: 'MC20' },
    ]
  },
  {
    make: 'alfa_romeo',
    models: [
      { value: 'giulia', label: 'Giulia' },
      { value: 'stelvio', label: 'Stelvio' },
      { value: 'tonale', label: 'Tonale' },
    ]
  },
  {
    make: 'renault',
    models: [
      { value: 'symbol', label: 'Symbol' },
      { value: 'megane', label: 'Megane' },
      { value: 'captur', label: 'Captur' },
      { value: 'koleos', label: 'Koleos' },
      { value: 'duster', label: 'Duster' },
    ]
  },
  {
    make: 'peugeot',
    models: [
      { value: '208', label: '208' },
      { value: '2008', label: '2008' },
      { value: '3008', label: '3008' },
      { value: '5008', label: '5008' },
      { value: '408', label: '408' },
      { value: '508', label: '508' },
      { value: 'partner', label: 'Partner' },
    ]
  },
  {
    make: 'citroen',
    models: [
      { value: 'c3', label: 'C3' },
      { value: 'c3_aircross', label: 'C3 Aircross' },
      { value: 'c4', label: 'C4' },
      { value: 'c5_aircross', label: 'C5 Aircross' },
      { value: 'berlingo', label: 'Berlingo' },
    ]
  },
  {
    make: 'volvo',
    models: [
      { value: 's60', label: 'S60' },
      { value: 's90', label: 'S90' },
      { value: 'xc40', label: 'XC40' },
      { value: 'c40', label: 'C40' },
      { value: 'xc60', label: 'XC60' },
      { value: 'xc90', label: 'XC90' },
    ]
  },
  {
    make: 'cupra',
    models: [
      { value: 'leon', label: 'Leon' },
      { value: 'ateca', label: 'Ateca' },
      { value: 'formentor', label: 'Formentor' },
      { value: 'born', label: 'Born' },
    ]
  }
];

// Import trim functions
import { getTrimsForModel } from './trims';
import { ALL_BRANDS } from './brands';

// Helper function to get models for a specific make with trims
export const getModelsForMake = (make: string): CarModel[] => {
  const makeData = CAR_MODELS.find(m => m.make === make);

  if (makeData) {
    // Add trims to each model
    return makeData.models.map(model => ({
      ...model,
      trims: getTrimsForModel(make, model.label)
    }));
  }

  // If no models found but brand exists in ALL_BRANDS, return "Other" model
  const brandExists = ALL_BRANDS.find(b => b.value === make);
  if (brandExists) {
    return [{ value: 'other', label: 'Other' }];
  }

  // Brand doesn't exist at all
  return [];
};

// Get all models as a flat array with trims
export const getAllModels = (): CarModel[] => {
  return CAR_MODELS.flatMap(makeData =>
    makeData.models.map(model => ({
      ...model,
      trims: getTrimsForModel(makeData.make, model.label)
    }))
  );
};

// Helper function to get models for a specific make without trims (for performance)
export const getModelsForMakeBasic = (make: string): CarModel[] => {
  const makeData = CAR_MODELS.find(m => m.make === make);

  if (makeData) {
    return makeData.models;
  }

  // If no models found but brand exists in ALL_BRANDS, return "Other" model
  const brandExists = ALL_BRANDS.find(b => b.value === make);
  if (brandExists) {
    return [{ value: 'other', label: 'Other' }];
  }

  return [];
};

// Helper function to get trims for a specific model
export const getTrimsForModelByMake = (make: string, modelValue: string): string[] => {
  const makeData = CAR_MODELS.find(m => m.make === make);

  if (makeData) {
    const model = makeData.models.find(m => m.value === modelValue);
    if (model) {
      return getTrimsForModel(make, model.label);
    }
  }

  // If it's the "Other" model for brands without specific models, return empty array
  if (modelValue === 'other') {
    const brandExists = ALL_BRANDS.find(b => b.value === make);
    if (brandExists) {
      return [];
    }
  }

  return [];
};
