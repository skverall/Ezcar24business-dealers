import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CarCard from '@/components/CarCardDubizzle';

const CardTest = () => {
  // Test cases for different card content scenarios
  const testCars = [
    // Test case 1: Short title, full metadata
    {
      id: '1',
      title: 'BMW X5',
      price: 'AED 185,000',
      year: 2023,
      mileage: '15,000 km',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&h=375&fit=crop',
      images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&h=375&fit=crop'],
      dealer: 'Premium Motors',
      location: 'Dubai',
      isNew: true
    },
    // Test case 2: Very long title (should truncate to 2 lines)
    {
      id: '2',
      title: 'Mercedes-Benz GLE 450 4MATIC AMG Line Premium Plus Package with Panoramic Sunroof and Advanced Driver Assistance',
      price: 'AED 275,000',
      year: 2022,
      mileage: '25,000 km',
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&h=375&fit=crop',
      images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&h=375&fit=crop'],
      dealer: 'Luxury Car Center',
      location: 'Abu Dhabi',
      isNew: false
    },
    // Test case 3: Missing some metadata
    {
      id: '3',
      title: 'Toyota Camry SE',
      price: 'AED 95,000',
      year: 2021,
      mileage: '',
      fuelType: '',
      transmission: 'CVT',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=500&h=375&fit=crop',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=500&h=375&fit=crop'],
      dealer: 'City Motors',
      location: 'Sharjah',
      isNew: false
    },
    // Test case 4: Very long dealer and location names
    {
      id: '4',
      title: 'Audi Q7 Quattro',
      price: 'AED 320,000',
      year: 2023,
      mileage: '8,500 km',
      fuelType: 'Diesel',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=375&fit=crop',
      images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=375&fit=crop'],
      dealer: 'Premium Luxury Automotive Excellence Center',
      location: 'Ras Al Khaimah',
      isNew: true
    },
    // Test case 5: Vertical image (should maintain aspect ratio)
    {
      id: '5',
      title: 'Porsche 911 Turbo S',
      price: 'AED 650,000',
      year: 2023,
      mileage: '2,500 km',
      fuelType: 'Petrol',
      transmission: 'PDK',
      image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=500&h=750&fit=crop',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=500&h=750&fit=crop'],
      dealer: 'Sports Car Center',
      location: 'Dubai',
      isNew: true
    },
    // Test case 6: Panoramic image (should maintain aspect ratio)
    {
      id: '6',
      title: 'Range Rover Evoque',
      price: 'AED 195,000',
      year: 2022,
      mileage: '18,000 km',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=300&fit=crop',
      images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=300&fit=crop'],
      dealer: 'Land Rover Dealer',
      location: 'Fujairah',
      isNew: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Car Card Consistency Test</h1>
            <p className="text-muted-foreground mb-6">
              Testing different scenarios to ensure all cards have consistent height and layout:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-8">
              <li>• Card 1: Short title, full metadata</li>
              <li>• Card 2: Very long title (should truncate to 2 lines)</li>
              <li>• Card 3: Missing some metadata (should show N/A)</li>
              <li>• Card 4: Long dealer/location names (should truncate)</li>
              <li>• Card 5: Vertical image (should maintain 4:3 aspect ratio)</li>
              <li>• Card 6: Panoramic image (should maintain 4:3 aspect ratio)</li>
            </ul>
          </div>

          {/* Test Grid */}
          <div className="car-card-grid max-w-7xl mx-auto">
            {testCars.map((car) => (
              <div key={car.id} className="car-card-container">
                <CarCard {...car} />
              </div>
            ))}
          </div>

          {/* Browser Zoom Test Instructions */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Manual Testing Instructions</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold">1. Height Consistency Test:</h3>
                <p>All cards in each row should have exactly the same height. Resize browser window to test different breakpoints.</p>
              </div>
              <div>
                <h3 className="font-semibold">2. Browser Zoom Test:</h3>
                <p>Test at 90%, 100%, and 110% zoom levels. Grid should not break and heights should remain consistent.</p>
              </div>
              <div>
                <h3 className="font-semibold">3. Text Truncation Test:</h3>
                <p>Long titles should be truncated to 2 lines max. Long dealer/location names should be truncated to 1 line.</p>
              </div>
              <div>
                <h3 className="font-semibold">4. Image Aspect Ratio Test:</h3>
                <p>All images should maintain 4:3 aspect ratio regardless of original image dimensions.</p>
              </div>
              <div>
                <h3 className="font-semibold">5. Missing Data Test:</h3>
                <p>Missing metadata should show "N/A" without affecting card height.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CardTest;
