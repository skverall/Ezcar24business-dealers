import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import DashboardCarCard from '@/components/DashboardCarCard';

export default function ProfileFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
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
          setFavorites([]);
        } else if (error) {
          toast({ title: 'Failed to load favorites', description: error.message, variant: 'destructive' });
        } else {
          // Process favorites to extract cover image
          const processedFavorites = (data || []).map((favorite: any) => {
            const listing = favorite.listings;
            if (listing && listing.listing_images) {
              const coverImage = listing.listing_images.find((img: any) => img.is_cover);
              const firstImage = listing.listing_images[0];
              listing.image_url = getProxiedImageUrl(coverImage?.url || firstImage?.url || '');
            }
            return favorite;
          });
          setFavorites(processedFavorites);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, toast]);

  const removeFavorite = async (listingId: string) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('listing_id', listingId)
      .eq('user_id', user?.id ?? '');
    if (error) {
      toast({ title: 'Failed to remove favorite', description: error.message, variant: 'destructive' });
    } else {
      setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
      toast({ title: 'Removed from favorites', description: 'The car has been removed from your favorites.' });
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your favorites...</p>
          </CardContent>
        </Card>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<span>❤️</span>}
              title="You have no favorites yet"
              description="Start browsing cars and save your favorites to see them here. Click the heart icon on any car listing to add it to your favorites."
              actionButton={{ text: 'Explore Cars', href: '/browse', variant: 'luxury' }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((f:any)=> (
            <DashboardCarCard
              key={f.id}
              id={f.listing_id}
              title={f.listings?.title ?? `Listing ${f.listing_id?.slice?.(0,6)}`}
              price={f.listings?.price ?? 'Price not available'}
              year={f.listings?.year}
              mileage={f.listings?.mileage}
              spec={f.listings?.spec}
              location={f.listings?.city}
              image={f.listings?.image_url}
              isFavorite
              variant="favorite"
              onRemoveFavorite={removeFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

