import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { crmSupabase } from '@/integrations/supabase/crmClient';
import { useToast } from '@/hooks/use-toast';

interface RealtimeSubscriptionOptions {
    table: string;
    queryKey: any[];
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    schema?: string;
    filter?: string;
}

export const useRealtimeSubscription = ({
    table,
    queryKey,
    event = '*',
    schema = 'public',
    filter,
}: RealtimeSubscriptionOptions) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        const channel = crmSupabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes' as any,
                {
                    event,
                    schema,
                    table,
                    filter,
                },
                (payload) => {
                    console.log(`Realtime update for ${table}:`, payload);

                    // Invalidate the query to trigger a refetch
                    queryClient.invalidateQueries({ queryKey });

                    // Optional: Show a toast notification for updates
                    // We might want to disable this for high-frequency updates
                    /*
                    if (payload.eventType === 'INSERT') {
                      toast({
                        title: 'New data received',
                        description: `A new item was added to ${table}.`,
                      });
                    }
                    */
                }
            )
            .subscribe();

        return () => {
            crmSupabase.removeChannel(channel);
        };
    }, [table, queryKey, event, schema, filter, queryClient, toast]);
};
