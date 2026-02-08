'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X, FolderOpen, Video, Star, CheckCircle, XCircle, MessageSquare, Megaphone, Settings, ShoppingBag, Package, Truck, FileText, ImageIcon, Printer, Type, Eye, EyeOff, Heart, Layers, Palette, Share2, Tag, Users, Receipt, Footprints, Brain, BarChart3, Wrench, Upload, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Category, Review, Offer } from '../types';
import CarouselManager from '../components/admin/CarouselManager';
import VideoSectionManager from '../components/admin/VideoSectionManager';
import VideoOverlayManager from '../components/admin/VideoOverlayManager';
import MarqueeManager from '../components/admin/MarqueeManager';
import ShippingManager from '../components/admin/ShippingManager';
import SectionManager from '../components/admin/SectionManager';
import CardDesignManager from '../components/admin/CardDesignManager';
import BannerSocialManager from '../components/admin/BannerSocialManager';
import NavigationCustomizer from '../components/admin/NavigationCustomizer';
import CouponManager from '../components/admin/CouponManager';
import BulkOperationsManager from '../components/admin/BulkOperationsManager';
import TryOnModelManager from '../components/admin/TryOnModelManager';
import TaxManager from '../components/admin/TaxManager';
import FooterManager from '../components/admin/FooterManager';
import ColorPicker from '../components/admin/ColorPicker';
import StatisticsCharts from '../components/admin/StatisticsCharts';
import AIAgentManager from '../components/admin/AIAgentManager';
import TrafficAnalytics from '../components/admin/TrafficAnalytics';
import UpgradeBanner from '../components/admin/UpgradeBanner';
import R2GalleryManager from '../components/admin/R2GalleryManager';
import BillCustomizer from '../components/admin/BillCustomizer';
import PreviewModal from '../components/admin/PreviewModal';
import ImageUpload from '../components/ImageUpload';
import MultipleImageUpload from '../components/MultipleImageUpload';
import LazyImage from '../components/LazyImage';
import { downloadBillAsPDF, downloadBillAsJPG, printBill } from '../utils/billGenerator';
import DataValidationPanel from '../components/admin/DataValidationPanel';
import { validateFirebaseData, type ValidationResult } from '../utils/dataValidator';
import PublishHistoryPanel from '../components/admin/PublishHistoryPanel';
import PublishManager from '../components/admin/PublishManager';
import { addPublishRecord } from '../utils/publishHistory';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  total_amount: number;
  payment_status: string;
  payment_id: string;
  order_status: string;
  created_at: string;
  order_items: OrderItem[];
  dispatch_details?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  selected_size?: string | null;
  selected_color?: string | null;
}

