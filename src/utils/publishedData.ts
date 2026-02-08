// Utility to load published site data from R2
// Admin loads from Firebase, Users load from R2
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';

interface PublishedData {
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
  // Banner and social
  social_links: Record<string, any> | null;
  site_content: Record<string, any> | null;
  published_at?: string;
  version?: string;
}

let cachedData: PublishedData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minute cache

// Fallback: Load data directly from Firebase
async function getDataFromFirebase(): Promise<PublishedData | null> {
  try {
    console.log('[FALLBACK] Loading from Firebase...');
    
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
      navigation_settings: ref(db, 'navigation_settings'),
      coupons: ref(db, 'coupons'),
      try_on_models: ref(db, 'try_on_models'),
      tax_settings: ref(db, 'tax_settings'),
      footer_settings: ref(db, 'footer_settings'),
      footer_config: ref(db, 'footer_config'),
      policies: ref(db, 'policies'),
      settings: ref(db, 'settings'),
      bill_settings: ref(db, 'bill_settings'),
      // Banner and social data
      social_links: ref(db, 'social_links'),
      site_content: ref(db, 'site_content'),
    };

    const snapshots = await Promise.all(
      Object.entries(dataRefs).map(async ([key, refPath]) => {
        try {
          const snapshot = await get(refPath);
          return [key, snapshot.exists() ? snapshot.val() : null];
        } catch (err) {
          console.warn(`[FALLBACK] Failed to fetch ${key}:`, err);
          return [key, null];
        }
      })
    );

    const allData: Record<string, any> = {};
    snapshots.forEach(([key, value]) => {
      allData[key as string] = value;
    });

    console.log('[FALLBACK] Successfully loaded from Firebase');
    return allData as PublishedData;
  } catch (error) {
    console.error('[FALLBACK] Error loading from Firebase:', error);
    return null;
  }
}

export async function getPublishedData(): Promise<PublishedData | null> {
  // Check if we're in preview mode
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === 'true';
  
  // In preview mode, bypass cache to get latest data
  if (isPreviewMode) {
    console.log('[R2] Preview mode active: bypassing cache');
    // Continue to load from R2 but bypass cache
  } else {
    // Return cached data if still valid (5 minutes for better performance)
    if (cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log('[R2] Using cached data');
      return cachedData;
    }
  }

  try {
    console.log('[R2] Fetching published data from R2...');
    const fetchStart = Date.now();
    
    // Use optimized fetch with abort timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch('/api/get-published-data', {
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const fetchTime = Date.now() - fetchStart;
      
      // Get response as text first
      const responseText = await response.text();
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[R2] No published data found (404), falling back to Firebase');
          return await getDataFromFirebase();
        }
        console.error('[R2] Failed to fetch published data:', response.status, responseText);
        return await getDataFromFirebase();
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log(`[R2] ✓ Data loaded in ${fetchTime}ms`);
        console.log(`[R2] ✓ Found ${Object.keys(data).length} data sections`);
      } catch (parseError) {
        console.error('[R2] Failed to parse published data JSON:', parseError);
        return await getDataFromFirebase();
      }

      // Check if data has error property (API returned error as JSON)
      if (data.error) {
        console.log('[R2] API returned error:', data.error);
        return await getDataFromFirebase();
      }

      cachedData = data;
      cacheTimestamp = Date.now();
      console.log('[R2] ✓ Cache updated');
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('[R2] Request timeout after 15s, falling back to Firebase');
      } else {
        console.error('[R2] Error fetching published data:', fetchError);
      }
      return await getDataFromFirebase();
    }
  } catch (error) {
    console.error('[R2] Error fetching published data:', error);
    console.log('[R2] Attempting Firebase fallback...');
    return await getDataFromFirebase();
  }
}

export function clearPublishedDataCache() {
  cachedData = null;
  cacheTimestamp = 0;
  console.log('[CACHE] Cleared published data cache');
}

// Helper to convert Firebase-style object to array
export function objectToArray<T>(obj: Record<string, any> | null): T[] {
  if (!obj) return [];
  return Object.entries(obj).map(([id, data]) => ({
    id,
    ...data,
  }));
}
