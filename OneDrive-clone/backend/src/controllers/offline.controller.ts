import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { StorageService } from '../services/storage.service';

export const offlineController = {
  async getManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const files = await SupabaseService.getRecentFiles(userId, 20);
      const items = await Promise.all(files.map(async (f: any) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        mimeType: f.mime_type,
        previewUrl: f.storage_path ? await StorageService.getFileUrl(f.storage_path, 600) : null,
        offline: !!f.metadata?.offline_available,
      })));
      res.json({ success: true, items });
    } catch (error) { next(error); }
  },

  setOffline(enabled: boolean) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user.id as string;
        const { id } = req.params;
        const file = await SupabaseService.getFile(id);
        if (!file || file.owner_id !== userId) return res.status(404).json({ success: false });
        const updated = await SupabaseService.updateFile(id, {
          metadata: { ...(file.metadata || {}), offline_available: enabled },
        });
        res.json({ success: true, file: updated });
      } catch (error) { next(error); }
    }
  },

  async reportChanges(req: Request, res: Response, next: NextFunction) {
    try {
      // For simulation we just accept and mark as synced
      const userId = (req as any).user.id as string;
      const { changes = [] } = req.body as any;
      await Promise.all(changes.map(async (c: any) => {
        await SupabaseService.updateFile(c.id, { sync_status: 'synced' as any });
      }));
      const io = (req as any).app.get('io');
      changes.forEach((c: any) => io.to(`user-${userId}`).emit('file-updated', { fileId: c.id, action: 'synced' }));
      res.json({ success: true });
    } catch (error) { next(error); }
  }
}

