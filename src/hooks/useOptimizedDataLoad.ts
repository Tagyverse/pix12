'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublishedData, clearPublishedDataCache } from '../utils/publishedData';

export interface LoadingState {
  isLoading: boolean;
  isNavigationReady: boolean;
  isContentReady: boolean;
  error: string | null;
  progress: number; // 0-100
}

export function useOptimizedDataLoad() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isNavigationReady: false,
    isContentReady: false,
    error: null,
    progress: 0,
  });

  const [data, setData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true, error: null, progress: 10 }));

      // Stage 1: Load critical navigation data (fastest)
      setLoadingState(prev => ({ ...prev, progress: 25 }));

      // Stage 2: Fetch all data from R2 with optimized loading
      const startTime = performance.now();
      const publishedData = await getPublishedData();
      const loadTime = performance.now() - startTime;

      console.log(`[OPTIMIZED] Data loaded in ${Math.round(loadTime)}ms`);

      if (!publishedData) {
        throw new Error('Failed to load published data');
      }

      setLoadingState(prev => ({ ...prev, progress: 60, isNavigationReady: true }));

      // Stage 3: Validate critical sections
      const hasCriticalData = publishedData.products && publishedData.categories;
      if (!hasCriticalData) {
        console.warn('[OPTIMIZED] Missing critical data sections');
      }

      setLoadingState(prev => ({ ...prev, progress: 85 }));

      // Stage 4: Set all data
      setData(publishedData);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isContentReady: true,
        progress: 100,
      }));

      console.log('[OPTIMIZED] Data loading complete');
    } catch (error) {
      console.error('[OPTIMIZED] Error loading data:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
        progress: 100,
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    clearPublishedDataCache();
    await loadData();
  }, [loadData]);

  return {
    data,
    loadingState,
    refresh,
  };
}
