import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  points: number;
  level: number;
  currentStreak: number;
  isPremium: boolean;
  hobbies?: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const { data } = await authApi.register(userData);
      localStorage.setItem('token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const { data } = await authApi.getMe();
      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUser: (user) => {
    set({ user });
  },
}));
