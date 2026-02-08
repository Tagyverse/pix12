import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function LazyImage({ src, alt, className = '', onClick }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');

  // Generate optimized image URLs
  const getOptimizedSrc = (originalSrc: string) => {
    // For external URLs with query params support, add optimization
    if (originalSrc.includes('unsplash.com') || originalSrc.includes('pexels.com')) {
      const separator = originalSrc.includes('?') ? '&' : '?';
      return `${originalSrc}${separator}auto=format&fit=crop&w=800&q=75`;
    }
    return originalSrc;
  };

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setImageSrc(getOptimizedSrc(src));
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before coming into view
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <div
      ref={imgRef}
      className={`${className} relative overflow-hidden`}
      onClick={onClick}
      style={{ minHeight: '100px', backgroundColor: '#f3f4f6' }}
    >
      {/* Shimmer loading effect */}
      {!isLoaded && isInView && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]" />
      )}

      {/* Error placeholder */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !error && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} transition-all duration-700 ease-out ${
            !isLoaded
              ? 'opacity-0 scale-95 blur-lg'
              : 'opacity-100 scale-100 blur-0'
          }`}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
