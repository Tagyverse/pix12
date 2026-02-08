import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import type { Product } from '../types';
import LazyImage from './LazyImage';
import VirtualTryOn from './VirtualTryOn';
import { objectToArray } from '../utils/publishedData';

interface TryOnProductListProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TryOnProductList({ isOpen, onClose }: TryOnProductListProps) {
  const { data: publishedData } = usePublishedData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  useEffect(() => {
    if (isOpen && publishedData?.products) {
      try {
        const productsArray: Product[] = objectToArray<Product>(publishedData.products);
        const tryOnProducts = productsArray.filter(
          (p: Product) => p.try_on_enabled && p.try_on_image_url && p.in_stock
        );
        setProducts(tryOnProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading try-on products:', error);
        setLoading(false);
      }
    }
  }, [isOpen, publishedData]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowTryOn(true);
  };

  if (!isOpen) return null;

  if (showTryOn && selectedProduct) {
    return (
      <VirtualTryOn
        product={selectedProduct}
        onClose={() => {
          setShowTryOn(false);
          setSelectedProduct(null);
        }}
        onBack={() => setShowTryOn(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Virtual Try-On</h2>
              <p className="text-purple-100 text-sm">See how it looks on you!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products available for virtual try-on</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all"
                >
                  <LazyImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-purple-600 font-bold">₹{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
