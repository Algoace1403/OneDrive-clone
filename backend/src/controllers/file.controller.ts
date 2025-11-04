import { Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { SupabaseService } from '../services/supabase.service';
import { StorageService } from '../services/storage.service';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { uploadFileToStorage, cleanupTempFile } from '../utils/file-upload';

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const { parentId, comment } = req.body;
    const userId = req.user!.id;

    // Check storage limit
    await SupabaseService.updateUserStorage(userId, req.file.size);

    // Generate file ID
    const fileId = uuidv4();

    // Upload file to Supabase storage
    const storagePath = await uploadFileToStorage(
      userId,
      fileId,
      req.file,
      req.file.mimetype
    );

    // Create file record
    const file = await SupabaseService.createFile({
      name: req.file.originalname,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      storage_path: storagePath,
      owner_id: userId,
      parent_id: parentId || null,
      is_folder: false,
      is_deleted: false,
      is_favorite: false,
      tags: [],
      last_modified_by: userId,
      sync_status: 'synced'
    });

    // Create initial version
    await SupabaseService.createFileVersion({
      file_id: file.id,
      version_number: 1,
      storage_path: storagePath,
      size: req.file.size,
      uploaded_by: userId,
      comment: comment || 'Initial version'
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'upload',
      target_type: 'file',
      target_id: file.id,
      target_name: file.name
    });

    // Clean up temporary file
    await cleanupTempFile(req.file);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('file-created', {
      file,
      action: 'upload'
    });

    res.status(201).json({
      success: true,
      file
    });
  } catch (error: any) {
    // Clean up temporary file on error
    if (req.file) {
      await cleanupTempFile(req.file);
    }
    next(error);
  }
};

