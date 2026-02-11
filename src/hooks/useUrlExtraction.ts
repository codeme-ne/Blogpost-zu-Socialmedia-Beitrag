import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { extractFromUrlStreaming, type ExtractionStage } from '@/api/extract'

interface ExtractionResult {
  title: string
  content: string
}

/**
 * Request deduplication cache with TTL.
 *
 * Prevents duplicate API calls to Jina when users spam the extract button.
 * Cache key format: URL
 * TTL: 5 minutes
 * Max entries: 100 (with automatic cleanup of expired entries)
 */
const extractionCache = new Map<string, {
  result: ExtractionResult
  timestamp: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Client-side timer schedule (ms → stage). Provides immediate visual
// feedback while SSE events may be buffered by CDN/proxy layers.
// Real SSE events override these when they arrive.
const TIMER_SCHEDULE: Array<{ delay: number; stage: ExtractionStage }> = [
  { delay: 200, stage: 'validating' },
  { delay: 1200, stage: 'fetching' },
]

export const useUrlExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionStage, setExtractionStage] = useState<ExtractionStage | 'idle'>('idle')
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const sseReceivedRef = useRef(false)

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timerIds.current.forEach(clearTimeout)
    }
  }, [])

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(clearTimeout)
    timerIds.current = []
  }, [])

  const startTimerProgression = useCallback(() => {
    sseReceivedRef.current = false
    for (const { delay, stage } of TIMER_SCHEDULE) {
      const id = setTimeout(() => {
        // Only apply timer stage if no SSE event has arrived yet
        if (!sseReceivedRef.current) {
          setExtractionStage(stage)
        }
      }, delay)
      timerIds.current.push(id)
    }
  }, [])

  const extractContent = useCallback(async (sourceUrl: string): Promise<ExtractionResult | null> => {
    if (!sourceUrl.trim()) return null

    // Check cache first
    const cached = extractionCache.get(sourceUrl)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      toast.info('Cached result returned')
      return cached.result
    }

    setIsExtracting(true)
    setExtractionStage('idle')
    startTimerProgression()

    try {
      const extractResult = await extractFromUrlStreaming(sourceUrl, (event) => {
        if (event.stage !== 'complete') {
          // SSE event arrived - stop timer, use real server stage
          sseReceivedRef.current = true
          clearTimers()
          setExtractionStage(event.stage)
        }
      })

      clearTimers()
      setExtractionStage('complete')

      const result: ExtractionResult = {
        title: extractResult.title || "",
        content: extractResult.content || ""
      }
      toast.success(`Inhalt importiert - ${extractResult.title || sourceUrl}`)

      // Cache the successful result
      extractionCache.set(sourceUrl, {
        result,
        timestamp: Date.now()
      })

      // Clean up old cache entries if cache grows too large
      if (extractionCache.size > 100) {
        const now = Date.now()
        for (const [key, value] of extractionCache) {
          if (now - value.timestamp > CACHE_TTL) {
            extractionCache.delete(key)
          }
        }
      }

      return result
    } catch (e) {
      clearTimers()
      setExtractionStage('error')
      toast.error(`Import fehlgeschlagen - ${e instanceof Error ? e.message : String(e)}`)
      return null
    } finally {
      setIsExtracting(false)
    }
  }, [startTimerProgression, clearTimers])

  return {
    isExtracting,
    extractionStage,
    extractContent,
  }
}
