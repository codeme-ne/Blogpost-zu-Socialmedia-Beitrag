import { useState } from 'react';
import { toast } from 'sonner';
import { generateEnhancedPost, generateComparison } from '@/api/claude-enhanced';
import type { Platform } from '@/config/platforms';
import type { PostGenerationOptions, PostGenerationResponse, PostGoal } from '@/libs/promptBuilder.v2';
import { useSubscription } from '@/hooks/useSubscription';

interface EnhancedGenerationState {
  post: string;
  metadata: PostGenerationResponse['generation_metadata'];
  hashtags?: string[];
  regenerationCount: number;
  isEdited: boolean;
  generationId: string;
  timestamp: number;
}

interface ComparisonResult {
  old: {
    posts: string[];
    count: number;
    system: string;
  };
  new: {
    post: string;
    metadata: PostGenerationResponse['generation_metadata'];
    hashtags?: string[];
    system: string;
  };
}

interface PendingRegeneration {
  content: string;
  platform: Platform;
  postGoal: PostGoal;
}

export const useEnhancedContentGeneration = () => {
  const [enhancedPosts, setEnhancedPosts] = useState<Partial<Record<Platform, EnhancedGenerationState>>>({});
  const [activeGenerations, setActiveGenerations] = useState<Set<string>>(new Set());
  const [comparisonResults, setComparisonResults] = useState<Partial<Record<Platform, ComparisonResult>>>({});
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [pendingRegeneration, setPendingRegeneration] = useState<PendingRegeneration | null>(null);

  const { decrementUsage, hasUsageRemaining } = useSubscription();

  /**
   * Generate enhanced post using structured prompts
   */
  const generateEnhancedSinglePost = async (
    content: string,
    platform: Platform,
    postGoal: PostGoal = 'thought_leadership',
    isRegeneration = false
  ): Promise<PostGenerationResponse> => {
    if (!content.trim()) {
      toast.error('Bitte gib einen Text ein');
      throw new Error('Empty content');
    }

    if (!isRegeneration && !hasUsageRemaining()) {
      toast.error('Tageslimit erreicht. Upgrade für unbegrenzte Generierung.');
      throw new Error('Usage limit reached');
    }

    const current = enhancedPosts[platform];
    const regenerationCount = current?.regenerationCount || 0;
    const generationId = `enhanced-${platform}-${Date.now()}`;

    setActiveGenerations((prev) => new Set([...prev, generationId]));

    try {
      const options: PostGenerationOptions = {
        content,
        platform,
        postGoal,
        regenerationSeed: isRegeneration ? regenerationCount + 1 : undefined
      };

      const response = await generateEnhancedPost(options);

      // Store enhanced post with metadata
      setEnhancedPosts((prev) => ({
        ...prev,
        [platform]: {
          post: response.post_text,
          metadata: response.generation_metadata,
          hashtags: response.suggested_hashtags,
          regenerationCount: isRegeneration ? regenerationCount + 1 : 0,
          isEdited: false,
          generationId,
          timestamp: Date.now()
        }
      }));

      if (!isRegeneration) {
        decrementUsage();
      }

      toast.success(`Enhanced ${platform.toUpperCase()} Post generiert!`, {
        description: `Hook: ${response.generation_metadata.hook_formula_used}`
      });

      return response;

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      let errorMessage = 'Enhanced Generierung fehlgeschlagen. Bitte erneut versuchen.';
      const msg = err.message

      if (msg.includes('Usage limit') || msg.includes('limit')) {
        errorMessage = 'Tageslimit erreicht. Upgrade für unbegrenzte Posts.';
      } else if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        errorMessage = 'Zu viele Anfragen. Bitte 30 Sekunden warten.';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Anfrage-Timeout. Bitte versuche es erneut.';
      }

      toast.error(errorMessage);
      throw err;

    } finally {
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete(generationId);
        return next;
      });
    }
  };

  /**
   * Regenerate enhanced post with different formulas
   * If post is edited, sets pending state for component to confirm
   */
  const regenerateEnhancedPost = async (
    content: string,
    platform: Platform,
    postGoal: PostGoal = 'thought_leadership'
  ) => {
    const current = enhancedPosts[platform];
    if (current?.isEdited) {
      setPendingRegeneration({ content, platform, postGoal });
      return null;
    }
    return generateEnhancedSinglePost(content, platform, postGoal, true);
  };

  /**
   * Confirm pending regeneration (call after user confirms via AlertDialog)
   */
  const confirmRegeneration = async () => {
    if (!pendingRegeneration) return null;

    const { content, platform, postGoal } = pendingRegeneration;
    setPendingRegeneration(null);

    return generateEnhancedSinglePost(content, platform, postGoal, true);
  };

  /**
   * Cancel pending regeneration (call when user cancels AlertDialog)
   */
  const cancelRegeneration = () => {
    setPendingRegeneration(null);
  };

  /**
   * Generate comparison between old and new systems
   */
  const generatePostComparison = async (
    content: string,
    platform: Platform,
    postGoal: PostGoal = 'thought_leadership'
  ): Promise<ComparisonResult> => {
    if (!content.trim()) {
      toast.error('Bitte gib einen Text ein');
      throw new Error('Empty content');
    }

    const generationId = `comparison-${platform}-${Date.now()}`;
    setActiveGenerations((prev) => new Set([...prev, generationId]));

    try {
      toast.info('Generiere Vergleich...', {
        description: 'Alte vs. neue Prompt-Engine'
      });

      const comparison = await generateComparison(content, platform, postGoal);

      setComparisonResults((prev) => ({
        ...prev,
        [platform]: comparison
      }));

      toast.success(`Vergleich für ${platform.toUpperCase()} erstellt!`, {
        description: `Alte Methode: ${comparison.old.count} Posts, Neue: 1 strukturierter Post`
      });

      return comparison;

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      toast.error('Vergleichsgenerierung fehlgeschlagen');
      throw err;

    } finally {
      setActiveGenerations((prev) => {
        const next = new Set(prev);
        next.delete(generationId);
        return next;
      });
    }
  };

  /**
   * Switch post goal and regenerate
   */
  const changePostGoal = async (
    content: string,
    platform: Platform,
    newGoal: PostGoal
  ) => {
    const current = enhancedPosts[platform];
    if (!current) {
      toast.error('Bitte generiere zuerst einen Post');
      return null;
    }

    toast.info(`Ändere Ziel zu: ${newGoal}...`);
    return generateEnhancedSinglePost(content, platform, newGoal, false);
  };

  /**
   * Get generation metadata for analytics
   */
  const getGenerationMetadata = (platform: Platform) => {
    return enhancedPosts[platform]?.metadata;
  };

  /**
   * Export generation data for analysis
   */
  const exportGenerationData = () => {
    const data = Object.entries(enhancedPosts)
      .filter(([, state]) => state)
      .map(([platform, state]) => ({
        platform,
        post: state!.post,
        metadata: state!.metadata,
        hashtags: state!.hashtags,
        timestamp: state!.timestamp,
        regenerationCount: state!.regenerationCount
      }));

    return {
      generations: data,
      comparisons: comparisonResults,
      exportTimestamp: Date.now()
    };
  };

  /**
   * Clear all enhanced posts
   */
  const clearEnhancedPosts = () => {
    setEnhancedPosts({});
    setComparisonResults({});
  };

  /**
   * Update post content (marks as edited)
   */
  const updateEnhancedPost = (platform: Platform, newContent: string) => {
    setEnhancedPosts((prev) => {
      const current = prev[platform];
      if (!current) return prev;

      return {
        ...prev,
        [platform]: {
          ...current,
          post: newContent,
          isEdited: true
        }
      };
    });
  };

  /**
   * Check if platform is currently generating
   */
  const isEnhancedGenerating = (platform: Platform) =>
    Array.from(activeGenerations).some((id) =>
      id.includes(`enhanced-${platform}`) || id.includes(`comparison-${platform}`)
    );

  return {
    // Enhanced generation state
    enhancedPosts,
    comparisonResults,
    isComparisonMode,
    setIsComparisonMode,
    pendingRegeneration,

    // Enhanced generation methods
    generateEnhancedSinglePost,
    regenerateEnhancedPost,
    generatePostComparison,
    changePostGoal,
    confirmRegeneration,
    cancelRegeneration,

    // Utilities
    getGenerationMetadata,
    exportGenerationData,
    clearEnhancedPosts,
    updateEnhancedPost,
    isEnhancedGenerating,

    // Active generations tracking
    activeGenerations
  };
};