export default function Admin() {
  const { user } = useAuth();
  const isDevelopment = import.meta.env.DEV;

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'offers' | 'orders' | 'carousel' | 'marquee' | 'sections' | 'card-design' | 'banner-social' | 'navigation' | 'coupons' | 'bulk-operations' | 'try-on' | 'tax' | 'footer' | 'ai-assistant' | 'traffic' | 'gallery' | 'bill-customizer' | 'settings' | 'publish'>('products');
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'in_transit' | 'completed'>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    compare_at_price: 0,
    category_ids: [] as string[],
    image_url: '',
    gallery_images: [] as string[],
    video_url: '',
    featured: false,
    best_selling: false,
    might_you_like: false,
    in_stock: true,
    sizes: [] as string[],
    colors: [] as string[],
    default_size: '',
    default_color: '',
    size_pricing: {} as { [size: string]: { price: number; compare_at_price?: number } },
    try_on_enabled: false,
    try_on_image_url: '',
    hairclip_type: 'top' as 'side' | 'top' | 'back' | 'headband' | 'full',
    availableColors: [] as string[]
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    featured: false,
    new_arrival: false,
    bg_color: '#10b981'
  });


  const [reviewFormData, setReviewFormData] = useState({
    customer_name: '',
    review_text: '',
    is_active: true
  });

  const [offerFormData, setOfferFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    is_active: false
  });

  const [settingsFormData, setSettingsFormData] = useState({
    id: '',
    site_name: '',
    site_tagline: '',
    contact_email: '',
    contact_phone: '',
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    whatsapp_number: '',
    welcome_banner_text: '',
    top_banner_text: '',
    top_banner_active: true,
    footer_text: '',
    popup_enabled: true,
    temporarily_closed: false,
    dispatch_details: ''
  });

  const [billSettings, setBillSettings] = useState<any>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuthenticated');
    if (savedAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
    fetchData();
    fetchBillSettings();
  }, []);

  const fetchBillSettings = async () => {
    try {
      const billSettingsRef = ref(db, 'bill_settings');
      const snapshot = await get(billSettingsRef);
      if (snapshot.exists()) {
        setBillSettings(snapshot.val());
      }
    } catch (error: any) {
      // Silently fail - bill settings are optional
      console.warn('Bill settings not available:', error.message);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const envAdminId = import.meta.env.VITE_ADMIN_ID;
    const envAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (adminId === envAdminId && adminPassword === envAdminPassword) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid Admin ID or Password');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setAdminId('');
    setAdminPassword('');
  };

  const fetchData = async () => {
    try {
      const productsRef = ref(db, 'products');
      const categoriesRef = ref(db, 'categories');

      const [productsSnapshot, categoriesSnapshot] = await Promise.all([
        get(productsRef),
        get(categoriesRef)
      ]);

      const productsData: Product[] = [];
      if (productsSnapshot.exists()) {
        const data = productsSnapshot.val();
        Object.keys(data).forEach(key => {
          productsData.push({ id: key, ...data[key] });
        });
        productsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      }

      const categoriesData: Category[] = [];
      if (categoriesSnapshot.exists()) {
        const data = categoriesSnapshot.val();
        Object.keys(data).forEach(key => {
          categoriesData.push({ id: key, ...data[key] });
        });
        categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      }

      const reviewsRef = ref(db, 'reviews');
      const offersRef = ref(db, 'offers');
      const settingsRef = ref(db, 'site_settings');
      const ordersRef = ref(db, 'orders');
      const shippingRef = ref(db, 'settings/shipping_price');

      const [reviewsSnapshot, offersSnapshot, settingsSnapshot, ordersSnapshot, shippingSnapshot] = await Promise.all([
        get(reviewsRef),
        get(offersRef),
        get(settingsRef),
        get(ordersRef),
        get(shippingRef)
      ]);

      const reviewsData: Review[] = [];
      if (reviewsSnapshot.exists()) {
        const data = reviewsSnapshot.val();
        Object.keys(data).forEach(key => {
          reviewsData.push({ id: key, ...data[key] });
        });
        reviewsData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      }

      const offersData: Offer[] = [];
      if (offersSnapshot.exists()) {
        const data = offersSnapshot.val();
        Object.keys(data).forEach(key => {
          offersData.push({ id: key, ...data[key] });
        });
        offersData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      }

      const ordersData: Order[] = [];
      if (ordersSnapshot.exists()) {
        const data = ordersSnapshot.val();
        Object.keys(data).forEach(key => {
          if (data[key].payment_status === 'completed') {
            ordersData.push({ id: key, ...data[key] });
          }
        });
        ordersData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      }

      setProducts(productsData);
      setCategories(categoriesData);
      setReviews(reviewsData);
      setOffers(offersData);
      setOrders(ordersData);

      if (shippingSnapshot.exists()) {
        setShippingPrice(shippingSnapshot.val());
      }

      if (settingsSnapshot.exists()) {
        const data = settingsSnapshot.val();
        const settingsId = Object.keys(data)[0];
        setSettingsFormData({ id: settingsId, ...data[settingsId] });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.category_ids.length === 0) {
      alert('Please select at least one category');
      return;
    }

    const productData: any = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      image_url: formData.image_url,
      category_ids: formData.category_ids,
      in_stock: formData.in_stock,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    if (formData.compare_at_price && formData.compare_at_price > 0) {
      productData.compare_at_price = Number(formData.compare_at_price);
    }

    if (formData.gallery_images && formData.gallery_images.length > 0) {
      productData.gallery_images = formData.gallery_images;
    }

    if (formData.video_url) {
      productData.video_url = formData.video_url;
    }

    if (formData.featured) {
      productData.featured = formData.featured;
    }

    if (formData.best_selling) {
      productData.best_selling = formData.best_selling;
    }

    if (formData.might_you_like) {
      productData.might_you_like = formData.might_you_like;
    }

    if (formData.sizes && formData.sizes.length > 0) {
      const filteredSizes = formData.sizes.filter(s => s.length > 0);
      if (filteredSizes.length > 0) {
        productData.sizes = filteredSizes;
      }
    }

    if (formData.colors && formData.colors.length > 0) {
      const filteredColors = formData.colors.filter(c => c.length > 0);
      if (filteredColors.length > 0) {
        productData.colors = filteredColors;
      }
    }

    if (formData.default_size) {
      productData.default_size = formData.default_size;
    }

    if (formData.default_color) {
      productData.default_color = formData.default_color;
    }

    if (formData.size_pricing && Object.keys(formData.size_pricing).length > 0) {
      productData.size_pricing = formData.size_pricing;
    }

    if (formData.try_on_enabled !== undefined) {
      productData.try_on_enabled = formData.try_on_enabled;
    }

    if (formData.try_on_image_url) {
      productData.try_on_image_url = formData.try_on_image_url;
    }

    if (formData.hairclip_type) {
      productData.hairclip_type = formData.hairclip_type;
    }

    if (formData.availableColors && formData.availableColors.length > 0) {
      productData.availableColors = formData.availableColors;
    }

    try {
      if (editingProduct) {
        const productRef = ref(db, `products/${editingProduct.id}`);
        await update(productRef, productData);
      } else {
        const productsRef = ref(db, 'products');
        await push(productsRef, productData);
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const categoryIds = product.category_ids || (product.category_id ? [product.category_id] : []);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      compare_at_price: product.compare_at_price || 0,
      category_ids: categoryIds,
      image_url: product.image_url,
      gallery_images: product.gallery_images || [],
      video_url: product.video_url || '',
      featured: product.featured,
      best_selling: product.best_selling || false,
      try_on_enabled: product.try_on_enabled || false,
      try_on_image_url: product.try_on_image_url || '',
      hairclip_type: product.hairclip_type || 'top',
      might_you_like: product.might_you_like || false,
      in_stock: product.in_stock,
      sizes: product.sizes || [],
      colors: product.colors || [],
      default_size: product.default_size || '',
      default_color: product.default_color || '',
      size_pricing: product.size_pricing || {},
      availableColors: product.availableColors || []
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const productRef = ref(db, `products/${productId}`);
      await remove(productRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const toggleProductFeatured = async (product: Product) => {
    try {
      const productRef = ref(db, `products/${product.id}`);
      await update(productRef, { featured: !product.featured });
      await fetchData();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const toggleProductStock = async (product: Product) => {
    try {
      const productRef = ref(db, `products/${product.id}`);
      await update(productRef, { in_stock: !product.in_stock });
      await fetchData();
    } catch (error) {
      console.error('Error toggling stock status:', error);
      alert('Failed to update stock status');
    }
  };

  const toggleProductBestSelling = async (product: Product) => {
    try {
      const productRef = ref(db, `products/${product.id}`);
      await update(productRef, { best_selling: !product.best_selling });
      await fetchData();
    } catch (error) {
      console.error('Error toggling best selling status:', error);
      alert('Failed to update best selling status');
    }
  };

  const toggleProductMightYouLike = async (product: Product) => {
    try {
      const productRef = ref(db, `products/${product.id}`);
      await update(productRef, { might_you_like: !product.might_you_like });
      await fetchData();
    } catch (error) {
      console.error('Error toggling might you like status:', error);
      alert('Failed to update might you like status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      compare_at_price: 0,
      category_ids: [],
      image_url: '',
      gallery_images: [],
      video_url: '',
      featured: false,
      best_selling: false,
      try_on_enabled: false,
      try_on_image_url: '',
      hairclip_type: 'top',
      might_you_like: false,
      in_stock: true,
      sizes: [],
      colors: [],
      default_size: '',
      default_color: '',
      size_pricing: {},
      availableColors: []
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      name: categoryFormData.name,
      description: categoryFormData.description,
      image_url: categoryFormData.image_url || 'https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&w=1200',
      featured: categoryFormData.featured,
      new_arrival: categoryFormData.new_arrival,
      bg_color: categoryFormData.bg_color || '#10b981'
    };

    try {
      if (editingCategory) {
        const categoryRef = ref(db, `categories/${editingCategory.id}`);
        await update(categoryRef, categoryData);
      } else {
        const categoriesRef = ref(db, 'categories');
        await push(categoriesRef, categoryData);
      }

      await fetchData();
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description,
      image_url: category.image_url || '',
      featured: category.featured || false,
      new_arrival: category.new_arrival || false,
      bg_color: category.bg_color || '#10b981'
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const categoryRef = ref(db, `categories/${categoryId}`);
      await remove(categoryRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const toggleCategoryFeatured = async (category: Category) => {
    try {
      const categoryRef = ref(db, `categories/${category.id}`);
      await update(categoryRef, { featured: !category.featured });
      await fetchData();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      featured: false,
      new_arrival: false,
      bg_color: '#10b981'
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reviewData = {
      customer_name: reviewFormData.customer_name,
      review_text: reviewFormData.review_text,
      is_active: reviewFormData.is_active,
      created_at: editingReview ? editingReview.created_at : new Date().toISOString()
    };

    try {
      if (editingReview) {
        const reviewRef = ref(db, `reviews/${editingReview.id}`);
        await update(reviewRef, reviewData);
      } else {
        const reviewsRef = ref(db, 'reviews');
        await push(reviewsRef, reviewData);
      }

      await fetchData();
      resetReviewForm();
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review');
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewFormData({
      customer_name: review.customer_name,
      review_text: review.review_text,
      is_active: review.is_active
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const reviewRef = ref(db, `reviews/${reviewId}`);
      await remove(reviewRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const toggleReviewActive = async (review: Review) => {
    try {
      const reviewRef = ref(db, `reviews/${review.id}`);
      await update(reviewRef, { is_active: !review.is_active });
      await fetchData();
    } catch (error) {
      console.error('Error toggling review status:', error);
      alert('Failed to update review status');
    }
  };

  const resetReviewForm = () => {
    setReviewFormData({
      customer_name: '',
      review_text: '',
      is_active: true
    });
    setEditingReview(null);
    setShowReviewForm(false);
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const offerData = {
      title: offerFormData.title,
      description: offerFormData.description,
      image_url: offerFormData.image_url || null,
      is_active: offerFormData.is_active,
      created_at: editingOffer ? editingOffer.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (editingOffer) {
        const offerRef = ref(db, `offers/${editingOffer.id}`);
        await update(offerRef, offerData);
      } else {
        const offersRef = ref(db, 'offers');
        await push(offersRef, offerData);
      }

      await fetchData();
      resetOfferForm();
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer');
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferFormData({
      title: offer.title,
      description: offer.description,
      image_url: offer.image_url || '',
      is_active: offer.is_active
    });
    setShowOfferForm(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const offerRef = ref(db, `offers/${offerId}`);
      await remove(offerRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer');
    }
  };

  const toggleOfferActive = async (offer: Offer) => {
    try {
      if (!offer.is_active) {
        const offersRef = ref(db, 'offers');
        const snapshot = await get(offersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const updates: Record<string, any> = {};
          Object.keys(data).forEach(key => {
            if (key !== offer.id) {
              updates[`offers/${key}/is_active`] = false;
            }
          });
          if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
          }
        }
      }

      const offerRef = ref(db, `offers/${offer.id}`);
      await update(offerRef, {
        is_active: !offer.is_active,
        updated_at: new Date().toISOString()
      });

      await fetchData();
    } catch (error) {
      console.error('Error toggling offer status:', error);
      alert('Failed to update offer status');
    }
  };

  const resetOfferForm = () => {
    setOfferFormData({
      title: '',
      description: '',
      image_url: '',
      is_active: false
    });
    setEditingOffer(null);
    setShowOfferForm(false);
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const settingsData = {
        site_name: settingsFormData.site_name,
        site_tagline: settingsFormData.site_tagline,
        contact_email: settingsFormData.contact_email,
        contact_phone: settingsFormData.contact_phone,
        instagram_url: settingsFormData.instagram_url,
        facebook_url: settingsFormData.facebook_url,
        twitter_url: settingsFormData.twitter_url,
        whatsapp_number: settingsFormData.whatsapp_number,
        welcome_banner_text: settingsFormData.welcome_banner_text,
        top_banner_text: settingsFormData.top_banner_text,
        top_banner_active: settingsFormData.top_banner_active,
        footer_text: settingsFormData.footer_text,
        popup_enabled: settingsFormData.popup_enabled,
        temporarily_closed: settingsFormData.temporarily_closed,
        dispatch_details: settingsFormData.dispatch_details,
        updated_at: new Date().toISOString()
      };

      if (settingsFormData.id) {
        const settingsRef = ref(db, `site_settings/${settingsFormData.id}`);
        await update(settingsRef, settingsData);
      } else {
        const settingsRef = ref(db, 'site_settings');
        const newRef = await push(settingsRef, settingsData);
        setSettingsFormData({ ...settingsFormData, id: newRef.key || '' });
      }

      alert('Settings updated successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, {
        order_status: newStatus,
        updated_at: new Date().toISOString()
      });

      await fetchData();
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleUpdateDispatchDetails = async (orderId: string, dispatchDetails: string) => {
    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, {
        dispatch_details: dispatchDetails,
        updated_at: new Date().toISOString()
      });

      await fetchData();
      alert('Dispatch details updated successfully!');
    } catch (error) {
      console.error('Error updating dispatch details:', error);
      alert('Failed to update dispatch details');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await remove(orderRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredOrders = orders.filter(order => {
    // Filter by search term
    const matchesSearch = order.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer_phone.includes(orderSearch) ||
      order.id.toLowerCase().includes(orderSearch.toLowerCase());

    // Filter by status
    const matchesStatus = orderStatusFilter === 'all' || order.order_status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const validateCurrentData = async () => {
    setIsValidating(true);
    try {
      console.log('[ADMIN] Validating current data...');
      
      // Collect current data from state
      const dataToValidate = {
        products: products.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, any>),
        categories: categories.reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {} as Record<string, any>),
        reviews: reviews.reduce((acc, r) => {
          acc[r.id] = r;
          return acc;
        }, {} as Record<string, any>),
        offers: offers.reduce((acc, o) => {
          acc[o.id] = o;
          return acc;
        }, {} as Record<string, any>),
      };

      const validationResult = validateFirebaseData(dataToValidate);
      setValidation(validationResult);
      
      console.log('[ADMIN] Validation complete:', validationResult);
      return validationResult;
    } catch (error) {
      console.error('[ADMIN] Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish all data to the live site? Users will see this data.')) {
      return;
    }

    setIsPublishing(true);
    try {
      console.log('[ADMIN] Starting publish process...');
      
      // Fetch all Firebase data
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
        // Banner and Social data
        social_links: ref(db, 'social_links'),
        site_content: ref(db, 'site_content'),
        // Navigation customization
        navigation_settings: ref(db, 'navigation_settings'),
      };

      console.log('[ADMIN] Fetching Firebase data...');
      const snapshots = await Promise.all(
        Object.entries(dataRefs).map(async ([key, refPath]) => {
          try {
            const snapshot = await get(refPath);
            const hasData = snapshot.exists();
            console.log(`[ADMIN] Fetched ${key}: ${hasData ? 'data exists' : 'no data'}`);
            return [key, hasData ? snapshot.val() : null];
          } catch (err) {
            console.warn(`[ADMIN] Failed to fetch ${key}:`, err);
            return [key, null];
          }
        })
      );

      const allData: Record<string, any> = {};
      let dataCount = 0;
      let productCount = 0;
      let categoryCount = 0;
      
      const dataWithContent: string[] = [];
      
      snapshots.forEach(([key, value]) => {
        allData[key as string] = value;
        if (value) {
          dataCount++;
          dataWithContent.push(key as string);
          if (key === 'products' && typeof value === 'object') {
            productCount = Object.keys(value).length;
          }
          if (key === 'categories' && typeof value === 'object') {
            categoryCount = Object.keys(value).length;
          }
        }
      });

      console.log(`[ADMIN] Data collected: ${dataCount} sections with ${productCount} products and ${categoryCount} categories`);
      console.log('[ADMIN] Sections with data:', dataWithContent.sort());
      console.log('[ADMIN] ✓ site_content:', dataWithContent.includes('site_content') ? 'YES' : 'NO');
      console.log('[ADMIN] ✓ social_links:', dataWithContent.includes('social_links') ? 'YES' : 'NO');
      console.log('[ADMIN] ✓ marquee_sections:', dataWithContent.includes('marquee_sections') ? 'YES' : 'NO');
      console.log('[ADMIN] ✓ navigation_settings:', dataWithContent.includes('navigation_settings') ? 'YES' : 'NO');

      // Note: Don't block publish - let all data through, even if some sections are empty
      // This allows publishing navigation, banners, footer, etc. without products
      if (dataWithContent.length === 0) {
        throw new Error('No data found to publish. Please add some content first.');
      }

      console.log('[ADMIN] Sending to R2...');
      
      // Upload to R2
      const response = await fetch('/api/publish-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: allData }),
      });

      // Try to parse JSON response
      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch {
        // If response isn't JSON, create error object
        result = { error: responseText || 'Unknown error occurred' };
      }

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to publish';
        const details = result.details ? '\n' + result.details.join('\n') : '';
        
        if (errorMsg.includes('R2_BUCKET') || errorMsg.includes('R2 bucket')) {
          throw new Error('R2 storage is not configured. Please add R2 bucket binding in Cloudflare Dashboard → Pages → Settings → Functions → R2 bucket bindings.');
        }
        
        if (errorMsg.includes('validation')) {
          throw new Error(`Data validation failed:${details}`);
        }
        
        throw new Error(errorMsg);
      }

      console.log('[ADMIN] Publish successful!');
      console.log('[ADMIN] Response:', result);
      
      setLastPublished(result.published_at);
      
      // Log successful publish to history
      addPublishRecord({
        timestamp: new Date().toISOString(),
        status: 'success',
        message: 'Data published successfully',
        dataStats: {
          productCount: result.productCount || productCount,
          categoryCount: result.categoryCount || categoryCount,
          totalSize: result.size || 0,
        },
        uploadTime: result.uploadTime,
        verifyTime: result.verifyTime,
      });
      
      // Refresh history panel
      setHistoryRefresh(prev => prev + 1);
      
      let successMsg = `Data published successfully!
Products: ${result.productCount || productCount}
Categories: ${result.categoryCount || categoryCount}
Size: ${result.size ? (result.size / 1024).toFixed(2) + ' KB' : 'unknown'}
Upload Time: ${result.uploadTime || '?'}ms
Verify Time: ${result.verifyTime || '?'}ms
Users will now see the updated content.`;

      if (result.warnings && result.warnings.length > 0) {
        successMsg += `\n\nWarnings:\n${result.warnings.join('\n')}`;
      }
      
      alert(successMsg);
      
      // Clear the published data cache so users get fresh data
      const { clearPublishedDataCache } = await import('../utils/publishedData');
      clearPublishedDataCache();
      
    } catch (error: any) {
      console.error('[ADMIN] Error publishing data:', error);
      const errorMessage = error?.message || String(error) || 'Unknown error';
      
      // Log failed publish to history
      addPublishRecord({
        timestamp: new Date().toISOString(),
        status: 'failed',
        message: 'Failed to publish data',
        errorMessage: errorMessage,
      });
      
      // Refresh history panel
      setHistoryRefresh(prev => prev + 1);
      
      if (errorMessage.includes('Permission denied')) {
        alert('Firebase permission denied. Please make sure you are logged in and have admin access.');
      } else if (errorMessage.includes('R2')) {
        alert(errorMessage);
      } else if (errorMessage.includes('Failed to fetch')) {
        alert('Network error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('No products') || errorMessage.includes('No categories')) {
        alert(errorMessage);
      } else {
        alert(`Failed to publish data: ${errorMessage}`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-mint-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 border-2 border-teal-300 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
              <Settings className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h2>
            <p className="text-gray-600 text-sm">Enter your credentials to access the admin panel</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin ID</label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Enter admin ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 transition-colors pr-12"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-500 text-white py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-mint-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your products and categories</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowPreviewModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-5 h-5" />
                Preview Changes
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
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
              <button
                onClick={handleAdminLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {lastPublished && (
            <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              Last published: {new Date(lastPublished).toLocaleString()}
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div>
              <button
                onClick={validateCurrentData}
                disabled={isValidating}
                className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Validate Data
                  </>
                )}
              </button>
              <DataValidationPanel validation={validation} isValidating={isValidating} />
            </div>

            <PublishHistoryPanel refreshTrigger={historyRefresh} />
          </div>

          <UpgradeBanner />

          <div className="flex gap-2 sm:gap-4 mb-8 border-b-2 border-gray-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('products');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'products'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'categories'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                Categories
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('offers');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'offers'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                Offers
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('orders');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'orders'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                Orders
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('carousel');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'carousel'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Carousel
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('marquee');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'marquee'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 sm:w-5 sm:h-5" />
                Marquee
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('sections');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'sections'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                Homepage Sections
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('card-design');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'card-design'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                Card Design
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('banner-social');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'banner-social'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Banner & Social
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('navigation');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'navigation'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Navigation
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('coupons');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'coupons'
                  ? 'border-b-4 border-purple-500 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                Coupons
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('bulk-operations');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'bulk-operations'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                Bulk Operations
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('try-on');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'try-on'
                  ? 'border-b-4 border-pink-500 text-pink-600'
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Try-On Models
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tax');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'tax'
                  ? 'border-b-4 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                Tax Settings
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('footer');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'footer'
                  ? 'border-b-4 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 sm:w-5 sm:h-5" />
                Footer
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('ai-assistant');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'ai-assistant'
                  ? 'border-b-4 border-purple-500 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                AI Assistant
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('traffic');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'traffic'
                  ? 'border-b-4 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                Traffic
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('gallery');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'gallery'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                R2 Gallery
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('bill-customizer');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'bill-customizer'
                  ? 'border-b-4 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                Bill Design
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'settings'
                  ? 'border-b-4 border-teal-500 text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Settings
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('publish');
                setShowForm(false);
                setShowCategoryForm(false);
                setShowReviewForm(false);
                setShowOfferForm(false);
              }}
              className={`pb-4 px-4 sm:px-6 font-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'publish'
                  ? 'border-b-4 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                Publish to Live
              </div>
            </button>
          </div>

          {activeTab === 'products' && (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
                >
                  {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {showForm ? 'Cancel' : 'Add Product'}
                </button>
              </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-teal-50 rounded-2xl p-4 sm:p-6 mb-8 border-2 border-teal-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categories (Select Multiple)</label>
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-gray-500 text-sm">No categories available. Please create a category first.</p>
                    ) : (
                      <div className="space-y-2">
                        {categories.map(cat => (
                          <label key={cat.id} className="flex items-center gap-3 p-2 hover:bg-teal-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.category_ids.includes(cat.id)}
                              onChange={(e) => {
                                const newCategoryIds = e.target.checked
                                  ? [...formData.category_ids, cat.id]
                                  : formData.category_ids.filter(id => id !== cat.id);
                                setFormData({ ...formData, category_ids: newCategoryIds });
                              }}
                              className="w-5 h-5 text-teal-500 border-2 border-teal-200 rounded focus:ring-2 focus:ring-teal-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.category_ids.length === 0 && (
                    <p className="text-red-500 text-xs mt-1">Please select at least one category</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (���)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Compare Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <ImageUpload
                  label="Product Image"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Video URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="https://example.com/video.mp4"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add a video URL for the product</p>
                </div>
              </div>

              <div className="mb-4">
                <MultipleImageUpload
                  label="Gallery Images (Additional Images)"
                  images={formData.gallery_images}
                  onChange={(images) => setFormData({ ...formData, gallery_images: images })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Sizes (Optional)</label>
                  <input
                    type="text"
                    value={formData.sizes.join(', ')}
                    onChange={(e) => {
                      const newSizes = e.target.value.split(',').map(s => s.trim());
                      setFormData({
                        ...formData,
                        sizes: newSizes
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="S, M, L, XL or 24, 26, 28"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter sizes separated by commas</p>
                </div>

                <ColorPicker
                  selectedColors={formData.colors.filter(c => c.length > 0)}
                  onChange={(colors) => setFormData({ ...formData, colors })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                {formData.sizes && formData.sizes.filter(s => s.length > 0).length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Default Size (Optional)</label>
                    <select
                      value={formData.default_size}
                      onChange={(e) => setFormData({ ...formData, default_size: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">None (Customer must select)</option>
                      {formData.sizes.filter(s => s.length > 0).map((size, idx) => (
                        <option key={idx} value={size}>{size}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Pre-selected size for customers</p>
                  </div>
                )}

                {formData.colors && formData.colors.filter(c => c.length > 0).length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Default Color (Optional)</label>
                    <select
                      value={formData.default_color}
                      onChange={(e) => setFormData({ ...formData, default_color: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">None (Customer must select)</option>
                      {formData.colors.filter(c => c.length > 0).map((color, idx) => (
                        <option key={idx} value={color}>{color}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Pre-selected color for customers</p>
                  </div>
                )}
              </div>

              {formData.sizes && formData.sizes.filter(s => s.length > 0).length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Size-Based Pricing (Optional)</label>
                  <div className="bg-white border-2 border-teal-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-gray-500 mb-3">Set different prices for each size. Leave empty to use the default price above.</p>
                    {formData.sizes.filter(s => s.length > 0).map((size, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 text-sm min-w-[60px]">Size: {size}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.size_pricing?.[size]?.price || ''}
                            onChange={(e) => {
                              const newSizePricing = { ...formData.size_pricing };
                              if (e.target.value) {
                                newSizePricing[size] = {
                                  ...newSizePricing[size],
                                  price: parseFloat(e.target.value) || 0
                                };
                              } else {
                                delete newSizePricing[size];
                              }
                              setFormData({ ...formData, size_pricing: newSizePricing });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            placeholder="Price"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Compare Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.size_pricing?.[size]?.compare_at_price || ''}
                            onChange={(e) => {
                              const newSizePricing = { ...formData.size_pricing };
                              if (!newSizePricing[size]) {
                                newSizePricing[size] = { price: 0 };
                              }
                              if (e.target.value) {
                                newSizePricing[size].compare_at_price = parseFloat(e.target.value) || 0;
                              } else {
                                delete newSizePricing[size].compare_at_price;
                              }
                              setFormData({ ...formData, size_pricing: newSizePricing });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            placeholder="Compare"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-teal-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-teal-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                  <input
                    type="checkbox"
                    checked={formData.best_selling}
                    onChange={(e) => setFormData({ ...formData, best_selling: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-teal-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Best Selling</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                  <input
                    type="checkbox"
                    checked={formData.might_you_like}
                    onChange={(e) => setFormData({ ...formData, might_you_like: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-teal-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Might You Like</span>
                </label>
              </div>

              <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Virtual Try-On Settings
                </h3>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-purple-200 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.try_on_enabled}
                    onChange={(e) => setFormData({ ...formData, try_on_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Enable Virtual Try-On</span>
                </label>

                {formData.try_on_enabled && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Hairclip Type</label>
                      <select
                        value={formData.hairclip_type}
                        onChange={(e) => setFormData({ ...formData, hairclip_type: e.target.value as any })}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="top">Top Clip</option>
                        <option value="side">Side Clip</option>
                        <option value="back">Back Clip</option>
                        <option value="headband">Headband</option>
                        <option value="full">Full Coverage</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Select the type of hairclip for proper positioning</p>
                    </div>

                    <ImageUpload
                      label="Try-On Image (Optional - uses main image if not provided)"
                      value={formData.try_on_image_url}
                      onChange={(url) => setFormData({ ...formData, try_on_image_url: url })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a transparent PNG image for best results</p>
                  </>
                )}
              </div>

              <div className="mb-4 bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border-2 border-pink-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  Color Matching for Dress
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add colors available for this product to enable the "Match Your Dress" feature. Customers can upload their dress photo to find accessories with matching colors.
                </p>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Colors</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter a color (e.g., red, blue, pink)"
                      className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const color = input.value.trim().toLowerCase();
                          if (color && !formData.availableColors.includes(color)) {
                            setFormData({
                              ...formData,
                              availableColors: [...formData.availableColors, color]
                            });
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                        const color = input.value.trim().toLowerCase();
                        if (color && !formData.availableColors.includes(color)) {
                          setFormData({
                            ...formData,
                            availableColors: [...formData.availableColors, color]
                          });
                          input.value = '';
                        }
                      }}
                      className="bg-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Press Enter or click Add to add a color</p>

                  {formData.availableColors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.availableColors.map((color, index) => (
                        <div
                          key={index}
                          className="bg-white border-2 border-pink-200 px-4 py-2 rounded-full flex items-center gap-2 group hover:border-pink-400 transition-colors"
                        >
                          <span className="text-sm font-medium capitalize">{color}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                availableColors: formData.availableColors.filter((_, i) => i !== index)
                              });
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          )}

              {!showForm && products.length > 0 && (
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search products by name or description..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
                    <Plus className="w-10 h-10 text-teal-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-2">No products yet</p>
                  <p className="text-gray-600">Start by adding your first product</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl font-bold text-gray-900 mb-2">No products found</p>
                  <p className="text-gray-600">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-teal-200">
                      <div className="relative">
                        <LazyImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                          {product.featured && (
                            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <Star className="w-3 h-3 fill-white" />
                              Featured
                            </span>
                          )}
                          {product.best_selling && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <ShoppingBag className="w-3 h-3" />
                              Best Selling
                            </span>
                          )}
                          {product.might_you_like && (
                            <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <Heart className="w-3 h-3" />
                              Might You Like
                            </span>
                          )}
                          {!product.in_stock && (
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(product.category_ids && product.category_ids.length > 0 ? product.category_ids : (product.category_id ? [product.category_id] : [])).map(catId => {
                            const category = categories.find(c => c.id === catId);
                            return category ? (
                              <span key={catId} className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded-full">
                                {category.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-xl sm:text-2xl font-bold text-gray-900">₹{product.price}</span>
                            {product.compare_at_price && product.compare_at_price > 0 && (
                              <span className="text-sm text-gray-400 line-through ml-2">
                                ₹{product.compare_at_price}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-3 p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Quick Controls</p>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                              onClick={() => toggleProductFeatured(product)}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                                product.featured
                                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${product.featured ? 'fill-white' : ''}`} />
                              {product.featured ? 'Featured' : 'Not Featured'}
                            </button>
                            <button
                              onClick={() => toggleProductStock(product)}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                                product.in_stock
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              {product.in_stock ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  In Stock
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Out of Stock
                                </>
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => toggleProductBestSelling(product)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                              product.best_selling
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {product.best_selling ? 'Best Selling' : 'Not Best Selling'}
                          </button>
                          <button
                            onClick={() => toggleProductMightYouLike(product)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                              product.might_you_like
                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            {product.might_you_like ? 'Might You Like' : 'Not Might You Like'}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="flex-1 bg-teal-500 text-white py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'categories' && (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
                >
                  {showCategoryForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {showCategoryForm ? 'Cancel' : 'Add Category'}
                </button>
              </div>

              {showCategoryForm && (
                <form onSubmit={handleCategorySubmit} className="bg-teal-50 rounded-2xl p-4 sm:p-6 mb-8 border-2 border-teal-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <ImageUpload
                      label="Category Image (Optional)"
                      value={categoryFormData.image_url}
                      onChange={(url) => setCategoryFormData({ ...categoryFormData, image_url: url })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional - Leave blank to use default image</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Background Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={categoryFormData.bg_color}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, bg_color: e.target.value })}
                        className="h-12 w-20 rounded-xl border-2 border-teal-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={categoryFormData.bg_color}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, bg_color: e.target.value })}
                        className="flex-1 px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="#10b981"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Choose a background color for featured category section</p>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                      <input
                        type="checkbox"
                        checked={categoryFormData.featured}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, featured: e.target.checked })}
                        className="w-5 h-5 text-teal-500 border-2 border-teal-200 rounded focus:ring-2 focus:ring-teal-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-700 block">Featured Category</span>
                        <p className="text-xs text-gray-500 mt-1">Featured categories will be displayed on the home page</p>
                      </div>
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                      <input
                        type="checkbox"
                        checked={categoryFormData.new_arrival}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, new_arrival: e.target.checked })}
                        className="w-5 h-5 text-teal-500 border-2 border-teal-200 rounded focus:ring-2 focus:ring-teal-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-700 block">Best Selling</span>
                        <p className="text-xs text-gray-500 mt-1">Mark categories as best selling to display them in the Best Selling section with live indicator</p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </form>
              )}

              {!showCategoryForm && categories.length > 0 && (
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search categories by name..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
                    <FolderOpen className="w-10 h-10 text-teal-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-2">No categories yet</p>
                  <p className="text-gray-600">Start by adding your first category</p>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl font-bold text-gray-900 mb-2">No categories found</p>
                  <p className="text-gray-600">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-teal-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{category.name}</h3>
                            {category.featured && (
                              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>

                      <div className="mb-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Featured Control</p>
                        <button
                          onClick={() => toggleCategoryFeatured(category)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                            category.featured
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${category.featured ? 'fill-white' : ''}`} />
                          {category.featured ? 'Featured on Home Page' : 'Not Featured'}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="flex-1 bg-teal-500 text-white py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'offers' && (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowOfferForm(!showOfferForm)}
                  className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
                >
                  {showOfferForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {showOfferForm ? 'Cancel' : 'Add Offer'}
                </button>
              </div>

              {showOfferForm && (
                <form onSubmit={handleOfferSubmit} className="bg-teal-50 rounded-2xl p-4 sm:p-6 mb-8 border-2 border-teal-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                    {editingOffer ? 'Edit Offer' : 'Add New Offer'}
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Title</label>
                    <input
                      type="text"
                      value={offerFormData.title}
                      onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Special Offer - 50% Off!"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={offerFormData.description}
                      onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows={4}
                      placeholder="Get 50% off on all hair accessories this week only!"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <ImageUpload
                      label="Offer Banner Image (Optional)"
                      value={offerFormData.image_url}
                      onChange={(url) => setOfferFormData({ ...offerFormData, image_url: url })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional - Add a banner image for your offer</p>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                      <input
                        type="checkbox"
                        checked={offerFormData.is_active}
                        onChange={(e) => setOfferFormData({ ...offerFormData, is_active: e.target.checked })}
                        className="w-5 h-5 text-teal-500 border-2 border-teal-200 rounded focus:ring-2 focus:ring-teal-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-700 block">Show this offer</span>
                        <p className="text-xs text-gray-500 mt-1">Only one offer can be active at a time. Activating this will deactivate other offers.</p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingOffer ? 'Update Offer' : 'Add Offer'}
                  </button>
                </form>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading offers...</p>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
                    <Megaphone className="w-10 h-10 text-teal-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-2">No offers yet</p>
                  <p className="text-gray-600">Create your first promotional offer</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {offers.map((offer) => (
                    <div key={offer.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-teal-200">
                      {offer.image_url && (
                        <div className="relative">
                          <LazyImage
                            src={offer.image_url}
                            alt={offer.title}
                            className="w-full h-48 object-cover"
                          />
                          {offer.is_active && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.title}</h3>
                            <p className="text-xs text-gray-500">
                              {new Date(offer.updated_at || offer.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!offer.is_active && (
                            <span className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

                        <div className="mb-3 p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Status Control</p>
                          <button
                            onClick={() => toggleOfferActive(offer)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                              offer.is_active
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {offer.is_active ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Currently Showing
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Not Showing
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditOffer(offer)}
                            className="flex-1 bg-teal-500 text-white py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className="mb-6">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Orders & Statistics</h2>
                      <p className="text-teal-50 text-sm">View all customer orders and purchase details</p>
                    </div>
                  </div>
                </div>
              </div>

              {orders.length > 0 && <StatisticsCharts orders={orders} />}

              {orders.length > 0 && (
                <>
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Search orders by customer name, email, phone, or order ID..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="mb-6 bg-white rounded-2xl shadow-sm border-2 border-teal-200 overflow-hidden">
                    <div className="flex overflow-x-auto">
                      <button
                        onClick={() => setOrderStatusFilter('all')}
                        className={`flex-1 min-w-[120px] px-4 py-4 font-semibold transition-all ${
                          orderStatusFilter === 'all'
                            ? 'bg-teal-500 text-white border-b-4 border-teal-600'
                            : 'bg-white text-gray-600 hover:bg-teal-50 border-b-2 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <ShoppingBag className="w-5 h-5" />
                          <span className="text-sm">All Orders</span>
                          <span className="text-xs font-bold">({orders.length})</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setOrderStatusFilter('pending')}
                        className={`flex-1 min-w-[120px] px-4 py-4 font-semibold transition-all ${
                          orderStatusFilter === 'pending'
                            ? 'bg-amber-500 text-white border-b-4 border-amber-600'
                            : 'bg-white text-gray-600 hover:bg-amber-50 border-b-2 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Package className="w-5 h-5" />
                          <span className="text-sm">Pending</span>
                          <span className="text-xs font-bold">({orders.filter(o => o.order_status === 'pending').length})</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setOrderStatusFilter('processing')}
                        className={`flex-1 min-w-[120px] px-4 py-4 font-semibold transition-all ${
                          orderStatusFilter === 'processing'
                            ? 'bg-blue-500 text-white border-b-4 border-blue-600'
                            : 'bg-white text-gray-600 hover:bg-blue-50 border-b-2 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Settings className="w-5 h-5" />
                          <span className="text-sm">Processing</span>
                          <span className="text-xs font-bold">({orders.filter(o => o.order_status === 'processing').length})</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setOrderStatusFilter('in_transit')}
                        className={`flex-1 min-w-[120px] px-4 py-4 font-semibold transition-all ${
                          orderStatusFilter === 'in_transit'
                            ? 'bg-purple-500 text-white border-b-4 border-purple-600'
                            : 'bg-white text-gray-600 hover:bg-purple-50 border-b-2 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Truck className="w-5 h-5" />
                          <span className="text-sm">In Transit</span>
                          <span className="text-xs font-bold">({orders.filter(o => o.order_status === 'in_transit').length})</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setOrderStatusFilter('completed')}
                        className={`flex-1 min-w-[120px] px-4 py-4 font-semibold transition-all ${
                          orderStatusFilter === 'completed'
                            ? 'bg-green-500 text-white border-b-4 border-green-600'
                            : 'bg-white text-gray-600 hover:bg-green-50 border-b-2 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Completed</span>
                          <span className="text-xs font-bold">({orders.filter(o => o.order_status === 'completed').length})</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
                    <ShoppingBag className="w-10 h-10 text-teal-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-2">No orders yet</p>
                  <p className="text-gray-600">Orders will appear here when customers make purchases</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl font-bold text-gray-900 mb-2">No orders found</p>
                  <p className="text-gray-600">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-lg border-2 border-teal-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-50 to-mint-50 p-6 border-b-2 border-teal-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{order.customer_name}</h3>
                            <p className="text-sm text-gray-600">Order ID: {order.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 font-semibold">Total Amount</p>
                            <p className="text-3xl font-bold text-teal-600">₹{Number(order.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-teal-600">📞</span>
                              </div>
                              Contact Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-600 min-w-[80px]">Email:</span>
                                <span className="text-gray-900">{order.customer_email}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-600 min-w-[80px]">Phone:</span>
                                <span className="text-gray-900">{order.customer_phone}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-teal-600">📍</span>
                              </div>
                              Shipping Address
                            </h4>
                            <div className="text-sm text-gray-900 space-y-1">
                              <p>{order.shipping_address.address}</p>
                              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                              <p>PIN: {order.shipping_address.pincode}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Package className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            Order Items
                          </h4>
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{item.product_name}</p>
                                  <div className="flex gap-2 mt-1 mb-1">
                                    {item.selected_size && (
                                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                                        Size: {item.selected_size}
                                      </span>
                                    )}
                                    {item.selected_color && (
                                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                                        Color: {item.selected_color}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">₹{Number(item.product_price).toFixed(2)} each</p>
                                  <p className="font-bold text-gray-900">₹{Number(item.subtotal).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.payment_id && (
                          <div className="bg-teal-50 rounded-xl p-4 border-2 border-teal-200 mb-4">
                            <p className="text-sm">
                              <span className="font-semibold text-gray-700">Payment ID:</span>
                              <span className="text-gray-900 ml-2 font-mono">{order.payment_id}</span>
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Order Status</p>
                            <p className="text-sm font-bold text-gray-900 capitalize">{order.order_status.replace('_', ' ')}</p>
                          </div>
                          <div className="flex gap-2">
                            {order.order_status !== 'in_transit' && order.order_status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'in_transit')}
                                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-600 transition-colors border-2 border-amber-600"
                              >
                                <Truck className="w-4 h-4" />
                                Mark In Transit
                              </button>
                            )}
                            {order.order_status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors border-2 border-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                          <button
                            onClick={() => {
                              const siteSettings = {
                                site_name: settingsFormData.site_name || 'Hair Accessories Store',
                                contact_email: settingsFormData.contact_email || 'contact@hairstore.com',
                                contact_phone: settingsFormData.contact_phone || '+919345259073'
                              };
                              downloadBillAsPDF(order, siteSettings, shippingPrice, billSettings);
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg border-2 border-red-700"
                          >
                            <FileText className="w-5 h-5" />
                            PDF
                          </button>
                          <button
                            onClick={() => {
                              const siteSettings = {
                                site_name: settingsFormData.site_name || 'Hair Accessories Store',
                                contact_email: settingsFormData.contact_email || 'contact@hairstore.com',
                                contact_phone: settingsFormData.contact_phone || '+919345259073'
                              };
                              downloadBillAsJPG(order, siteSettings, shippingPrice, billSettings);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg border-2 border-blue-700"
                          >
                            <ImageIcon className="w-5 h-5" />
                            JPG
                          </button>
                          <button
                            onClick={() => {
                              const siteSettings = {
                                site_name: settingsFormData.site_name || 'Hair Accessories Store',
                                contact_email: settingsFormData.contact_email || 'contact@hairstore.com',
                                contact_phone: settingsFormData.contact_phone || '+919345259073'
                              };
                              printBill(order, siteSettings, shippingPrice, billSettings);
                            }}
                            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg border-2 border-gray-800"
                          >
                            <Printer className="w-5 h-5" />
                            Print
                          </button>
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg border-2 border-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                            Delete Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'carousel' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Carousel Images</h2>
                    <p className="text-white/90 mt-1">Manage homepage carousel images</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-teal-200">
                <CarouselManager />
              </div>
            </div>
          )}

          {activeTab === 'marquee' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Type className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Top Marquee Banner</h2>
                    <p className="text-white/90 mt-1">Manage the scrolling text banner at the top of your site</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-teal-200">
                <MarqueeManager />
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Homepage Sections</h2>
                    <p className="text-white/90 mt-1">Manage dynamic sections on your homepage</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-teal-200">
                <SectionManager />
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 sm:p-8 text-white mt-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Video Section</h2>
                    <p className="text-white/90 mt-1">Add YouTube/Vimeo videos to your homepage</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-purple-200">
                <VideoSectionManager />
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 sm:p-8 text-white mt-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Video Overlay Sections</h2>
                    <p className="text-white/90 mt-1">Create video sections with text overlays</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-blue-200">
                <VideoOverlayManager />
              </div>
            </div>
          )}

          {activeTab === 'card-design' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border-2 border-teal-200">
                <CardDesignManager />
              </div>
            </div>
          )}

          {activeTab === 'banner-social' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-6 sm:p-8 text-white mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Banner & Social Media</h2>
                    <p className="text-white/90 mt-1">Manage welcome banner and social media links</p>
                  </div>
                </div>
              </div>
              <BannerSocialManager />
            </div>
          )}

          {activeTab === 'navigation' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 sm:p-8 text-white mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Navigation Settings</h2>
                    <p className="text-white/90 mt-1">Customize navigation buttons, colors, and styles</p>
                  </div>
                </div>
              </div>
              <NavigationCustomizer />
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 sm:p-8 text-white mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Coupon Management</h2>
                    <p className="text-white/90 mt-1">Create and manage discount coupons for your store</p>
                  </div>
                </div>
              </div>
              <CouponManager />
            </div>
          )}

          {activeTab === 'bulk-operations' && <BulkOperationsManager />}

          {activeTab === 'try-on' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10" />
                  <h2 className="text-2xl sm:text-3xl font-bold">Try-On Models</h2>
                </div>
                <p className="text-pink-100">Upload and manage model images for the virtual try-on feature</p>
              </div>
              <TryOnModelManager />
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <Receipt className="w-8 h-8 sm:w-10 sm:h-10" />
                  <h2 className="text-2xl sm:text-3xl font-bold">Tax Settings</h2>
                </div>
                <p className="text-green-100">Configure tax rates, GST number, and tax display options</p>
              </div>
              <TaxManager />
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <Footprints className="w-8 h-8 sm:w-10 sm:h-10" />
                  <h2 className="text-2xl sm:text-3xl font-bold">Footer Settings</h2>
                </div>
                <p className="text-blue-100">Customize your website footer with preset themes, colors, and content</p>
              </div>
              <FooterManager />
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="space-y-6">
              <AIAgentManager />
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="space-y-6">
              <TrafficAnalytics />
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <R2GalleryManager />
            </div>
          )}

          {activeTab === 'bill-customizer' && (
            <div className="space-y-6">
              <BillCustomizer />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Store Settings</h2>
                    <p className="text-white/90 mt-1">Control popup visibility and store status</p>
                  </div>
                </div>
              </div>

              <ShippingManager />

              <div className="bg-white rounded-2xl p-6 border-2 border-teal-200">
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Common Dispatch Details</h3>
                        <p className="text-sm text-gray-600">This message will appear above the Place Order button for all customers during checkout</p>
                      </div>
                    </div>
                    <textarea
                      value={settingsFormData.dispatch_details}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, dispatch_details: e.target.value })}
                      placeholder="Enter common dispatch information (e.g., 'Orders are typically dispatched within 2-3 business days via Blue Dart/Delhivery')"
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-teal-50 to-mint-50 rounded-xl p-6 border-2 border-teal-200">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Popup Control</h3>
                          <p className="text-sm text-gray-600 mb-4">Enable or disable promotional popups on your site</p>
                          <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-all">
                            <input
                              type="checkbox"
                              checked={settingsFormData.popup_enabled}
                              onChange={(e) => setSettingsFormData({ ...settingsFormData, popup_enabled: e.target.checked })}
                              className="w-6 h-6 text-teal-500 border-2 border-teal-200 rounded focus:ring-2 focus:ring-teal-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-gray-900 block">
                                {settingsFormData.popup_enabled ? 'Popups Enabled' : 'Popups Disabled'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {settingsFormData.popup_enabled
                                  ? 'Offer popups will show to visitors'
                                  : 'All popups are currently hidden'}
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Store Status</h3>
                          <p className="text-sm text-gray-600 mb-4">Temporarily close your store with a grayscale overlay</p>
                          <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-all">
                            <input
                              type="checkbox"
                              checked={settingsFormData.temporarily_closed}
                              onChange={(e) => setSettingsFormData({ ...settingsFormData, temporarily_closed: e.target.checked })}
                              className="w-6 h-6 text-orange-500 border-2 border-orange-200 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-gray-900 block">
                                {settingsFormData.temporarily_closed ? 'Store Closed' : 'Store Open'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {settingsFormData.temporarily_closed
                                  ? 'Visitors see grayscale overlay with disabled access'
                                  : 'Store is fully operational'}
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
                    >
                      <Save className="w-5 h-5" />
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'publish' && (
            <div className="space-y-6">
              <PublishManager onPublishComplete={() => {
                setHistoryRefresh(prev => prev + 1);
              }} />
              
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Publication History</h3>
                <PublishHistoryPanel refreshTrigger={historyRefresh} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Preview Modal */}
      <PreviewModal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
    </div>
  );
}