export const getFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parent, query, q, type, owner, sort = 'updated', direction = 'desc', status } = req.query as any;
    const userId = req.user!.id;

    let files: any[] = [];
    const searchQuery = (query || q) as string | undefined;

    // Choose base dataset depending on owner filter
    const ownerFilter = (owner as string) || 'me';
    if (ownerFilter === 'shared') {
      files = await SupabaseService.getSharedFiles(userId);
      if (searchQuery) {
        const qLower = searchQuery.toLowerCase();
        files = files.filter(f => f.name?.toLowerCase().includes(qLower));
      }
      // Enrich with owner info for UI "Shared by <name>"
      const ownerIds = Array.from(new Set((files || []).map((f: any) => f.owner_id).filter(Boolean)));
      let ownersMap = new Map<string, any>();
      if (ownerIds.length > 0) {
        const { data: owners, error } = await supabaseAdmin
          .from('users')
          .select('id, name, email, profile_picture')
          .in('id', ownerIds);
        if (error) throw error;
        (owners || []).forEach((u: any) => ownersMap.set(u.id, u));
      }
      files = (files || []).map((f: any) => ({ ...f, shared_by: ownersMap.get(f.owner_id) || null }));
    } else {
      if (searchQuery) {
        files = await SupabaseService.searchFiles(userId, searchQuery);
      } else {
        files = await SupabaseService.getFilesByParent(userId, parent as string);
      }
    }

    // Separate files and folders
    const folders = files.filter(f => f.is_folder);
    let regularFiles = files.filter(f => !f.is_folder);

    // Filter by sync status if provided
    if (status && ['synced','syncing','error'].includes(String(status))) {
      regularFiles = regularFiles.filter((f: any) => f.sync_status === status);
    }

    // Apply type filter if provided
    if (type && type !== 'all' && type !== 'folder') {
      const t = String(type);
      regularFiles = regularFiles.filter(f => {
        const mt = (f.mime_type || '').toLowerCase();
        if (t === 'image') return mt.startsWith('image/');
        if (t === 'video') return mt.startsWith('video/');
        if (t === 'audio') return mt.startsWith('audio/');
        if (t === 'document') return (
          mt.includes('pdf') ||
          mt.includes('msword') ||
          mt.includes('officedocument') ||
          mt.includes('text/') ||
          mt.includes('json')
        );
        return true;
      });
    }

    // Apply sorting
    const dir = String(direction).toLowerCase() === 'asc' ? 1 : -1;
    const comparator = (a: any, b: any) => {
      if (sort === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort === 'size') return ((a.size || 0) - (b.size || 0)) * dir;
      // default: updated
      return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
    };
    regularFiles = [...regularFiles].sort(comparator);

    // Support frontend variant requesting only folders
    if (type === 'folder') {
      return res.json({
        success: true,
        files: folders,
        folders
      });
    }

    res.json({
      success: true,
      folders,
      files: regularFiles
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { type } = req.query as any;
    // Recent should include both user's own recent files and files shared with the user
    let ownRecent = await SupabaseService.getRecentFiles(userId);
    let sharedWithMe = await SupabaseService.getSharedFiles(userId);
    // Exclude folders and deleted entries (service already excludes deleted; ensure folders below)
    let files = [...(ownRecent || []), ...(sharedWithMe || [])];

    if (type && type !== 'all') {
      const t = String(type);
      files = files.filter((f: any) => {
        const mt = (f.mime_type || '').toLowerCase();
        if (t === 'image') return mt.startsWith('image/');
        if (t === 'video') return mt.startsWith('video/');
        if (t === 'audio') return mt.startsWith('audio/');
        if (t === 'document') return (
          mt.includes('pdf') ||
          mt.includes('msword') ||
          mt.includes('officedocument') ||
          mt.includes('text/') ||
          mt.includes('json')
        );
        return true;
      });
    }

    // Keep only files (no folders)
    files = files.filter((f: any) => !f.is_folder);

    // De-duplicate by id in case an item appears in both lists
    const seen = new Set<string>();
    files = files.filter((f: any) => {
      const id = f.id;
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Sort by updated_at desc
    files.sort((a: any, b: any) => (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

    // Enrich shared items with owner (sharer) info, so UI can show "Shared by <name>"
    const ownerIds = Array.from(new Set((files || [])
      .filter((f: any) => f.owner_id && f.owner_id !== userId)
      .map((f: any) => f.owner_id)));
    let ownersMap = new Map<string, any>();
    if (ownerIds.length > 0) {
      const { data: owners, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, profile_picture')
        .in('id', ownerIds);
      if (error) throw error;
      (owners || []).forEach((u: any) => ownersMap.set(u.id, u));
    }
    const enriched = (files || []).map((f: any) => (
      f.owner_id !== userId ? { ...f, shared_by: ownersMap.get(f.owner_id) || null } : f
    ));

    res.json({
      success: true,
      files: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const files = await SupabaseService.getFavoriteFiles(userId);

    res.json({
      success: true,
      files
    });
  } catch (error) {
    next(error);
  }
};

export const getShared = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const files = await SupabaseService.getSharedFiles(userId);
    // Enrich with owner (sharer) info so UI can show "Shared by <name>"
    const ownerIds = Array.from(new Set((files || []).map((f: any) => f.owner_id).filter(Boolean)));
    let ownersMap = new Map<string, any>();
    if (ownerIds.length > 0) {
      const { data: owners, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, profile_picture')
        .in('id', ownerIds);
      if (error) throw error;
      (owners || []).forEach((u: any) => ownersMap.set(u.id, u));
    }
    const enriched = (files || []).map((f: any) => ({
      ...f,
      shared_by: ownersMap.get(f.owner_id) || null,
    }));

    res.json({ success: true, files: enriched });
  } catch (error) {
    next(error);
  }
};

export const getSharedByMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const files = await SupabaseService.getSharedByMe(userId);

    res.json({
      success: true,
      files
    });
  } catch (error) {
    next(error);
  }
};

export const getShareCounts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const idsParam = (req.query.ids as string) || '';
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json({ success: true, counts: {} });
    const counts = await SupabaseService.getShareCounts(ids);
    res.json({ success: true, counts });
  } catch (error) {
    next(error);
  }
};

export const getFavoriteFlags = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const idsParam = (req.query.ids as string) || '';
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json({ success: true, favorites: {} });
    const favorites = await SupabaseService.getFavoriteFlags(userId, ids);
    res.json({ success: true, favorites });
  } catch (error) {
    next(error);
  }
};

