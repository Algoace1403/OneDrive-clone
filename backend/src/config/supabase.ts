import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Supabase configuration:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  anonKey: supabaseKey ? 'Set' : 'Missing',
  serviceKey: supabaseServiceKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Client for public operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  storage_used: number;
  storage_limit: number;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  name: string;
  original_name: string;
  mime_type?: string;
  size: number;
  storage_path?: string;
  owner_id: string;
  parent_id?: string;
  is_folder: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  is_favorite: boolean;
  tags: string[];
  last_modified_by: string;
  last_accessed?: string;
  sync_status: 'synced' | 'syncing' | 'error';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  storage_path: string;
  size: number;
  uploaded_by: string;
  comment?: string;
  created_at: string;
}

export interface FileShare {
  id: string;
  file_id: string;
  shared_with_user_id: string;
  permission: 'view' | 'edit' | 'comment';
  shared_at: string;
}

export interface PublicLink {
  id: string;
  file_id: string;
  url: string;
  permission: 'view' | 'edit';
  password_hash?: string;
  expires_at?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  target_type: 'file' | 'folder' | 'user' | 'share';
  target_id: string;
  target_name: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  file_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}