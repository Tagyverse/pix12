'use client';

import { useEffect, useState } from 'react';

interface PageLoaderProps {
  isVisible: boolean;
  progress?: number;
  message?: string;
}

export default function PageLoader({ isVisible, progress = 0, message = 'Loading...' }: PageLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const target = Math.min(progress, 99);
        if (prev < target) {
          return Math.min(prev + (target - prev) * 0.1, target);
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="space-y-6 w-full max-w-md px-6">
        {/* Loading spinner */}
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
        </div>

        {/* Message */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pixie Blooms</h2>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-teal-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${Math.round(displayProgress)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">{Math.round(displayProgress)}%</p>
        </div>

        {/* Tips */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Setting up your store...</p>
          <p>Loading products & categories...</p>
        </div>
      </div>
    </div>
  );
}
