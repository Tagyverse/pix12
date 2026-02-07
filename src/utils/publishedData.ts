// Utility to load published site data from R2
// Admin loads from Firebase, Users load from R2

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
  policies: Record<string, any> | null;
  maintenance_settings: any | null;
  settings: any | null;
  published_at?: string;
}

let cachedData: PublishedData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

export async function getPublishedData(): Promise<PublishedData | null> {
  // Return cached data if still valid
  if (cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const response = await fetch('/api/get-published-data');
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('No published data found, falling back to Firebase');
        return null;
      }
      throw new Error('Failed to fetch published data');
    }

    const data = await response.json();
    cachedData = data;
    cacheTimestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching published data:', error);
    return null;
  }
}

export function clearPublishedDataCache() {
  cachedData = null;
  cacheTimestamp = 0;
}

// Helper to convert Firebase-style object to array
export function objectToArray<T>(obj: Record<string, any> | null): T[] {
  if (!obj) return [];
  return Object.entries(obj).map(([id, data]) => ({
    id,
    ...data,
  }));
}
