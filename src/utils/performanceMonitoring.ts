/**
 * Performance monitoring utilities
 * Track and log performance metrics for optimization
 */

interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  // Only run in production to avoid noise in development
  if (import.meta.env.DEV) return;

  // Log page load performance using modern Navigation Timing API (Level 2)
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        const pageLoadTime = nav.loadEventEnd - nav.startTime;
        const connectTime = nav.responseEnd - nav.requestStart;
        const renderTime = nav.domComplete - nav.domInteractive;

        // Send to analytics if needed
        logPerformanceMetric('page_load', pageLoadTime);
      }
    }, 0);
  });

  // Monitor Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        console.log('LCP:', lcp);
        logPerformanceMetric('lcp', lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          console.log('FID:', fid);
          logPerformanceMetric('fid', fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        console.log('CLS:', clsScore);
        logPerformanceMetric('cls', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }
}

/**
 * Log performance metric (can be extended to send to analytics service)
 */
function logPerformanceMetric(metricName: string, value: number) {
  // In production, send to your analytics service
  if (import.meta.env.PROD) {
    // Example: analytics.track(metricName, value);
  }
}

/**
 * Measure custom performance marks
 */
export function measurePerformance(markName: string, startMark: string, endMark: string) {
  try {
    performance.measure(markName, startMark, endMark);
    const measure = performance.getEntriesByName(markName)[0];
    console.log(`${markName}: ${measure.duration.toFixed(2)}ms`);
    return measure.duration;
  } catch (e) {
    console.warn('Performance measurement failed:', e);
    return 0;
  }
}

/**
 * Create a performance mark
 */
export function markPerformance(markName: string) {
  try {
    performance.mark(markName);
  } catch (e) {
    console.warn('Performance mark failed:', e);
  }
}

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    };
  }
  return null;
}

/**
 * Log slow components for debugging
 */
export function logSlowComponent(componentName: string, renderTime: number) {
  if (renderTime > 16) { // Slower than 60fps
    console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
  }
}

/**
 * Detect and log long tasks
 */
export function monitorLongTasks() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', {
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks API not supported
    }
  }
}
