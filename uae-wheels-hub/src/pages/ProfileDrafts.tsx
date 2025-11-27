import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftListings, useDeleteListing } from '@/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import DashboardCarCard from '@/components/DashboardCarCard';

export default function ProfileDrafts() {
  const navigate = useNavigate();
  const deleteMutation = useDeleteListing();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<'newest'|'oldest'|'price_asc'|'price_desc'>('newest');

  const { data, isLoading } = useDraftListings(page, pageSize, sort);
  const listings = data?.data || [];

  const deleteListing = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your drafts...</p>
          </CardContent>
        </Card>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<span>📝</span>}
              title="No drafts yet"
              description="Start a new listing and save as draft to see it here."
              actionButton={{ text: 'List Your Car', href: '/list-car', variant: 'luxury' }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l: any) => (
            <DashboardCarCard
              key={l.id}
              id={l.id}
              title={l.title ?? `Listing ${l.id.slice(0,6)}`}
              price={l.price ?? 'Price not set'}
              year={l.year}
              mileage={l.mileage}
              spec={l.spec}
              location={l.city}
              image={l.image_url}
              status={l.is_draft ? 'draft' : l.status === 'sold' ? 'sold' : 'published'}
              dateAdded={l.created_at}
              views={l.views ?? 0}
              showActions
              variant="listing"
              moderationStatus={l.moderation_status}
              onEdit={(id) => navigate(`/list-car?edit=${id}`)}
              onDelete={deleteListing}
            />
          ))}
        </div>
      )}
    </div>
  );
}

