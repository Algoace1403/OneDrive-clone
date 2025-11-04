import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { SupabaseService } from '../services/supabase.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { supabaseAdmin } from '../config/supabase';

export const shareFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const { email, permission = 'view' } = req.body;
    const userId = req.user!.id;

    // Check if user owns the file
    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    // Find user to share with by email
    const shareUser = await SupabaseService.findOrCreateUserByEmail(email);
    if (!shareUser) {
      // Create email invite if user not present
      const invite = await SupabaseService.createInvite({
        file_id: fileId,
        email,
        permission,
        inviter_user_id: userId,
        expires_at: null,
      });
      return res.status(201).json({ success: true, invite: { token: invite.token, email, permission } });
    }

    if (shareUser.id === userId) {
      return next(new AppError('Cannot share file with yourself', 400));
    }

    // Check if already shared
    const existingShares = await SupabaseService.getFileShares(fileId);
    const alreadyShared = existingShares.some(share => share.shared_with_user_id === shareUser.id);
    
    if (alreadyShared) {
      return next(new AppError('File already shared with this user', 400));
    }

    // Create share
    const share = await SupabaseService.createFileShare({
      file_id: fileId,
      shared_with_user_id: shareUser.id,
      permission
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'share',
      target_type: 'file',
      target_id: fileId,
      target_name: file.name,
      details: {
        sharedWith: shareUser.email,
        permission
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${shareUser.id}`).emit('file-shared', {
      file,
      sharedBy: req.user
    });

    res.status(201).json({
      success: true,
      share: {
        ...share,
        shared_with_user: shareUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create an email invite for non-registered users
export const inviteByEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, email, permission = 'view', expiresInDays } = req.body || {};
    const userId = req.user!.id;

    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    // Optional: prevent duplicate invites for same email/file
    const invite = await SupabaseService.createInvite({
      file_id: fileId,
      email,
      permission,
      inviter_user_id: userId,
      expires_at: expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 86400000).toISOString() : null,
    });

    // In a real setup, send email here. For now, return invite token for the frontend to copy/send
    res.status(201).json({ success: true, invite: { token: invite.token, email, permission } });
  } catch (error) {
    next(error);
  }
};

export const getInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const invite = await SupabaseService.getInviteByToken(token);
    if (!invite) return next(new AppError('Invite not found', 404));
    res.json({ success: true, invite });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;
    const result = await SupabaseService.acceptInvite(token, userId);
    res.json({ success: true, invite: result });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to accept invite', 400));
  }
};

export const getFileShares = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;

    // Check if user owns the file or has access
    const file = await SupabaseService.getFile(fileId);
    if (!file) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      const shares = await SupabaseService.getFileShares(fileId);
      const hasAccess = shares.some(share => share.shared_with_user_id === userId);
      if (!hasAccess) {
        return next(new AppError('Access denied', 403));
      }
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

export const updateShare = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, shareId } = req.params;
    const { permission } = req.body;
    const userId = req.user!.id;

    // Check if user owns the file
    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    // For now, we'll remove and recreate the share with new permission
    const shares = await SupabaseService.getFileShares(fileId);
    const share = shares.find(s => s.id === shareId);
    
    if (!share) {
      return next(new AppError('Share not found', 404));
    }

    // Remove old share
    await SupabaseService.removeFileShare(share.id, userId);

    // Create new share with updated permission
    const newShare = await SupabaseService.createFileShare({
      file_id: fileId,
      shared_with_user_id: share.shared_with_user_id,
      permission
    });

    res.json({
      success: true,
      share: newShare
    });
  } catch (error) {
    next(error);
  }
};

export const removeShare = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, userId: sharedUserId } = req.params;
    const userId = req.user!.id;

    // Check if user owns the file
    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    await SupabaseService.removeFileShare(fileId, sharedUserId);

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'unshare',
      target_type: 'file',
      target_id: fileId,
      target_name: file.name
    });

    res.json({
      success: true,
      message: 'Share removed'
    });
  } catch (error) {
    next(error);
  }
};

export const createPublicLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const { permission = 'view', password, expiresIn } = req.body;
    const userId = req.user!.id;

    // Check if user owns the file
    const file = await SupabaseService.getFile(fileId);
    if (!file || file.owner_id !== userId) {
      return next(new AppError('File not found', 404));
    }

    // Generate unique URL
    const url = uuidv4();

    // Hash password if provided
    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Calculate expiry date
    let expiresAt;
    if (expiresIn) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresIn);
      expiresAt = expiryDate.toISOString();
    }

    const publicLink = await SupabaseService.createPublicLink({
      file_id: fileId,
      url,
      permission,
      password_hash: passwordHash,
      expires_at: expiresAt
    });

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'create_public_link',
      target_type: 'file',
      target_id: fileId,
      target_name: file.name
    });

    res.status(201).json({
      success: true,
      publicLink: {
        ...publicLink,
        fullUrl: `${process.env.FRONTEND_URL}/public/${url}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { linkId } = req.params;
    const { password } = req.body;

    const publicLink = await SupabaseService.getPublicLink(linkId);
    if (!publicLink) {
      return next(new AppError('Invalid link', 404));
    }

    // Check if link is expired
    if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
      return next(new AppError('Link expired', 403));
    }

    // Check password if required
    if (publicLink.password_hash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Password required'
        });
      }

      const isValidPassword = await bcrypt.compare(password, publicLink.password_hash);
      if (!isValidPassword) {
        return next(new AppError('Invalid password', 401));
      }
    }

    const file = await SupabaseService.getFile(publicLink.file_id);
    if (!file || file.is_deleted) {
      return next(new AppError('File not found', 404));
    }

    res.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mime_type,
        permission: publicLink.permission
      }
    });
  } catch (error) {
    next(error);
  }
};