export const getFilesMeta = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const idsParam = (req.query.ids as string) || '';
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json({ success: true, counts: {}, favorites: {} });
    const [counts, favorites] = await Promise.all([
      SupabaseService.getShareCounts(ids),
      SupabaseService.getFavoriteFlags(userId, ids)
    ]);
    res.json({ success: true, counts, favorites });
  } catch (error) {
    next(error);
  }
};

export const getTrash = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const files = await SupabaseService.getDeletedFiles(userId);

    res.json({
      success: true,
      files
    });
  } catch (error) {
    next(error);
  }
};

export const createFolder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user!.id;

    const folder = await SupabaseService.createFile({
      name,
      original_name: name,
      size: 0,
      owner_id: userId,
      parent_id: parentId || null,
      is_folder: true,
      is_deleted: false,
      is_favorite: false,
      tags: [],
      last_modified_by: userId,
      sync_status: 'synced'
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'create_folder',
      target_type: 'folder',
      target_id: folder.id,
      target_name: folder.name
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('folder-created', {
      folder,
      action: 'create'
    });

    res.status(201).json({
      success: true,
      folder
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);

    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      // Check if user has access through shares
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      
      if (!hasAccess) {
        return next(new AppError('Access denied', 403));
      }
    }

    if (!file.storage_path) {
      return next(new AppError('File not available for download', 404));
    }

    // Get signed URL for download with download header
    const downloadUrl = await StorageService.getFileUrl(file.storage_path, 300, true); // 5 minutes with download

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'download',
      target_type: 'file',
      target_id: file.id,
      target_name: file.name
    });

    res.json({
      success: true,
      downloadUrl,
      filename: file.name,
      mimeType: file.mime_type
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.deleteFile(fileId, userId);

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'delete',
      target_type: file.is_folder ? 'folder' : 'file',
      target_id: file.id,
      target_name: file.name
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('file-deleted', {
      fileId,
      action: 'delete'
    });

    res.json({
      success: true,
      message: 'File moved to trash'
    });
  } catch (error) {
    next(error);
  }
};

export const restoreFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.restoreFile(fileId, userId);

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'restore',
      target_type: file.is_folder ? 'folder' : 'file',
      target_id: file.id,
      target_name: file.name
    });

    res.json({
      success: true,
      file
    });
  } catch (error) {
    next(error);
  }
};

export const permanentlyDelete = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    // Delete from storage
    if (file.storage_path) {
      await StorageService.deleteFile(file.storage_path);
    }

    // Delete all versions from storage
    const versions = await SupabaseService.getFileVersions(fileId);
    const versionPaths = versions.map(v => v.storage_path);
    if (versionPaths.length > 0) {
      await StorageService.deleteFiles(versionPaths);
    }

    // Delete from database
    await SupabaseService.permanentlyDeleteFile(fileId, userId);

    // Update user storage
    await SupabaseService.updateUserStorage(userId, -file.size);

    res.json({
      success: true,
      message: 'File permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    // Access check: owner or shared with user
    if (file.owner_id !== userId) {
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some((s: any) => s.shared_with_user_id === userId);
      if (!hasAccess) return next(new AppError('Access denied', 403));
    }

    const exists = await SupabaseService.hasFavorite(userId, fileId);
    if (exists) {
      await SupabaseService.removeFavorite(userId, fileId);
    } else {
      await SupabaseService.addFavorite(userId, fileId);
    }

    res.json({ success: true, isFavorite: !exists });
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const { name } = req.body;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    const updatedFile = await SupabaseService.updateFile(fileId, {
      name,
      last_modified_by: userId
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'rename',
      target_type: file.is_folder ? 'folder' : 'file',
      target_id: file.id,
      target_name: name,
      details: { oldName: file.name }
    });

    res.json({
      success: true,
      file: updatedFile
    });
  } catch (error) {
    next(error);
  }
};

