import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import DashboardCarCard from '@/components/DashboardCarCard';
import DashboardPagination from '@/components/DashboardPagination';
import { useNavigate } from 'react-router-dom';
import { useDeleteListing, useListings } from '@/hooks/useDashboardData';

export default function ProfileMyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteMutation = useDeleteListing();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<'newest'|'oldest'|'price_asc'|'price_desc'>('newest');

  const { data, isLoading } = useListings(page, pageSize, sort);
  const listings = data?.data || [];

  const deleteListing = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    // No local filtering; React Query invalidation will refetch
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your listings...</p>
          </CardContent>
        </Card>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<span>🚗</span>}
              title="No listings yet"
              description="Start selling your car by creating your first listing. It's quick and easy!"
              actionButton={{ text: 'List Your Car', href: '/list-car', variant: 'luxury' }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status Legend */}
          <Card>
            <CardContent className="py-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Statuses: </span>
                <span className="inline-flex items-center gap-2 mr-4"><span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>Pending review</span>
                <span className="inline-flex items-center gap-2 mr-4"><span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>Published</span>
                <span className="inline-flex items-center gap-2 mr-4"><span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>Rejected</span>
                <span className="inline-flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>Draft</span>
              </div>
            </CardContent>
          </Card>

          <DashboardPagination
            currentPage={page}
            totalItems={listings.length}
            pageSize={pageSize}
            sortValue={sort}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortChange={(v)=>{ setSort(v as any); setPage(1); }}
            sortOptions={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
            ]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l:any)=> (
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
                status={l.status === 'active' ? 'published' : l.status === 'sold' ? 'sold' : 'draft'}
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
        </>
      )}
    </div>
  );
}

