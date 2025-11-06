import express from 'express';
import {
  createPost,
  getFeed,
  getPost,
  likePost,
  commentOnPost,
  deletePost
} from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', authenticate, upload.single('image'), createPost);
router.get('/feed', optionalAuth, getFeed);
router.get('/:postId', optionalAuth, getPost);
router.post('/:postId/like', authenticate, likePost);
router.post('/:postId/comment', authenticate, commentOnPost);
router.delete('/:postId', authenticate, deletePost);

export default router;
