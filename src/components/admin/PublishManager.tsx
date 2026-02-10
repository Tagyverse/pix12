'use client';

import { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { addPublishRecord } from '../../utils/publishHistory';
import { checkPublishLimit, incrementPublishCount, getRemainingPublishes } from '../../utils/publishLimitTracker';

interface PublishData {
  products: Record<string, any> | null;
  categories: Record<string, any> | null;
  reviews: Record<string, any> | null;
  offers: Record<string, any> | null;
  site_settings: Record<string, any> | null;
  carousel_images: Record<string, any> | null;
  carousel_settings: any | null;
  homepage_sections: Record<string, any> | null;
  info_sections: Record<string, any> | null;
  marquee_sections: Record<string, any> | null;
  video_sections: Record<string, any> | null;
  video_section_settings: any | null;
  video_overlay_sections: Record<string, any> | null;
  video_overlay_items: Record<string, any> | null;
  default_sections_visibility: any | null;
  card_designs: Record<string, any> | null;
  navigation_settings: any | null;
  coupons: Record<string, any> | null;
  try_on_models: Record<string, any> | null;
  tax_settings: any | null;
  footer_settings: any | null;
  footer_config: any | null;
  policies: Record<string, any> | null;
  settings: any | null;
  bill_settings: any | null;
  social_links: Record<string, any> | null;
  site_content: Record<string, any> | null;
  admins: Record<string, any> | null;
  super_admins: Record<string, any> | null;
}

interface PublishStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  details?: string;
  dataStats?: any;
}

