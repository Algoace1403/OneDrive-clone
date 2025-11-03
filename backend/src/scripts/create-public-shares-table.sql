-- Create public_shares table for shareable links
CREATE TABLE IF NOT EXISTS public_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  share_id UUID NOT NULL UNIQUE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id),
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')) DEFAULT 'view',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_public_shares_share_id ON public_shares(share_id);
CREATE INDEX idx_public_shares_file_id ON public_shares(file_id);
CREATE INDEX idx_public_shares_expires_at ON public_shares(expires_at);

-- Enable RLS
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for public_shares
CREATE POLICY "Users can create public shares for their own files"
  ON public_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files 
      WHERE files.id = file_id 
      AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own public shares"
  ON public_shares FOR SELECT
  USING (
    shared_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM files 
      WHERE files.id = file_id 
      AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own public shares"
  ON public_shares FOR DELETE
  USING (
    shared_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM files 
      WHERE files.id = file_id 
      AND files.owner_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public_shares TO authenticated;
GRANT SELECT ON public_shares TO anon;