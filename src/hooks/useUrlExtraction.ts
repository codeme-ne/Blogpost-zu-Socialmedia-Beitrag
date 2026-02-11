import { useState, useCallback } from 'react'
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

export const useUrlExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionStage, setExtractionStage] = useState<ExtractionStage | 'idle'>('idle')

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

    try {
      const extractResult = await extractFromUrlStreaming(sourceUrl, (event) => {
        if (event.stage !== 'complete') {
          setExtractionStage(event.stage)
        }
      })

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
      setExtractionStage('error')
      toast.error(`Import fehlgeschlagen - ${e instanceof Error ? e.message : String(e)}`)
      return null
    } finally {
      setIsExtracting(false)
    }
  }, [])

  return {
    isExtracting,
    extractionStage,
    extractContent,
  }
}
