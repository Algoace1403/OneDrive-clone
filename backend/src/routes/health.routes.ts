import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/details', healthController.details);

export default router;