export const moveFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const { parentId } = req.body;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    const updatedFile = await SupabaseService.updateFile(fileId, {
      parent_id: parentId || null,
      last_modified_by: userId
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'move',
      target_type: file.is_folder ? 'folder' : 'file',
      target_id: file.id,
      target_name: file.name
    });

    res.json({
      success: true,
      file: updatedFile
    });
  } catch (error) {
    next(error);
  }
};

export const copyFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const { parentId, name } = req.body || {};
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    if (file.is_folder) {
      return next(new AppError('Folder copy is not supported yet', 400));
    }

    if (!file.storage_path) {
      return next(new AppError('Source file missing from storage', 404));
    }

    // Create new file metadata
    const newFileId = uuidv4();
    const destinationPath = `${userId}/${newFileId}`;

    // Copy in storage
    await StorageService.copyFile(file.storage_path, destinationPath);

    // Create DB record
    const copied = await SupabaseService.createFile({
      name: name || file.name,
      original_name: file.original_name,
      mime_type: file.mime_type,
      size: file.size,
      storage_path: destinationPath,
      owner_id: userId,
      parent_id: parentId ?? file.parent_id ?? null,
      is_folder: false,
      is_deleted: false,
      is_favorite: false,
      tags: [],
      last_modified_by: userId,
      sync_status: 'synced'
    });

    // Create initial version entry for the copied file
    await SupabaseService.createFileVersion({
      file_id: copied.id,
      version_number: 1,
      storage_path: destinationPath,
      size: file.size,
      uploaded_by: userId,
      comment: 'Copied from existing file'
    });

    // Update user storage usage
    await SupabaseService.updateUserStorage(userId, file.size);

    // Activity log
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'copy',
      target_type: 'file',
      target_id: copied.id,
      target_name: copied.name,
      details: { from: fileId }
    });

    // Realtime emit
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('file-created', { file: copied, action: 'copy' });

    res.status(201).json({ success: true, file: copied });
  } catch (error) {
    next(error);
  }
};

export const getFolderPath = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.id;

    const pathItems: { id: string; name: string; isRoot?: boolean }[] = [];

    let currentId: string | null = id;
    const guard = new Set<string>();

    while (currentId) {
      if (guard.has(currentId)) break; // prevent cycles
      guard.add(currentId);

      const node = await SupabaseService.getFile(currentId);
      if (!node || node.owner_id !== userId) break;
      pathItems.push({ id: node.id, name: node.name });
      currentId = (node.parent_id as string | null) || null;
    }

    // Add root
    pathItems.push({ id: 'root', name: 'My Files', isRoot: true });

    // Reverse to root -> folder chain
    const path = pathItems.reverse();

    res.json({ success: true, path });
  } catch (error) {
    next(error);
  }
};

// (duplicate copyFile removed; see earlier definition)

export const getFileVersions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      // Check if user has access through shares
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      
      if (!hasAccess) {
        return next(new AppError('Access denied', 403));
      }
    }

    const versions = await SupabaseService.getFileVersions(fileId);

    // Attach uploader info (name, email, profile_picture)
    const userIds = Array.from(new Set(versions.map((v: any) => v.uploaded_by).filter(Boolean)));
    let usersMap = new Map<string, any>();
    if (userIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, email, profile_picture')
        .in('id', userIds);
      (data || []).forEach((u: any) => usersMap.set(u.id, u));
    }

    const versionsWithAuthors = versions.map((v: any) => ({
      ...v,
      uploader: usersMap.get(v.uploaded_by) || null
    }));

    res.json({
      success: true,
      versions: versionsWithAuthors
    });
  } catch (error) {
    next(error);
  }
};

