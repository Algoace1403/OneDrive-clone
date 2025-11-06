import express from 'express';
import {
  getRewards,
  getRewardById,
  redeemReward,
  getMyRewards,
  markRewardAsUsed
} from '../controllers/reward.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getRewards);
router.get('/my', authenticate, getMyRewards);
router.get('/:rewardId', getRewardById);
router.post('/:rewardId/redeem', authenticate, redeemReward);
router.put('/:userRewardId/use', authenticate, markRewardAsUsed);

export default router;
