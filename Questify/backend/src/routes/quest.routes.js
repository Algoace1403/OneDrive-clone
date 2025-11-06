import express from 'express';
import {
  getQuests,
  getQuestById,
  joinQuest,
  updateQuestProgress,
  getMyQuests
} from '../controllers/quest.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalAuth, getQuests);
router.get('/my', authenticate, getMyQuests);
router.get('/:questId', optionalAuth, getQuestById);
router.post('/:questId/join', authenticate, joinQuest);
router.put('/:questId/progress', authenticate, updateQuestProgress);

export default router;
