import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);

router.get('/users', adminController.listUsers);
router.patch('/users/:userId/storage', adminController.updateStorageLimit);

export default router;

