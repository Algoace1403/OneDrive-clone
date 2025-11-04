import { Router } from 'express';
import { publicShareController } from '../controllers/public.controller';

const router = Router();

// Public share routes (no authentication required)
router.get('/share/:shareId', publicShareController.getSharedFile);
router.get('/share/:shareId/download', publicShareController.downloadSharedFile);
router.get('/share/:shareId/preview', publicShareController.previewSharedFile);

export default router;