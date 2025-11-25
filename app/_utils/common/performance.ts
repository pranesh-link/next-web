/**
 * Performance monitoring utilities
 * Use these to track performance improvements in production
 */

export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;

  // Measure Core Web Vitals
  if ('web-vital' in window) {
    return;
  }

  // First Contentful Paint (FCP)
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  
  if (fcp) {
    console.log(`FCP: ${fcp.startTime.toFixed(2)}ms`);
  }

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // Cumulative Layout Shift (CLS)
  let clsScore = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      if (!entry.hadRecentInput) {
        clsScore += entry.value;
      }
    }
    console.log(`CLS: ${clsScore.toFixed(4)}`);
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }

  // Time to Interactive (TTI)
  if (performance.timing) {
    const tti = performance.timing.domInteractive - performance.timing.navigationStart;
    console.log(`TTI: ${tti}ms`);
  }
};

export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    console.log(`[API] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[API ERROR] ${name}: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

export const preloadCriticalAssets = (urls: string[]) => {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    // Determine asset type
    if (url.match(/\.(woff2|woff|ttf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (url.match(/\.(jpg|jpeg|png|webp|avif|gif)$/)) {
      link.as = 'image';
    } else if (url.match(/\.css$/)) {
      link.as = 'style';
    } else if (url.match(/\.js$/)) {
      link.as = 'script';
    }
    
    link.href = url;
    document.head.appendChild(link);
  });
};

// Report performance metrics to analytics
export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics endpoint
    console.log(metric);
    
    // Example: Send to custom analytics
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    // });
  }
};
