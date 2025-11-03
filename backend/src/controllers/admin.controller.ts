import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';

function isAdmin(userId?: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return !!userId && adminIds.includes(userId);
}

export const adminController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id as string | undefined;
      if (!isAdmin(userId)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
      }
      const users = await SupabaseService.listUsersBasic();
      res.json({ success: true, users });
    } catch (error) {
      next(error);
    }
  },

  async updateStorageLimit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id as string | undefined;
      if (!isAdmin(userId)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
      }
      const { userId: targetId } = req.params as any;
      const { limit } = req.body as any;
      if (!targetId || typeof limit !== 'number' || limit <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid limit' });
      }
      const updated = await SupabaseService.updateUserStorageLimit(targetId, limit);
      res.json({ success: true, user: updated });
    } catch (error) {
      next(error);
    }
  },
};

