import { useEffect, useState } from 'react';

// Feature flag names
export const FEATURE_FLAGS = {
  NEW_UX: 'VITE_ENABLE_NEW_UX',
  MOBILE_BOTTOM_SHEET: 'VITE_ENABLE_MOBILE_BOTTOM_SHEET',
  PLATFORM_ANIMATIONS: 'VITE_ENABLE_PLATFORM_ANIMATIONS',
  PREMIUM_FEATURES: 'VITE_ENABLE_PREMIUM_FEATURES',
} as const;

type FeatureFlagName = keyof typeof FEATURE_FLAGS;

// Analytics event types
interface FeatureFlagEvent {
  flag: string;
  enabled: boolean;
  variant?: string;
  userId?: string;
  timestamp: number;
}

// Feature flag configuration
interface FeatureFlagConfig {
  defaultValue?: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  analyticsEnabled?: boolean;
}

/**
 * Hook to manage feature flags with A/B testing support
 */
export function useFeatureFlag(
  flagName: FeatureFlagName | string,
  config: FeatureFlagConfig = {}
): boolean {
  const {
    defaultValue = false,
    rolloutPercentage,
    userGroups = [],
    analyticsEnabled = true,
  } = config;

  const [isEnabled] = useState<boolean>(() => {
    // Get the actual env variable name
    const envVarName = typeof flagName === 'string'
      ? flagName
      : FEATURE_FLAGS[flagName];

    // Check environment variable
    const envValue = import.meta.env[envVarName];

    if (envValue !== undefined) {
      return envValue === 'true' || envValue === true;
    }

    // Check localStorage override (for testing)
    try {
      const localOverride = localStorage.getItem(`feature_${envVarName}`);
      if (localOverride !== null) {
        return localOverride === 'true';
      }
    } catch {
      // localStorage unavailable (Safari private mode)
    }

    // Check rollout percentage if specified
    if (rolloutPercentage !== undefined) {
      const userHash = getUserHash();
      const threshold = rolloutPercentage / 100;
      return userHash < threshold;
    }

    // Check user groups if specified
    if (userGroups.length > 0) {
      const currentUserGroup = getCurrentUserGroup();
      return userGroups.includes(currentUserGroup);
    }

    return defaultValue;
  });

  // Track feature flag usage
  useEffect(() => {
    if (analyticsEnabled) {
      trackFeatureFlagUsage({
        flag: typeof flagName === 'string' ? flagName : FEATURE_FLAGS[flagName],
        enabled: isEnabled,
        timestamp: Date.now(),
      });
    }
  }, [flagName, isEnabled, analyticsEnabled]);

  return isEnabled;
}

/**
 * Hook to get all active feature flags
 */
export function useActiveFeatureFlags(): string[] {
  const [activeFlags, setActiveFlags] = useState<string[]>([]);

  useEffect(() => {
    const flags: string[] = [];

    Object.entries(FEATURE_FLAGS).forEach(([key, envVar]) => {
      const value = import.meta.env[envVar];
      let localOverride: string | null = null;
      try {
        localOverride = localStorage.getItem(`feature_${envVar}`);
      } catch {
        // localStorage unavailable
      }

      if (value === 'true' || value === true || localOverride === 'true') {
        flags.push(key);
      }
    });

    setActiveFlags(flags);
  }, []);

  return activeFlags;
}

/**
 * Hook for A/B testing with variants
 */
export function useABTest<T extends string>(
  testName: string,
  variants: T[],
  config: {
    defaultVariant: T;
    weights?: number[];
    analyticsEnabled?: boolean;
  }
): T {
  const { defaultVariant, weights, analyticsEnabled = true } = config;

  const [variant] = useState<T>(() => {
    // Check for override in localStorage
    try {
      const override = localStorage.getItem(`ab_test_${testName}`);
      if (override && variants.includes(override as T)) {
        return override as T;
      }
    } catch {
      // localStorage unavailable
    }

    // Check URL parameter override
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get(`ab_${testName}`);
    if (urlVariant && variants.includes(urlVariant as T)) {
      return urlVariant as T;
    }

    // Assign variant based on weights
    if (weights && weights.length === variants.length) {
      const random = getUserHash();
      let cumulative = 0;

      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
          return variants[i];
        }
      }
    }

    // Equal distribution if no weights specified
    const index = Math.floor(getUserHash() * variants.length);
    return variants[index] || defaultVariant;
  });

  // Track A/B test assignment
  useEffect(() => {
    if (analyticsEnabled) {
      trackABTestAssignment(testName, variant);
    }
  }, [testName, variant, analyticsEnabled]);

  return variant;
}

// Utility functions

/**
 * Generate consistent user hash for feature flag rollout
 */
function getUserHash(): number {
  const userId = getUserId();
  let hash = 0;

  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Normalize to 0-1 range
  return Math.abs(hash) / 2147483647;
}

/**
 * Get or generate user ID for consistent feature flag assignment
 */
function getUserId(): string {
  try {
    const storedId = localStorage.getItem('feature_flag_user_id');
    if (storedId) {
      return storedId;
    }
    const newId = generateUserId();
    localStorage.setItem('feature_flag_user_id', newId);
    return newId;
  } catch {
    // localStorage unavailable (Safari private mode) - return ephemeral ID
    return generateUserId();
  }
}

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current user group (can be extended based on your user system)
 */
function getCurrentUserGroup(): string {
  try {
    const userEmail = localStorage.getItem('user_email');
    if (userEmail?.includes('@admin')) return 'admin';
    if (userEmail?.includes('@beta')) return 'beta';
  } catch {
    // localStorage unavailable
  }
  return 'default';
}

/**
 * Track feature flag usage for analytics
 */
function trackFeatureFlagUsage(event: FeatureFlagEvent): void {
  // Send to your analytics service
  const win = window as unknown as Record<string, unknown>;
  if (typeof window !== 'undefined' && win.analytics) {
    (win.analytics as { track: (name: string, data: unknown) => void }).track('Feature Flag Used', event);
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Feature Flag]', event);
  }
}

/**
 * Track A/B test assignment
 */
function trackABTestAssignment(testName: string, variant: string): void {
  // Send to your analytics service
  const win = window as unknown as Record<string, unknown>;
  if (typeof window !== 'undefined' && win.analytics) {
    (win.analytics as { track: (name: string, data: unknown) => void }).track('A/B Test Assignment', {
      test: testName,
      variant,
      timestamp: Date.now(),
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[A/B Test]', testName, '→', variant);
  }
}

/**
 * Override feature flag for testing (development only)
 */
export function overrideFeatureFlag(
  flagName: FeatureFlagName | string,
  enabled: boolean
): void {
  if (!import.meta.env.DEV) {
    console.warn('Feature flag override is only available in development');
    return;
  }

  const envVarName = typeof flagName === 'string'
    ? flagName
    : FEATURE_FLAGS[flagName];

  localStorage.setItem(`feature_${envVarName}`, String(enabled));

  // Trigger re-render
  window.dispatchEvent(new Event('feature-flag-change'));
}