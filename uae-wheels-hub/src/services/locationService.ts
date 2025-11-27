import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationResult {
  success: boolean;
  coordinates?: LocationCoordinates;
  error?: string;
}

export interface NearbySearchOptions {
  coordinates: LocationCoordinates;
  radiusKm?: number;
  maxResults?: number;
}

class LocationService {
  private lastKnownLocation: LocationCoordinates | null = null;
  private watchId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Location services only available on native platforms');
      return false;
    }

    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(options?: PositionOptions): Promise<LocationResult> {
    try {
      // Check if we have permission
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Location permission denied'
        };
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      });

      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      this.lastKnownLocation = coordinates;

      return {
        success: true,
        coordinates
      };
    } catch (error: any) {
      console.error('Error getting current location:', error);
      return {
        success: false,
        error: error.message || 'Failed to get location'
      };
    }
  }

  async watchPosition(
    callback: (result: LocationResult) => void,
    options?: PositionOptions
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        callback({
          success: false,
          error: 'Location permission denied'
        });
        return null;
      }

      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
        ...options
      }, (position: Position | null, err?: any) => {
        if (err) {
          callback({
            success: false,
            error: err.message || 'Location watch error'
          });
          return;
        }

        if (position) {
          const coordinates: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          this.lastKnownLocation = coordinates;

          callback({
            success: true,
            coordinates
          });
        }
      });

      return this.watchId;
    } catch (error: any) {
      console.error('Error watching position:', error);
      callback({
        success: false,
        error: error.message || 'Failed to watch position'
      });
      return null;
    }
  }

  async clearWatch(): Promise<void> {
    if (this.watchId) {
      try {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
      } catch (error) {
        console.error('Error clearing location watch:', error);
      }
    }
  }

  getLastKnownLocation(): LocationCoordinates | null {
    return this.lastKnownLocation;
  }

  // Calculate distance between two coordinates in kilometers
  calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * 
      Math.cos(this.toRadians(coord2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get city name from coordinates (requires reverse geocoding service)
  async getCityFromCoordinates(coordinates: LocationCoordinates): Promise<string | null> {
    try {
      // This is a simplified version - in production you'd use a proper geocoding service
      // For UAE, we can make educated guesses based on coordinates
      const { latitude, longitude } = coordinates;
      
      // UAE approximate boundaries
      if (latitude >= 22.5 && latitude <= 26.5 && longitude >= 51 && longitude <= 56.5) {
        // Dubai area
        if (latitude >= 24.8 && latitude <= 25.5 && longitude >= 54.8 && longitude <= 55.8) {
          return 'Dubai';
        }
        // Abu Dhabi area
        else if (latitude >= 24.0 && latitude <= 24.8 && longitude >= 54.0 && longitude <= 55.0) {
          return 'Abu Dhabi';
        }
        // Sharjah area
        else if (latitude >= 25.2 && latitude <= 25.6 && longitude >= 55.3 && longitude <= 55.8) {
          return 'Sharjah';
        }
        // Default to UAE
        return 'UAE';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      return null;
    }
  }

  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Check if location services are enabled
  async isLocationEnabled(): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return false;
      }

      // Try to get current position with a short timeout
      const result = await this.getCurrentLocation({ timeout: 5000 });
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

export const locationService = new LocationService();
