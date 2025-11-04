import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getFolderPath } from '../controllers/file.controller';

const router = Router();

// All folder routes require authentication
router.use(authenticate);

// Breadcrumb path for a folder
router.get('/:id/path', getFolderPath);

export default router;

