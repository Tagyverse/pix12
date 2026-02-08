import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Sparkles, CheckCircle, AlertCircle, Loader, Camera, Image as ImageIcon } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { objectToArray } from '../utils/publishedData';
import type { Product } from '../types';
import LazyImage from './LazyImage';

interface DressColorMatcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct?: Product;
}

interface ColorInfo {
  hex: string;
  name: string;
  percentage: number;
}

interface MatchedProduct {
  product: Product;
  matchPercentage: number;
  matchingColors: string[];
}

const colorMap: { [key: string]: string } = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#6B7280',
  grey: '#6B7280',
  pink: '#EC4899',
  purple: '#A855F7',
  orange: '#F97316',
  brown: '#92400E',
  navy: '#1E3A8A',
  beige: '#D4C5B9',
  cream: '#FFFDD0',
  maroon: '#800000',
  gold: '#FFD700',
  silver: '#C0C0C0',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  indigo: '#6366F1',
};

const getColorName = (hex: string): string => {
  const distances = Object.entries(colorMap).map(([name, colorHex]) => {
    const r1 = parseInt(hex.substring(1, 3), 16);
    const g1 = parseInt(hex.substring(3, 5), 16);
    const b1 = parseInt(hex.substring(5, 7), 16);

    const r2 = parseInt(colorHex.substring(1, 3), 16);
    const g2 = parseInt(colorHex.substring(3, 5), 16);
    const b2 = parseInt(colorHex.substring(5, 7), 16);

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    return { name, distance };
  });

  distances.sort((a, b) => a.distance - b.distance);
  return distances[0].name;
};

