import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";

// Feature flag and layout components
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { UnifiedLayout, type MobileTab } from "@/components/layouts/UnifiedLayout";
import { EnhancedUrlExtractor } from "@/components/common/EnhancedUrlExtractor";
import {
  ExtractingContent,
  GeneratingPosts
} from "@/components/common/SkeletonLoaders";

// Existing components and hooks
import { SavedPosts } from "@/components/common/SavedPosts";
import { PlatformPreviewCard } from "@/components/common/PlatformPreviewCard";
import { AccountButton } from "@/components/common/AccountButton";
import { Auth } from "@/components/common/Auth";
import PlatformGenerators from "@/components/common/PlatformGenerators";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUrlExtraction } from "@/hooks/useUrlExtraction";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { usePostGeneratorState, type GeneratedPost } from "@/hooks/usePostGeneratorState";

// Performance monitoring
import { perfMonitor, PERF_MARKS, PERF_MEASURES } from "@/utils/performance";

// Types
import type { Platform } from "@/config/platforms";
import { PLATFORM_LABEL, PLATFORM_META } from "@/config/platforms";
import { savePost } from "@/api/appwrite";
import { createLinkedInShareUrl } from "@/api/linkedin";

import { useSaveAnimation } from "@/hooks/useSaveAnimation";
import { FlyingSaveCard } from "@/components/animations/FlyingSaveCard";

