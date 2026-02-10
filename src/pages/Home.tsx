'use client';

import { ArrowRight, Sparkles, Heart, Star } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import type { Product, Category } from '../types';
import FeaturedCategories from '../components/FeaturedCategories';
import CustomerReviews from '../components/CustomerReviews';
import WhatsAppFAB from '../components/WhatsAppFAB';
import SmartFeatureFAB from '../components/SmartFeatureFAB';
import TryOnProductList from '../components/TryOnProductList';
import ColorMatchProductList from '../components/ColorMatchProductList';
import EnquiryModal from '../components/EnquiryModal';
import BottomSheet from '../components/BottomSheet';
import ProductDetailsSheet from '../components/ProductDetailsSheet';
import ShimmerLoader from '../components/ShimmerLoader';
import MightYouLike from '../components/MightYouLike';
import LazyImage from '../components/LazyImage';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import DynamicSection from '../components/DynamicSection';
import InfoSection from '../components/InfoSection';
import VideoSection from '../components/VideoSection';
import VideoOverlaySection from '../components/VideoOverlaySection';
import { getPublishedData, objectToArray } from '../utils/publishedData';
import type { HomepageSection } from '../types';

interface InfoSectionData {
  id: string;
  title: string;
  content: string;
  theme: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'gradient';
  is_visible: boolean;
  order_index: number;
}

interface HomeProps {
  onNavigate: (page: 'shop', categoryId?: string) => void;
  onCartClick: () => void;
}

interface Policy {
  key: string;
  title: string;
  content: string;
  isEnabled: boolean;
}

