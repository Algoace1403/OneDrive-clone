'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              🎯 Questify
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                Dashboard
              </Link>
              <Link href="/quests" className="text-gray-700 hover:text-primary-600">
                Quests
              </Link>
              <Link href="/feed" className="text-gray-700 hover:text-primary-600">
                Feed
              </Link>
              <Link href="/rewards" className="text-gray-700 hover:text-primary-600">
                Rewards
              </Link>
              <Link href="/leaderboard" className="text-gray-700 hover:text-primary-600">
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-gray-500">Level {user.level} • {user.points} pts</p>
            </div>
            <button onClick={logout} className="btn btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.fullName || user.username}! 👋
          </h1>
          <p className="text-gray-600">Ready to complete some quests today?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-3xl font-bold text-primary-600">{user.level}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Points</p>
                <p className="text-3xl font-bold text-purple-600">{user.points}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Streak</p>
                <p className="text-3xl font-bold text-orange-600">{user.currentStreak}</p>
              </div>
              <div className="text-4xl">🔥</div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Quests</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/quests" className="block p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-medium text-primary-900">Browse Quests</p>
                    <p className="text-sm text-primary-700">Find new challenges to join</p>
                  </div>
                </div>
              </Link>

              <Link href="/feed" className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-medium text-purple-900">View Feed</p>
                    <p className="text-sm text-purple-700">See what others are doing</p>
                  </div>
                </div>
              </Link>

              <Link href="/rewards" className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <p className="font-medium text-green-900">Claim Rewards</p>
                    <p className="text-sm text-green-700">Redeem your points for coupons</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Your Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Level {user.level} Progress</span>
                  <span className="text-sm font-medium">{user.points % 100}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all"
                    style={{ width: `${(user.points % 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-2">Keep your streak going!</p>
                <p className="text-3xl font-bold">{user.currentStreak} Days 🔥</p>
                <p className="text-sm opacity-90 mt-2">Complete a quest today to maintain your streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