export const uploadNewVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const fileId = req.params.id;
    const { comment } = req.body;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    // Get next version number
    const latestVersion = await SupabaseService.getLatestVersionNumber(fileId);
    const newVersionNumber = latestVersion + 1;

    // Upload new version to storage
    const versionStoragePath = StorageService.generateStoragePath(userId, fileId, newVersionNumber);
    await uploadFileToStorage(
      userId,
      `${fileId}/v${newVersionNumber}`,
      req.file,
      req.file.mimetype
    );

    // Create version record
    const version = await SupabaseService.createFileVersion({
      file_id: fileId,
      version_number: newVersionNumber,
      storage_path: versionStoragePath,
      size: req.file.size,
      uploaded_by: userId,
      comment: comment || `Version ${newVersionNumber}`
    });

    // Update file with new version info
    const sizeDiff = req.file.size - file.size;
    await SupabaseService.updateFile(fileId, {
      size: req.file.size,
      storage_path: versionStoragePath,
      last_modified_by: userId
    });

    // Update user storage
    if (sizeDiff !== 0) {
      await SupabaseService.updateUserStorage(userId, sizeDiff);
    }

    // Clean up temporary file
    await cleanupTempFile(req.file);

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'upload_version',
      target_type: 'file',
      target_id: fileId,
      target_name: file.name,
      details: { versionNumber: newVersionNumber }
    });

    res.status(201).json({
      success: true,
      version
    });
  } catch (error: any) {
    // Clean up temporary file on error
    if (req.file) {
      await cleanupTempFile(req.file);
    }
    next(error);
  }
};

