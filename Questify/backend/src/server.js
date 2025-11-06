import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import questRoutes from './routes/quest.routes.js';
import postRoutes from './routes/post.routes.js';
import rewardRoutes from './routes/reward.routes.js';
import hobbyRoutes from './routes/hobby.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';

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

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/hobbies', hobbyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Questify API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      quests: '/api/quests',
      posts: '/api/posts',
      rewards: '/api/rewards',
      hobbies: '/api/hobbies',
      leaderboard: '/api/leaderboard'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Questify API is running' });
});

// Error handling
app.use(errorHandler);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('new-post', (data) => {
    // Broadcast new post to followers
    io.emit('post-created', data);
  });

  socket.on('new-like', (data) => {
    // Notify post owner
    io.to(`user-${data.postOwnerId}`).emit('post-liked', data);
  });

  socket.on('new-comment', (data) => {
    // Notify post owner
    io.to(`user-${data.postOwnerId}`).emit('post-commented', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Questify API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

export { io };
export default app;
