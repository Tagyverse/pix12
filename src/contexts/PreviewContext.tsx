import { createContext, useContext, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';

interface PreviewData {
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
  site_content: any | null;
  social_links: Record<string, any> | null;
}

interface PreviewContextType {
  isPreviewMode: boolean;
  previewData: PreviewData | null;
  loading: boolean;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === 'true';

  return (
    <PreviewContext.Provider value={{ isPreviewMode, previewData: null, loading: false }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}

// Helper function to load preview data from Firebase
export async function loadPreviewDataFromFirebase(): Promise<PreviewData | null> {
  try {
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
      site_content: ref(db, 'site_content'),
      social_links: ref(db, 'social_links'),
    };

    const results = await Promise.all(
      Object.entries(dataRefs).map(async ([key, refPath]) => {
        try {
          const snapshot = await get(refPath);
          return [key, snapshot.exists() ? snapshot.val() : null];
        } catch (error) {
          console.error(`Error loading ${key} from Firebase:`, error);
          return [key, null];
        }
      })
    );

    return Object.fromEntries(results) as PreviewData;
  } catch (error) {
    console.error('Error loading preview data from Firebase:', error);
    return null;
  }
}
