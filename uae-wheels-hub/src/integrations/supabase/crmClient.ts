import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// CRM now lives in the same Supabase project as the listing, but in schema "crm"
const CRM_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const CRM_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Define helper types for extending tables
type CrmTable<T extends { Row: any, Insert: any, Update: any, Relationships: any }> = {
    Row: T['Row'] & { dealer_id: string };
    Insert: T['Insert'] & { dealer_id: string };
    Update: T['Update'] & { dealer_id?: string };
    Relationships: T['Relationships'];
};

// Extend the Database type to include CRM tables
export type CrmDatabase = {
    public: {
        Tables: Database['public']['Tables'] & {
            crm_expenses: CrmTable<Database['public']['Tables']['expenses']>;
            crm_vehicles: CrmTable<Database['public']['Tables']['vehicles']>;
            crm_sales: CrmTable<Database['public']['Tables']['sales']>;
            crm_financial_accounts: CrmTable<Database['public']['Tables']['financial_accounts']>;
            crm_dealer_users: CrmTable<Database['public']['Tables']['dealer_users']>;
        };
        Views: Database['public']['Views'];
        Functions: Database['public']['Functions'];
        Enums: Database['public']['Enums'];
        CompositeTypes: Database['public']['CompositeTypes'];
    };
};

export const crmSupabase = createClient<CrmDatabase>(CRM_SUPABASE_URL, CRM_SUPABASE_ANON_KEY, {
    auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        // Use a different storage key to avoid conflicts with the main client
        storageKey: 'sb-crm-auth-token',
    }
});
