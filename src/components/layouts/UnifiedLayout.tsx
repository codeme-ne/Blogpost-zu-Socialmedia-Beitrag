import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface UnifiedLayoutProps {
  header?: ReactNode;
  inputArea: ReactNode;
  outputArea: ReactNode;
  savedPostsArea?: ReactNode;
  className?: string;
  children?: ReactNode;
  /** Callback when mobile tab changes (for smart flow auto-switching) */
  onMobileTabChange?: (tab: MobileTab) => void;
  /** Externally controlled mobile tab (for smart flow) */
  activeTab?: MobileTab;
}

export type MobileTab = 'input' | 'output' | 'saved';
type LayoutMode = 'three-column' | 'mobile-tabs';

// Layout Context
interface LayoutContextValue {
  mode: LayoutMode;
  isMobile: boolean;
  isDesktop: boolean;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within UnifiedLayout');
  }
  return context;
}

export function UnifiedLayout({
  header,
  inputArea,
  outputArea,
  savedPostsArea,
  className,
  children,
  onMobileTabChange,
  activeTab,
}: UnifiedLayoutProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'three-column' : 'mobile-tabs'
  );
  const [mobileTab, setMobileTabInternal] = useState<MobileTab>('input');

  // Sync external tab control
  useEffect(() => {
    if (activeTab) {
      setMobileTabInternal(activeTab);
    }
  }, [activeTab]);

  const setMobileTab = (tab: MobileTab) => {
    setMobileTabInternal(tab);
    onMobileTabChange?.(tab);
  };

  // Determine layout mode based on viewport
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setLayoutMode(window.innerWidth >= 1024 ? 'three-column' : 'mobile-tabs');
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const contextValue: LayoutContextValue = {
    mode: layoutMode,
    isMobile: layoutMode === 'mobile-tabs',
    isDesktop: layoutMode === 'three-column',
    mobileTab,
    setMobileTab,
  };

  // Desktop: Three-column layout (>=1024px)
  if (layoutMode === 'three-column') {
    return (
      <LayoutContext.Provider value={contextValue}>
        <div className={cn('min-h-screen bg-background', className)}>
          {/* Header */}
          {header && (
            <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
              <div className="px-4 py-3">
                {header}
              </div>
            </div>
          )}

          {/* Three-column grid */}
          <div className="grid grid-cols-[38fr_38fr_24fr] h-[calc(100vh-4rem)]">
            {/* Column 1: Input */}
            <div className="overflow-y-auto border-r">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input</span>
              </div>
              <div className="p-4">
                {inputArea}
              </div>
            </div>

            {/* Column 2: Output / Generated Posts */}
            <div className="overflow-y-auto border-r bg-gray-50/30">
              <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm border-b px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generierte Posts</span>
              </div>
              <div className="p-4">
                {outputArea}
              </div>
            </div>

            {/* Column 3: Saved Posts */}
            <div className="overflow-y-auto bg-gray-50/30" data-save-target>
              {savedPostsArea ? (
                savedPostsArea
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Keine gespeicherten Beiträge
                </div>
              )}
            </div>
          </div>

          {children}
        </div>
      </LayoutContext.Provider>
    );
  }

  // Mobile/Tablet: Tab layout (<1024px)
  return (
    <LayoutContext.Provider value={contextValue}>
      <div className={cn('min-h-screen bg-background pb-14', className)}>
        {/* Header */}
        {header && (
          <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-3">
              {header}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="px-4 py-4">
          {mobileTab === 'input' && (
            <div className="space-y-4">
              {inputArea}
            </div>
          )}
          {mobileTab === 'output' && (
            <div className="space-y-4">
              {outputArea}
            </div>
          )}
          {mobileTab === 'saved' && (
            <div data-save-target className="space-y-4">
              {savedPostsArea || (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Keine gespeicherten Beiträge
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Tab Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
          <div className="grid grid-cols-3">
            <button
              onClick={() => setMobileTab('input')}
              className={cn(
                "py-3 text-center transition-colors",
                mobileTab === 'input'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-sm font-medium">Input</span>
            </button>
            <button
              onClick={() => setMobileTab('output')}
              className={cn(
                "py-3 text-center transition-colors",
                mobileTab === 'output'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-sm font-medium">Output</span>
            </button>
            <button
              onClick={() => setMobileTab('saved')}
              className={cn(
                "py-3 text-center transition-colors",
                mobileTab === 'saved'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-sm font-medium">Gespeichert</span>
            </button>
          </div>
        </div>

        {children}
      </div>
    </LayoutContext.Provider>
  );
}
