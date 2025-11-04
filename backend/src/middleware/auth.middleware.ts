import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import type { User } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    // Verify token with Supabase
    const user = await AuthService.verifyToken(token);

    if (!user) {
      throw new Error('Invalid token');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const user = await AuthService.verifyToken(token);

      if (user) {
        req.user = user;
        req.token = token;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};