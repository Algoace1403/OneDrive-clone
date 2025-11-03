import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  shareFile,
  getFileShares,
  updateShare,
  removeShare,
  createPublicLink,
  getPublicFile,
  inviteByEmail,
  getInvite,
  acceptInvite
} from '../controllers/share.controller';

const router = Router();

// Public route
router.get('/public/:linkId', getPublicFile);

// Protected routes
router.use(authenticate);

// Invite-based sharing (email without account) - must come before generic ":fileId" routes
router.post('/invite', inviteByEmail);
router.get('/invite/:token', getInvite);
router.post('/invite/:token/accept', acceptInvite);

// Generic file share routes
router.post('/:fileId', shareFile);
router.get('/:fileId', getFileShares);
router.patch('/:fileId/:shareId', updateShare);
router.delete('/:fileId/:userId', removeShare);
router.post('/:fileId/public', createPublicLink);

export default router;
