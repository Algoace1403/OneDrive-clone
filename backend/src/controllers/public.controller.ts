import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { StorageService } from '../services/storage.service';
import { AppError } from '../middleware/error.middleware';

export const publicShareController = {
  async getSharedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { shareId } = req.params;
      
      // Get public share
      const share = await SupabaseService.getPublicShare(shareId);
      
      if (!share) {
        return next(new AppError('Share link not found', 404));
      }
      
      // Check if link has expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return next(new AppError('Share link has expired', 410));
      }
      
      // Get file details
      const file = await SupabaseService.getFile(share.file_id);
      
      if (!file || file.is_deleted) {
        return next(new AppError('File not found', 404));
      }
      
      // Update access count
      await SupabaseService.updatePublicShareAccess(shareId);
      
      res.json({
        success: true,
        file: {
          id: file.id,
          name: file.name,
          size: file.size,
          mime_type: file.mime_type,
          created_at: share.created_at,
          permission: share.permission
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadSharedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { shareId } = req.params;
      
      // Get public share
      const share = await SupabaseService.getPublicShare(shareId);
      
      if (!share) {
        return next(new AppError('Share link not found', 404));
      }
      
      // Check if link has expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return next(new AppError('Share link has expired', 410));
      }
      
      // Get file
      const file = await SupabaseService.getFile(share.file_id);
      
      if (!file || file.is_deleted || !file.storage_path) {
        return next(new AppError('File not available for download', 404));
      }
      
      // Get signed URL for download
      const downloadUrl = await StorageService.getFileUrl(file.storage_path, 300, true); // 5 minutes with download
      
      res.json({
        success: true,
        downloadUrl,
        filename: file.name,
        mimeType: file.mime_type
      });
    } catch (error) {
      next(error);
    }
  },

  async previewSharedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { shareId } = req.params;
      
      // Get public share
      const share = await SupabaseService.getPublicShare(shareId);
      
      if (!share) {
        return next(new AppError('Share link not found', 404));
      }
      
      // Check if link has expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return next(new AppError('Share link has expired', 410));
      }
      
      // Check permission
      if (share.permission === 'view' || share.permission === 'edit') {
        // Get file
        const file = await SupabaseService.getFile(share.file_id);
        
        if (!file || file.is_deleted || !file.storage_path) {
          return next(new AppError('File not available for preview', 404));
        }
        
        // Get signed URL for preview
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
      } else {
        return next(new AppError('Preview not allowed', 403));
      }
    } catch (error) {
      next(error);
    }
  }
};