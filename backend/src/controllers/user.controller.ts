import { Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/supabase';

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.query;
    
    if (!query || (query as string).length < 2) {
      res.json({ success: true, users: [] });
      return;
    }

    const searchQuery = query as string;

    // Search users by name or email
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, profile_picture')
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .neq('id', req.user!.id) // Exclude current user
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await SupabaseService.getUser(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get recent activity
    const activities = await SupabaseService.getActivities(userId, 10);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit
      },
      activities
    });
  } catch (error) {
    next(error);
  }
};

export const getStorageStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await SupabaseService.getUser(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get file type breakdown
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('mime_type, size')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (error) throw error;

    // Calculate stats by file type
    const stats = {
      total: user.storage_used,
      limit: user.storage_limit,
      used: user.storage_used,
      available: user.storage_limit - user.storage_used,
      percentage: Math.round((user.storage_used / user.storage_limit) * 100),
      breakdown: {} as Record<string, number>
    };

    // Group by file type
    files?.forEach(file => {
      const type = file.mime_type?.split('/')[0] || 'other';
      stats.breakdown[type] = (stats.breakdown[type] || 0) + file.size;
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = 50 } = req.query;

    const activities = await SupabaseService.getActivities(
      userId, 
      Math.min(parseInt(limit as string) || 50, 100)
    );

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    next(error);
  }
};