import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { linkedInPostsFromNewsletter, xTweetsFromBlog, instagramPostsFromBlog, batchedPostsFromContent } from '@/api/claude'
import type { Platform } from '@/config/platforms'
import { PLATFORM_LABEL } from '@/config/platforms'
import { buildSinglePostPrompt, validatePost, normalizeSinglePostResponse } from '@/libs/promptBuilder'
import { useSubscription } from '@/hooks/useSubscription'
import { generateOpenRouterMessage } from '@/libs/api-client'
import type { VoiceTone } from '@/config/voice-tones'
import { DEFAULT_VOICE_TONE } from '@/config/voice-tones'
import { OPENROUTER_MODEL } from '@/config/ai'

interface GenerationProgress {
  progress: number // 0-100
  currentPlatform: string
  totalPlatforms: number
  completedPlatforms: number
}

// Maximum number of posts to keep in memory (LRU-like cache)
const MAX_POSTS = 50

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message)
  }
  return new Error(String(error))
}

export const useContentGeneration = () => {
  const [postsByPlatform, setPostsByPlatform] = useState<Record<Platform, string[]>>({
    linkedin: [],
    x: [],
    instagram: [],
  })
  // Single-post state (new)
  const [generatedPosts, setGeneratedPosts] = useState<Partial<Record<Platform, { post: string; regenerationCount: number; isEdited: boolean }>>>({})
  // Ref to always read latest generatedPosts inside callbacks (avoids stale closure)
  const generatedPostsRef = useRef(generatedPosts)
  generatedPostsRef.current = generatedPosts
  const [activeGenerations, setActiveGenerations] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    progress: 0,
    currentPlatform: "",
    totalPlatforms: 0,
    completedPlatforms: 0,
  })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  // Free tier usage from subscription
  const { decrementUsage, hasUsageRemaining } = useSubscription()

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setGeneratedPosts({})
      setActiveGenerations(new Set())
      setPostsByPlatform({ linkedin: [], x: [], instagram: [] })
    }
  }, [])

  const generateContent = async (inputText: string, selectedPlatforms: Platform[]) => {
    if (!inputText.trim()) {
      toast.error("Bitte gib einen Text ein")
      return false
    }

    setIsLoading(true)
    setGenerationProgress({
      progress: 0,
      currentPlatform: "",
      totalPlatforms: selectedPlatforms.length,
      completedPlatforms: 0,
    })

    try {
      let newPosts: Record<Platform, string[]> = { linkedin: [], x: [], instagram: [] }

      // Show progress
      setGenerationProgress(prev => ({
        ...prev,
        currentPlatform: "Alle Plattformen",
        progress: 10,
      }))

      /**
       * OPTIMIZATION: Try batched API call first (1 call for all platforms)
       * Reduces costs by ~3x compared to N separate calls
       * Falls back to parallel calls if batching fails
       */
      if (selectedPlatforms.length > 1) {
        const batchedResult = await batchedPostsFromContent(inputText, selectedPlatforms)

        if (batchedResult) {
          // Batching succeeded - use those results
          newPosts = batchedResult
          setGenerationProgress(prev => ({
            ...prev,
            completedPlatforms: selectedPlatforms.length,
            progress: 100,
          }))
        } else {
          // Batching failed - fall back to parallel calls
          console.warn('Batched generation failed, falling back to parallel calls')
          newPosts = await executeParallelGeneration(inputText, selectedPlatforms)
        }
      } else {
        // Single platform - use direct call (no need for batching)
        newPosts = await executeParallelGeneration(inputText, selectedPlatforms)
      }

      setPostsByPlatform(prev => ({ ...prev, ...newPosts }))

      const names = selectedPlatforms.map(p => PLATFORM_LABEL[p]).join(', ')
      toast.success(`Beiträge erstellt! Generiert für: ${names}`)

      return true
    } catch {
      toast.error("Fehler beim Erstellen - LinkedIn-Beiträge konnten nicht erstellt werden.")
      return false
    } finally {
      // Reset progress states
      setGenerationProgress({
        progress: 0,
        currentPlatform: "",
        totalPlatforms: 0,
        completedPlatforms: 0,
      })
      setIsLoading(false)
    }
  }

  /**
   * Fallback: Execute parallel generation for all platforms
   * Used when batching fails or for single platform requests
   */
  const executeParallelGeneration = async (
    inputText: string,
    selectedPlatforms: Platform[]
  ): Promise<Record<Platform, string[]>> => {
    const newPosts: Record<Platform, string[]> = { linkedin: [], x: [], instagram: [] }

    // Create parallel promise array for all platforms
    const platformPromises = selectedPlatforms.map(async (platform) => {
      const platformName = PLATFORM_LABEL[platform]
      try {
        let posts: string[] = []
        switch (platform) {
          case 'linkedin':
            posts = await linkedInPostsFromNewsletter(inputText)
            break
          case 'x':
            posts = await xTweetsFromBlog(inputText)
            break
          case 'instagram':
            posts = await instagramPostsFromBlog(inputText)
            break
        }
        return { platform, posts, success: true, platformName }
      } catch (error) {
        return { platform, posts: [] as string[], success: false, error, platformName }
      }
    })

    // Execute all in parallel
    const results = await Promise.allSettled(platformPromises)

    // Process results and handle errors gracefully
    let completed = 0
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { platform, posts, success, platformName, error } = result.value
        if (success) {
          newPosts[platform] = posts
          completed++
        } else {
          toast.error(`Fehler bei ${platformName}: ${error instanceof Error ? error.message : String(error)}`)
        }
      } else {
        // Handle rejected promise (shouldn't happen with our try-catch, but be safe)
        toast.error(`Unerwarteter Fehler bei der Generierung`)
      }
    }

    // Update progress after all complete
    setGenerationProgress(prev => ({
      ...prev,
      completedPlatforms: completed,
      progress: 100,
    }))

    return newPosts
  }

  // === New: Single post generation per platform (via Edge Function helper) ===

  const generateSinglePost = useCallback(async (
    content: string,
    platform: Platform,
    isRegeneration = false,
    voiceTone?: VoiceTone
  ): Promise<string> => {
    if (!content.trim()) {
      toast.error('Bitte gib einen Text ein')
      throw new Error('Empty content')
    }

    if (!isRegeneration && !hasUsageRemaining()) {
      setShowUpgradeModal(true)
      throw new Error('Usage limit reached')
    }

    const current = generatedPostsRef.current[platform]
    const regenerationCount = current?.regenerationCount || 0
    const generationId = `${platform}-${Date.now()}`
    setActiveGenerations((prev) => new Set([...prev, generationId]))

    try {
      const prompt = buildSinglePostPrompt(
        content,
        platform,
        isRegeneration ? regenerationCount + 1 : undefined,
        voiceTone || DEFAULT_VOICE_TONE
      )

      const maxTokens = platform === 'x' ? 1024 : 2048
      // Cap temperature at 0.95 to prevent API errors after 4+ regenerations
      const temperature = isRegeneration
        ? Math.min(0.95, 0.8 + regenerationCount * 0.05)
        : 0.7

      const response = await generateOpenRouterMessage({
        model: OPENROUTER_MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'user', content: prompt },
        ],
        sourceText: content,
      }, { timeout: 25000 })

      // Type guard: validate response structure before accessing text
      const firstBlock = response.content?.[0]
      if (!firstBlock || typeof firstBlock !== 'object' || !('text' in firstBlock) || typeof firstBlock.text !== 'string') {
        throw new Error('Invalid AI response: expected text block')
      }
      const raw = firstBlock.text
      const generatedPost = normalizeSinglePostResponse(raw, platform)

      // Validate and store
      validatePost(generatedPost, platform)

      setGeneratedPosts((prev) => {
        const newEntry = {
          post: generatedPost,
          regenerationCount: isRegeneration ? regenerationCount + 1 : 0,
          isEdited: false,
        }
        const updated = { ...prev, [platform]: newEntry }
        const entries = Object.entries(updated)

        // Apply LRU: keep only the last MAX_POSTS entries
        if (entries.length > MAX_POSTS) {
          const trimmed = entries.slice(-MAX_POSTS)
          return Object.fromEntries(trimmed) as typeof prev
        }
        return updated
      })

      if (!isRegeneration) {
        decrementUsage()
      }

      toast.success(`${platform.toUpperCase()} Post generiert!`)

      return generatedPost
    } catch (error: unknown) {
      const err = toError(error)
      let errorMessage = 'Generierung fehlgeschlagen. Bitte erneut versuchen.'
      const msg = err.message
      if (msg.includes('Usage limit') || msg.includes('limit')) {
        errorMessage = 'Tageslimit erreicht. Upgrade für unbegrenzte Posts.'
      } else if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        errorMessage = 'Zu viele Anfragen. Bitte 30 Sekunden warten.'
      } else if (err.name === 'AbortError') {
        errorMessage = 'Anfrage-Timeout. Bitte versuche es erneut.'
      } else if (
        msg.includes('OPENROUTER_API_KEY') ||
        msg.includes('OpenRouter ist nicht konfiguriert') ||
        msg.includes('AI service is not properly configured')
      ) {
        errorMessage = 'OpenRouter ist nicht eingerichtet. Bitte OPENROUTER_API_KEY in `.env.local` setzen.'
      } else if (msg.includes('OpenRouter API-Route nicht gefunden')) {
        errorMessage = 'Lokale API nicht erreichbar. Starte `npm run dev:full`.'
      }
      toast.error(errorMessage)
      throw err
    } finally {
      setActiveGenerations((prev) => {
        const next = new Set(prev)
        next.delete(generationId)
        return next
      })
    }
  }, [hasUsageRemaining, decrementUsage, setShowUpgradeModal, setActiveGenerations, setGeneratedPosts])

  const regeneratePost = async (content: string, platform: Platform, voiceTone?: VoiceTone) => {
    const current = generatedPostsRef.current[platform]
    if (current?.isEdited) {
      const proceed = window.confirm('Das Regenerieren überschreibt Ihre Änderungen. Fortfahren?')
      if (!proceed) return null
    }
    return generateSinglePost(content, platform, true, voiceTone)
  }

  const isGenerating = (platform: Platform) =>
    Array.from(activeGenerations).some((id) => id.startsWith(platform))

  const updatePost = (platform: Platform, index: number, content: string) => {
    setPostsByPlatform(prev => {
      const updated = { ...prev }
      updated[platform] = [...updated[platform]]
      updated[platform][index] = content
      return updated
    })
  }

  const clearPosts = () => {
    setPostsByPlatform({ linkedin: [], x: [], instagram: [] })
    setGeneratedPosts({})
    setActiveGenerations(new Set())
  }

  // Full session reset for memory management
  const resetSession = useCallback(() => {
    setPostsByPlatform({ linkedin: [], x: [], instagram: [] })
    setGeneratedPosts({})
    setActiveGenerations(new Set())
    setGenerationProgress({
      progress: 0,
      currentPlatform: "",
      totalPlatforms: 0,
      completedPlatforms: 0,
    })
  }, [])

  return {
    postsByPlatform,
    setPostsByPlatform,
    isLoading,
    generationProgress,
    generateContent,
    // New API
    generatedPosts,
    setGeneratedPosts,
    generateSinglePost,
    regeneratePost,
    isGenerating,
    updatePost,
    clearPosts,
    resetSession,
    // Upgrade modal state
    showUpgradeModal,
    setShowUpgradeModal,
  }
}