export default function PublishManager({ onPublishComplete }: { onPublishComplete?: () => void }) {
  const { user } = useAuth();
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({ status: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [dataPreview, setDataPreview] = useState<any>(null);
  const [remainingPublishes, setRemainingPublishes] = useState<number>(10);

  const navigationStyleRef = ref(db, 'navigation_settings');

  useEffect(() => {
    if (user) {
      checkAndUpdateRemainingPublishes();
    }
  }, [user]);

  const checkAndUpdateRemainingPublishes = async () => {
    if (!user) return;
    try {
      const remaining = await getRemainingPublishes(user.uid);
      setRemainingPublishes(remaining);
    } catch (error) {
      console.error('[PUBLISH] Error checking remaining publishes:', error);
    }
  };

  // Collect all data from Firebase
  const collectAllData = async (): Promise<PublishData> => {
    console.log('[PUBLISH] Starting data collection from Firebase...');
    
    const dataRefs = {
      products: ref(db, 'products'),
      categories: ref(db, 'categories'),
      reviews: ref(db, 'reviews'),
      offers: ref(db, 'offers'),
      site_settings: ref(db, 'site_settings'),
      carousel_images: ref(db, 'carousel_images'),
      carousel_settings: ref(db, 'carousel_settings'),
      homepage_sections: ref(db, 'homepage_sections'),
      info_sections: ref(db, 'info_sections'),
      marquee_sections: ref(db, 'marquee_sections'),
      video_sections: ref(db, 'video_sections'),
      video_section_settings: ref(db, 'video_section_settings'),
      video_overlay_sections: ref(db, 'video_overlay_sections'),
      video_overlay_items: ref(db, 'video_overlay_items'),
      default_sections_visibility: ref(db, 'default_sections_visibility'),
      card_designs: ref(db, 'card_designs'),
      coupons: ref(db, 'coupons'),
      try_on_models: ref(db, 'try_on_models'),
      tax_settings: ref(db, 'tax_settings'),
      footer_settings: ref(db, 'footer_settings'),
      footer_config: ref(db, 'footer_config'),
      policies: ref(db, 'policies'),
      settings: ref(db, 'settings'),
      bill_settings: ref(db, 'bill_settings'),
      social_links: ref(db, 'social_links'),
      site_content: ref(db, 'site_content'),
      admins: ref(db, 'admins'),
      super_admins: ref(db, 'super_admins'),
    };

    try {
      // Collect standard refs
      const snapshots = await Promise.all(
        Object.entries(dataRefs).map(async ([key, refPath]) => {
          try {
            const snapshot = await get(refPath);
            const value = snapshot.exists() ? snapshot.val() : null;
            if (value && typeof value === 'object') {
              const itemCount = Object.keys(value).length;
              console.log(`[PUBLISH] ${key}: ${itemCount} items`);
            } else {
              console.log(`[PUBLISH] ${key}: empty/null`);
            }
            return [key, value];
          } catch (err) {
            console.warn(`[PUBLISH] Failed to fetch ${key}:`, err);
            return [key, null];
          }
        })
      );

      const allData: Record<string, any> = {};
      snapshots.forEach(([key, value]) => {
        allData[key as string] = value;
      });

      // Get navigation_settings from Firebase
      try {
        console.log('[PUBLISH] Reading navigation_settings from Firebase...');
        const navStyleSnapshot = await get(navigationStyleRef);
        console.log('[PUBLISH] navigation_settings exists:', navStyleSnapshot.exists());
        
        if (navStyleSnapshot.exists()) {
          allData.navigation_settings = navStyleSnapshot.val();
          console.log('[PUBLISH] navigation_settings: successfully loaded', allData.navigation_settings);
        } else {
          console.log('[PUBLISH] WARNING: navigation_settings not found in Firebase - will use defaults on publish');
          allData.navigation_settings = null;
        }
      } catch (err) {
        console.warn('[PUBLISH] Failed to fetch navigation_settings:', err);
        allData.navigation_settings = null;
      }

      const collectedKeys = Object.keys(allData).filter(k => allData[k] !== null && allData[k] !== undefined);
      console.log(`[PUBLISH] Data collection complete. Collected ${collectedKeys.length} non-empty sections`);
      return allData as PublishData;
    } catch (error) {
      console.error('[PUBLISH] Error collecting data:', error);
      throw error;
    }
  };

  // Preview data to be published
  const handlePreviewData = async () => {
    try {
      setPublishStatus({ status: 'loading', message: 'Preparing data preview...' });
      const data = await collectAllData();
      setDataPreview(data);
      
      const productCount = Object.keys(data.products || {}).length;
      const categoryCount = Object.keys(data.categories || {}).length;
      
      setPublishStatus({
        status: 'idle',
        message: 'Data ready for preview',
        dataStats: {
          productCount,
          categoryCount,
          totalSize: JSON.stringify(data).length
        }
      });
    } catch (error) {
      setPublishStatus({
        status: 'error',
        message: 'Failed to preview data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Publish to R2
  const handlePublish = async () => {
    // Check authentication
    if (!user) {
      setPublishStatus({ 
        status: 'error', 
        message: 'Authentication required',
        details: 'You must be logged in to publish data. Please sign in first.'
      });
      return;
    }

    // Check publish limit
    try {
      const limitCheck = await checkPublishLimit(user.uid);
      if (!limitCheck.allowed) {
        setPublishStatus({
          status: 'error',
          message: 'Publish limit reached',
          details: limitCheck.message
        });
        return;
      }
      console.log('[PUBLISH LIMIT]', limitCheck.message);
    } catch (error) {
      console.error('[PUBLISH LIMIT] Error checking limit:', error);
    }

    if (!confirm('Are you sure you want to publish all changes to live? This will update the data visible to all users.')) {
      return;
    }

    try {
      setIsLoading(true);
      setPublishStatus({ status: 'loading', message: 'Collecting all Firebase data...' });
      console.log('[PUBLISH] User authenticated:', user.uid);

      // Collect all data
      const data = await collectAllData();
      console.log('[PUBLISH] Collected data, keys:', Object.keys(data));
      console.log('[PUBLISH] Navigation settings:', data.navigation_settings);

      const productCount = Object.keys(data.products || {}).length;
      const categoryCount = Object.keys(data.categories || {}).length;
      const totalSize = JSON.stringify(data).length;

      setPublishStatus({
        status: 'loading',
        message: `Publishing ${productCount} products, ${categoryCount} categories to R2...`
      });

      // Publish to R2
      const response = await fetch('/api/publish-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Publish failed');
      }

      // Log any warnings returned (don't block publish)
      if (result.warnings && result.warnings.length > 0) {
        console.warn('[PUBLISH] Data validation warnings:', result.warnings);
        result.warnings.forEach((warning: string) => {
          console.warn('[PUBLISH WARNING]', warning);
        });
      }

      console.log('[PUBLISH] Publish response:', result);

      // Increment publish count
      try {
        await incrementPublishCount(user.uid);
        await checkAndUpdateRemainingPublishes();
      } catch (error) {
        console.error('[PUBLISH LIMIT] Error updating limit:', error);
      }

      // Record successful publish
      addPublishRecord({
        status: 'success',
        message: 'Successfully published to live',
        dataStats: {
          productCount,
          categoryCount,
          totalSize,
        },
        uploadTime: result.uploadTime,
        verifyTime: result.verifyTime,
      });

      setPublishStatus({
        status: 'success',
        message: 'Successfully published to live!',
        details: `${productCount} products, ${categoryCount} categories, ${(totalSize / 1024).toFixed(2)}KB uploaded. ${remainingPublishes - 1} publishes remaining this month.`,
        dataStats: {
          productCount,
          categoryCount,
          totalSize,
          uploadTime: result.uploadTime,
          verifyTime: result.verifyTime,
        }
      });

      // Clear cache on user side
      if (typeof window !== 'undefined') {
        // This will be called on the next page load to refresh the cache
        localStorage.setItem('publishedDataRefresh', Date.now().toString());
      }

      if (onPublishComplete) {
        setTimeout(onPublishComplete, 2000);
      }
    } catch (error) {
      console.error('[PUBLISH ERROR]', error);
      
      // Don't show warnings as errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Suppress showing the alert if it's just validation warnings
      if (!errorMessage.includes('Missing') && !errorMessage.includes('will be empty')) {
        addPublishRecord({
          status: 'error',
          message: 'Publish failed',
          errorMessage,
        });

        setPublishStatus({
          status: 'error',
          message: 'Failed to publish',
          details: errorMessage
        });
      } else {
        // Log warnings but continue
        console.warn('[PUBLISH WARNINGS]', errorMessage);
        setPublishStatus({
          status: 'idle',
          message: 'Data collection complete with warnings (logged)',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Publish to Live</h2>
              <p className="text-blue-100 mt-1">Push all Firebase changes to R2 for live site updates</p>
            </div>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg text-right">
            <p className="text-sm text-blue-100">Publishes Remaining</p>
            <p className="text-3xl font-bold">{remainingPublishes}/10</p>
          </div>
        </div>
      </div>

      {/* Status Display */}
      {publishStatus.status !== 'idle' && (
        <div className={`rounded-2xl p-6 border-2 ${
          publishStatus.status === 'success' ? 'bg-green-50 border-green-300' :
          publishStatus.status === 'error' ? 'bg-red-50 border-red-300' :
          'bg-blue-50 border-blue-300'
        }`}>
          <div className="flex items-start gap-4">
            {publishStatus.status === 'success' && (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            )}
            {publishStatus.status === 'error' && (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            {publishStatus.status === 'loading' && (
              <Loader2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1 animate-spin" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${
                publishStatus.status === 'success' ? 'text-green-700' :
                publishStatus.status === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {publishStatus.message}
              </h3>
              {publishStatus.details && (
                <p className="text-sm text-gray-600 mt-2">{publishStatus.details}</p>
              )}
              {publishStatus.dataStats && (
                <div className="mt-3 space-y-1 text-sm">
                  <p>Products: <span className="font-semibold">{publishStatus.dataStats.productCount}</span></p>
                  <p>Categories: <span className="font-semibold">{publishStatus.dataStats.categoryCount}</span></p>
                  <p>Size: <span className="font-semibold">{(publishStatus.dataStats.totalSize / 1024).toFixed(2)}KB</span></p>
                  {publishStatus.dataStats.uploadTime && (
                    <p>Upload Time: <span className="font-semibold">{publishStatus.dataStats.uploadTime}ms</span></p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handlePreviewData}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors border-2 border-blue-600"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Preview Data
          </button>

          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors border-2 border-green-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Publish to Live
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            Important: Click "Preview Data" to check what will be published, then click "Publish to Live" to update the live site for all users.
          </p>
        </div>
      </div>

      {/* Data Preview */}
      {dataPreview && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <h3 className="font-bold text-lg mb-4">Data Preview</h3>
          <div className="max-h-96 overflow-y-auto space-y-2 text-sm">
            {Object.entries(dataPreview).map(([key, value]) => {
              const count = value && typeof value === 'object' ? Object.keys(value).length : 0;
              return (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-700">{key}</span>
                  <span className="text-gray-600">
                    {count > 0 ? `${count} items` : 'empty'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
