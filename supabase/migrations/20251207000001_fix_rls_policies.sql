-- Fix RLS policies for application_logs
-- This ensures anonymous users can insert error logs

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous error logs" ON public.application_logs;

-- Recreate with correct configuration
CREATE POLICY "Allow anonymous error logs"
  ON public.application_logs
  FOR INSERT
  TO public  -- Changed from 'anon' to 'public' to allow both anon and authenticated
  WITH CHECK (level = 'error' AND user_id IS NULL);

-- Also ensure authenticated users can insert their own logs
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.application_logs;

CREATE POLICY "Users can insert their own logs"
  ON public.application_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Grant necessary permissions
GRANT INSERT ON public.application_logs TO anon;
GRANT INSERT ON public.application_logs TO authenticated;
GRANT SELECT ON public.application_logs TO authenticated;

COMMENT ON POLICY "Allow anonymous error logs" ON public.application_logs IS
  'Allows anonymous users to insert error-level logs without user_id for debugging';

COMMENT ON POLICY "Users can insert their own logs" ON public.application_logs IS
  'Allows authenticated users to insert logs with their own user_id or anonymous logs';
