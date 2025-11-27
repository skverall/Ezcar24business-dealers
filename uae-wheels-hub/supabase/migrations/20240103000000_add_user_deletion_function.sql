-- Create support_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on support_requests
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for support_requests
CREATE POLICY "Users can create their own support requests" ON support_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own support requests" ON support_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle user account deletion
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if the requesting user is the account owner
  IF auth.uid() != user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Start transaction
  BEGIN
    -- Soft delete user listings
    UPDATE listings 
    SET deleted_at = NOW(), status = 'deleted'
    WHERE user_id = delete_user_account.user_id;

    -- Anonymize and mark profile as deleted
    UPDATE profiles 
    SET 
      full_name = 'Deleted User',
      phone = NULL,
      whatsapp = NULL,
      location = NULL,
      bio = NULL,
      avatar_url = NULL,
      company_name = NULL,
      deleted_at = NOW()
    WHERE user_id = delete_user_account.user_id;

    -- Delete user favorites
    DELETE FROM favorites WHERE user_id = delete_user_account.user_id;

    -- Anonymize messages (keep for conversation history but remove personal data)
    UPDATE messages 
    SET content = '[Message deleted by user]'
    WHERE sender_id = delete_user_account.user_id;

    -- Create a support request for final account deletion
    INSERT INTO support_requests (user_id, type, message, status)
    VALUES (
      delete_user_account.user_id,
      'account_deletion_final',
      'User completed account deletion process - ready for final auth deletion',
      'pending'
    );

    -- Return success
    result := json_build_object('success', true, 'message', 'Account deletion process completed');
    
  EXCEPTION WHEN OTHERS THEN
    -- Return error if something goes wrong
    result := json_build_object('success', false, 'error', SQLERRM);
  END;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- Create function to check if user account is deleted
CREATE OR REPLACE FUNCTION is_user_deleted(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = is_user_deleted.user_id 
    AND deleted_at IS NOT NULL
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_user_deleted(UUID) TO authenticated;
