import car1 from "@/assets/car1.jpg";
import car2 from "@/assets/car2.jpg";
import car3 from "@/assets/car3.jpg";

export interface Car {
  id: string;
  title: string;
  price: string;
  year: number;
  mileage: string;
  fuelType: string;
  transmission: string;
  image: string;
  gallery: string[];
  dealer: string;
  location: string;
  isNew?: boolean;
  condition: string;
  engine: string;
  power: string;
  topSpeed: string;
  acceleration: string;
  bodyType: string;
  color: string;
  seats: number;
  warranty: string;
  features: string[];
}

export const getCarData = (): Car[] => [
  {
    id: "1",
    title: "BMW 3 Series 2023",
    price: "AED 185,000",
    year: 2023,
    mileage: "15,000 km",
    fuelType: "Petrol",
    transmission: "Automatic",
    image: car1,
    gallery: [car1, car2, car3, car1],
    dealer: "Premium Motors",
    location: "Dubai",
    isNew: true,
    condition: "Excellent",
    engine: "2.0L Turbo 4-Cylinder",
    power: "255 HP",
    topSpeed: "250 km/h",
    acceleration: "6.2 seconds",
    bodyType: "Sedan",
    color: "Alpine White",
    seats: 5,
    warranty: "2 years remaining",
    features: [
      "Navigation System",
      "Leather Seats", 
      "Sunroof",
      "Parking Sensors",
      "Cruise Control",
      "Bluetooth",
      "USB Ports",
      "Climate Control",
      "Alloy Wheels"
    ]
  },
  {
    id: "2",
    title: "Mercedes GLE 2022",
    price: "AED 320,000",
    year: 2022,
    mileage: "22,000 km",
    fuelType: "Petrol",
    transmission: "Automatic",
    image: car2,
    gallery: [car2, car1, car3, car2],
    dealer: "Luxury Cars UAE",
    location: "Abu Dhabi",
    condition: "Very Good",
    engine: "3.0L V6 Turbo",
    power: "362 HP",
    topSpeed: "240 km/h",
    acceleration: "5.7 seconds",
    bodyType: "SUV",
    color: "Obsidian Black",
    seats: 7,
    warranty: "1 year remaining",
    features: [
      "MBUX Infotainment",
      "Premium Sound System",
      "Panoramic Sunroof",
      "360° Camera",
      "Adaptive Cruise Control",
      "Wireless Charging",
      "Ambient Lighting",
      "Heated Seats",
      "Air Suspension"
    ]
  },
  {
    id: "3",
    title: "Ferrari 488 GTB",
    price: "AED 850,000",
    year: 2023,
    mileage: "8,500 km",
    fuelType: "Petrol",
    transmission: "Automatic",
    image: car3,
    gallery: [car3, car1, car2, car3],
    dealer: "Exotic Motors",
    location: "Dubai",
    isNew: true,
    condition: "Like New",
    engine: "3.9L V8 Twin-Turbo",
    power: "661 HP",
    topSpeed: "330 km/h",
    acceleration: "3.0 seconds",
    bodyType: "Coupe",
    color: "Rosso Corsa",
    seats: 2,
    warranty: "3 years remaining",
    features: [
      "Ferrari Infotainment",
      "Carbon Fiber Interior",
      "Launch Control",
      "Sport Exhaust",
      "Racing Seats",
      "Performance Tires",
      "Brembo Brakes",
      "Manettino Dial",
      "Apple CarPlay"
    ]
  },
  {
    id: "4",
    title: "Toyota Camry 2023",
    price: "AED 95,000",
    year: 2023,
    mileage: "12,000 km",
    fuelType: "Hybrid",
    transmission: "Automatic",
    image: car1,
    gallery: [car1, car2, car3, car1],
    dealer: "Al Futtaim Motors",
    location: "Sharjah",
    condition: "Excellent",
    engine: "2.5L Hybrid 4-Cylinder",
    power: "208 HP",
    topSpeed: "180 km/h",
    acceleration: "8.1 seconds",
    bodyType: "Sedan",
    color: "Celestial Silver",
    seats: 5,
    warranty: "5 years remaining",
    features: [
      "Toyota Safety Sense",
      "Hybrid System",
      "Touchscreen Display",
      "Backup Camera",
      "Lane Keeping Assist",
      "Automatic Emergency Braking",
      "Keyless Entry",
      "Dual Zone Climate",
      "LED Headlights"
    ]
  },
  {
    id: "5",
    title: "Audi Q7 2022",
    price: "AED 285,000",
    year: 2022,
    mileage: "18,000 km",
    fuelType: "Petrol",
    transmission: "Automatic",
    image: car2,
    gallery: [car2, car3, car1, car2],
    dealer: "German Auto",
    location: "Dubai",
    condition: "Very Good",
    engine: "3.0L V6 TFSI",
    power: "335 HP",
    topSpeed: "245 km/h",
    acceleration: "5.9 seconds",
    bodyType: "SUV",
    color: "Glacier White",
    seats: 7,
    warranty: "2 years remaining",
    features: [
      "Virtual Cockpit",
      "Quattro AWD",
      "Matrix LED Headlights",
      "Bang & Olufsen Sound",
      "Adaptive Air Suspension",
      "MMI Touch Response",
      "Wireless Apple CarPlay",
      "Massage Seats",
      "Trailer Assist"
    ]
  },
  {
    id: "6",
    title: "Porsche 911 Turbo",
    price: "AED 650,000",
    year: 2023,
    mileage: "5,000 km",
    fuelType: "Petrol",
    transmission: "Automatic",
    image: car3,
    gallery: [car3, car2, car1, car3],
    dealer: "Sports Car Center",
    location: "Abu Dhabi",
    isNew: true,
    condition: "Like New",
    engine: "3.8L Flat-6 Twin-Turbo",
    power: "572 HP",
    topSpeed: "320 km/h",
    acceleration: "2.7 seconds",
    bodyType: "Coupe",
    color: "GT Silver",
    seats: 4,
    warranty: "4 years remaining",
    features: [
      "PCM Infotainment",
      "Sport Chrono Package",
      "PASM Suspension",
      "Ceramic Brakes",
      "Sport Seats Plus",
      "Bose Sound System",
      "Porsche Torque Vectoring",
      "Active Suspension",
      "Performance Battery"
    ]
  }
];