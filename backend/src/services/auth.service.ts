import { supabase, supabaseAdmin } from '../config/supabase';
import { SupabaseService } from './supabase.service';
import type { User } from '../config/supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async signUp(data: SignUpData) {
    console.log('SignUp service called with:', { email: data.email, name: data.name });
    
    try {
      let userId: string;
      let session: any = null;

      // First try regular signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name
          },
          emailRedirectTo: process.env.NODE_ENV === 'development' ? undefined : `${process.env.FRONTEND_URL}/auth/confirm`
        }
      });

      if (authError) {
        console.error('Regular signup error:', authError);
        
        // In development, if email validation fails, use admin API
        if (process.env.NODE_ENV === 'development' && 
            (authError.message?.includes('email') || authError.code === 'email_address_invalid')) {
          
          console.log('Attempting admin user creation for development...');
          
          // First check if user already exists
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users.find(u => u.email === data.email);
          
          if (existingUser) {
            throw new Error('Email already registered');
          }
          
          // Create user with admin API
          const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
              name: data.name
            }
          });

          if (adminError) {
            console.error('Admin create error:', adminError);
            throw adminError;
          }
          
          if (!adminData.user) throw new Error('Admin user creation failed');
          
          userId = adminData.user.id;
          console.log('User created with admin API:', userId);
          
          // Try to create a session after admin user creation
          // Note: This might fail, but user can still login manually
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password
            });
            session = signInData.session;
          } catch (signInError) {
            console.log('Auto sign-in after admin create failed, user needs to login manually');
          }
          
        } else {
          throw authError;
        }
      } else {
        if (!authData.user) throw new Error('User creation failed');
        userId = authData.user.id;
        session = authData.session;
        console.log('User created with regular signup:', userId);
      }

      // Create user profile in public.users table
      const userProfile = await SupabaseService.createUser(
        userId,
        data.email,
        data.name
      );

      console.log('User profile created:', userProfile.id);

      return {
        user: userProfile,
        session: session
      };
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.message?.includes('duplicate key') || 
          error.code === '23505' || 
          error.message?.includes('already registered')) {
        throw new Error('Email already registered');
      }
      
      throw error;
    }
  }

  static async signIn(data: SignInData) {
    console.log('SignIn attempt for:', data.email);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        console.error('SignIn error:', error);
        throw error;
      }
      
      if (!authData.user || !authData.session) {
        throw new Error('Sign in failed');
      }

      console.log('User signed in:', authData.user.id);

      // Get user profile
      const userProfile = await SupabaseService.getUser(authData.user.id);

      return {
        user: userProfile,
        session: authData.session,
        accessToken: authData.session.access_token
      };
    } catch (error: any) {
      console.error('SignIn service error:', error);
      throw error;
    }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;

    const userProfile = await SupabaseService.getUser(user.id);
    return userProfile;
  }

  static async verifyToken(token: string) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) return null;

    const userProfile = await SupabaseService.getUser(user.id);
    return userProfile;
  }

  static async updateProfile(userId: string, updates: Partial<User>) {
    return await SupabaseService.updateUser(userId, updates);
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`
    });

    if (error) throw error;
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  static async refreshSession(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;
    if (!data.session) throw new Error('Session refresh failed');

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    };
  }
}