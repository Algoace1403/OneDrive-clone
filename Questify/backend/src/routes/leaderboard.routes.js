import express from 'express';
import {
  getLeaderboard,
  getUserRank,
  getHobbyLeaderboard
} from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getLeaderboard);
router.get('/me/rank', authenticate, getUserRank);
router.get('/hobby/:hobbyId', getHobbyLeaderboard);

export default router;
