# 🎯 Questify - Gamify Your Life

A social gamification platform where users complete hobby-based challenges, earn points, and redeem rewards from partner brands.

## 🚀 Features

- ✅ User Authentication & Profiles
- 🎯 Quest/Challenge System
- 📱 Social Feed (Posts, Likes, Comments)
- 🏆 Gamification (Points, Levels, Streaks, Achievements)
- 🎁 Rewards & Brand Partnerships
- 📊 Leaderboards
- 🔄 Real-time Updates

## 🛠 Tech Stack

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- Socket.IO
- JWT Authentication

### Frontend
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Query

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_random_secret
```

Set up database:
1. Go to Supabase SQL Editor
2. Run `src/config/database-schema.sql`

Start backend:
```bash
npm run dev
```

Backend runs at: http://localhost:5001

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

Start frontend:
```bash
npm run dev
```

Frontend runs at: http://localhost:3000

## 🎮 Usage

1. **Register**: Create an account at `/register`
2. **Select Hobbies**: Choose your interests
3. **Browse Quests**: Find challenges in `/quests`
4. **Join & Complete**: Track your progress
5. **Post Updates**: Share your journey on the feed
6. **Earn Rewards**: Redeem points for brand coupons

## 📁 Project Structure

```
Questify/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   └── package.json
│
└── README.md
```

## 🌟 Key Features Explained

### Gamification System
- **Points**: Earn by completing quests
- **Levels**: Automatically calculated from points
- **Streaks**: Daily quest completion tracking
- **Achievements**: Unlock badges for milestones

### Quest System
- Join active quests
- Track progress
- Update with posts
- Earn rewards on completion

### Social Features
- Post updates with images
- Like and comment on posts
- Follow quest participants
- Real-time notifications

### Reward System
- Browse brand rewards
- Redeem with points
- Get unique coupon codes
- Track redemption history

## 🤝 Contributing

This is a hackathon project. Feel free to fork and build upon it!

## 📄 License

MIT

---

Built with ❤️ for gamifying everyday life!
