import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { offlineController } from '../controllers/offline.controller';

const router = Router();

router.use(authenticate);

router.get('/manifest', offlineController.getManifest);
router.post('/cache/:id', offlineController.setOffline(true));
router.delete('/cache/:id', offlineController.setOffline(false));
router.post('/report', offlineController.reportChanges);

export default router;

