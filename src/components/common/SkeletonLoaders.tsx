import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

// Content Extraction Skeleton
export function ExtractionSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Extrahiere Content...</span>
          <span className="text-muted-foreground">45%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary/50 rounded-full animate-progress" style={{ width: '45%' }} />
        </div>
      </div>
    </div>
  );
}

// Post Generation Skeleton
export function PostGenerationSkeleton({ platform }: { platform: string }) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Platform-specific animation overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-6xl animate-bounce opacity-20">
          {platform === 'linkedin' && '💼'}
          {platform === 'x' && '🐦'}
          {platform === 'instagram' && '📸'}
        </div>
      </div>
    </div>
  );
}

// Post Card Skeleton
export function PostCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Platform Selector Skeleton
export function PlatformSelectorSkeleton() {
  return (
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// Enhanced Loading States with Messages
interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  className?: string;
}

export function ExtractingContent({
  message = "Analysiere Content...",
  subMessage = "Dies kann bis zu 30 Sekunden dauern",
  progress,
  className
}: LoadingStateProps) {
  const steps = [
    "Lade Webseite...",
    "Extrahiere Hauptinhalt...",
    "Bereinige Formatierung...",
    "Optimiere für KI-Verarbeitung..."
  ];

  const currentStep = progress ? Math.floor((progress / 100) * steps.length) : 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-lg font-semibold">{message}</h3>
        <p className="text-sm text-muted-foreground">{subMessage}</p>
      </div>

      {/* Step Progress */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 text-sm",
              index <= currentStep ? "text-foreground" : "text-muted-foreground/50"
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full",
              index < currentStep ? "bg-primary" :
              index === currentStep ? "bg-primary animate-pulse" : "bg-muted"
            )} />
            <span>{step}</span>
          </div>
        ))}
      </div>

      {progress !== undefined && (
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">{progress}%</p>
        </div>
      )}
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  x: '#000000',
  instagram: '#833AB4',
};

const PLATFORM_EMOJIS: Record<string, string> = {
  linkedin: '\uD83D\uDCBC',
  x: '\uD83D\uDC26',
  instagram: '\uD83D\uDCF8',
};

export function GeneratingPosts({
  platform,
  message = "Generiere Posts...",
  subMessage,
  className
}: LoadingStateProps & { platform?: string }) {
  const color = platform ? PLATFORM_COLORS[platform] : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center space-y-2">
        <div
          className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full relative", !color && "bg-primary/10")}
          style={color ? { backgroundColor: `${color}15` } : undefined}
        >
          {platform && (
            <span className="absolute text-3xl animate-pulse">
              {PLATFORM_EMOJIS[platform]}
            </span>
          )}
          <div
            className={cn("w-16 h-16 border-3 rounded-full animate-spin", !color && "border-primary/30 border-t-primary")}
            style={color ? { borderColor: `${color}30`, borderTopColor: color } : undefined}
          />
        </div>
        <h3 className="text-lg font-semibold">{message}</h3>
        {subMessage && (
          <p className="text-sm text-muted-foreground">{subMessage}</p>
        )}
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("w-2 h-2 rounded-full animate-bounce", !color && "bg-primary")}
            style={{
              backgroundColor: color || undefined,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function PlatformPreviewSkeleton({ platform }: { platform?: string }) {
  const color = platform ? PLATFORM_COLORS[platform] : '#e5e7eb';

  return (
    <div
      className="rounded-lg border bg-white p-4 space-y-3"
      style={{ borderLeftWidth: '3px', borderLeftColor: color }}
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-4/6" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>

      {/* Footer skeleton */}
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}