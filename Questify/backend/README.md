# Questify Backend

Gamified social platform API for hobby-based challenges and rewards.

## Features

- 🔐 User Authentication (JWT-based)
- 👤 User Profiles with Hobbies
- 🎯 Quest/Challenge System
- 📝 Social Feed (Posts, Likes, Comments)
- 🏆 Gamification (Points, Levels, Streaks, Achievements)
- 🎁 Rewards & Coupon Redemption
- 📊 Leaderboards
- 🔄 Real-time Updates (Socket.IO)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT + Supabase Auth
- **File Upload:** Multer
- **Real-time:** Socket.IO

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in your environment variables:

```env
PORT=5001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Origins
CORS_ORIGINS=http://localhost:3000
```

### 3. Set Up Database

1. Go to your Supabase project
2. Open the SQL Editor
3. Run the SQL script from `src/config/database-schema.sql`

This will create all necessary tables, relationships, and seed data.

### 4. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:5001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Users
- `GET /api/users/:userId` - Get user profile
- `POST /api/users/hobbies` - Add/update user hobbies (protected)
- `GET /api/users/:userId/stats` - Get user statistics

### Quests
- `GET /api/quests` - Get all quests
- `GET /api/quests/my` - Get my quests (protected)
- `GET /api/quests/:questId` - Get quest details
- `POST /api/quests/:questId/join` - Join a quest (protected)
- `PUT /api/quests/:questId/progress` - Update progress (protected)

### Posts
- `POST /api/posts` - Create post (protected)
- `GET /api/posts/feed` - Get feed
- `GET /api/posts/:postId` - Get post details
- `POST /api/posts/:postId/like` - Like/unlike post (protected)
- `POST /api/posts/:postId/comment` - Comment on post (protected)
- `DELETE /api/posts/:postId` - Delete post (protected)

### Rewards
- `GET /api/rewards` - Get all rewards
- `GET /api/rewards/my` - Get my rewards (protected)
- `GET /api/rewards/:rewardId` - Get reward details
- `POST /api/rewards/:rewardId/redeem` - Redeem reward (protected)
- `PUT /api/rewards/:userRewardId/use` - Mark as used (protected)

### Hobbies
- `GET /api/hobbies` - Get all hobbies
- `GET /api/hobbies/:hobbyId` - Get hobby details

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/me/rank` - Get my rank (protected)
- `GET /api/leaderboard/hobby/:hobbyId` - Get hobby leaderboard

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js          # Supabase client configuration
│   │   └── database-schema.sql  # Database schema
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── quest.controller.js
│   │   ├── post.controller.js
│   │   ├── reward.controller.js
│   │   ├── hobby.controller.js
│   │   └── leaderboard.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── error.middleware.js  # Error handling
│   │   └── upload.middleware.js # File upload
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── quest.routes.js
│   │   ├── post.routes.js
│   │   ├── reward.routes.js
│   │   ├── hobby.routes.js
│   │   └── leaderboard.routes.js
│   └── server.js                # Main server file
├── uploads/                     # Uploaded files
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Real-time Events (Socket.IO)

The API uses Socket.IO for real-time features:

### Client Events
- `join-user` - Join user's personal room
- `new-post` - Notify about new post
- `new-like` - Notify about new like
- `new-comment` - Notify about new comment

### Server Events
- `post-created` - New post created
- `post-liked` - Post liked
- `post-commented` - Post commented

## Development

- All routes with `(protected)` require Bearer token in Authorization header
- Token format: `Authorization: Bearer <your-jwt-token>`
- Get token from `/api/auth/login` or `/api/auth/register` responses

## License

MIT
