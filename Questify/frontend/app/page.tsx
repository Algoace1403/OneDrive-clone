'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-3xl font-bold text-white">🎯 Questify</div>
        <div className="space-x-4">
          <Link href="/login" className="btn bg-white text-primary-600 hover:bg-gray-100">
            Login
          </Link>
          <Link href="/register" className="btn bg-primary-700 text-white hover:bg-primary-800">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
          Gamify Your Life,<br />One Quest at a Time
        </h1>
        <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto animate-slide-up">
          Turn your hobbies into rewarding quests. Complete challenges, earn points,
          and unlock amazing rewards from top brands.
        </p>

        <div className="flex gap-4 justify-center mb-20 animate-slide-up">
          <Link
            href="/register"
            className="btn btn-primary text-lg px-8 py-4 shadow-2xl hover:scale-105 transition-transform"
          >
            Start Your Journey
          </Link>
          <Link
            href="/quests"
            className="btn bg-white/20 text-white backdrop-blur-sm text-lg px-8 py-4 hover:bg-white/30"
          >
            Explore Quests
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="card bg-white/10 backdrop-blur-md text-white border-white/20">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Daily Quests</h3>
            <p className="text-white/80">
              Join challenges in running, fitness, reading, and more
            </p>
          </div>

          <div className="card bg-white/10 backdrop-blur-md text-white border-white/20">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
            <p className="text-white/80">
              Get exclusive discounts from brands like Adidas, Nike, and more
            </p>
          </div>

          <div className="card bg-white/10 backdrop-blur-md text-white border-white/20">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Social Community</h3>
            <p className="text-white/80">
              Share progress, compete on leaderboards, and stay motivated
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-white/70">
        <p>© 2024 Questify. Gamify your hobbies, reward your dedication.</p>
      </footer>
    </div>
  );
}