export default function GeneratorV2() {
  // Mark app initialization
  useEffect(() => {
    perfMonitor.mark(PERF_MARKS.APP_INIT);
  }, []);

  // Unified state management
  const { state, actions, computed } = usePostGeneratorState();

  // Local UI state only
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('input');
  const prevPostCountRef = useRef(0);

  // Custom hooks
  const { userEmail, loginOpen, setLoginOpen } = useAuth();
  useSubscription();
  useUsageTracking();
  const { extractContent } = useUrlExtraction();
  const saveAnimation = useSaveAnimation();

  // Feature flag check
  const newUxEnabled = useFeatureFlag('NEW_UX', {
    rolloutPercentage: 100,
    analyticsEnabled: true
  });

  // Fix Magic Link auth state synchronization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authType = urlParams.get('type');

    if (authType === 'magiclink' || authType === 'recovery') {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      toast.success("Erfolgreich eingeloggt!");
    }
  }, []);

  // Update workflow step based on state
  useEffect(() => {
    if (state.inputText.trim()) {
      if (!state.completedSteps.includes('input')) {
        actions.completeStep('input');
        actions.setStep('generate');
      }
    }

    const hasGeneratedPosts = Object.values(state.postsByPlatform).some(posts => posts.length > 0);
    if (hasGeneratedPosts) {
      if (!state.completedSteps.includes('generate')) {
        actions.completeStep('generate');
        actions.setStep('share');
        perfMonitor.mark(PERF_MARKS.FIRST_POST_RENDERED);
      }
    }
  }, [state.inputText, state.postsByPlatform, state.completedSteps, actions]);

  // Smart Flow: Auto-switch to output tab on mobile after generation
  useEffect(() => {
    const currentPostCount = Object.values(state.postsByPlatform)
      .reduce((sum, posts) => sum + posts.length, 0);

    if (currentPostCount > prevPostCountRef.current && currentPostCount > 0) {
      // New posts generated - switch to output on mobile
      if (window.innerWidth < 1024) {
        setMobileTab('output');
      }
    }
    prevPostCountRef.current = currentPostCount;
  }, [state.postsByPlatform]);

  // Display errors with toasts
  useEffect(() => {
    if (state.errors.extraction) {
      toast.error(`Extraktionsfehler: ${state.errors.extraction}`);
    }

    if (state.errors.generation) {
      Object.entries(state.errors.generation).forEach(([platform, error]) => {
        if (error) {
          toast.error(`${PLATFORM_LABEL[platform as Platform]} Generierungsfehler: ${error}`);
        }
      });
    }
  }, [state.errors]);

  // URL extraction handler
  const handleExtract = useCallback(async (url: string) => {
    if (!url) return;

    perfMonitor.mark(PERF_MARKS.EXTRACTION_START);
    actions.startExtraction();

    try {
      const result = await extractContent(url);
      if (result) {
        const prefill = [result.title, result.content]
          .filter(Boolean)
          .join("\n\n");
        actions.completeExtraction(prefill);
        actions.setSourceUrl(url);

        perfMonitor.mark(PERF_MARKS.EXTRACTION_END);
        perfMonitor.measure(PERF_MEASURES.EXTRACTION_DURATION, PERF_MARKS.EXTRACTION_START, PERF_MARKS.EXTRACTION_END);
      }
    } catch (error) {
      actions.failExtraction(error instanceof Error ? error.message : 'Extraction failed');
    }
  }, [extractContent, actions]);

  // Save post handler with fly-to animation
  const handleSavePost = useCallback(async (content: string, platform: Platform, sourceElement?: HTMLElement | null) => {
    if (!userEmail) {
      setLoginOpen(true);
      toast.error("Login erforderlich - Bitte logge dich ein, um Beiträge zu speichern.");
      return;
    }

    const isMobile = window.innerWidth < 1024;
    const animating = sourceElement
      ? saveAnimation.startAnimation(sourceElement, content, platform)
      : false;

    const savePromise = savePost(content, platform).then(() => {
      setRefreshKey((prev) => prev + 1);
    });

    if (animating) {
      const toastMessage = isMobile
        ? "Beitrag gespeichert!"
        : "Beitrag gespeichert!";
      setTimeout(() => {
        toast.success(toastMessage);
        // Smart Flow: switch to saved tab on mobile after animation
        if (isMobile) {
          setMobileTab('saved');
        }
      }, 650);
    } else {
      toast.success("Beitrag gespeichert!");
      if (isMobile) {
        setTimeout(() => setMobileTab('saved'), 300);
      }
    }

    try {
      await savePromise;
    } catch (error) {
      toast.error(`Speichern fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [userEmail, setLoginOpen, saveAnimation]);

  // LinkedIn share handler
  const handleLinkedInShare = useCallback(async (postContent: string) => {
    try {
      const { createJWT } = await import('@/api/appwrite');
      const jwt = await createJWT();

      const response = await fetch('/api/share/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify({ content: postContent })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("LinkedIn Draft erstellt!");
        if (result.linkedinUrl) {
          window.open(result.linkedinUrl, "_blank", "noopener,noreferrer");
        }
      } else if (result.fallback) {
        const linkedinUrl = createLinkedInShareUrl(postContent);
        window.open(linkedinUrl, "_blank", "noopener,noreferrer");
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch {
      const linkedinUrl = createLinkedInShareUrl(postContent);
      window.open(linkedinUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleSaveEdit = () => {
    actions.saveEdit();
  };

  // Memoized Input Area
  const InputArea = useMemo(() => (
    <div className="space-y-6">
      <EnhancedUrlExtractor
        value={state.inputText}
        onContentExtracted={handleExtract}
        onTextInput={actions.setInputText}
        isExtracting={state.isExtracting}
      />

      {state.inputText.trim() && (
        <Card>
          <CardContent className="pt-6">
            <PlatformGenerators
              content={state.inputText}
              onPostGenerated={(platform, post) => {
                perfMonitor.mark(PERF_MARKS.GENERATION_END);
                const generatedPost: GeneratedPost = {
                  content: post,
                  platform,
                  isEdited: false,
                  regenerationCount: 0,
                  createdAt: new Date(),
                  characterCount: post.length
                };
                actions.completeGeneration(platform, generatedPost);
                toast.success(`${PLATFORM_LABEL[platform]} Post generiert!`);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  ), [state.inputText, state.isExtracting, handleExtract, actions]);

  // Output Area with PlatformPreviewCards
  const OutputArea = useMemo(() => {
    const hasContent = Object.values(state.postsByPlatform).some(posts => posts.length > 0);
    const isLoading = state.isExtracting || computed.isGeneratingAny;

    return (
      <div className="relative min-h-[400px] w-full">
        {/* Loading Overlays */}
        {state.isExtracting && (
          <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 flex items-center justify-center">
            <ExtractingContent progress={state.extractionProgress} />
          </div>
        )}

        {computed.isGeneratingAny && state.generationProgress.current && !state.isExtracting && (
          <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 flex items-center justify-center">
            <GeneratingPosts platform={state.generationProgress.current} />
          </div>
        )}

        {/* Main Content Area */}
        <div className={`space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
          {(["linkedin", "x", "instagram"] as Platform[]).map((platform) => {
            const items = state.postsByPlatform[platform] || [];
            if (items.length === 0) return null;

            const meta = PLATFORM_META[platform];

            return (
              <div key={platform} className="space-y-3">
                {/* Platform section header */}
                <div className="flex items-center gap-2">
                  <span>{meta.emoji}</span>
                  <span className="font-semibold text-sm">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'Beitrag' : 'Beiträge'}
                  </span>
                </div>

                {/* Preview cards */}
                {items.map((post, index) => {
                  const postContent = typeof post === 'string' ? post : post.content;
                  const isEditingThis = computed.isEditing && computed.editingPlatform === platform && computed.editingIndex === index;

                  return (
                    <PlatformPreviewCard
                      key={index}
                      platform={platform}
                      content={postContent}
                      index={index}
                      isEditing={isEditingThis}
                      editContent={state.editingPost?.content || ''}
                      onEditContentChange={(value) => actions.updateEditingContent(value)}
                      onStartEdit={() => actions.startEdit(platform, index, postContent)}
                      onCancelEdit={actions.cancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onSave={(e) => {
                        const card = (e.currentTarget as HTMLElement).closest('[data-post-card]') as HTMLElement | null;
                        handleSavePost(postContent, platform, card);
                      }}
                      onShare={platform === 'linkedin' ? () => handleLinkedInShare(postContent) : undefined}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Empty State */}
          {!hasContent && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-center gap-3">
                  {(["linkedin", "x", "instagram"] as Platform[]).map((p) => (
                    <div
                      key={p}
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${PLATFORM_META[p].color}10` }}
                    >
                      {PLATFORM_META[p].emoji}
                    </div>
                  ))}
                </div>
                <h3 className="text-lg font-medium text-foreground">Bereit für deinen ersten Post</h3>
                <p className="text-sm">Füge Content hinzu und wähle eine Plattform aus</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [state.isExtracting, state.extractionProgress, state.generationProgress, state.postsByPlatform, state.editingPost,
      computed.isGeneratingAny, computed.isEditing, computed.editingPlatform, computed.editingIndex,
      handleSaveEdit, handleSavePost, handleLinkedInShare, actions]);

  // If feature flag is disabled, show maintenance notice
  if (!newUxEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary flex items-center justify-center px-4">
        <div className="max-w-xl w-full space-y-4 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold">Generator vorübergehend deaktiviert</h1>
          <p className="text-muted-foreground">
            Die klassische Version des Generators wurde entfernt. Bitte aktiviere das neue UX-Flag oder
            wende dich an den Support, falls du weiterhin Zugriff auf den Generator benötigst.
          </p>
        </div>
      </div>
    );
  }

  // Main render with UnifiedLayout
  return (
    <>
      <UnifiedLayout
        activeTab={mobileTab}
        onMobileTabChange={setMobileTab}
        savedPostsArea={
          <SavedPosts
            refreshKey={refreshKey}
            isAuthenticated={!!userEmail}
            onLoginClick={() => setLoginOpen(true)}
            highlighted={saveAnimation.highlighted}
          />
        }
        header={
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Social Transformer
            </h1>
            <div className="flex items-center gap-4">
              {userEmail ? (
                <AccountButton />
              ) : (
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm">Login</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Einloggen</DialogTitle>
                    </DialogHeader>
                    <Auth />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        }
        inputArea={InputArea}
        outputArea={OutputArea}
      />

      {/* Flying save animation */}
      {saveAnimation.isAnimating && saveAnimation.sourceRect && saveAnimation.targetRect && (
        <FlyingSaveCard
          sourceRect={saveAnimation.sourceRect}
          targetRect={saveAnimation.targetRect}
          content={saveAnimation.animationContent}
          platform={saveAnimation.animationPlatform}
          onComplete={saveAnimation.onComplete}
        />
      )}
    </>
  );
}
