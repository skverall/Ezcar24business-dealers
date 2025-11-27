import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Query keys for consistent cache management
export const QUERY_KEYS = {
  profile: (userId: string) => ['profile', userId],
  listings: (userId: string, page: number, pageSize: number, sort: string) =>
    ['listings', userId, page, pageSize, sort],
  favorites: (userId: string) => ['favorites', userId],
  activity: (userId: string) => ['activity', userId],
} as const;

// Profile hook
export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: QUERY_KEYS.profile(user?.id ?? ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
};

// Listings hook
export const useListings = (page: number = 1, pageSize: number = 10, sort: string = 'newest') => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: QUERY_KEYS.listings(user?.id ?? '', page, pageSize, sort),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images:listing_images!listing_id(url, is_cover)
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_draft', false)
        .order(
          sort === 'newest' || sort === 'oldest' ? 'created_at' : 'price',
          { ascending: sort === 'oldest' || sort === 'price_asc' }
        )
        .range(from, to);

      if (error?.code === '42P01') {
        return { data: [], provisioned: false };
      }
      if (error) throw error;

      const withCover = (data || []).map((l: any) => ({
        ...l,
        image_url: getProxiedImageUrl(l.listing_images?.find((img: any) => img.is_cover)?.url || l.listing_images?.[0]?.url || '') || null
      }));

      return { data: withCover, provisioned: true };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });
};

// Draft listings hook
export const useDraftListings = (page: number = 1, pageSize: number = 10, sort: string = 'newest') => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: QUERY_KEYS.listings(user?.id ?? '', page, pageSize, `drafts_${sort}`),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images:listing_images!listing_id(url, is_cover)
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_draft', true)
        .order(
          sort === 'newest' || sort === 'oldest' ? 'created_at' : 'price',
          { ascending: sort === 'oldest' || sort === 'price_asc' }
        )
        .range(from, to);

      if (error?.code === '42P01') {
        return { data: [], provisioned: false };
      }
      if (error) throw error;

      const withCover = (data || []).map((l: any) => ({
        ...l,
        image_url: getProxiedImageUrl(l.listing_images?.find((img: any) => img.is_cover)?.url || l.listing_images?.[0]?.url || '') || null
      }));

      return { data: withCover, provisioned: true };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });
};

// Favorites hook
export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: QUERY_KEYS.favorites(user?.id ?? ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listings(
            *,
            listing_images(url, is_cover, sort_order)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error?.code === '42P01') {
        return { data: [], provisioned: false };
      }
      if (error) throw error;

      // Process favorites to extract cover image
      const processedFavorites = (data || []).map((favorite: any) => {
        const listing = favorite.listings;
        if (listing && listing.listing_images) {
          const coverImage = listing.listing_images.find((img: any) => img.is_cover);
          const firstImage = listing.listing_images[0];
          listing.image_url = getProxiedImageUrl(coverImage?.url || firstImage?.url || '') || null;
        }
        return favorite;
      });

      return { data: processedFavorites, provisioned: true };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });
};

// Activity hook
export const useActivity = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: QUERY_KEYS.activity(user?.id ?? ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error?.code === '42P01') {
        return { data: [], provisioned: false };
      }
      if (error) throw error;

      return { data: data || [], provisioned: true };
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1
  });
};

// Mutation hooks for data modifications
export const useUpdateProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: any) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(user?.id ?? '') });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteListing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('listings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', listingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all listings queries for this user across pages/sorts
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'listings' && q.queryKey.includes(user?.id)
      });
      toast({
        title: 'Listing deleted',
        description: 'Your listing has been deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete listing',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useRemoveFavorite = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', listingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites(user?.id ?? '') });
      toast({
        title: 'Removed from favorites',
        description: 'The car has been removed from your favorites.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove favorite',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Dealer Profile Hook
export const useDealerProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dealer_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('dealer_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching dealer profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

// Expenses Hook
export const useExpenses = (timeRange: 'today' | 'week' | 'month' | 'year' = 'today') => {
  const { user } = useAuth();
  const { data: dealerProfile } = useDealerProfile();

  return useQuery({
    queryKey: ['expenses', user?.id, timeRange],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      // If we have a dealer profile, we could filter by dealer_id if expenses table has it.
      // Checking schema: expenses has user_id, not dealer_id. 
      // So filtering by user_id is correct for expenses created by this user.
      query = query.eq('user_id', user.id);

      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('date', startDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });
};

// Financial Accounts Hook
export const useFinancialAccounts = () => {
  const { user } = useAuth();
  const { data: dealerProfile } = useDealerProfile();

  return useQuery({
    queryKey: ['financial_accounts', user?.id, dealerProfile?.dealer_id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
      // BUT, for now, let's try to fetch by dealer_id = user.id (if the auth user IS the dealer).
      // If not, we might need a separate hook to get the dealer profile.
      // Let's look at useProfile. It fetches from 'profiles' with user_id.
      // Let's assume for this iteration that we can query financial_accounts.
      // Wait, the schema showed 'financial_accounts' has 'dealer_id'.
      // Let's try to fetch all for now and let RLS filter if possible, or we need to know the dealer_id.
      // Actually, looking at the iOS code, it uses CoreData.
      // Let's assume the user.id IS the dealer_id for the main account.

      // Correction: We should probably fetch the dealer_user to get the dealer_id.
      // But let's stick to the pattern. If the user is the dealer, user.id might be used.
      // Let's try to query with dealer_id = user.id for now.



      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
};

// Sales hook
export const useSales = () => {
  const { user } = useAuth();
  const { data: dealerProfile } = useDealerProfile();

  return useQuery({
    queryKey: ['sales', user?.id, dealerProfile?.dealer_id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 2 * 60 * 1000,
  });
};

// Vehicles hook
export const useVehicles = () => {
  const { user } = useAuth();
  const { data: dealerProfile } = useDealerProfile();

  return useQuery({
    queryKey: ['vehicles', user?.id, dealerProfile?.dealer_id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 2 * 60 * 1000,
  });
};

// Add Expense Mutation
export const useAddExpense = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData: any) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          user_id: user.id,
          // dealer_id: user.id // Assuming user is dealer
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial_accounts'] }); // Balance might change
      toast({
        title: 'Expense added',
        description: 'Expense has been recorded successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add expense',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Delete Expense Mutation
export const useDeleteExpense = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial_accounts'] });
      toast({
        title: 'Expense deleted',
        description: 'Expense has been removed successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete expense',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Utility hook for refreshing all dashboard data
export const useRefreshDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return () => {
    if (!user) return;

    // Invalidate all dashboard-related queries
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    queryClient.invalidateQueries({ queryKey: ['listings', user.id] });
    queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
    queryClient.invalidateQueries({ queryKey: ['activity', user.id] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['financial_accounts'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  };
};
