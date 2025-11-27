import { useState, useEffect, useCallback } from 'react';
import { offlineService, OfflineListing } from '@/services/offlineService';
import { useToast } from '@/hooks/use-toast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineListings, setOfflineListings] = useState<OfflineListing[]>([]);
  const [offlineFavorites, setOfflineFavorites] = useState<string[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if offline functionality is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await offlineService.isSupported();
      setIsSupported(supported);
      setLoading(false);
    };
    checkSupport();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineService.syncWhenOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re offline',
        description: 'You can still view your saved listings and favorites.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load offline data when supported
  useEffect(() => {
    if (isSupported) {
      loadOfflineData();
    }
  }, [isSupported]);

  const loadOfflineData = useCallback(async () => {
    if (!isSupported) return;

    try {
      const [listings, favorites] = await Promise.all([
        offlineService.getOfflineListings(),
        offlineService.getOfflineFavorites()
      ]);

      setOfflineListings(listings);
      setOfflineFavorites(favorites);
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, [isSupported]);

  const saveListingForOffline = useCallback(async (listing: any): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Offline not supported',
        description: 'Offline viewing is only available on mobile devices.',
        variant: 'destructive'
      });
      return false;
    }

    const success = await offlineService.saveListingForOffline(listing);
    
    if (success) {
      await loadOfflineData();
      toast({
        title: 'Saved for offline',
        description: 'This listing is now available offline.',
      });
    } else {
      toast({
        title: 'Failed to save',
        description: 'Could not save listing for offline viewing.',
        variant: 'destructive'
      });
    }

    return success;
  }, [isSupported, loadOfflineData, toast]);

  const getOfflineListing = useCallback(async (id: string): Promise<OfflineListing | null> => {
    if (!isSupported) return null;
    return await offlineService.getOfflineListing(id);
  }, [isSupported]);

  const saveFavoriteForOffline = useCallback(async (listingId: string): Promise<boolean> => {
    if (!isSupported) return false;

    const success = await offlineService.saveFavoriteForOffline(listingId);
    
    if (success) {
      await loadOfflineData();
    }

    return success;
  }, [isSupported, loadOfflineData]);

  const removeFavoriteFromOffline = useCallback(async (listingId: string): Promise<boolean> => {
    if (!isSupported) return false;

    const success = await offlineService.removeFavoriteFromOffline(listingId);
    
    if (success) {
      await loadOfflineData();
    }

    return success;
  }, [isSupported, loadOfflineData]);

  const clearOfflineData = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const success = await offlineService.clearOfflineData();
    
    if (success) {
      setOfflineListings([]);
      setOfflineFavorites([]);
      toast({
        title: 'Offline data cleared',
        description: 'All offline listings and favorites have been removed.',
      });
    } else {
      toast({
        title: 'Failed to clear data',
        description: 'Could not clear offline data.',
        variant: 'destructive'
      });
    }

    return success;
  }, [isSupported, toast]);

  const getOfflineDataSize = useCallback(async () => {
    if (!isSupported) return { listings: 0, totalSizeMB: 0 };
    return await offlineService.getOfflineDataSize();
  }, [isSupported]);

  const isListingSavedOffline = useCallback((listingId: string): boolean => {
    return offlineListings.some(listing => listing.id === listingId);
  }, [offlineListings]);

  const isFavoriteSavedOffline = useCallback((listingId: string): boolean => {
    return offlineFavorites.includes(listingId);
  }, [offlineFavorites]);

  return {
    isOnline,
    isSupported,
    loading,
    offlineListings,
    offlineFavorites,
    saveListingForOffline,
    getOfflineListing,
    saveFavoriteForOffline,
    removeFavoriteFromOffline,
    clearOfflineData,
    getOfflineDataSize,
    isListingSavedOffline,
    isFavoriteSavedOffline,
    loadOfflineData
  };
};
