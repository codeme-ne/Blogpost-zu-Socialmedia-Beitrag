import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { Platform } from '@/config/platforms';

interface CharacterCounterProps {
  value: string;
  platform?: Platform;
  maxLength?: number;
  showWarnings?: boolean;
  className?: string;
  position?: 'inline' | 'floating';
  onChange?: (value: string) => void; // Optional, not used in display-only mode
}

// Platform-specific character limits
const PLATFORM_LIMITS: Record<Platform, { ideal: number; max: number }> = {
  linkedin: { ideal: 1300, max: 3000 },
  x: { ideal: 280, max: 280 },
  instagram: { ideal: 125, max: 2200 },
};

export function CharacterCounter({
  value,
  platform,
  maxLength,
  showWarnings = true,
  className,
  position = 'inline',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange: _onChange,
}: CharacterCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine the actual limit
  const limit = useMemo(() => {
    if (maxLength) return { ideal: maxLength * 0.8, max: maxLength };
    if (platform) return PLATFORM_LIMITS[platform];
    return { ideal: 500, max: 1000 }; // Default limits
  }, [platform, maxLength]);

  const charCount = value.length;
  const percentage = (charCount / limit.max) * 100;

  // Determine status
  const status = useMemo(() => {
    if (charCount === 0) return 'empty';
    if (charCount > limit.max) return 'exceeded';
    if (charCount > limit.max * 0.95) return 'critical';
    if (charCount > limit.max * 0.8) return 'warning';
    if (charCount <= limit.ideal) return 'ideal';
    return 'good';
  }, [charCount, limit]);

  // Trigger animation on significant changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [status]);

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'exceeded': return 'text-red-500 border-red-500';
      case 'critical': return 'text-red-400 border-red-400';
      case 'warning': return 'text-yellow-500 border-yellow-500';
      case 'ideal': return 'text-green-500 border-green-500';
      case 'good': return 'text-blue-500 border-blue-500';
      default: return 'text-muted-foreground border-muted';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'exceeded':
      case 'critical':
        return <AlertTriangle className="h-3 w-3" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3" />;
      case 'ideal':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (status === 'exceeded') {
      return `${charCount - limit.max} characters over limit`;
    }
    if (status === 'critical') {
      return `${limit.max - charCount} characters left`;
    }
    if (status === 'warning') {
      return 'Approaching limit';
    }
    if (status === 'ideal') {
      return 'Perfect length';
    }
    if (charCount === 0) {
      return 'Start typing...';
    }
    return `${limit.max - charCount} available`;
  };

  // Inline counter component
  const InlineCounter = () => (
    <div className={cn(
      "flex items-center gap-2 text-sm transition-all duration-300",
      getStatusColor(),
      isAnimating && "scale-105",
      className
    )}>
      {/* Character count */}
      <span className="font-mono font-medium">
        {charCount}/{limit.max}
      </span>

      {/* Status icon */}
      {showWarnings && getStatusIcon()}

      {/* Status message */}
      {showWarnings && (
        <span className="text-xs">
          {getStatusMessage()}
        </span>
      )}

      {/* Platform indicator */}
      {platform && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
          {platform}
        </span>
      )}
    </div>
  );

  // Floating counter component
  const FloatingCounter = () => (
    <div className={cn(
      "fixed bottom-4 right-4 z-40",
      "px-3 py-2 rounded-lg shadow-lg",
      "bg-background border-2",
      "transition-all duration-300",
      getStatusColor(),
      isAnimating && "scale-105",
      className
    )}>
      <div className="flex items-center gap-3">
        {/* Progress ring */}
        <div className="relative w-10 h-10">
          <svg className="transform -rotate-90 w-10 h-10">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.2"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${percentage} ${100 - percentage}`}
              strokeDashoffset="25"
              className="transition-all duration-300"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Count and status */}
        <div>
          <div className="font-mono text-sm font-medium">
            {charCount}/{limit.max}
          </div>
          <div className="text-xs opacity-80">
            {getStatusMessage()}
          </div>
        </div>

        {/* Icon */}
        {showWarnings && (
          <div className="ml-2">
            {getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );

  return position === 'floating' ? <FloatingCounter /> : <InlineCounter />;
}

// Character counter with textarea integration
interface CharacterCounterTextareaProps extends CharacterCounterProps {
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function CharacterCounterTextarea({
  value,
  platform,
  maxLength,
  showWarnings = true,
  className,
  placeholder,
  rows = 4,
  disabled = false,
  autoFocus = false,
  onChange,
  onFocus,
  onBlur,
}: CharacterCounterTextareaProps) {
  const limit = maxLength || (platform ? PLATFORM_LIMITS[platform].max : 1000);
  const charCount = value.length;
  const percentage = (charCount / limit) * 100;
  const isOverLimit = charCount > limit;

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={isOverLimit ? undefined : limit}
          className={cn(
            "w-full px-3 py-2 rounded-md border bg-background",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            isOverLimit
              ? "border-red-500 focus:ring-red-500/20"
              : charCount > limit * 0.8
              ? "border-yellow-500 focus:ring-yellow-500/20"
              : "border-input focus:ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        />

        {/* Inline counter in corner */}
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <CharacterCounter
            value={value}
            platform={platform}
            maxLength={maxLength}
            showWarnings={false}
            className="text-xs"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isOverLimit
              ? "bg-red-500"
              : percentage > 80
              ? "bg-yellow-500"
              : percentage > 60
              ? "bg-blue-500"
              : "bg-green-500"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Detailed status */}
      {showWarnings && (
        <CharacterCounter
          value={value}
          platform={platform}
          maxLength={maxLength}
          showWarnings={true}
          className="justify-between"
        />
      )}
    </div>
  );
}

// Hook for character counting logic
export function useCharacterCount(
  value: string,
  limit?: number,
  platform?: Platform
) {
  const actualLimit = limit || (platform ? PLATFORM_LIMITS[platform].max : 1000);
  const charCount = value.length;
  const remaining = actualLimit - charCount;
  const percentage = (charCount / actualLimit) * 100;
  const isOverLimit = charCount > actualLimit;
  const isNearLimit = charCount > actualLimit * 0.8;

  return {
    count: charCount,
    remaining,
    percentage,
    isOverLimit,
    isNearLimit,
    limit: actualLimit,
  };
}