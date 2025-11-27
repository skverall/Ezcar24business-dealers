import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// CRM Supabase Configuration
// TODO: Move these to environment variables in production
const CRM_SUPABASE_URL = 'https://texjdsagegkceahuufml.supabase.co';
const CRM_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTM3ODMsImV4cCI6MjA3NzkyOTc4M30.85WstSCAin_KtVxIEnF3FPZk1grax6_J-yNwSlioGhk';

export const crmSupabase = createClient<Database>(CRM_SUPABASE_URL, CRM_SUPABASE_ANON_KEY, {
    auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        // Use a different storage key to avoid conflicts with the main client
        storageKey: 'sb-crm-auth-token',
    }
});
