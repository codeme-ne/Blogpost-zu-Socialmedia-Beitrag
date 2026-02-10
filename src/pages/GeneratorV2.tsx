import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

// Feature flag and layout components
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { EnhancedUrlExtractor } from "@/components/common/EnhancedUrlExtractor";
import { CharacterCounterTextarea } from "@/components/common/CharacterCounter";
import {
  ExtractingContent,
  GeneratingPosts
} from "@/components/common/SkeletonLoaders";

// Existing components and hooks
import { SavedPosts } from "@/components/common/SavedPosts";
import { AccountButton } from "@/components/common/AccountButton";
import { Auth } from "@/components/common/Auth";
import PlatformGenerators from "@/components/common/PlatformGenerators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/copy-button";
import {
  SaveButton,
  EditButton,
  LinkedInShareButton,
  XShareButton,
  InstagramShareButton,
} from "@/design-system/components/ActionButtons";

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
import { PLATFORM_LABEL } from "@/config/platforms";
import { savePost } from "@/api/appwrite";
import { createLinkedInShareUrl } from "@/api/linkedin";

import { MobileBottomSheet, useMobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { Bookmark } from "lucide-react";

export default function GeneratorV2() {
  // Mark app initialization
  useEffect(() => {
    perfMonitor.mark(PERF_MARKS.APP_INIT);
  }, []);

  // Unified state management
  const { state, actions, computed } = usePostGeneratorState();

  // Local UI state only
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedPostsCollapsed, setSavedPostsCollapsed] = useState(true);
  const bottomSheet = useMobileBottomSheet();

  // Custom hooks
  const { userEmail, loginOpen, setLoginOpen } = useAuth();
  useSubscription();
  useUsageTracking();
  const { extractContent } = useUrlExtraction();

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

  // Display errors with toasts
  useEffect(() => {
    // Handle extraction errors
    if (state.errors.extraction) {
      toast.error(`Extraktionsfehler: ${state.errors.extraction}`);
    }

    // Handle generation errors
    if (state.errors.generation) {
      Object.entries(state.errors.generation).forEach(([platform, error]) => {
        if (error) {
          toast.error(`${PLATFORM_LABEL[platform as Platform]} Generierungsfehler: ${error}`);
        }
      });
    }
  }, [state.errors]);

  // URL extraction handler (uses Jina Reader - always free)
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

  // Save post handler
  const handleSavePost = async (content: string, platform: 'linkedin' | 'x' | 'instagram' = 'linkedin') => {
    if (!userEmail) {
      setLoginOpen(true);
      toast.error("Login erforderlich - Bitte logge dich ein, um Beiträge zu speichern.");
      return;
    }
    try {
      await savePost(content, platform);
      setRefreshKey((prev) => prev + 1);
      toast.success("Erfolgreich gespeichert - Du findest den Beitrag in der Seitenleiste \"Gespeicherte Beiträge\".");
    } catch (error) {
      toast.error(`Speichern fehlgeschlagen - Fehler beim Speichern: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSaveEdit = () => {
    actions.saveEdit();
  };

  // Memoized Input Area component
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

  // Stable Output Area - prevents layout jumping by maintaining consistent container
  const OutputArea = useMemo(() => {
    const hasContent = Object.values(state.postsByPlatform).some(posts => posts.length > 0);
    const isLoading = state.isExtracting || computed.isGeneratingAny;

    return (
      <div className="relative min-h-[400px] w-full">
        {/* Loading Overlays - Absolutely positioned to prevent layout shifts */}
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

        {/* Main Content Area - Always present, prevents jumping */}
        <div className={`space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
          {(["linkedin", "x", "instagram"] as Platform[]).map((platform) => {
            const items = state.postsByPlatform[platform] || [];
            if (items.length === 0) return null;

            return (
              <Card key={platform} className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{PLATFORM_LABEL[platform]} – {items.length} Beiträge</CardTitle>
                  <CardDescription>Plattformspezifische Vorschau und Bearbeitung</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    {items.map((post, index) => {
                    const postContent = typeof post === 'string' ? post : post.content;
                    return (
                      <Card key={index} className="border-muted/50 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
                        <CardContent className="p-6">
                          {computed.isEditing && computed.editingPlatform === platform && computed.editingIndex === index ? (
                            <div className="space-y-4">
                              <CharacterCounterTextarea
                                value={state.editingPost?.content || ''}
                                onChange={(value) => actions.updateEditingContent(value)}
                                platform={platform}
                                rows={8}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={actions.cancelEdit}>
                                  Abbrechen
                                </Button>
                                <SaveButton size="sm" onClick={handleSaveEdit} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-4">{postContent}</p>
                              <div className="flex justify-between items-center pt-4 border-t border-muted/30">
                                <Badge variant="outline" className="text-xs">
                                  {PLATFORM_LABEL[platform]} · Post #{index + 1}
                                </Badge>
                                <div className="flex gap-2">
                                  <CopyButton
                                    text={postContent}
                                    size="sm"
                                    variant="ghost"
                                    onCopy={() => toast.success('Beitrag kopiert!')}
                                  />
                                  <EditButton
                                    size="sm"
                                    onClick={() => actions.startEdit(platform, index, postContent)}
                                    text=""
                                    title="Beitrag bearbeiten"
                                  />
                                  <SaveButton
                                    size="sm"
                                    onClick={() => handleSavePost(postContent, platform)}
                                    text=""
                                    title="Beitrag speichern"
                                  />
                                  {/* Platform-specific share buttons */}
                                  {platform === "linkedin" && (
                                    <LinkedInShareButton
                                      size="sm"
                                      text=""
                                      onClick={async () => {
                                        try {
                                          // Get auth token from Appwrite
                                          const { createJWT } = await import('@/api/appwrite');
                                          const jwt = await createJWT();

                                          // Call our secure backend endpoint instead of exposing credentials
                                          const response = await fetch('/api/share/linkedin', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              // Optional: Add auth token if user is logged in
                                              ...(jwt ? {
                                                'Authorization': `Bearer ${jwt}`
                                              } : {})
                                            },
                                            body: JSON.stringify({ content: postContent })
                                          });

                                          const result = await response.json();

                                          if (result.success) {
                                            toast.success("LinkedIn Draft erstellt! 🚀");
                                            // Open LinkedIn posts page
                                            if (result.linkedinUrl) {
                                              window.open(result.linkedinUrl, "_blank", "noopener,noreferrer");
                                            }
                                          } else if (result.fallback) {
                                            // Use share dialog as fallback
                                            const linkedinUrl = createLinkedInShareUrl(postContent);
                                            window.open(linkedinUrl, "_blank", "noopener,noreferrer");
                                          } else {
                                            throw new Error(result.error || 'Unknown error');
                                          }
                                        } catch {
                                          // Always fallback to share dialog on error
                                          const linkedinUrl = createLinkedInShareUrl(postContent);
                                          window.open(linkedinUrl, "_blank", "noopener,noreferrer");
                                        }
                                      }}
                                      title="Auf LinkedIn teilen"
                                    />
                                  )}
                                  {platform === "x" && (
                                    <XShareButton
                                      size="sm"
                                      text=""
                                      tweetContent={postContent}
                                      title="Auf X teilen"
                                    />
                                  )}
                                  {platform === "instagram" && (
                                    <InstagramShareButton
                                      size="sm"
                                      text=""
                                      postContent={postContent}
                                      title="Auf Instagram teilen"
                                    />
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Stable Empty State Placeholder */}
          {!hasContent && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-16 h-16 mx-auto bg-muted/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✨</span>
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
      handleSaveEdit, handleSavePost, actions, userEmail]);

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
      // Reserve space for the fixed SavedPosts sidebar so it doesn't cover the main UI.
      className={savedPostsCollapsed ? 'lg:pr-12' : 'lg:pr-[22rem]'}
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

    {/* Desktop SavedPosts sidebar - fixed overlay that can toggle (only on desktop >= 1024px) */}
    <div className="hidden lg:block">
      <SavedPosts
        onCollapse={setSavedPostsCollapsed}
        refreshKey={refreshKey}
        isAuthenticated={!!userEmail}
        onLoginClick={() => setLoginOpen(true)}
      />
    </div>

    {/* Mobile/Tablet FAB for saved posts (hidden on desktop >= 1024px) */}
    <button
      onClick={bottomSheet.open}
      className="fixed bottom-6 right-6 lg:hidden z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
      aria-label="Gespeicherte Beiträge öffnen"
    >
      <Bookmark className="h-6 w-6" />
    </button>

    {/* Mobile Bottom Sheet */}
    <MobileBottomSheet
      isOpen={bottomSheet.isOpen}
      onClose={bottomSheet.close}
      title="Gespeicherte Beiträge"
      snapPoints={[0.5, 0.95]}
      defaultSnapPoint={0}
    >
      <SavedPosts
        onCollapse={() => {}}
        refreshKey={refreshKey}
        isAuthenticated={!!userEmail}
        onLoginClick={() => {
          bottomSheet.close();
          setLoginOpen(true);
        }}
      />
    </MobileBottomSheet>
    </>
  );
}
