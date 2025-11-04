// Load environment variables FIRST in development (before any other imports)
if (!process.env.VERCEL) {
  require('dotenv').config();
}

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
// fs import removed - not needed in serverless
import { StorageService } from './services/storage.service';

import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import shareRoutes from './routes/share.routes';
import userRoutes from './routes/user.routes';
import folderRoutes from './routes/folder.routes';
import syncRoutes from './routes/sync.routes';
import offlineRoutes from './routes/offline.routes';
import healthRoutes from './routes/health.routes';
import adminRoutes from './routes/admin.routes';
import commentRoutes from './routes/comment.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload directory creation handled by multer config

// Serve static files for testing
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', commentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/offline', offlineRoutes);
app.use('/api/public', publicRoutes); // Public routes (no auth required)
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint - API documentation
app.get('/', (_req, res) => {
  const apiDocs = {
    message: 'OneDrive Clone API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/me': 'Get current user profile (requires auth)',
        'PUT /api/auth/profile': 'Update user profile (requires auth)',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/reset-password': 'Reset password',
        'PUT /api/auth/password': 'Update password (requires auth)'
      },
      files: {
        'GET /api/files': 'Get all files and folders',
        'GET /api/files/:id': 'Get file by ID',
        'POST /api/files/upload': 'Upload a file',
        'PUT /api/files/:id': 'Update file metadata',
        'DELETE /api/files/:id': 'Delete file',
        'PATCH /api/files/:id/favorite': 'Toggle favorite status',
        'GET /api/files/:id/download': 'Download file',
        'GET /api/files/recent': 'Get recent files',
        'GET /api/files/favorites': 'Get favorite files',
        'GET /api/files/shared': 'Get shared files',
        'GET /api/files/shared/by-me': 'Get files shared by me',
        'GET /api/files/trash': 'Get trashed files',
        'POST /api/files/:id/restore': 'Restore file from trash',
        'DELETE /api/files/:id/permanent': 'Permanently delete file',
        'GET /api/files/search': 'Search files',
        'GET /api/files/meta': 'Get files metadata',
        'GET /api/files/favorites/check': 'Check favorite status',
        'GET /api/files/:id/activity': 'Get file activity',
        'GET /api/files/:id/versions': 'Get file versions',
        'POST /api/files/:id/revert': 'Revert to file version',
        'GET /api/files/:id/comments': 'Get file comments',
        'POST /api/files/:id/comments': 'Add comment to file',
        'PUT /api/files/:id/comments/:commentId': 'Update comment',
        'DELETE /api/files/:id/comments/:commentId': 'Delete comment'
      },
      folders: {
        'POST /api/folders': 'Create a new folder',
        'PUT /api/folders/:id': 'Update folder',
        'DELETE /api/folders/:id': 'Delete folder',
        'GET /api/folders/:id': 'Get folder details'
      },
      share: {
        'POST /api/share/:fileId': 'Share a file',
        'GET /api/files/:id/shares': 'Get file shares',
        'DELETE /api/files/shares/:shareId': 'Remove share',
        'PATCH /api/share/:fileId/:shareId': 'Update share permissions',
        'GET /api/share/:shareId': 'Get share details'
      },
      users: {
        'GET /api/users': 'Get all users (admin only)',
        'GET /api/users/search': 'Search users',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      sync: {
        'POST /api/sync/check': 'Check sync status',
        'POST /api/sync/update': 'Update sync status',
        'POST /api/sync/bulk': 'Bulk sync update'
      },
      offline: {
        'POST /api/offline/cache/:fileId': 'Cache file for offline',
        'DELETE /api/offline/cache/:fileId': 'Remove offline cache',
        'GET /api/offline/cached': 'Get cached files',
        'POST /api/offline/sync': 'Sync offline changes'
      },
      public: {
        'GET /api/public/share/:shareId': 'Get public share',
        'GET /api/public/download/:shareId': 'Download public share'
      },
      admin: {
        'GET /api/admin/stats': 'Get system stats (admin only)',
        'GET /api/admin/users': 'Get all users (admin only)',
        'POST /api/admin/users/:id/suspend': 'Suspend user (admin only)',
        'POST /api/admin/users/:id/unsuspend': 'Unsuspend user (admin only)',
        'DELETE /api/admin/trash/purge': 'Purge trash (admin only)'
      },
      health: {
        'GET /api/health': 'Health check'
      }
    }
  };
  res.json(apiDocs);
});

// API endpoint - API documentation
app.get('/api', (_req, res) => {
  res.redirect('/');
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'OneDrive Clone API is running' });
});

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('join-file', (fileId) => {
    socket.join(`file-${fileId}`);
    console.log(`Socket joined file room: ${fileId}`);
  });

  socket.on('leave-file', (fileId) => {
    socket.leave(`file-${fileId}`);
    console.log(`Socket left file room: ${fileId}`);
  });

  socket.on('file-update', (data) => {
    socket.to(`user-${data.userId}`).emit('file-updated', data);
  });

  socket.on('comment-added', (data) => {
    socket.to(`file-${data.fileId}`).emit('comment-added', data.comment);
  });

  socket.on('comment-updated', (data) => {
    socket.to(`file-${data.fileId}`).emit('comment-updated', data.comment);
  });

  socket.on('comment-deleted', (data) => {
    socket.to(`file-${data.fileId}`).emit('comment-deleted', data.commentId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Initialize services and start server
const startServer = async () => {
  try {
    // Only initialize storage in non-serverless environments
    if (!process.env.VERCEL) {
      try {
        await StorageService.createBucketIfNotExists();
        console.log('Supabase storage initialized');
      } catch (error) {
        console.warn('Could not initialize storage:', error);
      }
    }

    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Scheduled trash purge (mock) - only in non-serverless
    if (process.env.ENABLE_AUTO_PURGE === 'true' && !process.env.VERCEL) {
      const days = parseInt(process.env.TRASH_RETENTION_DAYS || '30');
      setInterval(async () => {
        try {
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
          await StorageService.purgeDeletedBefore(cutoff);
          console.log('Auto purge executed');
        } catch (e) {
          console.warn('Auto purge failed', e);
        }
      }, 6 * 60 * 60 * 1000); // every 6 hours
    }
  } catch (error) {
    console.error('Server initialization error:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// For Vercel deployment
if (process.env.VERCEL) {
  // In Vercel, we export the Express app
  module.exports = app;
} else {
  // In local development, start the server normally
  startServer();
}

export { io };
export default app;
