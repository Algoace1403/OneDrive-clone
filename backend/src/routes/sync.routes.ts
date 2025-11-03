import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { syncController } from '../controllers/sync.controller';

const router = Router();

router.use(authenticate);

router.post('/simulate', syncController.simulateSync);
router.get('/status', syncController.getSyncStatus);
router.post('/conflict/:id', syncController.simulateConflict);
router.post('/resolve/:id', syncController.resolveConflict);

export default router;

