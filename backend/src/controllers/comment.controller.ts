import { Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to the file
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

    const comments = await SupabaseService.getComments(fileId);

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const { content, parentCommentId, mentions = [] } = req.body;
    const userId = req.user!.id;

    // Check if user has access to comment on the file
    const file = await SupabaseService.getFile(fileId);
    if (!file) {
      return next(new AppError('File not found', 404));
    }

    if (file.owner_id !== userId) {
      const shares = await SupabaseService.getFileShares(fileId);
      const userShare = shares.find(share => share.shared_with_user_id === userId);
      
      if (!userShare || userShare.permission === 'view') {
        return next(new AppError('Access denied', 403));
      }
    }

    const comment = await SupabaseService.createComment({
      file_id: fileId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId,
      is_edited: false,
      is_deleted: false,
      mentions
    });

    // Get the full comment with user info
    const fullComment = {
      ...comment,
      user: req.user,
      reactions: []
    };

    // Log activity
    await SupabaseService.createActivity({
      user_id: userId,
      action: 'comment',
      target_type: 'file',
      target_id: fileId,
      target_name: file.name,
      details: { commentId: comment.id }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`file-${fileId}`).emit('comment-added', {
      comment: fullComment
    });

    res.status(201).json({
      success: true,
      comment: fullComment
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const comment = await SupabaseService.updateComment(commentId, userId, content);

    // Get the full comment with user info
    const fullComment = {
      ...comment,
      user: req.user
    };

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`file-${fileId}`).emit('comment-updated', {
      comment: fullComment
    });

    res.json({
      success: true,
      comment: fullComment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, commentId } = req.params;
    const userId = req.user!.id;

    await SupabaseService.deleteComment(commentId, userId);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`file-${fileId}`).emit('comment-deleted', {
      commentId
    });

    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, commentId } = req.params;
    const reactionType = req.body.reactionType || req.body.type;
    const userId = req.user!.id;

    const reaction = await SupabaseService.addReaction({
      comment_id: commentId,
      user_id: userId,
      reaction_type: reactionType
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`file-${fileId}`).emit('reaction-added', {
      commentId,
      reaction
    });

    res.status(201).json({
      success: true,
      reaction
    });
  } catch (error) {
    next(error);
  }
};

export const removeReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId, commentId } = req.params;
    const reactionType = req.body.reactionType || req.body.type;
    const userId = req.user!.id;

    await SupabaseService.removeReaction(commentId, userId, reactionType);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`file-${fileId}`).emit('reaction-removed', {
      commentId,
      userId,
      reactionType
    });

    res.json({
      success: true,
      message: 'Reaction removed'
    });
  } catch (error) {
    next(error);
  }
};

// Frontend alias routes that only provide commentId
export const updateCommentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // Update comment
    const updated = await SupabaseService.updateComment(commentId, userId, content);

    // Get comment to determine file room for emit
    const full = await SupabaseService.getComment(commentId);

    const io = req.app.get('io');
    io.to(`file-${full.file_id}`).emit('comment-updated', {
      comment: { ...updated, user: req.user }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    // Get before delete to know file id
    const existing = await SupabaseService.getComment(commentId);

    await SupabaseService.deleteComment(commentId, userId);

    const io = req.app.get('io');
    io.to(`file-${existing.file_id}`).emit('comment-deleted', {
      commentId
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

export const addReactionByCommentId = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const reactionType = req.body.reactionType || req.body.type;
    const userId = req.user!.id;

    const existing = await SupabaseService.getComment(commentId);

    const reaction = await SupabaseService.addReaction({
      comment_id: commentId,
      user_id: userId,
      reaction_type: reactionType
    });

    const io = req.app.get('io');
    io.to(`file-${existing.file_id}`).emit('reaction-added', {
      commentId,
      reaction
    });

    res.status(201).json({ success: true, reaction });
  } catch (error) {
    next(error);
  }
};
