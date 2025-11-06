import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, username, fullName } = req.body;

    if (!email || !password || !username) {
      throw new AppError('Email, password, and username are required', 400);
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      throw new AppError('User with this email or username already exists', 400);
    }

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw new AppError(authError.message, 400);

    // Create user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        full_name: fullName || username
      })
      .select()
      .single();

    if (userError) {
      // Rollback auth user creation
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new AppError('Failed to create user profile', 500);
    }

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        points: user.points,
        level: user.level
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw new AppError('Invalid credentials', 401);

    // Get user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw new AppError('User not found', 404);

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        points: user.points,
        level: user.level,
        currentStreak: user.current_streak,
        isPremium: user.is_premium
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_hobbies(
          hobby:hobbies(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw new AppError('User not found', 404);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        points: user.points,
        level: user.level,
        currentStreak: user.current_streak,
        longestStreak: user.longest_streak,
        totalQuestsCompleted: user.total_quests_completed,
        isPremium: user.is_premium,
        hobbies: user.user_hobbies?.map(uh => uh.hobby) || [],
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, bio, avatarUrl } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update profile', 500);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        points: user.points,
        level: user.level
      }
    });
  } catch (error) {
    next(error);
  }
};
