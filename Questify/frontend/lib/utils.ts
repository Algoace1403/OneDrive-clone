import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString();
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export function getNextLevelPoints(level: number): number {
  return Math.pow(level, 2) * 100;
}

export function getLevelProgress(points: number, level: number): number {
  const currentLevelPoints = Math.pow(level - 1, 2) * 100;
  const nextLevelPoints = Math.pow(level, 2) * 100;
  const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
