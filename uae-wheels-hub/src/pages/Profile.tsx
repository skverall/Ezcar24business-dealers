import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileAvatar from '@/components/ProfileAvatar';
import PhoneInputMask from '@/components/PhoneInputMask';
import EmptyState from '@/components/EmptyState';
import DashboardCarCard from '@/components/DashboardCarCard';
import DashboardPagination from '@/components/DashboardPagination';
import ActivityItem from '@/components/ActivityItem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Car, Heart, Clock, Plus } from 'lucide-react';

import { useDeleteListing } from '@/hooks/useDashboardData';
import { useLocation, useNavigate } from 'react-router-dom';
interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_dealer: boolean | null;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const deleteMutation = useDeleteListing();

  type Tab = 'profile' | 'listings' | 'favorites' | 'activity';

  const pathToTab = (pathname: string): Tab => {
    const parts = pathname.split('/').filter(Boolean);
    // parts example: ["profile", "favorites"]
    if (parts[0] !== 'profile') return 'profile';
    switch (parts[1]) {
      case 'listings':
        return 'listings';
      case 'favorites':
        return 'favorites';
      case 'activity':
        return 'activity';
      default:
        return 'profile';
    }
  };

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for profile editing
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    location: '',
    bio: '',
  });

  // Tab and pagination state
  const [selectedTab, setSelectedTab] = useState<Tab>(pathToTab(location.pathname));
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [backendProvisioned, setBackendProvisioned] = useState({ listings: true, favorites: true, activities: true });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>("newest");
  // Keep tab in sync with URL when navigating via back/forward or external links
  // React Query listings - this hook doesn't exist, removing for now
  const listingsData = { data: [] };
  const listingsLoading = false;
  const listings = listingsData?.data || [];

  useEffect(() => {
    const tabFromPath = pathToTab(location.pathname);
    if (tabFromPath !== selectedTab) {
      setSelectedTab(tabFromPath);
    }
  }, [location.pathname]);
  // Backward compatibility: support /profile?tab=... by redirecting to /profile/<tab>
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const raw = sp.get('tab');
    const allowed = ['profile', 'listings', 'favorites', 'activity'];
    if (raw && allowed.includes(raw)) {
      const tab = raw as Tab;
      const desired = tab === 'profile' ? '/profile' : `/profile/${tab}`;
      if (location.pathname !== desired || sp.has('tab')) {
        navigate({ pathname: desired, search: '' }, { replace: true });
      }
    }
  }, [location.search, location.pathname]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background w-full overflow-x-hidden flex flex-col">
        <Header />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-12">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Redirect if not authenticated (this should be handled by ProtectedRoute, but just in case)
  if (!user) {
    return (
      <div className="min-h-screen bg-background w-full overflow-x-hidden flex flex-col">
        <Header />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-muted-foreground">Please sign in to access your profile.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) {
        toast({ title: 'Failed to load profile', description: error.message, variant: 'destructive' });
      } else if (data) {
        setProfile(data as ProfileRow);
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          whatsapp: data.whatsapp ?? '',
          location: data.location ?? '',
          bio: data.bio ?? '',
        });
      }
      setLoading(false);
    };
    load();
  }, [user, toast]);

  // Load tab data when tab changes or user becomes available
  useEffect(() => {
    if (!user) return;

    const loadFavorites = async () => {
      setFavoritesLoading(true);
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
          setBackendProvisioned(prev => ({ ...prev, favorites: false }));
        } else if (error) {
          toast({ title: 'Failed to load favorites', description: error.message, variant: 'destructive' });
        } else {
          // Process favorites to extract cover image
          const processedFavorites = (data || []).map((favorite: any) => {
            const listing = favorite.listings;
            if (listing && listing.listing_images) {
              const coverImage = listing.listing_images.find((img: any) => img.is_cover);
              const firstImage = listing.listing_images[0];
              listing.image_url = coverImage?.url || firstImage?.url || null;
            }
            return favorite;
          });
          setFavorites(processedFavorites);
        }
      } finally {
        setFavoritesLoading(false);
      }
    };

    const loadActivity = async () => {
      setActivityLoading(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error?.code === '42P01') {
          setBackendProvisioned(prev => ({ ...prev, activities: false }));
        } else if (error) {
          toast({ title: 'Failed to load activity', description: error.message, variant: 'destructive' });
        } else {
          setActivity(data || []);
        }
      } finally {
        setActivityLoading(false);
      }
    };

    if (selectedTab === 'favorites') loadFavorites();
    if (selectedTab === 'activity') loadActivity();
  }, [selectedTab, user, page, pageSize, sort, toast]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        location: form.location,
        bio: form.bio,
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    }
  };

  const deleteListing = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    // The listings will be refetched automatically by the hook
  };

  const removeFavorite = async (listingId: string) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('listing_id', listingId)
      .eq('user_id', user?.id ?? '');

    if (error) {
      toast({
        title: 'Failed to remove favorite',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
      toast({
        title: 'Removed from favorites',
        description: 'The car has been removed from your favorites.'
      });
    }
  };




  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden flex flex-col">
      <Header />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and listings</p>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => {
          const tab = v as Tab;
          setSelectedTab(tab);
          const to = tab === 'profile' ? '/profile' : `/profile/${tab}`;
          navigate({ pathname: to, search: location.search });
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="text-sm">Profile</TabsTrigger>
            <TabsTrigger value="listings" className="text-sm">My Listings</TabsTrigger>
            <TabsTrigger value="favorites" className="text-sm">Favorites</TabsTrigger>
            <TabsTrigger value="activity" className="text-sm">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Avatar Section */}
                <div className="md:col-span-1">
                  <ProfileAvatar
                    avatarUrl={profile?.avatar_url}
                    fullName={profile?.full_name}
                    onAvatarUpdate={(newUrl) => {
                      setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
                    }}
                    size="xl"
                  />
                </div>

                {/* Profile Form */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input id="full_name" placeholder="Your full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <PhoneInputMask value={form.phone} onChange={(val) => setForm({ ...form, phone: val })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp</Label>
                          <PhoneInputMask value={form.whatsapp} onChange={(val) => setForm({ ...form, whatsapp: val })} placeholder="+971 5x xxx xxxx" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" placeholder="City, Country" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Input id="bio" placeholder="Short description about you" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">My Listings</h2>
                  <p className="text-muted-foreground">
                    {listings.length} {listings.length === 1 ? 'listing' : 'listings'} total
                  </p>
                </div>
              </div>

              {/* Content */}
              {!backendProvisioned.listings ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Car />}
                      title="Backend Not Ready"
                      description="Backend tables for listings are not provisioned yet."
                    />
                  </CardContent>
                </Card>
              ) : listingsLoading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading your listings...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : listings.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Car />}
                      title="No listings yet"
                      description="Start selling your car by creating your first listing. It's quick and easy!"
                      actionButton={{
                        text: "List Your Car",
                        href: "/list-car",
                        variant: "luxury"
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Pagination Controls */}
                  <DashboardPagination
                    currentPage={page}
                    totalItems={listings.length}
                    pageSize={pageSize}
                    sortValue={sort}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    onSortChange={(value) => {
                      setSort(value as any);
                      setPage(1);
                    }}
                    sortOptions={[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'price_asc', label: 'Price: Low to High' },
                      { value: 'price_desc', label: 'Price: High to Low' }
                    ]}
                  />

                  {/* Listings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <DashboardCarCard
                        key={listing.id}
                        id={listing.id}
                        title={listing.title ?? `Listing ${listing.id.slice(0, 6)}`}
                        price={listing.price ?? 'Price not set'}
                        year={listing.year}
                        mileage={listing.mileage}
                        spec={listing.spec}
                        location={listing.city}
                        image={listing.image_url}
                        status={listing.status === 'active' ? 'published' : listing.status === 'sold' ? 'sold' : 'draft'}
                        dateAdded={listing.created_at}
                        views={listing.views ?? 0}
                        showActions={true}
                        variant="listing"
                        onEdit={(id) => {
                          // Navigate to edit listing page
                          navigate(`/list-car?edit=${id}`);
                        }}
                        onDelete={deleteListing}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Favorites</h2>
                  <p className="text-muted-foreground">
                    {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'} saved
                  </p>
                </div>
              </div>

              {/* Content */}
              {!backendProvisioned.favorites ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Heart />}
                      title="Backend Not Ready"
                      description="Backend tables for favorites are not provisioned yet."
                    />
                  </CardContent>
                </Card>
              ) : favoritesLoading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading your favorites...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : favorites.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Heart />}
                      title="You have no favorites yet"
                      description="Start browsing cars and save your favorites to see them here. Click the heart icon on any car listing to add it to your favorites."
                      actionButton={{
                        text: "Explore Cars",
                        href: "/browse",
                        variant: "luxury"
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => (
                    <DashboardCarCard
                      key={favorite.id}
                      id={favorite.listing_id}
                      title={favorite.listings?.title ?? `Listing ${favorite.listing_id?.slice?.(0, 6)}`}
                      price={favorite.listings?.price ?? 'Price not available'}
                      year={favorite.listings?.year}
                      mileage={favorite.listings?.mileage}
                      location={favorite.listings?.city}
                      image={favorite.listings?.image_url}
                      isFavorite={true}
                      variant="favorite"
                      onRemoveFavorite={(listingId) => removeFavorite(listingId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>
                  <p className="text-muted-foreground">
                    Your latest actions and updates
                  </p>
                </div>
              </div>

              {/* Content */}
              {!backendProvisioned.activities ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Clock />}
                      title="Backend Not Ready"
                      description="Backend tables for activity are not provisioned yet."
                    />
                  </CardContent>
                </Card>
              ) : activityLoading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading your activity...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : activity.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Clock />}
                      title="No recent activity"
                      description="Your activity will appear here when you start listing cars, updating listings, or interacting with the platform."
                      actionButton={{
                        text: "List Your Car",
                        href: "/list-car",
                        variant: "luxury"
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Group activities by date */}
                  {(() => {
                    const groupedActivities = activity.reduce((groups: any, activity: any) => {
                      const date = new Date(activity.created_at).toDateString();
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(activity);
                      return groups;
                    }, {});

                    return Object.entries(groupedActivities).map(([date, activities]: [string, any]) => (
                      <div key={date} className="space-y-3">
                        {/* Date Header */}
                        <div className="flex items-center gap-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>

                        {/* Activities for this date */}
                        <div className="space-y-3">
                          {activities.map((activityItem: any) => (
                            <ActivityItem
                              key={activityItem.id}
                              id={activityItem.id}
                              type={activityItem.type}
                              title={activityItem.title}
                              description={activityItem.description}
                              timestamp={activityItem.created_at}
                              listingId={activityItem.listing_id}
                              listingTitle={activityItem.payload?.title}
                              payload={activityItem.payload}
                            />
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;

