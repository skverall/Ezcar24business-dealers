-- Security Fix Migration: Fix Policy Conflicts and Complete Security Updates

-- 1. Drop existing user_roles policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate user_roles policies with safe role checking
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 2. Fix profiles table to properly separate public/private data
-- We need to ensure only safe fields are exposed publicly
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  is_dealer,
  location, -- This might be ok as public for car listings
  created_at
FROM public.profiles;

-- Grant select on the view to public
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Add rate limiting function for security
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_identifier text,
  action_type text,
  max_attempts integer DEFAULT 5,
  time_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_count integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (time_window_minutes || ' minutes')::interval;
  
  -- Count recent attempts
  SELECT COUNT(*) INTO attempt_count
  FROM public.user_activity_logs
  WHERE 
    (user_id::text = user_identifier OR ip_address::text = user_identifier)
    AND action = action_type
    AND created_at > window_start;
  
  RETURN attempt_count < max_attempts;
END;
$$;

-- 4. Enhanced message system security
CREATE OR REPLACE FUNCTION public.can_send_message(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_listing_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if sender is authenticated
  IF p_sender_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Check if listing exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.listings 
    WHERE id = p_listing_id 
    AND status = 'active' 
    AND deleted_at IS NULL
  ) THEN
    RETURN false;
  END IF;
  
  -- Check rate limiting (max 10 messages per hour per user)
  RETURN public.check_rate_limit(p_sender_id::text, 'send_message', 10, 60);
END;
$$;

-- Update messages table policy with enhanced security
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND public.can_send_message(sender_id, receiver_id, listing_id)
);

-- 5. Add CSRF protection for forms
CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on CSRF tokens
ALTER TABLE public.csrf_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own CSRF tokens"
ON public.csrf_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to generate CSRF token
CREATE OR REPLACE FUNCTION public.generate_csrf_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token_value text;
BEGIN
  -- Clean up expired tokens
  DELETE FROM public.csrf_tokens WHERE expires_at < now();
  
  -- Generate new token
  token_value := encode(gen_random_bytes(32), 'hex');
  
  -- Store token
  INSERT INTO public.csrf_tokens (user_id, token, expires_at)
  VALUES (auth.uid(), token_value, now() + interval '1 hour')
  ON CONFLICT (user_id) DO UPDATE SET
    token = EXCLUDED.token,
    expires_at = EXCLUDED.expires_at;
  
  RETURN token_value;
END;
$$;

-- Function to validate CSRF token
CREATE OR REPLACE FUNCTION public.validate_csrf_token(token_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.csrf_tokens
    WHERE user_id = auth.uid()
    AND token = token_value
    AND expires_at > now()
  );
END;
$$;