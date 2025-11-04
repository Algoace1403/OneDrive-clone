import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { StorageService } from '../services/storage.service';
import { v4 as uuidv4 } from 'uuid';

const timers: Record<string, NodeJS.Timeout> = {};

export const syncController = {
  async simulateSync(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const fileIds: string[] = req.body.ids || [];

      // Find recent files or specified IDs
      let files = [] as any[];
      if (fileIds.length > 0) {
        files = await Promise.all(fileIds.map((id) => SupabaseService.getFile(id)));
      } else {
        files = await SupabaseService.getRecentFiles(userId, 5);
      }

      // Mark as syncing
      await Promise.all(files.map((f) => SupabaseService.updateFile(f.id, { sync_status: 'syncing' as any })));

      const io = (req as any).app.get('io');
      files.forEach((f) => io.to(`user-${userId}`).emit('file-updated', { fileId: f.id, action: 'syncing' }));

      // After short delay, mark as synced
      const key = `${userId}-${Date.now()}`;
      timers[key] = setTimeout(async () => {
        try {
          await Promise.all(files.map((f) => SupabaseService.updateFile(f.id, { sync_status: 'synced' as any })));
          files.forEach((f) => io.to(`user-${userId}`).emit('file-updated', { fileId: f.id, action: 'synced' }));
        } catch {}
        clearTimeout(timers[key]);
        delete timers[key];
      }, 2000);

      res.json({ success: true, count: files.length });
    } catch (error) {
      next(error);
    }
  },

  async getSyncStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const files = await SupabaseService.searchFiles(userId, '');
      const syncing = files.filter((f: any) => f.sync_status !== 'synced');
      res.json({ success: true, files: syncing });
    } catch (error) {
      next(error);
    }
  },

  async simulateConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const { id } = req.params;
      const file = await SupabaseService.getFile(id);
      if (!file || file.owner_id !== userId) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      // Mark as error with conflict details
      const updated = await SupabaseService.updateFile(id, {
        sync_status: 'error' as any,
        metadata: { ...(file.metadata || {}), conflict: { status: 'detected', at: new Date().toISOString() } },
      });

      const io = (req as any).app.get('io');
      io.to(`user-${userId}`).emit('file-updated', { fileId: id, action: 'conflict' });

      res.json({ success: true, file: updated });
    } catch (error) {
      next(error);
    }
  },

  async resolveConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const { id } = req.params;
      const { strategy = 'keep_local', name } = req.body as any;
      const file = await SupabaseService.getFile(id);
      if (!file || file.owner_id !== userId) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      let updated = file;

      if (strategy === 'keep_both') {
        const newFileId = uuidv4();
        let newStoragePath: string | undefined = undefined;
        if (file.storage_path) {
          newStoragePath = StorageService.generateStoragePath(userId, newFileId);
          await StorageService.copyFile(file.storage_path, newStoragePath);
        }

        const copiedFile = await SupabaseService.createFile({
          name: name || `Copy of ${file.name}`,
          original_name: file.original_name,
          mime_type: file.mime_type,
          size: file.size,
          storage_path: newStoragePath,
          owner_id: userId,
          parent_id: file.parent_id,
          is_folder: false,
          is_deleted: false,
          is_favorite: false,
          tags: file.tags || [],
          last_modified_by: userId,
          sync_status: 'synced'
        });

        // Add initial version entry for the copy
        if (newStoragePath) {
          await SupabaseService.createFileVersion({
            file_id: copiedFile.id,
            version_number: 1,
            storage_path: newStoragePath,
            size: file.size,
            uploaded_by: userId,
            comment: 'Created by conflict resolution (keep both)'
          });
        }

        updated = await SupabaseService.updateFile(id, {
          sync_status: 'synced' as any,
          metadata: { ...(file.metadata || {}), conflict: { status: 'resolved', strategy, at: new Date().toISOString() } },
        });
      } else {
        // keep_local or keep_remote both finish by marking resolved
        updated = await SupabaseService.updateFile(id, {
          sync_status: 'synced' as any,
          metadata: { ...(file.metadata || {}), conflict: { status: 'resolved', strategy, at: new Date().toISOString() } },
        });
      }

      const io = (req as any).app.get('io');
      io.to(`user-${userId}`).emit('file-updated', { fileId: id, action: 'resolved' });

      res.json({ success: true, file: updated });
    } catch (error) {
      next(error);
    }
  },
};
