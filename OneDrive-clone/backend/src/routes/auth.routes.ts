import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  updateProfile, 
  refreshToken, 
  resetPassword, 
  updatePassword 
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required')
], register);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

// Logout
router.post('/logout', authenticate, logout);

// Get current user
router.get('/me', authenticate, getMe);

// Update profile
router.patch('/profile', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('profilePicture').optional().isURL()
], updateProfile);

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty()
], refreshToken);

// Reset password request
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail()
], resetPassword);

// Update password
router.post('/update-password', authenticate, [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], updatePassword);

export default router;