export default function Home({ onNavigate, onCartClick }: HomeProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivalCategories, setNewArrivalCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [activePolicyKey, setActivePolicyKey] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<string[]>([
    'https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3755710/pexels-photo-3755710.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ]);
  const [carouselSettings, setCarouselSettings] = useState({
    is_visible: false,
    autoplay: true,
    interval: 5000,
    show_indicators: true,
    show_navigation: true
  });
  const [dynamicSections, setDynamicSections] = useState<HomepageSection[]>([]);
  const [infoSections, setInfoSections] = useState<InfoSectionData[]>([]);
  const [marqueeSections, setMarqueeSections] = useState<any[]>([]);
  const [videoSections, setVideoSections] = useState<any[]>([]);
  const [videoSectionSettings, setVideoSectionSettings] = useState({
    is_visible: false,
    section_title: 'Watch Our Videos',
    section_subtitle: 'Explore our collection'
  });
  const [videoOverlaySections, setVideoOverlaySections] = useState<any[]>([]);
  const [defaultSectionsVisibility, setDefaultSectionsVisibility] = useState({
    banner_social: false,
    feature_boxes: false,
    all_categories: false,
    best_sellers: false,
    might_you_like: false,
    shop_by_category: false,
    customer_reviews: false,
    marquee: false
  });
  const [allSectionsOrder, setAllSectionsOrder] = useState<Array<{ id: string; type: 'default' | 'custom' | 'info' | 'marquee' | 'video'; order_index: number }>>([]);
  const [showSmartFeatureFAB, setShowSmartFeatureFAB] = useState(false);
  const [showTryOnList, setShowTryOnList] = useState(false);
  const [showColorMatchList, setShowColorMatchList] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design: allCategoriesDesign } = useCardDesign('all_categories');
  const allCategoriesCardStyles = getCardStyles(allCategoriesDesign);

  useEffect(() => {
    const handleOpenProductDetails = (event: CustomEvent) => {
      const product = event.detail;
      setSelectedProduct(product);
      setShowProductDetails(true);
      window.history.pushState({}, '', `/?product=${product.id}`);
    };

    window.addEventListener('openProductDetails', handleOpenProductDetails as EventListener);

    return () => {
      window.removeEventListener('openProductDetails', handleOpenProductDetails as EventListener);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('[HOME] Starting data fetch...');
        
        // Try to load from R2 first (published data for users)
        const publishedData = await getPublishedData();
        
        if (publishedData) {
          console.log('[HOME] Published data loaded successfully');
          
          // Use published data from R2
          const allProducts: Product[] = objectToArray<Product>(publishedData.products);
          console.log(`[HOME] Loaded ${allProducts.length} products`);

          const featuredProducts = allProducts
            .filter(p => p.featured)
            .sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 3);

          const categoriesData: Category[] = objectToArray<Category>(publishedData.categories);
          const newArrivals = categoriesData.filter(c => c.new_arrival);
          categoriesData.sort((a, b) => a.name.localeCompare(b.name));
          newArrivals.sort((a, b) => a.name.localeCompare(b.name));

          if (publishedData.carousel_images) {
            const images = Object.keys(publishedData.carousel_images)
              .map(key => ({ ...publishedData.carousel_images![key], id: key }))
              .filter(img => img.isVisible)
              .sort((a, b) => a.order - b.order)
              .map(img => img.url);
            if (images.length > 0) {
              setCarouselImages(images);
            }
          }

          if (publishedData.carousel_settings) {
            setCarouselSettings(publishedData.carousel_settings);
          }

          const sectionsData: HomepageSection[] = [];
          if (publishedData.homepage_sections) {
            Object.entries(publishedData.homepage_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                sectionsData.push({ id, ...sectionData });
              }
            });
          }
          setDynamicSections(sectionsData);

          const infoSectionsData: InfoSectionData[] = [];
          if (publishedData.info_sections) {
            Object.entries(publishedData.info_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                infoSectionsData.push({ id, ...sectionData });
              }
            });
          }
          setInfoSections(infoSectionsData);

          const marqueeSectionsData: any[] = [];
          if (publishedData.marquee_sections) {
            Object.entries(publishedData.marquee_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                marqueeSectionsData.push({ id, ...sectionData });
              }
            });
          }
          setMarqueeSections(marqueeSectionsData);

          const videoSectionsData: any[] = [];
          if (publishedData.video_sections) {
            Object.entries(publishedData.video_sections).forEach(([id, videoData]: [string, any]) => {
              if (videoData.isVisible) {
                videoSectionsData.push({ id, ...videoData });
              }
            });
            videoSectionsData.sort((a, b) => a.order - b.order);
          }
          setVideoSections(videoSectionsData);

          let videoSettings = {
            is_visible: false,
            section_title: 'Watch Our Videos',
            section_subtitle: 'Explore our collection',
            order_index: 7
          };
          if (publishedData.video_section_settings) {
            videoSettings = { ...videoSettings, ...publishedData.video_section_settings };
            setVideoSectionSettings(videoSettings);
          }

          const videoOverlaySectionsData: any[] = [];
          if (publishedData.video_overlay_sections) {
            for (const [sectionId, sectionData] of Object.entries<any>(publishedData.video_overlay_sections)) {
              if (sectionData.is_visible && sectionData.videos) {
                const sectionVideos: any[] = [];
                if (publishedData.video_overlay_items) {
                  sectionData.videos.forEach((videoId: string) => {
                    if (publishedData.video_overlay_items![videoId] && publishedData.video_overlay_items![videoId].isVisible) {
                      sectionVideos.push({ id: videoId, ...publishedData.video_overlay_items![videoId] });
                    }
                  });
                  sectionVideos.sort((a, b) => a.order - b.order);
                }
                if (sectionVideos.length > 0) {
                  videoOverlaySectionsData.push({
                    id: sectionId,
                    ...sectionData,
                    videoItems: sectionVideos
                  });
                }
              }
            }
            videoOverlaySectionsData.sort((a, b) => a.order_index - b.order_index);
          }
          setVideoOverlaySections(videoOverlaySectionsData);

          if (publishedData.default_sections_visibility) {
            const visibility = publishedData.default_sections_visibility;
            setDefaultSectionsVisibility({
              banner_social: visibility.banner_social !== undefined ? visibility.banner_social : true,
              feature_boxes: visibility.feature_boxes !== undefined ? visibility.feature_boxes : true,
              all_categories: visibility.all_categories !== undefined ? visibility.all_categories : true,
              best_sellers: visibility.best_sellers !== undefined ? visibility.best_sellers : true,
              might_you_like: visibility.might_you_like !== undefined ? visibility.might_you_like : true,
              shop_by_category: visibility.shop_by_category !== undefined ? visibility.shop_by_category : true,
              customer_reviews: visibility.customer_reviews !== undefined ? visibility.customer_reviews : true,
              marquee: visibility.marquee !== undefined ? visibility.marquee : true
            });

            setShowSmartFeatureFAB(visibility.smart_feature_fab !== undefined ? visibility.smart_feature_fab : false);

            const defaultSections = [
              { id: 'banner_social', type: 'default' as const, order_index: visibility.order_banner_social ?? -1 },
              { id: 'feature_boxes', type: 'default' as const, order_index: visibility.order_feature_boxes ?? 0 },
              { id: 'all_categories', type: 'default' as const, order_index: visibility.order_all_categories ?? 1 },
              { id: 'best_sellers', type: 'default' as const, order_index: visibility.order_best_sellers ?? 2 },
              { id: 'might_you_like', type: 'default' as const, order_index: visibility.order_might_you_like ?? 3 },
              { id: 'shop_by_category', type: 'default' as const, order_index: visibility.order_shop_by_category ?? 4 },
              { id: 'customer_reviews', type: 'default' as const, order_index: visibility.order_customer_reviews ?? 5 },
              { id: 'marquee', type: 'default' as const, order_index: visibility.order_marquee ?? 6 }
            ];

            const customSections = sectionsData.map(s => ({
              id: s.id,
              type: 'custom' as const,
              order_index: s.order_index
            }));

            const infoSectionsOrder = infoSectionsData.map(s => ({
              id: s.id,
              type: 'info' as const,
              order_index: s.order_index
            }));

            const marqueeSectionsOrder = marqueeSectionsData.map(s => ({
              id: s.id,
              type: 'marquee' as const,
              order_index: s.order_index
            }));

            const videoSectionsOrder = videoSectionsData.length > 0 && videoSettings.is_visible ? [{
              id: 'video_section',
              type: 'video' as const,
              order_index: videoSettings.order_index ?? 7
            }] : [];

            const allSections = [...defaultSections, ...customSections, ...infoSectionsOrder, ...marqueeSectionsOrder, ...videoSectionsOrder];
            allSections.sort((a, b) => a.order_index - b.order_index);
            setAllSectionsOrder(allSections);
          }

          setFeaturedProducts(featuredProducts);
          setCategories(categoriesData.slice(0, 4));
          setNewArrivalCategories(newArrivals);
          setLoading(false);
          console.log('[HOME] Data loading complete');
          return;
        }

        // No published data available - will show Coming Soon page
        console.log('[HOME] No published data available - showing coming soon page');
        setLoading(false);
      } catch (error) {
        console.error('[HOME] Error fetching data:', error);
        console.log('[HOME] Failed to load data, showing coming soon page');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (carouselSettings.autoplay && carouselSettings.is_visible) {
      autoSlideRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, carouselSettings.interval);

      return () => {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current);
        }
      };
    }
  }, [carouselImages.length, carouselSettings.autoplay, carouselSettings.interval, carouselSettings.is_visible]);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const policiesRef = ref(db, 'policies');
        const snapshot = await get(policiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const policiesArray = Object.keys(data)
            .map(key => ({ ...data[key], key }))
            .filter((p: Policy) => p.isEnabled);
          setPolicies(policiesArray);
        }
      } catch (error) {
        console.error('Error loading policies:', error);
      }
    }

    loadPolicies();
  }, []);

  const activePolicy = policies.find(p => p.key === activePolicyKey);

  const renderPolicyContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4">{line.substring(2)}</h2>;
      } else if (line.startsWith('## ')) {
        return <h3 key={index} className="text-xl font-semibold text-gray-800 mt-4 mb-3">{line.substring(3)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 text-gray-700">{line.substring(2)}</li>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="text-gray-700 mb-2">{line}</p>;
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {carouselSettings.is_visible && (
        <section className="relative">
          {loading ? (
            <ShimmerLoader variant="banner" />
          ) : (
            <div className="relative h-[320px] sm:h-[400px] lg:h-[500px] overflow-hidden bg-gray-100">
              {carouselImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}

              {carouselSettings.show_navigation && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-900 p-2 sm:p-3 rounded-full shadow-lg transition-all"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselImages.length)}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-900 p-2 sm:p-3 rounded-full shadow-lg transition-all"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {carouselSettings.show_indicators && (
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white transition-all ${
                        index === currentSlide ? 'bg-teal-500 scale-125' : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {defaultSectionsVisibility.feature_boxes && (
        <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="text-center px-2 sm:px-4 lg:px-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-2 sm:mb-3 lg:mb-4 mx-auto flex items-center justify-center bg-teal-100">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-teal-600 fill-teal-600" />
              </div>
              <h3 className="text-[10px] sm:text-base lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Top Quality</h3>
              <p className="text-[8px] sm:text-xs lg:text-sm text-gray-600 leading-tight sm:leading-normal">Premium materials and exceptional craftsmanship in every piece</p>
            </div>

            <div className="text-center px-2 sm:px-4 lg:px-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-2 sm:mb-3 lg:mb-4 mx-auto flex items-center justify-center bg-peach-100">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-peach-600" />
              </div>
              <h3 className="text-[10px] sm:text-base lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Unique Designs</h3>
              <p className="text-[8px] sm:text-xs lg:text-sm text-gray-600 leading-tight sm:leading-normal">One-of-a-kind pieces you won't find anywhere else</p>
            </div>

            <div className="text-center px-2 sm:px-4 lg:px-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-2 sm:mb-3 lg:mb-4 mx-auto flex items-center justify-center bg-mint-100">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-mint-600 fill-mint-600" />
              </div>
              <h3 className="text-[10px] sm:text-base lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">100% Handmade</h3>
              <p className="text-[8px] sm:text-xs lg:text-sm text-gray-600 leading-tight sm:leading-normal">Carefully crafted with love and attention to detail</p>
            </div>
          </div>
        </div>
      </section>
      )}

      {defaultSectionsVisibility.all_categories && (loading ? (
        <section className="py-8 sm:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="h-10 w-48 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:200%_100%] rounded-lg mb-6"></div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <ShimmerLoader variant="category" count={2} className="contents" />
              </div>
            </div>
          </div>
        </section>
      ) : newArrivalCategories.length > 0 && (
        <section className="py-8 sm:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                ALL CATEGORIES
                <span className="relative flex items-center">
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </h2>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {newArrivalCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onNavigate('shop', category.id)}
                    className={`group bg-white overflow-hidden text-left transition-all duration-300 ${allCategoriesCardStyles.container || 'border-2 border-gray-200'}`}
                    style={{
                      ...allCategoriesCardStyles.style,
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (allCategoriesCardStyles.hoverTransform) {
                        e.currentTarget.style.transform = allCategoriesCardStyles.hoverTransform;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-50" style={allCategoriesCardStyles.imageStyle}>
                      <LazyImage
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center justify-between">
                        {category.name}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={() => onNavigate('shop')}
                className="px-8 py-4 bg-teal-500 text-white rounded-full font-bold text-lg border-2 border-teal-600 hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
              >
                Shop Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      ))}

      {defaultSectionsVisibility.best_sellers && (
        <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Best Sellers 🏆
            </h2>
            <p className="text-lg text-gray-600 mb-8">Our most popular products loved by customers</p>
            <p className="text-sm text-gray-500 italic">Coming soon - Configure products with "best_seller" flag in admin</p>
          </div>
        </section>
      )}

      {defaultSectionsVisibility.might_you_like && (
        <MightYouLike
        onProductClick={(product) => {
          setSelectedProduct(product);
          setShowProductDetails(true);
        }}
        onCartClick={onCartClick}
        />
      )}

      {dynamicSections.length > 0 && (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {dynamicSections.map((section) => (
              <DynamicSection
                key={section.id}
                section={section}
                onProductClick={(product) => {
                  setSelectedProduct(product);
                  setShowProductDetails(true);
                }}
                onCategoryClick={(categoryId) => onNavigate('shop', categoryId)}
              />
            ))}
          </div>
        </div>
      )}

      {defaultSectionsVisibility.shop_by_category && (
        <section className="relative py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <span className="text-xs sm:text-sm font-semibold text-teal-600 tracking-widest uppercase">Featured</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-3 sm:mt-4 mb-4 sm:mb-6 px-4">
                Shop by Category
              </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 mb-8">
              Discover our curated collections
            </p>
          </div>
        </div>

        <div className="w-full">
          <FeaturedCategories
            onNavigate={onNavigate}
            onAddToCart={addToCart}
            onCartClick={onCartClick}
            onProductClick={(product) => {
              setSelectedProduct(product);
              setShowProductDetails(true);
            }}
          />
        </div>
      </section>
      )}

      {defaultSectionsVisibility.customer_reviews && <CustomerReviews />}

      {videoSectionSettings.is_visible && videoSections.length > 0 && (
        <VideoSection
          videos={videoSections}
          title={videoSectionSettings.section_title}
          subtitle={videoSectionSettings.section_subtitle}
        />
      )}

      {videoOverlaySections.length > 0 && videoOverlaySections.map((section) => (
        <VideoOverlaySection
          key={section.id}
          videos={section.videoItems}
          title={section.title}
          subtitle={section.subtitle}
        />
      ))}

      {infoSections.length > 0 && infoSections.map((section) => (
        <section key={section.id} className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <InfoSection
              title={section.title}
              content={section.content}
              theme={section.theme}
            />
          </div>
        </section>
      ))}

      {marqueeSections.length > 0 && marqueeSections.map((section) => {
        const speedClass = section.speed === 'slow' ? 'animate-marquee-slow' : section.speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee';
        return (
          <div
            key={section.id}
            className="w-full overflow-hidden py-3"
            style={{ backgroundColor: section.bg_color }}
          >
            <div className={`whitespace-nowrap ${speedClass}`} style={{ color: section.text_color }}>
              <span className="inline-block px-4 text-lg font-semibold">{section.text}</span>
              <span className="inline-block px-4 text-lg font-semibold">{section.text}</span>
              <span className="inline-block px-4 text-lg font-semibold">{section.text}</span>
              <span className="inline-block px-4 text-lg font-semibold">{section.text}</span>
            </div>
          </div>
        );
      })}

      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs sm:text-sm font-semibold text-teal-600 tracking-widest uppercase">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-3 sm:mt-4 mb-3 sm:mb-4">
              The Pixie Blooms Promise
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative bg-white rounded-3xl overflow-hidden border-2 border-teal-200 hover:border-teal-400 transition-all duration-500 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-8 sm:p-10 lg:p-12">
                <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <div className="relative bg-white rounded-2xl w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border-2 border-teal-200">
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600 fill-teal-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                  Handmade with Love
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Every piece is meticulously crafted by hand, ensuring unique quality and character in each accessory
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>

            <div className="group relative bg-white rounded-3xl overflow-hidden border-2 border-rose-200 hover:border-rose-400 transition-all duration-500 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-rose-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-8 sm:p-10 lg:p-12">
                <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <div className="relative bg-white rounded-2xl w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border-2 border-rose-200">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-rose-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-rose-600 transition-colors">
                  Premium Quality
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  We source only the finest materials to create accessories that last and look beautiful every day
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <WhatsAppFAB />

      {showSmartFeatureFAB && (
        <SmartFeatureFAB
          onTryOnClick={() => setShowTryOnList(true)}
          onColorMatchClick={() => setShowColorMatchList(true)}
        />
      )}

      <TryOnProductList
        isOpen={showTryOnList}
        onClose={() => setShowTryOnList(false)}
      />

      <ColorMatchProductList
        isOpen={showColorMatchList}
        onClose={() => setShowColorMatchList(false)}
      />

      <EnquiryModal isOpen={showEnquiryModal} onClose={() => setShowEnquiryModal(false)} />

      <ProductDetailsSheet
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('product')) {
            window.history.pushState({}, '', '/');
          }
        }}
        onCartClick={onCartClick}
      />

      {activePolicy && (
        <BottomSheet
          isOpen={!!activePolicy}
          onClose={() => setActivePolicyKey(null)}
          title={activePolicy.title}
        >
          {renderPolicyContent(activePolicy.content)}
        </BottomSheet>
      )}

      <BottomSheet isOpen={activePolicyKey === 'about'} onClose={() => setActivePolicyKey(null)} title="About Us">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            Welcome to Pixie Blooms, where elegance meets craftsmanship.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            We specialize in handcrafted floral baby headbands, hair clips, and custom accessories designed to add a magical touch to every little moment.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            Pixie Blooms began as a small passion for flower art and has now grown into a brand loved by moms and little ones across India. Every design is made with love, care, and attention to detail, because we believe the sweetest moments deserve something crafted with heart.
          </p>
          <h3 className="text-lg font-bold text-gray-900 mt-4">Our Story</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            I am Moomin, a artist and a mom who loves creating unique floral accessories. What started as a creative hobby slowly transformed into Pixie Blooms when people appreciated my work and requested custom pieces. Today, Pixie Blooms proudly offers soft, comfortable, and long-lasting accessories for babies, toddlers, and girls.
          </p>
          <h3 className="text-lg font-bold text-gray-900 mt-4">What Makes Pixie Blooms Special</h3>
          <ul className="text-gray-700 text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li>Handmade with love – Each flower is carefully shaped, painted, and assembled by hand.</li>
            <li>Premium-quality materials – Skin-friendly, lightweight, and safe for delicate little heads.</li>
            <li>Customization available – We craft pieces that match your outfits, themes, and special celebrations.</li>
            <li>Made to last – Beautiful designs perfect for everyday wear and cherished occasions.</li>
          </ul>
          <h3 className="text-lg font-bold text-gray-900 mt-4">Our Mission</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            To create beautiful, handcrafted floral accessories that make every child feel special, confident, and joyful.
          </p>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activePolicyKey === 'terms'} onClose={() => setActivePolicyKey(null)} title="Terms & Conditions">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            By using the Pixie Blooms website and placing an order, you agree to our terms and conditions. All our products are handmade, so slight variations in colour, size, or design may occur, and product photos are for reference only. Once an order is placed and processing has started, it cannot be cancelled, especially for customised items. Prices shown on the website may change anytime, but the amount displayed at checkout is the final price you will pay. All payments are processed securely through trusted gateways, and we do not store or access any of your payment details. We ship across India through reliable couriers, but delivery delays due to courier issues, weather, or incorrect addresses are beyond our control. We do not accept returns or exchanges unless the product is damaged on arrival, and such issues must be reported within 24 hours with clear photo and video proof. All designs, photos, and content belong to Pixie Blooms and cannot be copied or reused without permission. By continuing to use our website, you agree to follow these terms, and you can contact us anytime at pixieblooms2512@gmail.com for any queries.
          </p>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activePolicyKey === 'privacy'} onClose={() => setActivePolicyKey(null)} title="Privacy Policy">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            At Pixie Blooms, we truly value your trust and are committed to protecting your personal information. When you shop with us, we collect only the essential details, such as your name, phone number, email, and address, to process your orders smoothly and keep you updated. Your payment information is never stored or viewed by us, as all transactions are handled securely through trusted payment gateways. We use your data only to fulfil your orders, improve your experience, and provide customer support, and we share it solely with our delivery partners when required. We do not sell, rent, or misuse your information under any circumstances. Our website may use basic cookies to help us understand your preferences and offer a better browsing experience. Your data is always handled with care, confidentiality, and respect. By using our website, you agree to this Privacy Policy, and you can contact us anytime if you want your information updated or removed.
          </p>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activePolicyKey === 'shipping'} onClose={() => setActivePolicyKey(null)} title="Shipping Policy">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            Thank you for shopping with us! We take great care in packing and delivering your handmade floral headbands, clips, and accessories. Please read our shipping policy below.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Processing Time</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            All products are handmade and require time to prepare. Orders are processed within 7 to 10 business days. During peak seasons or sale days, processing may take a little longer.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Shipping Time</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Once shipped, orders usually take 3–7 business days within India. Delivery timelines may vary based on your location and courier service speed.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Shipping Charges</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Shipping charges are calculated at checkout based on your location and order weight. Free shipping offers (if any) will be clearly mentioned on the website or product page.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Order Tracking</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            After dispatch, we will provide a tracking number via email/WhatsApp/SMS so you can follow your package.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Incorrect Address</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Please ensure your address, phone number, and pin code are correct. We are not responsible for delays or lost packages due to incorrect address details.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Delays</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Sometimes courier delays happen due to weather, festivals, or unexpected situations. These delays are beyond our control, but we will assist you in tracking your parcel.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Returns / Exchanges / Refunds</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Since all items are custom-made & handmade, we do not accept returns or exchanges. Refunds are only applicable if the product is damaged during transit. You must inform us within 24 hours of delivery with an unboxing video.
          </p>
          <h3 className="text-lg font-bold text-gray-900">Lost or Damaged Parcels</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            If your parcel is lost or damaged, please contact us with your order details and proof. We will coordinate with the courier to resolve the issue.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