export default function DressColorMatcher({ isOpen, onClose, currentProduct }: DressColorMatcherProps) {
  const { data: publishedData } = usePublishedData();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedColors, setDetectedColors] = useState<ColorInfo[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUploadedImage(null);
      setDetectedColors([]);
      setMatchedProducts([]);
      setError(null);
      setStep('upload');
    }
  }, [isOpen]);

  const extractColorsFromImage = (imageElement: HTMLImageElement): ColorInfo[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];

    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const focusWidth = Math.floor(canvas.width * 0.7);
    const focusHeight = Math.floor(canvas.height * 0.7);
    const startX = Math.floor(centerX - focusWidth / 2);
    const startY = Math.floor(centerY - focusHeight / 2);

    const imageData = ctx.getImageData(startX, startY, focusWidth, focusHeight);
    const pixels = imageData.data;
    const colorCounts: { [key: string]: number } = {};
    let validPixelCount = 0;

    const edgeThreshold = 20;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 200) continue;

      const pixelIndex = i / 4;
      const x = pixelIndex % focusWidth;
      const y = Math.floor(pixelIndex / focusWidth);

      if (x < edgeThreshold || x > focusWidth - edgeThreshold ||
          y < edgeThreshold || y > focusHeight - edgeThreshold) {
        continue;
      }

      const brightness = (r + g + b) / 3;
      if (brightness > 235 || brightness < 20) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      if (saturation < 0.15) continue;

      const roundedR = Math.round(r / 10) * 10;
      const roundedG = Math.round(g / 10) * 10;
      const roundedB = Math.round(b / 10) * 10;
      const hex = `#${((1 << 24) + (roundedR << 16) + (roundedG << 8) + roundedB).toString(16).slice(1).toUpperCase()}`;

      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      validPixelCount++;
    }

    const sortedColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hex, count]) => ({
        hex,
        name: getColorName(hex),
        percentage: Math.round((count / validPixelCount) * 100 * 100) / 100
      }))
      .filter(color => color.percentage > 2);

    return sortedColors;
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          const colors = extractColorsFromImage(img);
          setDetectedColors(colors);
          await matchProductsByColors(colors);
          setIsProcessing(false);
          setStep('results');
        };
        img.onerror = () => {
          setError('Failed to process image. Please try another one.');
          setIsProcessing(false);
          setStep('upload');
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
      setIsProcessing(false);
      setStep('upload');
    }
  };

  const matchProductsByColors = async (colors: ColorInfo[]) => {
    try {
      const productsRef = ref(db, 'products');
      const snapshot = await get(productsRef);

      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const allProducts = Object.entries(data)
        .map(([id, prod]: [string, any]) => ({
          id,
          ...prod,
        }))
        .filter((p: Product) => {
          if (!p.in_stock || p.isVisible === false || !p.availableColors || p.availableColors.length === 0) {
            return false;
          }

          if (currentProduct && p.id === currentProduct.id) {
            return false;
          }

          if (currentProduct) {
            const hasMatchingCategory = p.category === currentProduct.category;
            const hasMatchingSubcategory = p.subcategory === currentProduct.subcategory;
            return hasMatchingCategory || hasMatchingSubcategory;
          }

          return true;
        });

      const detectedColorNames = colors.map(c => c.name.toLowerCase());

      const matches: MatchedProduct[] = [];

      for (const product of allProducts) {
        const productColors = (product.availableColors || []).map(c => c.toLowerCase());
        const matchingColors = productColors.filter(pc =>
          detectedColorNames.includes(pc)
        );

        if (matchingColors.length > 0) {
          const matchPercentage = Math.round((matchingColors.length / productColors.length) * 100);
          matches.push({
            product,
            matchPercentage,
            matchingColors
          });
        }
      }

      matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setMatchedProducts(matches.slice(0, 10));
    } catch (err) {
      console.error('Error matching products:', err);
      setError('Failed to find matching products');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden border-4 border-black">
        <div className="bg-[#B5E5CF] p-4 md:p-6 flex items-center justify-between border-b-4 border-black rounded-t-3xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-black">
              <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-black" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-black">Dress Color Matcher</h2>
              <p className="text-black text-xs md:text-sm font-medium hidden sm:block">Find accessories that match your dress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200 border-2 border-black hover:scale-110 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-5rem)] md:max-h-[calc(90vh-8rem)] p-4 md:p-6 bg-white">
          {step === 'upload' && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center">
                <p className="text-sm md:text-base text-black font-medium mb-4 md:mb-6">
                  {currentProduct
                    ? `Upload a photo of your dress to find ${currentProduct.category || 'products'} with matching colors`
                    : 'Upload a photo of your dress to find accessories with matching colors'
                  }
                </p>
              </div>

              <div
                className="border-4 border-dashed border-black rounded-2xl p-8 md:p-12 text-center hover:bg-[#B5E5CF] transition-all duration-300 cursor-pointer bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <div className="bg-[#B5E5CF] rounded-2xl p-4 md:p-6 border-2 border-black">
                    <Upload className="w-10 h-10 md:w-12 md:h-12 text-black" />
                  </div>
                  <div>
                    <p className="text-base md:text-lg font-bold text-black mb-1 md:mb-2">
                      Click to upload your dress photo
                    </p>
                    <p className="text-xs md:text-sm text-black font-medium">
                      Supports JPG, PNG, WebP (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-24 h-24 border-8 border-[#B5E5CF] border-t-black rounded-full animate-spin"></div>
                <Sparkles className="w-8 h-8 text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xl font-bold text-black mt-6">Analyzing colors...</p>
              <p className="text-black font-medium mt-2">This will only take a moment</p>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-black mb-2 md:mb-3">Your Dress</h3>
                  {uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt="Uploaded dress"
                      className="w-full rounded-xl shadow-lg border-2 border-black"
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-bold text-black mb-2 md:mb-3">Detected Colors</h3>
                  <div className="space-y-2 md:space-y-3">
                    {detectedColors.map((color, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-[#B5E5CF] rounded-xl p-3 border-2 border-black"
                      >
                        <div
                          className="w-12 h-12 rounded-lg shadow-md border-2 border-black"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-black capitalize">{color.name}</p>
                          <p className="text-sm text-black font-medium">{color.hex}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">{color.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-bold text-black mb-3 md:mb-4">
                  Matching Products ({matchedProducts.length})
                </h3>

                {matchedProducts.length === 0 ? (
                  <div className="bg-[#B5E5CF] border-4 border-black rounded-2xl p-4 md:p-6 text-center">
                    <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-black mx-auto mb-2 md:mb-3" />
                    <p className="text-sm md:text-base text-black font-bold">No matching products found</p>
                    <p className="text-xs md:text-sm text-black font-medium mt-1 md:mt-2">
                      Try uploading a different photo or explore our full catalog
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {matchedProducts.map(({ product, matchPercentage, matchingColors }) => (
                      <div
                        key={product.id}
                        className={`bg-white border-4 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 ${
                          matchPercentage >= 80
                            ? 'border-black shadow-lg'
                            : 'border-black'
                        }`}
                      >
                        <div className="relative">
                          <LazyImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />

                          <div className="absolute top-2 left-2 flex flex-col gap-2">
                            <div className="bg-[#B5E5CF] text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border-2 border-black">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Dress Match
                            </div>
                            {matchPercentage >= 80 && (
                              <div className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse border-2 border-white">
                                <Sparkles className="w-3.5 h-3.5" />
                                Wow Match!
                              </div>
                            )}
                          </div>

                          <div className="absolute top-2 right-2 bg-black text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg border-2 border-white">
                            {matchPercentage}% Match
                          </div>
                        </div>
                        <div className="p-4 bg-[#B5E5CF]">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-black line-clamp-2 flex-1">{product.name}</h4>
                          </div>
                          <p className="text-lg font-bold text-black mb-2">₹{product.price}</p>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-black">Matching Colors:</p>
                            <div className="flex flex-wrap gap-1">
                              {matchingColors.map((color, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white text-black px-2 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 border-2 border-black"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {color}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('upload');
                    setUploadedImage(null);
                    setDetectedColors([]);
                    setMatchedProducts([]);
                  }}
                  className="flex-1 bg-white text-black py-3 px-6 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 border-2 border-gray-300 hover:border-black"
                >
                  Try Another Photo
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-[#B5E5CF] text-black py-3 px-6 rounded-xl font-bold hover:bg-white transition-all duration-200 border-2 border-black"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
