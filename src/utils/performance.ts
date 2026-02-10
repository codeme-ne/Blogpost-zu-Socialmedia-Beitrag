import { useEffect, useRef, useState } from 'react';

/**
 * Performance monitoring utilities for tracking UX metrics
 */

// Performance mark names
export const PERF_MARKS = {
  APP_INIT: 'app-init',
  EXTRACTION_START: 'extraction-start',
  EXTRACTION_END: 'extraction-end',
  GENERATION_START: 'generation-start',
  GENERATION_END: 'generation-end',
  FIRST_POST_RENDERED: 'first-post-rendered',
  UI_INTERACTIVE: 'ui-interactive',
} as const;

// Performance measure names
export const PERF_MEASURES = {
  TIME_TO_INTERACTIVE: 'time-to-interactive',
  EXTRACTION_DURATION: 'extraction-duration',
  GENERATION_DURATION: 'generation-duration',
  TIME_TO_FIRST_POST: 'time-to-first-post',
} as const;

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observers: Set<(metrics: Record<string, number>) => void> = new Set();

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if (typeof window === 'undefined' || !window.performance) return;

    try {
      performance.mark(name);

      // Store in our metrics
      this.metrics.set(name, performance.now());

      // Log in development
      if (import.meta.env.DEV) {
        console.log(`[Performance] Mark: ${name} at ${performance.now().toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Performance mark failed:', error);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    try {
      performance.measure(name, startMark, endMark);

      // Get the measure
      const measures = performance.getEntriesByName(name);
      const duration = measures[measures.length - 1]?.duration || 0;

      // Store the measurement
      this.metrics.set(name, duration);

      // Notify observers
      this.notifyObservers();

      // Log in development
      if (import.meta.env.DEV) {
        console.log(`[Performance] Measure: ${name} = ${duration.toFixed(2)}ms`);
      }

      // Send to analytics
      this.sendToAnalytics(name, duration);

      return duration;
    } catch (error) {
      console.error('Performance measure failed:', error);
      return null;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();

    if (typeof window !== 'undefined' && window.performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: Record<string, number>) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify all observers
   */
  private notifyObservers(): void {
    const metrics = this.getMetrics();
    this.observers.forEach(callback => callback(metrics));
  }

  /**
   * Send metrics to analytics service
   */
  public sendToAnalytics(name: string, value: number): void {
    // Send to your analytics service
    const win = window as unknown as Record<string, unknown>;
    if (typeof window !== 'undefined' && win.analytics) {
      (win.analytics as { track: (name: string, data: unknown) => void }).track('Performance Metric', {
        metric: name,
        value,
        timestamp: Date.now(),
      });
    }

    // Google Analytics (if available)
    if (typeof window !== 'undefined' && win.gtag) {
      (win.gtag as (...args: unknown[]) => void)('event', 'timing_complete', {
        name,
        value: Math.round(value),
        event_category: 'Performance',
      });
    }
  }

  /**
   * Track Web Vitals
   */
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.set('fcp', entry.startTime);
          this.sendToAnalytics('FCP', entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('lcp', lastEntry.startTime);
      this.sendToAnalytics('LCP', lastEntry.startTime);
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry) => {
        if ('processingStart' in entry) {
          const fidEntry = entry as PerformanceEntry & { processingStart: number }
          const fid = fidEntry.processingStart - fidEntry.startTime;
          this.metrics.set('fid', fid);
          this.sendToAnalytics('FID', fid);
        }
      });
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Hook to track component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    renderCount.current++;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.current.push(renderTime);
      lastRenderTime.current = renderTime;

      // Log slow renders
      if (renderTime > 16.67) { // More than one frame (60fps)
        console.warn(
          `[Performance] Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }

      // Send metrics after 10 renders
      if (renderCount.current % 10 === 0) {
        const avgRenderTime =
          renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

        perfMonitor.sendToAnalytics(`${componentName}_avg_render`, avgRenderTime);

        // Reset for next batch
        renderTimes.current = [];
      }
    };
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  };
}

/**
 * Hook to track user interaction metrics
 */
export function useInteractionTracking() {
  useEffect(() => {
    let interactionCount = 0;
    let lastInteractionTime = 0;

    const trackInteraction = (event: Event) => {
      const now = performance.now();
      const timeSinceLastInteraction = now - lastInteractionTime;

      interactionCount++;
      lastInteractionTime = now;

      // Track rage clicks (multiple clicks in quick succession)
      if (event.type === 'click' && timeSinceLastInteraction < 500) {
        perfMonitor.sendToAnalytics('rage_click', interactionCount);
      }

      // Send interaction metrics periodically
      if (interactionCount % 50 === 0) {
        perfMonitor.sendToAnalytics('interaction_count', interactionCount);
      }
    };

    // Track various interactions
    document.addEventListener('click', trackInteraction);
    document.addEventListener('input', trackInteraction);
    document.addEventListener('scroll', trackInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('input', trackInteraction);
      document.removeEventListener('scroll', trackInteraction);
    };
  }, []);
}

/**
 * Hook to track API call performance
 */
export function useApiPerformance() {
  const track = (apiName: string) => {
    const startMark = `api_${apiName}_start`;
    const endMark = `api_${apiName}_end`;
    const measureName = `api_${apiName}_duration`;

    return {
      start: () => perfMonitor.mark(startMark),
      end: () => {
        perfMonitor.mark(endMark);
        return perfMonitor.measure(measureName, startMark, endMark);
      },
    };
  };

  return { track };
}

/**
 * Performance dashboard data hook
 */
export function usePerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribe = perfMonitor.subscribe(setMetrics);

    // Start tracking web vitals
    perfMonitor.trackWebVitals();

    return unsubscribe;
  }, []);

  return {
    metrics,
    clear: () => perfMonitor.clear(),
  };
}

// Export singleton for direct use
export default perfMonitor;