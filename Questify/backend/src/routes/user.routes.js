import express from 'express';
import { getUserProfile, addUserHobbies, getUserStats } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:userId', getUserProfile);
router.post('/hobbies', authenticate, addUserHobbies);
router.get('/:userId/stats', getUserStats);

export default router;
