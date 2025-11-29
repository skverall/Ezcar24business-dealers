import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { crmSupabase } from '@/integrations/supabase/crmClient';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { useAuth } from '@/hooks/useAuth';
import { useCrmAuth } from '@/hooks/useCrmAuth';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

// ... existing code ...

// Dealer Profile Hook
export const useDealerProfile = () => {
  const { user } = useCrmAuth();

  return useQuery({
    queryKey: ['dealer_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Use CRM Supabase for dealer profile
      const { data, error } = await crmSupabase
        .from('crm_dealer_users')
        .select('*')
        .eq('id', user.id)
        .single();

      // If no profile exists, create a minimal one so queries can proceed
      if (error?.code === 'PGRST116' || error?.message?.toLowerCase().includes('row not found') || (!data && !error)) {
        const fallbackProfile = {
          id: user.id,
          dealer_id: user.id,
          name: user.user_metadata?.full_name || user.email || 'Dealer'
        };

        const { data: inserted, error: insertError } = await crmSupabase
          .from('dealer_users')
          .upsert(fallbackProfile)
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating dealer profile:', insertError);
          return fallbackProfile; // return fallback so UI can still function
        }

        return inserted || fallbackProfile;
      }

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

// Dealer Users Hook
export const useDealerUsers = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();

  return useQuery({
    queryKey: ['dealer_users', user?.id, dealerProfile?.dealer_id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      const { data, error } = await crmSupabase
        .from('crm_dealer_users')
        .select('*')
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 5 * 60 * 1000,
  });
};

// Expenses Hook
export const useExpenses = (timeRange: 'today' | 'week' | 'month' | 'year' = 'today') => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const queryKey = ['expenses', user?.id, timeRange];

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'crm_expenses',
    queryKey: ['expenses'], // Invalidate all expense queries
    filter: dealerProfile?.dealer_id ? `dealer_id=eq.${dealerProfile.dealer_id}` : undefined
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Use CRM Supabase for expenses
      let query = crmSupabase
        .from('crm_expenses')
        .select('*')
        .order('date', { ascending: false });

      // Filter by dealer_id if available; otherwise fall back to user_id
      const dealerId = dealerProfile?.dealer_id || user.id;
      query = query.eq('dealer_id', dealerId);

      const now = new Date();
      const startDate = new Date();
      // Set to local midnight to respect user's timezone
      startDate.setHours(0, 0, 0, 0);

      let dateString = '';

      switch (timeRange) {
        case 'today':
          // For today, we want expenses from the start of the day (local time)
          dateString = format(startDate, 'yyyy-MM-dd');
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          dateString = format(startDate, 'yyyy-MM-dd');
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          dateString = format(startDate, 'yyyy-MM-dd');
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          dateString = format(startDate, 'yyyy-MM-dd');
          break;
      }

      query = query.gte('date', dateString).is('deleted_at', null);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute stale time, rely on realtime for updates
  });
};

// Financial Accounts Hook
export const useFinancialAccounts = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const queryKey = ['financial_accounts', user?.id, dealerProfile?.dealer_id];

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'crm_financial_accounts',
    queryKey: ['financial_accounts'],
    filter: dealerProfile?.dealer_id ? `dealer_id=eq.${dealerProfile.dealer_id}` : undefined
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      // Use CRM Supabase for financial accounts
      const { data, error } = await crmSupabase
        .from('crm_financial_accounts')
        .select('*')
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 1000 * 60,
  });
};

// Sales hook
export const useSales = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const queryKey = ['sales', user?.id, dealerProfile?.dealer_id];

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'crm_sales',
    queryKey: ['sales'],
    filter: dealerProfile?.dealer_id ? `dealer_id=eq.${dealerProfile.dealer_id}` : undefined
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      // Use CRM Supabase for sales
      const { data, error } = await crmSupabase
        .from('crm_sales')
        .select(`
          *,
          vehicles:crm_vehicles (
            id,
            make,
            model,
            year,
            vin,
            purchase_price
          )
        `)
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 1000 * 60,
  });
};

// Vehicles hook
export const useVehicles = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const queryKey = ['vehicles', user?.id, dealerProfile?.dealer_id];

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'crm_vehicles',
    queryKey: ['vehicles'],
    filter: dealerProfile?.dealer_id ? `dealer_id=eq.${dealerProfile.dealer_id}` : undefined
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      // Use CRM Supabase for vehicles
      const { data, error } = await crmSupabase
        .from('crm_vehicles')
        .select('*')
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 1000 * 60,
  });
};

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



// Add Expense Mutation
export const useAddExpense = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData: any) => {
      if (!user) throw new Error('User not authenticated');
      const dealerId = dealerProfile?.dealer_id || user.id;

      const { error } = await crmSupabase
        .from('crm_expenses')
        .insert({
          ...expenseData,
          user_id: expenseData.user_id || user.id,
          dealer_id: dealerId
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
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      if (!user) throw new Error('User not authenticated');
      const dealerId = dealerProfile?.dealer_id || user.id;

      const { error } = await crmSupabase
        .from('crm_expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', expenseId)
        .eq('dealer_id', dealerId);

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

// Add Vehicle Mutation
export const useAddVehicle = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleData: any) => {
      if (!user) throw new Error('User not authenticated');
      const dealerId = dealerProfile?.dealer_id || user.id;

      const { error } = await crmSupabase
        .from('crm_vehicles')
        .insert({
          ...vehicleData,
          dealer_id: dealerId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['financial_accounts'] }); // Assets might change
      toast({
        title: 'Vehicle added',
        description: 'Vehicle has been added to inventory successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add vehicle',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Clients Hook
export const useClients = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();

  return useQuery({
    queryKey: ['clients', user?.id, dealerProfile?.dealer_id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!dealerProfile?.dealer_id) return [];

      const { data, error } = await crmSupabase
        .from('crm_dealer_clients' as any)
        .select('*')
        .eq('dealer_id', dealerProfile.dealer_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealerProfile?.dealer_id,
    staleTime: 2 * 60 * 1000,
  });
};

// Add Client Mutation
export const useAddClient = () => {
  const { user } = useCrmAuth();
  const { data: dealerProfile } = useDealerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: any) => {
      if (!user) throw new Error('User not authenticated');
      const dealerId = dealerProfile?.dealer_id || user.id;

      const { error } = await crmSupabase
        .from('crm_dealer_clients' as any)
        .insert({
          ...clientData,
          dealer_id: dealerId,
          status: clientData.status || 'active'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client added',
        description: 'Client has been added successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add client',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Utility hook for refreshing all dashboard data
export const useRefreshDashboard = () => {
  const { user } = useAuth();
  const { user: crmUser } = useCrmAuth();
  const queryClient = useQueryClient();

  return () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['listings', user.id] });
      queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
      queryClient.invalidateQueries({ queryKey: ['activity', user.id] });
    }

    if (crmUser) {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  };
};
