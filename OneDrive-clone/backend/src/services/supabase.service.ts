import { supabaseAdmin } from '../config/supabase';
import type { 
  User, 
  File, 
  FileVersion, 
  FileShare, 
  PublicLink, 
  Activity, 
  Comment, 
  CommentReaction 
} from '../config/supabase';

export class SupabaseService {
  // User operations
  static async createUser(userId: string, email: string, name: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ id: userId, email, name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // File operations
  static async createFile(file: Omit<File, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFile(fileId: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getFilesByParent(userId: string, parentId?: string | null) {
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .order('is_folder', { ascending: false })
      .order('name');

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async searchFiles(userId: string, searchQuery: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .ilike('name', `%${searchQuery}%`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getRecentFiles(userId: string, limit = 20) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .eq('is_folder', false)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getFavoriteFiles(userId: string) {
    // Deprecated: replaced by per-user favorites join table
    const { data: favIds, error: favErr } = await supabaseAdmin
      .from('favorites')
      .select('file_id')
      .eq('user_id', userId);
    if (favErr) throw favErr;
    const ids = (favIds || []).map((r: any) => r.file_id);
    if (ids.length === 0) return [];

    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .in('id', ids)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    if (error) throw error;

    // Filter to files the user can access (owner or shared)
    const own = (files || []).filter((f: any) => f.owner_id === userId);
    const notOwn = (files || []).filter((f: any) => f.owner_id !== userId);
    if (notOwn.length === 0) return own;
    const notOwnIds = notOwn.map((f: any) => f.id);
    const { data: shares, error: sharesErr } = await supabaseAdmin
      .from('file_shares')
      .select('file_id')
      .eq('shared_with_user_id', userId)
      .in('file_id', notOwnIds);
    if (sharesErr) throw sharesErr;
    const allowed = new Set((shares || []).map((s: any) => s.file_id));
    return [...own, ...notOwn.filter((f: any) => allowed.has(f.id))];
  }

  static async getSharedFiles(userId: string) {
    const { data: shares, error: sharesError } = await supabaseAdmin
      .from('file_shares')
      .select('file_id')
      .eq('shared_with_user_id', userId);

    if (sharesError) throw sharesError;

    const fileIds = shares.map(share => share.file_id);
    if (fileIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .in('id', fileIds)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Favorites (per-user) operations
  static async addFavorite(userId: string, fileId: string) {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert({ user_id: userId, file_id: fileId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async removeFavorite(userId: string, fileId: string) {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('file_id', fileId);
    if (error) throw error;
  }

  static async hasFavorite(userId: string, fileId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('file_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('file_id', fileId);
    if (error) throw error;
    // head:true means no data; but supabase-js v2 returns count separately only when not head; fallback with another query
    // Simpler: query normally and check length
    const { data: rows, error: err2 } = await supabaseAdmin
      .from('favorites')
      .select('file_id')
      .eq('user_id', userId)
      .eq('file_id', fileId)
      .limit(1);
    if (err2) throw err2;
    return (rows || []).length > 0;
  }

  static async getFavoriteFlags(userId: string, ids: string[]): Promise<Record<string, boolean>> {
    if (ids.length === 0) return {};
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('file_id')
      .eq('user_id', userId)
      .in('file_id', ids);
    if (error) throw error;
    const map: Record<string, boolean> = {};
    (data || []).forEach((r: any) => { map[r.file_id] = true; });
    return map;
  }

  static async getSharedByMe(userId: string) {
    // Select shares for files owned by the user (no shared_by_user_id column in schema)
    const { data: shares, error: sharesError } = await supabaseAdmin
      .from('file_shares')
      .select('file_id, files!inner(owner_id)')
      .eq('files.owner_id', userId);

    if (sharesError) throw sharesError;
    const fileIds = (shares || []).map((s: any) => s.file_id);
    if (fileIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .in('id', fileIds)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getDeletedFiles(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getDeletedOlderThan(cutoffIso: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('is_deleted', true)
      .lt('deleted_at', cutoffIso);

    if (error) throw error;
    return data || [];
  }

  static async updateFile(fileId: string, updates: Partial<File>) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFile(fileId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', fileId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async restoreFile(fileId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('files')
      .update({ 
        is_deleted: false, 
        deleted_at: null 
      })
      .eq('id', fileId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async permanentlyDeleteFile(fileId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('owner_id', userId);

    if (error) throw error;
  }

  // File version operations
  static async createFileVersion(version: Omit<FileVersion, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('file_versions')
      .insert(version)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFileVersions(fileId: string) {
    const { data, error } = await supabaseAdmin
      .from('file_versions')
      .select('*')
      .eq('file_id', fileId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getLatestVersionNumber(fileId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('file_versions')
      .select('version_number')
      .eq('file_id', fileId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return 0; // No versions exist
      throw error;
    }
    return data.version_number;
  }

  // File sharing operations
  static async getFileShares(fileId: string) {
    const { data, error } = await supabaseAdmin
      .from('file_shares')
      .select(`
        *,
        shared_with_user:users!shared_with_user_id(
          id,
          email,
          name,
          profile_picture
        )
      `)
      .eq('file_id', fileId);

    if (error) throw error;
    return data;
  }

  static async createPublicLink(link: Omit<PublicLink, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('public_links')
      .insert(link)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPublicLink(url: string) {
    const { data, error } = await supabaseAdmin
      .from('public_links')
      .select('*')
      .eq('url', url)
      .single();

    if (error) throw error;
    return data;
  }

  // Activity operations
  static async createActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getActivities(userId: string, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getFileActivities(fileId: string) {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select(`
        *,
        user:users!user_id(
          id,
          email,
          name,
          profile_picture
        )
      `)
      .eq('target_id', fileId)
      .eq('target_type', 'file')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Comment operations
  static async createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getComments(fileId: string) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        user:users!user_id(
          id,
          email,
          name,
          profile_picture
        ),
        reactions:comment_reactions(
          id,
          reaction_type,
          user_id
        )
      `)
      .eq('file_id', fileId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({ 
        content, 
        is_edited: true, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteComment(commentId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getComment(commentId: string) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (error) throw error;
    return data;
  }

  // Comment reaction operations
  static async addReaction(reaction: Omit<CommentReaction, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('comment_reactions')
      .insert(reaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeReaction(commentId: string, userId: string, reactionType: string) {
    const { error } = await supabaseAdmin
      .from('comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType);

    if (error) throw error;
  }

  // Storage operations
  static async updateUserStorage(userId: string, sizeChange: number) {
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('storage_used, storage_limit')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newStorageUsed = Math.max(0, user.storage_used + sizeChange);

    if (newStorageUsed > user.storage_limit && sizeChange > 0) {
      throw new Error('Storage limit exceeded');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ storage_used: newStorageUsed })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  // Attempt to resolve a user by email from auth schema and ensure presence in public.users
  static async findOrCreateUserByEmail(email: string) {
    // First, check our public.users table
    const existing = await this.getUserByEmail(email);
    if (existing) return existing;

    // Try to locate user in auth schema
    try {
      const { data: authUser, error: authErr } = await supabaseAdmin
        .schema('auth')
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('email', email)
        .single();

      if (authErr || !authUser) return null;

      const nameFromMeta = (authUser as any).raw_user_meta_data?.name as string | undefined;
      const fallbackName = email.split('@')[0] || 'User';
      const name = nameFromMeta?.trim() || fallbackName;

      // Create mirror entry in public.users
      const created = await this.createUser(authUser.id, authUser.email, name);
      return created;
    } catch {
      return null;
    }
  }

  static async listUsersBasic() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, profile_picture, storage_used, storage_limit')
      .order('name');
    if (error) throw error;
    return data;
  }

  static async updateUserStorageLimit(userId: string, limit: number) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ storage_limit: limit })
      .eq('id', userId)
      .select('id, email, name, storage_used, storage_limit')
      .single();
    if (error) throw error;
    return data;
  }

  // Share counts for a set of file IDs
  static async getShareCounts(fileIds: string[]) {
    if (!fileIds || fileIds.length === 0) return {} as Record<string, number>;
    const { data, error } = await supabaseAdmin
      .from('file_shares')
      .select('file_id')
      .in('file_id', fileIds);
    if (error) throw error;
    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const id = row.file_id as string;
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }

  // Invites
  static async createInvite(invite: {
    file_id: string;
    email: string;
    permission: 'view' | 'edit' | 'comment';
    inviter_user_id: string;
    expires_at?: string | null;
  }) {
    const { data, error } = await supabaseAdmin
      .from('invites')
      .insert({
        file_id: invite.file_id,
        email: invite.email,
        permission: invite.permission,
        inviter_user_id: invite.inviter_user_id,
        expires_at: invite.expires_at || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getInviteByToken(token: string) {
    const { data, error } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('token', token)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);
    if (!invite) throw new Error('Invite not found');
    // Ensure logged-in user email matches invite
    const user = await this.getUser(userId);
    if (!user || user.email.toLowerCase() !== String(invite.email).toLowerCase()) {
      throw new Error('Invite email mismatch');
    }

    // Create file share
    await this.createFileShare({
      file_id: invite.file_id,
      shared_with_user_id: userId,
      permission: invite.permission,
    });

    // Mark accepted
    const { data, error } = await supabaseAdmin
      .from('invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async createFileShare(shareData: {
    file_id: string;
    shared_by_user_id?: string; // ignored (not in schema)
    shared_with_user_id: string;
    permission: string;
    message?: string; // ignored (not in schema)
  }) {
    // Insert only columns that exist in schema
    const insertData = {
      file_id: shareData.file_id,
      shared_with_user_id: shareData.shared_with_user_id,
      permission: shareData.permission,
    } as const;

    const { data, error } = await supabaseAdmin
      .from('file_shares')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createPublicShare(shareData: {
    file_id: string;
    share_id: string;
    shared_by_user_id: string;
    permission: string;
    expires_at: Date;
  }) {
    const { data, error } = await supabaseAdmin
      .from('public_shares')
      .insert(shareData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeFileShare(shareId: string, userId: string) {
    // First verify the user owns the file
    const { data: share } = await supabaseAdmin
      .from('file_shares')
      .select('*, files!inner(owner_id)')
      .eq('id', shareId)
      .single();

    if (!share || share.files.owner_id !== userId) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabaseAdmin
      .from('file_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  }

  static async getPublicShare(shareId: string) {
    const { data, error } = await supabaseAdmin
      .from('public_shares')
      .select('*')
      .eq('share_id', shareId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  static async updatePublicShareAccess(shareId: string) {
    // First get current count
    const { data: share } = await supabaseAdmin
      .from('public_shares')
      .select('accessed_count')
      .eq('share_id', shareId)
      .single();

    const { error } = await supabaseAdmin
      .from('public_shares')
      .update({
        accessed_count: (share?.accessed_count || 0) + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('share_id', shareId);

    if (error) throw error;
  }
}
