-- Create application_logs table for centralized logging
CREATE TABLE IF NOT EXISTS public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON public.application_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON public.application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON public.application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON public.application_logs(created_at DESC);

-- Create index on JSONB context for common queries
CREATE INDEX IF NOT EXISTS idx_application_logs_context_gin ON public.application_logs USING gin(context);

-- Enable Row Level Security
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert their own logs"
  ON public.application_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own logs"
  ON public.application_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all logs"
  ON public.application_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Policy: Allow anonymous logs (for errors before login)
CREATE POLICY "Allow anonymous error logs"
  ON public.application_logs
  FOR INSERT
  TO anon
  WITH CHECK (level = 'error' AND user_id IS NULL);

-- Add comment for documentation
COMMENT ON TABLE public.application_logs IS 'Centralized application logging table for debugging and monitoring';
COMMENT ON COLUMN public.application_logs.level IS 'Log level: debug, info, warn, error';
COMMENT ON COLUMN public.application_logs.context IS 'Additional context data as JSON';
COMMENT ON COLUMN public.application_logs.user_id IS 'User who triggered the log (nullable for anonymous)';

-- Create a function to clean up old logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_application_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.application_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_application_logs IS 'Deletes application logs older than 30 days to save storage';
