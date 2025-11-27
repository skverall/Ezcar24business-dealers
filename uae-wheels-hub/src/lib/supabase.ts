/**
 * Centralized Supabase Client
 * Single source of truth for Supabase configuration
 * 
 * Re-exports the client from integrations to ensure a single instance
 */

import { supabase } from '@/integrations/supabase/client';

export { supabase };
export default supabase;
