import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
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

dotenv.config();

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

// Create upload directory if it doesn't exist
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
    // Create Supabase storage bucket if it doesn't exist
    await StorageService.createBucketIfNotExists();
    console.log('Supabase storage initialized');

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Scheduled trash purge (mock)
    if (process.env.ENABLE_AUTO_PURGE === 'true') {
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
    process.exit(1);
  }
};

startServer();

export { io };
