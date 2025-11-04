import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for field mapping
const mapFileFields = (file: any) => {
  if (!file) return file;
  
  // Map Supabase fields to frontend expected fields
  return {
    ...file,
    _id: file.id || file._id,
    isFolder: file.is_folder !== undefined ? file.is_folder : file.isFolder,
    isFavorite: file.is_favorite !== undefined ? file.is_favorite : file.isFavorite,
    isDeleted: file.is_deleted !== undefined ? file.is_deleted : file.isDeleted,
    deletedAt: file.deleted_at || file.deletedAt,
    originalName: file.original_name || file.originalName,
    mimeType: file.mime_type || file.mimeType,
    storagePath: file.storage_path || file.storagePath,
    parentId: file.parent_id || file.parentId,
    createdAt: file.created_at || file.createdAt,
    updatedAt: file.updated_at || file.updatedAt,
    owner: file.owner_id || file.owner,
    lastModifiedBy: file.last_modified_by || file.lastModifiedBy,
    syncStatus: file.sync_status || file.syncStatus
  };
};

// Token refresh logic
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Handle auth errors and field mapping
apiClient.interceptors.response.use(
  (response) => {
    // Map file fields in responses
    if (response.data?.file) {
      response.data.file = mapFileFields(response.data.file);
    }
    if (response.data?.files && Array.isArray(response.data.files)) {
      response.data.files = response.data.files.map(mapFileFields);
    }
    if (response.data?.folders && Array.isArray(response.data.folders)) {
      response.data.folders = response.data.folders.map(mapFileFields);
    }
    if (response.data?.folder) {
      response.data.folder = mapFileFields(response.data.folder);
    }
    
    // Map user fields
    if (response.data?.user) {
      const user = response.data.user;
      response.data.user = {
        ...user,
        _id: user.id || user._id,
        storageUsed: user.storage_used || user.storageUsed,
        storageLimit: user.storage_limit || user.storageLimit,
        profilePicture: user.profile_picture || user.profilePicture
      };
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          const response = await apiClient.post('/auth/refresh', { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = response.data
          
          localStorage.setItem('token', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          processQueue(null, accessToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          return apiClient(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/auth/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(error)
  }
)
