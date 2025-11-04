// Type mappings for Supabase to frontend compatibility

export interface SupabaseFile {
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

export interface FrontendFile {
  _id: string;
  name: string;
  originalName: string;
  mimeType?: string;
  size: number;
  storagePath?: string;
  owner: string;
  parent?: string;
  isFolder: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  isFavorite: boolean;
  tags: string[];
  lastModifiedBy: string;
  lastAccessed?: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Convert Supabase file to frontend format
export function toFrontendFile(file: SupabaseFile): FrontendFile {
  return {
    _id: file.id,
    name: file.name,
    originalName: file.original_name,
    mimeType: file.mime_type,
    size: file.size,
    storagePath: file.storage_path,
    owner: file.owner_id,
    parent: file.parent_id,
    isFolder: file.is_folder,
    isDeleted: file.is_deleted,
    deletedAt: file.deleted_at,
    isFavorite: file.is_favorite,
    tags: file.tags,
    lastModifiedBy: file.last_modified_by,
    lastAccessed: file.last_accessed,
    syncStatus: file.sync_status,
    metadata: file.metadata,
    createdAt: file.created_at,
    updatedAt: file.updated_at
  };
}

// Convert array of Supabase files to frontend format
export function toFrontendFiles(files: SupabaseFile[]): FrontendFile[] {
  return files.map(toFrontendFile);
}