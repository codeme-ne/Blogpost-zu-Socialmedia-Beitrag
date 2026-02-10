import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';
import config from '@/config/app.config';

interface UsageStatus {
  canGenerate: boolean;
  isPremium: boolean;
  used: number;
  limit: number;
  remaining: number;
  isLoading: boolean;
}

/**
 * Unified usage tracking hook that delegates to useSubscription
 * for localStorage tracking (usage_DATE pattern).
 * Provides backward-compatible interface for components using this hook.
 */
export function useUsageTracking() {
  useAuth();
  const { hasAccess, dailyUsage, hasUsageRemaining, decrementUsage, loading: subscriptionLoading } = useSubscription();

  const [usageStatus, setUsageStatus] = useState<UsageStatus>({
    canGenerate: true,
    isPremium: false,
    used: 0,
    limit: config.limits.freeGenerationsPerDay,
    remaining: config.limits.freeGenerationsPerDay,
    isLoading: true,
  });

  // One-time migration: clean up legacy freeGenerationsCount key
  useEffect(() => {
    const legacyKey = 'freeGenerationsCount';
    if (localStorage.getItem(legacyKey) !== null) {
      localStorage.removeItem(legacyKey);
    }
  }, []); // Run once on mount

  // Sync state with useSubscription's daily usage tracking
  useEffect(() => {
    const limit = config.limits.freeGenerationsPerDay;
    const used = dailyUsage;
    const remaining = Math.max(0, limit - used);

    setUsageStatus({
      canGenerate: hasAccess || hasUsageRemaining(),
      isPremium: hasAccess,
      used,
      limit,
      remaining,
      isLoading: subscriptionLoading,
    });
  }, [hasAccess, dailyUsage, hasUsageRemaining, subscriptionLoading]);

  const loadUsageStatus = async () => {
    // Usage is now tracked locally via localStorage (usage_DATE pattern)
    // No server-side RPC needed
    const limit = config.limits.freeGenerationsPerDay;
    const today = new Date().toDateString();
    const used = parseInt(localStorage.getItem(`usage_${today}`) || '0', 10);
    const remaining = Math.max(0, limit - used);

    setUsageStatus({
      canGenerate: hasAccess || remaining > 0,
      isPremium: hasAccess,
      used,
      limit,
      remaining,
      isLoading: false,
    });
  };

  const checkAndIncrementUsage = async (): Promise<boolean> => {
    // Delegate to useSubscription for usage tracking (daily reset pattern)
    if (hasAccess) {
      // Premium users have unlimited access
      return true;
    }

    // Check if free tier has remaining usage
    if (!hasUsageRemaining()) {
      toast.error(
        'Dein kostenloses Limit ist erreicht. Upgrade zu Premium fuer unlimitierte Generierungen.'
      );
      return false;
    }

    // Increment usage counter (using useSubscription's decrementUsage)
    decrementUsage();

    return true;
  };

  const resetLocalUsage = () => {
    // Clean up legacy localStorage key
    localStorage.removeItem('freeGenerationsCount');

    // Reset current day's usage (usage_DATE pattern from useSubscription)
    const today = new Date().toDateString();
    const todayKey = `usage_${today}`;
    localStorage.removeItem(todayKey);

    // Trigger state update
    const limit = config.limits.freeGenerationsPerDay;
    setUsageStatus({
      canGenerate: true,
      isPremium: hasAccess,
      used: 0,
      limit,
      remaining: limit,
      isLoading: false,
    });
  };

  return {
    ...usageStatus,
    checkAndIncrementUsage,
    resetLocalUsage,
    refreshStatus: loadUsageStatus,
  };
}
