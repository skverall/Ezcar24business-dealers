import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// CRM now lives in the same Supabase project as the listing, but in schema "crm"
const CRM_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const CRM_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Extend the Database type to include CRM tables
export type CrmDatabase = {
    public: {
        Tables: Database['public']['Tables'] & {
            crm_expenses: Database['public']['Tables']['crm_expenses'];
            crm_vehicles: Database['public']['Tables']['crm_vehicles'];
            crm_sales: Database['public']['Tables']['crm_sales'];
            crm_financial_accounts: Database['public']['Tables']['crm_financial_accounts'];
            crm_dealer_users: Database['public']['Tables']['crm_dealer_users'];
            crm_dealer_clients: Database['public']['Tables']['crm_dealer_clients'];
            crm_expense_templates: Database['public']['Tables']['crm_expense_templates'];
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
