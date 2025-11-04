-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  profile_picture TEXT,
  storage_used BIGINT NOT NULL DEFAULT 0,
  storage_limit BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Files and Folders table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  is_folder BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  last_modified_by UUID NOT NULL REFERENCES public.users(id),
  last_accessed TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'syncing', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- File versions table
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(file_id, version_number)
);

-- File shares table
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'comment')),
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(file_id, shared_with_user_id)
);

-- Public links table
CREATE TABLE IF NOT EXISTS public.public_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email invites table (for sharing with non-registered users)
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view','edit','comment')),
  token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  inviter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('file', 'folder', 'user', 'share')),
  target_id UUID NOT NULL,
  target_name TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Create indexes for better performance
CREATE INDEX idx_files_owner_id ON public.files(owner_id);
CREATE INDEX idx_files_parent_id ON public.files(parent_id);
CREATE INDEX idx_files_is_deleted ON public.files(is_deleted);
CREATE INDEX idx_files_is_favorite ON public.files(is_favorite);
CREATE INDEX idx_file_shares_shared_with_user_id ON public.file_shares(shared_with_user_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_target_id ON public.activities(target_id);
CREATE INDEX idx_comments_file_id ON public.comments(file_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments(parent_comment_id);

-- Per-user favorites (join table)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_file ON public.favorites(file_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Invites policies
CREATE POLICY "Users can create invites for own files" ON public.invites
  FOR INSERT WITH CHECK (
    inviter_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = invites.file_id AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invites they sent" ON public.invites
  FOR SELECT USING (inviter_user_id = auth.uid());

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Files policies
CREATE POLICY "Users can view own files" ON public.files
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.file_shares
      WHERE file_shares.file_id = files.id
      AND file_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files" ON public.files
  FOR INSERT WITH CHECK (owner_id = auth.uid() AND last_modified_by = auth.uid());

CREATE POLICY "Users can update own files" ON public.files
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.file_shares
      WHERE file_shares.file_id = files.id
      AND file_shares.shared_with_user_id = auth.uid()
      AND file_shares.permission IN ('edit')
    )
  );

CREATE POLICY "Users can delete own files" ON public.files
  FOR DELETE USING (owner_id = auth.uid());

-- File versions policies
CREATE POLICY "Users can view file versions" ON public.file_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_versions.file_id
      AND (
        files.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.file_shares
          WHERE file_shares.file_id = files.id
          AND file_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create file versions" ON public.file_versions
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_versions.file_id
      AND (
        files.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.file_shares
          WHERE file_shares.file_id = files.id
          AND file_shares.shared_with_user_id = auth.uid()
          AND file_shares.permission = 'edit'
        )
      )
    )
  );

-- File shares policies
CREATE POLICY "Users can view shares for their files" ON public.file_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_shares.file_id
      AND files.owner_id = auth.uid()
    ) OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "File owners can create shares" ON public.file_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_shares.file_id
      AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "File owners can delete shares" ON public.file_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = file_shares.file_id
      AND files.owner_id = auth.uid()
    )
  );

-- Comments policies
CREATE POLICY "Users can view comments on accessible files" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = comments.file_id
      AND (
        files.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.file_shares
          WHERE file_shares.file_id = files.id
          AND file_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible files" ON public.comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = comments.file_id
      AND (
        files.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.file_shares
          WHERE file_shares.file_id = files.id
          AND file_shares.shared_with_user_id = auth.uid()
          AND file_shares.permission IN ('edit', 'comment')
        )
      )
    )
  );

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- Activities policies
CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activities" ON public.activities
  FOR INSERT WITH CHECK (true);

-- Comment reactions policies
CREATE POLICY "Users can view reactions" ON public.comment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.comments
      WHERE comments.id = comment_reactions.comment_id
      AND EXISTS (
        SELECT 1 FROM public.files
        WHERE files.id = comments.file_id
        AND (
          files.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.file_shares
            WHERE file_shares.file_id = files.id
            AND file_shares.shared_with_user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can create reactions" ON public.comment_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.comments
      WHERE comments.id = comment_reactions.comment_id
      AND EXISTS (
        SELECT 1 FROM public.files
        WHERE files.id = comments.file_id
        AND (
          files.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.file_shares
            WHERE file_shares.file_id = files.id
            AND file_shares.shared_with_user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can delete own reactions" ON public.comment_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their favorites" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());
