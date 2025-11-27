import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import ActivityItem from '@/components/ActivityItem';

export default function ProfileActivity() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error?.code === '42P01') {
          setActivity([]);
        } else if (error) {
          toast({ title: 'Failed to load activity', description: error.message, variant: 'destructive' });
        } else {
          setActivity(data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (activity.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<span>⏰</span>}
            title="No recent activity"
            description="Your activity will appear here when you start listing cars, updating listings, or interacting with the platform."
            actionButton={{ text: 'List Your Car', href: '/list-car', variant: 'luxury' }}
          />
        </CardContent>
      </Card>
    );
  }

  // Group activities by date for display
  const grouped = activity.reduce((acc:any, a:any) => {
    const key = new Date(a.created_at).toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, list]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <div className="space-y-3">
            {(list as any[]).map((item) => (
              <ActivityItem
                key={item.id}
                id={item.id}
                type={item.type}
                title={item.title}
                description={item.description}
                timestamp={item.created_at}
                listingId={item.listing_id}
                listingTitle={item.payload?.title}
                payload={item.payload}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

