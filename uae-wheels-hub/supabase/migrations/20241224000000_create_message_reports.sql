-- Create message_reports table for handling user reports
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'inappropriate_content',
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_by ON message_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_user ON message_reports(reported_user);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_reports_created_at ON message_reports(created_at);

-- Enable RLS
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can create reports
CREATE POLICY "Users can create message reports" ON message_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON message_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Admins can view and manage all reports (we'll need to create admin role later)
-- For now, we'll create a basic policy that allows viewing reports about messages in conversations the user is part of

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_message_reports_updated_at
  BEFORE UPDATE ON message_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_message_reports_updated_at();

-- Add comment to table
COMMENT ON TABLE message_reports IS 'Stores user reports about inappropriate messages';
