import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// CRM now lives in the same Supabase project as the listing (api.ezcar24.com), but in schema "crm"
const CRM_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const CRM_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const crmSupabase = createClient<Database>(CRM_SUPABASE_URL, CRM_SUPABASE_ANON_KEY, {
    auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        // Use a different storage key to avoid conflicts with the main client
        storageKey: 'sb-crm-auth-token',
    }
});
