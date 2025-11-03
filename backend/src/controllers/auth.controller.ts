import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Registration attempt:', { email: req.body.email, name: req.body.name });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Sign up user with Supabase
    const { user, session } = await AuthService.signUp({
      email,
      password,
      name
    });

    console.log('User created successfully:', user.id);

    // Log activity
    await SupabaseService.createActivity({
      user_id: user.id,
      action: 'register',
      target_type: 'user',
      target_id: user.id,
      target_name: user.name,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      token: session?.access_token,
      refreshToken: session?.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message?.includes('already registered') || error.code === '23505') {
      return next(new AppError('Email already registered', 400));
    }
    
    if (error.message?.includes('Email address') && error.message?.includes('invalid')) {
      return next(new AppError('Please use a valid email address (e.g., user@example.com)', 400));
    }
    
    if (error.code === 'email_address_invalid') {
      return next(new AppError('Email format is invalid. Try using a different email provider.', 400));
    }
    
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Sign in user with Supabase
    const { user, session, accessToken } = await AuthService.signIn({
      email,
      password
    });

    console.log('Login successful for user:', user.id);

    // Log activity
    await SupabaseService.createActivity({
      user_id: user.id,
      action: 'login',
      target_type: 'user',
      target_id: user.id,
      target_name: user.name,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      token: accessToken,
      refreshToken: session?.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit
      }
    });
  } catch (error: any) {
    console.error('Login controller error:', error);
    
    if (error.message?.includes('Invalid') || 
        error.message?.includes('Invalid login credentials') ||
        error.code === 'invalid_credentials') {
      return next(new AppError('Invalid email or password', 401));
    }
    
    if (error.message?.includes('Email not confirmed')) {
      return next(new AppError('Please confirm your email before logging in', 401));
    }
    
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await AuthService.signOut();

    if (req.user) {
      // Log activity
      await SupabaseService.createActivity({
        user_id: req.user.id,
        action: 'logout',
        target_type: 'user',
        target_id: req.user.id,
        target_name: req.user.name,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return next(new AppError('User not found', 404));
    }

    const { name, profilePicture } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (profilePicture) updates.profile_picture = profilePicture;

    const updatedUser = await AuthService.updateProfile(req.user.id, updates);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        profilePicture: updatedUser.profile_picture,
        storageUsed: updatedUser.storage_used,
        storageLimit: updatedUser.storage_limit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token required', 400));
    }

    const tokens = await AuthService.refreshSession(refreshToken);

    res.json({
      success: true,
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    await AuthService.resetPassword(email);

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    await AuthService.updatePassword(newPassword);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};