export const restoreVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const versionNumber = parseInt(req.params.versionNumber || req.body.versionNumber);
    const userId = req.user!.id;
    const { name } = req.body as any;

    if (!versionNumber || Number.isNaN(versionNumber)) {
      return next(new AppError('Invalid version number', 400));
    }

    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId || file.is_folder) {
      return next(new AppError('File not found', 404));
    }

    const versions = await SupabaseService.getFileVersions(fileId);
    const target = versions.find(v => v.version_number === versionNumber);
    if (!target) {
      return next(new AppError('Version not found', 404));
    }

    // Determine next version number
    const latest = await SupabaseService.getLatestVersionNumber(fileId);
    const newVersionNumber = latest + 1;

    // Update file to point at restored version
    const sizeDiff = (target.size || 0) - (file.size || 0);
    await SupabaseService.updateFile(fileId, {
      name: name || file.name,
      size: target.size,
      storage_path: target.storage_path,
      last_modified_by: userId
    });

    // Create a new version record that reflects the restore operation
    await SupabaseService.createFileVersion({
      file_id: fileId,
      version_number: newVersionNumber,
      storage_path: target.storage_path,
      size: target.size,
      uploaded_by: userId,
      comment: `Restored to v${versionNumber}`
    });

    // Adjust user storage to follow the existing size-diff model
    if (sizeDiff !== 0) {
      await SupabaseService.updateUserStorage(userId, sizeDiff);
    }

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'restore_version',
      target_type: 'file',
      target_id: fileId,
      target_name: name || file.name,
      details: { fromVersion: versionNumber, newVersion: newVersionNumber, renamedTo: name || undefined }
    });

    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('file-updated', { fileId, action: 'restore_version' });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const previewFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      // Check if user has access through shares
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      
      if (!hasAccess) {
        return next(new AppError('Access denied', 403));
      }
    }

    if (!file.storage_path) {
      return next(new AppError('File not available for preview', 404));
    }

    // Get signed URL for preview (longer expiration for preview)
    const previewUrl = await StorageService.getFileUrl(file.storage_path, 3600); // 1 hour

    res.json({
      success: true,
      previewUrl,
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mime_type,
        size: file.size
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getThumbnail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const { width = '200', height = '200' } = req.query;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      // Check if user has access through shares
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      
      if (!hasAccess) {
        return next(new AppError('Access denied', 403));
      }
    }

  // Thumbnails: images or simple SVG placeholder for PDFs
  const mime = file.mime_type || '';
  if (!mime.startsWith('image/')) {
    if (mime === 'application/pdf') {
      const w = parseInt(width as string) || 200;
      const h = parseInt(height as string) || 200;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#7f1d1d"/>
  <rect x="30" y="30" width="140" height="140" rx="12" fill="#ef4444"/>
  <text x="100" y="115" font-size="56" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="#ffffff">PDF</text>
</svg>`;
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(svg);
    }
    return next(new AppError('File is not an image', 400));
  }

    if (!file.storage_path) {
      return next(new AppError('File not available', 404));
    }

    // Download the image
    const imageBuffer = await StorageService.downloadFile(file.storage_path);

    // Generate thumbnail
    const thumbnail = await sharp(imageBuffer)
      .resize(parseInt(width as string), parseInt(height as string), {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(thumbnail);
  } catch (error) {
    next(error);
  }
};

export const getVersionPreviewUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const versionNumber = parseInt(req.params.versionNumber);
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      if (!hasAccess) return next(new AppError('Access denied', 403));
    }

    const versions = await SupabaseService.getFileVersions(fileId);
    const target = versions.find(v => v.version_number === versionNumber);
    if (!target || !target.storage_path) {
      return next(new AppError('Version not found', 404));
    }

    const previewUrl = await StorageService.getFileUrl(target.storage_path, 3600);
    res.json({ success: true, previewUrl, mimeType: file.mime_type, size: target.size });
  } catch (error) {
    next(error);
  }
};

export const getVersionDownloadUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const versionNumber = parseInt(req.params.versionNumber);
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      if (!hasAccess) return next(new AppError('Access denied', 403));
    }

    const versions = await SupabaseService.getFileVersions(fileId);
    const target = versions.find(v => v.version_number === versionNumber);
    if (!target || !target.storage_path) {
      return next(new AppError('Version not found', 404));
    }

    const downloadUrl = await StorageService.getFileUrl(target.storage_path, 300, true);
    res.json({ success: true, downloadUrl, filename: file.name, mimeType: file.mime_type });
  } catch (error) {
    next(error);
  }
};

export const shareFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const { email, permission, message } = req.body;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found or access denied', 404));
    }

    // Find user by email
    // Resolve target user; if not mirrored in public.users but exists in auth, create it
    const sharedUser = await SupabaseService.findOrCreateUserByEmail(email);
    if (!sharedUser) {
      // User not registered: create invite instead of erroring
      const invite = await SupabaseService.createInvite({
        file_id: fileId,
        email,
        permission: permission || 'view',
        inviter_user_id: userId,
        expires_at: null,
      });
      return res.status(201).json({ success: true, invite: { token: invite.token, email, permission: permission || 'view' } });
    }

    if (sharedUser.id === userId) {
      return next(new AppError('Cannot share with yourself', 400));
    }

    // Create share record
    const share = await SupabaseService.createFileShare({
      file_id: fileId,
      shared_with_user_id: sharedUser.id,
      permission: permission || 'view'
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'share',
      target_type: 'file',
      target_id: fileId,
      target_name: file.name,
      details: { sharedWith: email, permission }
    });

    // Emit real-time update to recipient
    const io = req.app.get('io');
    io.to(`user-${sharedUser.id}`).emit('file-shared', {
      file,
      sharedBy: req.user
    });

    res.status(201).json({ success: true, share })
  } catch (error) {
    next(error);
  }
};

export const generateShareLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const { permission } = req.body;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found or access denied', 404));
    }

    // Generate unique share ID
    const shareId = uuidv4();

    // Create public share record
    const share = await SupabaseService.createPublicShare({
      file_id: fileId,
      share_id: shareId,
      shared_by_user_id: userId,
      permission: permission || 'view',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    res.status(201).json({
      success: true,
      shareId,
      share
    });
  } catch (error) {
    next(error);
  }
};

export const getFileShares = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found or access denied', 404));
    }

    const shares = await SupabaseService.getFileShares(fileId);

    res.json({
      success: true,
      shares
    });
  } catch (error) {
    next(error);
  }
};

export const removeFileShare = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shareId } = req.params;
    const userId = req.user!.id;

    await SupabaseService.removeFileShare(shareId, userId);

    res.json({
      success: true,
      message: 'Share removed'
    });
  } catch (error) {
    next(error);
  }
};
