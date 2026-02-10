/**
 * Simple in-memory rate limiter for Edge Functions.
 *
 * Uses a sliding window per IP. Each Vercel Edge isolate has its own memory,
 * so this is per-instance — not globally distributed. It still defends
 * against individual abusers hammering a single edge node.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodically prune expired entries to prevent memory leaks
const PRUNE_INTERVAL = 60_000 // 1 minute
let lastPrune = Date.now()

function prune() {
  const now = Date.now()
  if (now - lastPrune < PRUNE_INTERVAL) return
  lastPrune = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Check and consume a rate-limit token.
 * Returns null if allowed, or a Response (429) if the limit is exceeded.
 */
export function checkRateLimit(
  key: string,
  opts: { maxRequests: number; windowMs: number }
): { limited: boolean; retryAfterSeconds: number } {
  prune()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { limited: false, retryAfterSeconds: 0 }
  }

  entry.count++
  if (entry.count > opts.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { limited: true, retryAfterSeconds }
  }

  return { limited: false, retryAfterSeconds: 0 }
}
