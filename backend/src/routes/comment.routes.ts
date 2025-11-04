import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  updateCommentById,
  deleteCommentById,
  addReactionByCommentId
} from '../controllers/comment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Comment operations
router.post('/:fileId/comments', addComment);
router.get('/:fileId/comments', getComments);
router.patch('/:fileId/comments/:commentId', updateComment);
router.delete('/:fileId/comments/:commentId', deleteComment);

// Reaction operations
router.post('/:fileId/comments/:commentId/reactions', addReaction);
router.delete('/:fileId/comments/:commentId/reactions', removeReaction);

// Frontend alias routes (without fileId in path)
router.patch('/comments/:commentId', updateCommentById);
router.delete('/comments/:commentId', deleteCommentById);
router.post('/comments/:commentId/reactions', addReactionByCommentId);

export default router;
