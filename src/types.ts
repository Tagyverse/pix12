export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  featured: boolean;
  new_arrival?: boolean;
  bg_color?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  category_id?: string;
  category_ids: string[];
  image_url: string;
  gallery_images: string[];
  video_url?: string;
  in_stock: boolean;
  featured: boolean;
  best_selling?: boolean;
  might_you_like?: boolean;
  sizes?: string[];
  colors?: string[];
  default_size?: string;
  default_color?: string;
  size_pricing?: { [size: string]: { price: number; compare_at_price?: number } };
  try_on_enabled?: boolean;
  try_on_image_url?: string;
  hairclip_type?: 'side' | 'top' | 'back' | 'headband' | 'full';
  availableColors?: string[];
  created_at: string;
  createdAt?: string;
  updated_at: string;
}

export interface Review {
  id: string;
  customer_name: string;
  review_text: string;
  is_active: boolean;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle: string | null;
  content_type: 'category' | 'product';
  display_type: 'horizontal' | 'vertical' | 'carousel' | 'swipable' | 'grid';
  selected_items: string[];
  is_visible: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count?: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TryOnModel {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
