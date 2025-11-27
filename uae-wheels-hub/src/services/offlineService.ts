import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface OfflineListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
  description?: string;
  location?: string;
  cached_at: string;
  expires_at: string;
}

export interface OfflineData {
  listings: OfflineListing[];
  favorites: string[];
  lastSync: string;
}

class OfflineService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHED_LISTINGS = 50;
  private readonly OFFLINE_DATA_FILE = 'offline_data.json';

  async isSupported(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  async saveListingForOffline(listing: any): Promise<boolean> {
    if (!await this.isSupported()) {
      console.log('Offline storage not supported on this platform');
      return false;
    }

    try {
      const offlineData = await this.getOfflineData();
      
      const offlineListing: OfflineListing = {
        id: listing.id,
        title: listing.title,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        images: listing.images || [],
        description: listing.description,
        location: listing.location,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString()
      };

      // Remove existing entry if it exists
      offlineData.listings = offlineData.listings.filter(l => l.id !== listing.id);
      
      // Add new entry at the beginning
      offlineData.listings.unshift(offlineListing);
      
      // Keep only the most recent listings
      if (offlineData.listings.length > this.MAX_CACHED_LISTINGS) {
        offlineData.listings = offlineData.listings.slice(0, this.MAX_CACHED_LISTINGS);
      }

      await this.saveOfflineData(offlineData);
      console.log(`Saved listing ${listing.id} for offline viewing`);
      return true;
    } catch (error) {
      console.error('Error saving listing for offline:', error);
      return false;
    }
  }

  async getOfflineListings(): Promise<OfflineListing[]> {
    if (!await this.isSupported()) {
      return [];
    }

    try {
      const offlineData = await this.getOfflineData();
      const now = new Date();
      
      // Filter out expired listings
      const validListings = offlineData.listings.filter(listing => {
        const expiresAt = new Date(listing.expires_at);
        return expiresAt > now;
      });

      // Update the data if we removed expired listings
      if (validListings.length !== offlineData.listings.length) {
        offlineData.listings = validListings;
        await this.saveOfflineData(offlineData);
      }

      return validListings;
    } catch (error) {
      console.error('Error getting offline listings:', error);
      return [];
    }
  }

  async getOfflineListing(id: string): Promise<OfflineListing | null> {
    const listings = await this.getOfflineListings();
    return listings.find(listing => listing.id === id) || null;
  }

  async saveFavoriteForOffline(listingId: string): Promise<boolean> {
    if (!await this.isSupported()) {
      return false;
    }

    try {
      const offlineData = await this.getOfflineData();
      
      if (!offlineData.favorites.includes(listingId)) {
        offlineData.favorites.push(listingId);
        await this.saveOfflineData(offlineData);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving favorite for offline:', error);
      return false;
    }
  }

  async removeFavoriteFromOffline(listingId: string): Promise<boolean> {
    if (!await this.isSupported()) {
      return false;
    }

    try {
      const offlineData = await this.getOfflineData();
      offlineData.favorites = offlineData.favorites.filter(id => id !== listingId);
      await this.saveOfflineData(offlineData);
      return true;
    } catch (error) {
      console.error('Error removing favorite from offline:', error);
      return false;
    }
  }

  async getOfflineFavorites(): Promise<string[]> {
    if (!await this.isSupported()) {
      return [];
    }

    try {
      const offlineData = await this.getOfflineData();
      return offlineData.favorites;
    } catch (error) {
      console.error('Error getting offline favorites:', error);
      return [];
    }
  }

  async clearOfflineData(): Promise<boolean> {
    if (!await this.isSupported()) {
      return false;
    }

    try {
      await Filesystem.deleteFile({
        path: this.OFFLINE_DATA_FILE,
        directory: Directory.Data
      });
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  }

  async getOfflineDataSize(): Promise<{ listings: number; totalSizeMB: number }> {
    if (!await this.isSupported()) {
      return { listings: 0, totalSizeMB: 0 };
    }

    try {
      const offlineData = await this.getOfflineData();
      const dataString = JSON.stringify(offlineData);
      const sizeBytes = new Blob([dataString]).size;
      const sizeMB = sizeBytes / (1024 * 1024);
      
      return {
        listings: offlineData.listings.length,
        totalSizeMB: Math.round(sizeMB * 100) / 100
      };
    } catch (error) {
      console.error('Error getting offline data size:', error);
      return { listings: 0, totalSizeMB: 0 };
    }
  }

  private async getOfflineData(): Promise<OfflineData> {
    try {
      const result = await Filesystem.readFile({
        path: this.OFFLINE_DATA_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

      return JSON.parse(result.data as string);
    } catch (error) {
      // File doesn't exist or is corrupted, return default data
      return {
        listings: [],
        favorites: [],
        lastSync: new Date().toISOString()
      };
    }
  }

  private async saveOfflineData(data: OfflineData): Promise<void> {
    data.lastSync = new Date().toISOString();
    
    await Filesystem.writeFile({
      path: this.OFFLINE_DATA_FILE,
      data: JSON.stringify(data),
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async syncWhenOnline(): Promise<void> {
    if (await this.isOnline()) {
      // Here you could implement sync logic with your backend
      console.log('Device is online, sync could be performed');
    }
  }
}

export const offlineService = new OfflineService();
