/**
 * Performance Optimization Utilities
 * Monitors Core Web Vitals, optimizes rendering, and manages resource loading
 */

// Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS = {
  LCP: 2500,    // Largest Contentful Paint (milliseconds)
  FID: 100,     // First Input Delay (milliseconds)
  CLS: 0.1,     // Cumulative Layout Shift
  TTFB: 600,    // Time to First Byte (milliseconds)
  FCP: 1800,    // First Contentful Paint (milliseconds)
};

// Monitor Core Web Vitals
export const monitorWebVitals = () => {
  const vitals: any = {};

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
        console.log('[Performance] LCP:', vitals.LCP);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.log('[Performance] LCP monitoring not available');
    }

    // CLS - Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            vitals.CLS = (vitals.CLS || 0) + entry.value;
            console.log('[Performance] CLS:', vitals.CLS);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.log('[Performance] CLS monitoring not available');
    }

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          vitals.FCP = fcpEntry.startTime;
          console.log('[Performance] FCP:', vitals.FCP);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.log('[Performance] FCP monitoring not available');
    }
  }

  // Navigation timing using modern Navigation Timing API (Level 2)
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const nav = navEntries[0];
          vitals.TTFB = nav.responseStart - nav.startTime;
          vitals.domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime;
          vitals.pageLoadTime = nav.loadEventEnd - nav.startTime;
        }
      }, 0);
    });
  }

  return vitals;
};

// Request Idle Callback polyfill and implementation
export const requestIdleCallback = (callback: () => void, options?: { timeout?: number }) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  const start = Date.now();
  return setTimeout(() => {
    callback();
  }, 1);
};

// Defer non-critical scripts
export const deferScript = (src: string, delay: number = 3000) => {
  setTimeout(() => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  }, delay);
};

// Progressive image loading
export const progressiveLoad = (
  element: HTMLImageElement,
  fullResUrl: string,
  onLoad?: () => void
) => {
  const img = new Image();
  
  img.onload = () => {
    element.src = fullResUrl;
    element.classList.add('loaded');
    onLoad?.();
  };

  img.src = fullResUrl;
};

// Optimize LCP (Largest Contentful Paint)
export const optimizeLCP = () => {
  // Preload hero images
  const heroImage = document.querySelector('img[data-lcp]') as HTMLImageElement;
  if (heroImage) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroImage.src;
    link.imagesrcset = heroImage.srcset;
    document.head.appendChild(link);
  }
};

// Batch DOM operations to prevent layout thrashing
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Lazy load components with Intersection Observer
export const createLazyComponent = (element: Element, callback: () => void) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(element);
  return observer;
};

// Debounce function for resize/scroll events
export const debounce = (func: Function, delay: number = 200) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function for frequent events
export const throttle = (func: Function, limit: number = 300) => {
  let inThrottle: boolean;
  
  return (...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Cache API responses to reduce network calls
export const cacheResponse = (url: string, data: any, ttl: number = 3600000) => {
  const cache = {
    data,
    timestamp: Date.now(),
    ttl
  };
  localStorage.setItem(`cache_${url}`, JSON.stringify(cache));
};

// Get cached response if still valid
export const getCachedResponse = (url: string) => {
  const cached = localStorage.getItem(`cache_${url}`);
  if (!cached) return null;

  const { data, timestamp, ttl } = JSON.parse(cached);
  if (Date.now() - timestamp > ttl) {
    localStorage.removeItem(`cache_${url}`);
    return null;
  }

  return data;
};

// Monitor resource timing
export const getResourceMetrics = () => {
  if (!('performance' in window)) return null;

  const perfData = performance.getEntriesByType('resource');
  return {
    totalResources: perfData.length,
    avgDuration: perfData.reduce((sum, r) => sum + r.duration, 0) / perfData.length,
    totalSize: perfData.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    slowestResources: perfData
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(r => ({ name: r.name, duration: r.duration }))
  };
};

// Enable smooth scrolling with GPU acceleration
export const enableGPUAcceleration = () => {
  const style = document.createElement('style');
  style.textContent = `
    html {
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    body, main, section {
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    img, video {
      will-change: auto;
    }
  `;
  document.head.appendChild(style);
};

// Optimize animations with reduced motion support
export const respectReducedMotion = () => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (mediaQuery.matches) {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
  }
};

export default {
  monitorWebVitals,
  requestIdleCallback,
  deferScript,
  progressiveLoad,
  optimizeLCP,
  batchDOMUpdates,
  createLazyComponent,
  debounce,
  throttle,
  cacheResponse,
  getCachedResponse,
  getResourceMetrics,
  enableGPUAcceleration,
  respectReducedMotion
};
