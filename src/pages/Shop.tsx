import { useEffect, useState } from 'react';
import { Filter, SlidersHorizontal, ShoppingCart, Heart, Star, X, MessageCircle, Shield } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import EnquiryModal from '../components/EnquiryModal';
import ProductDetailsSheet from '../components/ProductDetailsSheet';
import WhatsAppCustomization from '../components/WhatsAppCustomization';
import BottomSheet from '../components/BottomSheet';
import ShimmerLoader from '../components/ShimmerLoader';
import FilterBottomSheet from '../components/FilterBottomSheet';
import LazyImage from '../components/LazyImage';
import { getPublishedData, objectToArray } from '../utils/publishedData';
import type { Product, Category } from '../types';

interface ShopProps {
  onCartClick: () => void;
}

export default function Shop({ onCartClick }: ShopProps) {
  const { addToCart, isInCart, taxSettings } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design } = useCardDesign('shop_page');
  const cardStyles = getCardStyles(design);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        // Try to load from R2 first
        const publishedData = await getPublishedData();
        
        let categoriesData: Category[] = [];
        
        if (publishedData && publishedData.categories) {
          categoriesData = objectToArray<Category>(publishedData.categories);
          categoriesData.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          // Fallback to Firebase
          const categoriesRef = ref(db, 'categories');
          const categoriesSnapshot = await get(categoriesRef);

          if (categoriesSnapshot.exists()) {
            const data = categoriesSnapshot.val();
            Object.keys(data).forEach(key => {
              categoriesData.push({ id: key, ...data[key] });
            });
            categoriesData.sort((a, b) => a.name.localeCompare(b.name));
          }
        }

        setCategories(categoriesData);

        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
          setSelectedCategory(categoryParam);
          setTimeout(() => {
            const productsSection = document.getElementById('products-section');
            if (productsSection) {
              productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleOpenProductDetails = (event: CustomEvent) => {
      const product = event.detail;
      setSelectedProduct(product);
      setShowProductDetails(true);
      window.history.pushState({}, '', `/shop?product=${product.id}`);
    };

    window.addEventListener('openProductDetails', handleOpenProductDetails as EventListener);

    return () => {
      window.removeEventListener('openProductDetails', handleOpenProductDetails as EventListener);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        // Try to load from R2 first
        const publishedData = await getPublishedData();
        
        let productsData: Product[] = [];
        
        if (publishedData && publishedData.products) {
          productsData = objectToArray<Product>(publishedData.products);
        } else {
          // Fallback to Firebase
          const productsRef = ref(db, 'products');
          const productsSnapshot = await get(productsRef);

          if (productsSnapshot.exists()) {
            const data = productsSnapshot.val();
            Object.keys(data).forEach(key => {
              productsData.push({ id: key, ...data[key] });
            });
          }
        }

        if (selectedCategory) {
          productsData = productsData.filter(p => {
            if (p.category_ids && p.category_ids.length > 0) {
              return p.category_ids.includes(selectedCategory);
            }
            return p.category_id === selectedCategory;
          });
        }

        if (showInStock) {
          productsData = productsData.filter(p => p.in_stock);
        }

        if (showOnSale) {
          productsData = productsData.filter(p => p.compare_at_price && p.compare_at_price > p.price);
        }

        switch (sortBy) {
          case 'newest':
            productsData.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
            break;
          case 'price-low':
            productsData.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            productsData.sort((a, b) => b.price - a.price);
            break;
          case 'name-az':
            productsData.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'name-za':
            productsData.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case 'featured':
          default:
            productsData.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
            break;
        }

        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, sortBy, showInStock, showOnSale]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-white via-teal-50/30 to-white border-b border-gray-100 py-6 sm:py-8 lg:py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-0">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg border-4 border-teal-700 group-hover:border-teal-800 transition-all group-hover:scale-110">
                  <span>1</span>
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 mt-2 sm:mt-3 whitespace-nowrap">Browse</span>
              </div>

              <div className="w-12 sm:w-16 lg:w-24 h-1 bg-gradient-to-r from-teal-500 to-mint-400 mx-1 sm:mx-2 border-2 border-teal-600 rounded-full"></div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 text-white flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg border-4 border-mint-700 group-hover:border-mint-800 transition-all group-hover:scale-110">
                  <span>2</span>
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 mt-2 sm:mt-3 whitespace-nowrap">Customize</span>
              </div>

              <div className="w-12 sm:w-16 lg:w-24 h-1 bg-gradient-to-r from-mint-400 to-peach-400 mx-1 sm:mx-2 border-2 border-mint-600 rounded-full"></div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-peach-400 to-peach-600 text-white flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg border-4 border-peach-700 group-hover:border-peach-800 transition-all group-hover:scale-110">
                  <span>3</span>
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 mt-2 sm:mt-3 whitespace-nowrap">Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative bg-gradient-to-br from-teal-50 via-mint-50 to-peach-100 py-8 sm:py-12 lg:py-16 xl:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="hidden md:block absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-teal-300/30 to-mint-400/30 blob"></div>
        <div className="hidden lg:block absolute bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-peach-300/20 to-teal-300/20 blob" style={{ animationDelay: '3s' }}></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-block text-[10px] sm:text-xs md:text-sm font-semibold text-teal-600 tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Handcrafted Collection
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-2">
            Discover Your
            <span className="block text-gradient mt-1 sm:mt-2">Perfect Style</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-2">
            Every accessory tells a unique story. Explore our carefully curated collection of handmade treasures designed to make you feel extraordinary.
          </p>
        </div>
      </div>

      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-12">
            <div className="text-center">
              <h3 className="text-[10px] sm:text-base lg:text-xl font-bold text-gray-900 mb-0 sm:mb-2">Top Quality</h3>
              <p className="hidden sm:block text-xs lg:text-sm text-gray-600">Premium materials and exceptional craftsmanship in every piece</p>
            </div>
            <div className="text-center">
              <h3 className="text-[10px] sm:text-base lg:text-xl font-bold text-gray-900 mb-0 sm:mb-2">Unique Designs</h3>
              <p className="hidden sm:block text-xs lg:text-sm text-gray-600">One-of-a-kind pieces you won't find anywhere else</p>
            </div>
            <div className="text-center">
              <h3 className="text-[10px] sm:text-base lg:text-xl font-bold text-gray-900 mb-0 sm:mb-2">100% Handmade</h3>
              <p className="hidden sm:block text-xs lg:text-sm text-gray-600">Carefully crafted with love and attention to detail</p>
            </div>
          </div>
        </div>
      </div>

      <div id="products-section" className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="lg:hidden flex items-center gap-2 text-gray-900 font-semibold mb-3 sm:mb-4 w-full justify-between bg-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-teal-200 text-xs sm:text-sm"
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                  Filter Products
                </span>
                {filterOpen ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              <div className={`space-y-3 sm:space-y-4 lg:space-y-6 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-teal-200">
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 sm:h-5 lg:h-6 bg-gradient-to-b from-teal-500 to-mint-500 rounded-full"></span>
                    Categories
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setFilterOpen(false);
                      }}
                      className={`block w-full text-left px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-md sm:rounded-lg lg:rounded-xl font-medium transition-all text-xs sm:text-sm lg:text-base ${
                        selectedCategory === null
                          ? 'bg-teal-500 text-white border-2 border-teal-600'
                          : 'text-gray-700 hover:bg-teal-50 border-2 border-transparent'
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setFilterOpen(false);
                        }}
                        className={`block w-full text-left px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-md sm:rounded-lg lg:rounded-xl font-medium transition-all text-xs sm:text-sm lg:text-base ${
                          selectedCategory === category.id
                            ? 'bg-teal-500 text-white border-2 border-teal-600'
                            : 'text-gray-700 hover:bg-teal-50 border-2 border-transparent'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-peach-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-peach-200">
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 sm:h-5 lg:h-6 bg-gradient-to-b from-peach-500 to-teal-500 rounded-full"></span>
                    Availability
                  </h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <label className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={showInStock}
                        onChange={(e) => setShowInStock(e.target.checked)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-md border-2 border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 text-xs sm:text-sm lg:text-base">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={showOnSale}
                        onChange={(e) => setShowOnSale(e.target.checked)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-md border-2 border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 text-xs sm:text-sm lg:text-base">On Sale Only</span>
                    </label>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <WhatsAppCustomization />
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1" id="products-section">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8 gap-2 sm:gap-3">
              <div>
                <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {loading ? 'Loading...' : `${products.length} ${products.length === 1 ? 'Product' : 'Products'}`}
                </p>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-0.5 sm:mt-1">Handcrafted with excellence</p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-white border-2 border-teal-200 rounded-md sm:rounded-lg lg:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 hover:border-teal-300 transition-colors"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
                <option value="name-za">Name: Z to A</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pr-4 sm:pr-6 lg:pr-8">
                <ShimmerLoader variant="product" count={6} className="contents" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 sm:py-20 lg:py-32 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-teal-100 rounded-full mb-3 sm:mb-4 lg:mb-6">
                  <Filter className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-teal-600" />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">No products found</p>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">Try adjusting your filters to find what you're looking for</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pr-4 sm:pr-6 lg:pr-8">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductDetails(true);
                    }}
                    className={`group overflow-hidden ${!design ? 'bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-teal-200 hover:border-teal-400' : cardStyles.container} transition-all cursor-pointer`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      ...cardStyles.style,
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (cardStyles.hoverTransform) {
                        e.currentTarget.style.transform = cardStyles.hoverTransform;
                      } else if (!design) {
                        e.currentTarget.style.transform = 'translateY(-0.5rem)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100" style={cardStyles.imageStyle}>
                      <LazyImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-2 transition-all duration-700"
                      />

                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 flex flex-col gap-1 sm:gap-1.5 lg:gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border sm:border-2 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 ${
                            isFavorite(product.id)
                              ? 'bg-red-50 border-red-300 hover:bg-red-100'
                              : 'bg-white border-teal-300 hover:bg-teal-50'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-all ${
                            isFavorite(product.id)
                              ? 'text-red-500 fill-red-500'
                              : 'text-teal-600'
                          }`} />
                        </button>
                      </div>

                      {product.compare_at_price && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 bg-teal-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-full text-[10px] sm:text-xs font-bold border border-teal-600 sm:border-2">
                          SALE
                        </div>
                      )}

                      {!product.in_stock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-white text-gray-900 px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 rounded-xl sm:rounded-2xl font-bold border-2 border-gray-300 text-xs sm:text-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {product.in_stock && (
                        <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 lg:bottom-4 lg:left-4 lg:right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                          {isInCart(product.id) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCartClick();
                              }}
                              className={`w-full bg-emerald-500 text-white py-2 sm:py-2.5 lg:py-3 ${cardStyles.button} text-xs sm:text-sm lg:text-base font-semibold hover:bg-emerald-600 transition-colors border border-emerald-600 sm:border-2 flex items-center justify-center gap-1.5 sm:gap-2`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                              Go to Cart
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              className={`w-full bg-teal-500 text-white py-2 sm:py-2.5 lg:py-3 ${cardStyles.button} text-xs sm:text-sm lg:text-base font-semibold hover:bg-teal-600 transition-colors border border-teal-600 sm:border-2 flex items-center justify-center gap-1.5 sm:gap-2`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                              Add to Cart
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4 lg:p-6">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 mb-2 sm:mb-3 lg:mb-4 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="flex flex-col pt-2 sm:pt-3 lg:pt-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <div className="flex items-baseline gap-1 sm:gap-1.5">
                            <span className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">
                              ₹{product.price.toFixed(2)}
                            </span>
                            {product.compare_at_price && (
                              <span className="text-[10px] sm:text-xs lg:text-sm text-gray-400 line-through">
                                ₹{product.compare_at_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {product.compare_at_price && (
                            <span className="text-[10px] sm:text-xs font-bold text-teal-600 bg-teal-50 px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                              Save ₹{(product.compare_at_price - product.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {taxSettings?.is_enabled && taxSettings?.include_in_price && (
                          <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1">
                            Inclusive of {taxSettings.tax_label} {taxSettings.tax_percentage}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <EnquiryModal isOpen={showEnquiryModal} onClose={() => setShowEnquiryModal(false)} />
      <ProductDetailsSheet
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('product')) {
            window.history.pushState({}, '', '/shop');
          }
        }}
        onCartClick={onCartClick}
      />
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        showInStock={showInStock}
        showOnSale={showOnSale}
        onInStockChange={setShowInStock}
        onOnSaleChange={setShowOnSale}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

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
