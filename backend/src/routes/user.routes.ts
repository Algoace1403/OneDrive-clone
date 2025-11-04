import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { searchUsers, getRecentActivity, getStorageStats } from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/search', searchUsers);
router.get('/activity', getRecentActivity);
router.get('/storage', getStorageStats);

export default router;