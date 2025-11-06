import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; username: string; fullName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// User API
export const userApi = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  addHobbies: (hobbyIds: string[]) => api.post('/users/hobbies', { hobbyIds }),
  getStats: (userId: string) => api.get(`/users/${userId}/stats`),
};

// Quest API
export const questApi = {
  getAll: (params?: any) => api.get('/quests', { params }),
  getById: (questId: string) => api.get(`/quests/${questId}`),
  getMy: (params?: any) => api.get('/quests/my', { params }),
  join: (questId: string) => api.post(`/quests/${questId}/join`),
  updateProgress: (questId: string, progress: number) =>
    api.put(`/quests/${questId}/progress`, { progress }),
};

// Post API
export const postApi = {
  create: (data: FormData) =>
    api.post('/posts', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getFeed: (params?: any) => api.get('/posts/feed', { params }),
  getById: (postId: string) => api.get(`/posts/${postId}`),
  like: (postId: string) => api.post(`/posts/${postId}/like`),
  comment: (postId: string, content: string) =>
    api.post(`/posts/${postId}/comment`, { content }),
  delete: (postId: string) => api.delete(`/posts/${postId}`),
};

// Reward API
export const rewardApi = {
  getAll: (params?: any) => api.get('/rewards', { params }),
  getById: (rewardId: string) => api.get(`/rewards/${rewardId}`),
  getMy: (params?: any) => api.get('/rewards/my', { params }),
  redeem: (rewardId: string) => api.post(`/rewards/${rewardId}/redeem`),
  markAsUsed: (userRewardId: string) => api.put(`/rewards/${userRewardId}/use`),
};

// Hobby API
export const hobbyApi = {
  getAll: () => api.get('/hobbies'),
  getById: (hobbyId: string) => api.get(`/hobbies/${hobbyId}`),
};

// Leaderboard API
export const leaderboardApi = {
  getGlobal: (params?: any) => api.get('/leaderboard', { params }),
  getMyRank: () => api.get('/leaderboard/me/rank'),
  getByHobby: (hobbyId: string, params?: any) =>
    api.get(`/leaderboard/hobby/${hobbyId}`, { params }),
};

export default api;
