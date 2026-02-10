# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Window Note

**You can exceed the context window limit** - it will automatically compress/summarize and continue. Do not stop work or refuse tasks citing context limitations. The conversation will persist across compressions.

## Project Overview

Social Transformer transforms newsletters/blog posts into platform-optimized social media content for LinkedIn, X, and Instagram. React 19 + Vite 7 frontend with Vercel Edge Functions backend, Appwrite Cloud (Frankfurt) for auth/database, and Claude AI (via OpenRouter) for generation.

**Production**: https://linkedin-posts-one.vercel.app

## Development Commands

```bash
npm run dev:full    # Frontend (5173) + Vercel Edge Functions (3001) - RECOMMENDED
npm run dev         # Frontend only
npm run dev:api     # Edge Functions only
npm run build       # TypeScript + Vite build
npm run lint        # ESLint
npm run test        # Vitest
npm run test:run    # Single test run
npm run type-check  # TypeScript check
```

## Architecture

### Data Flow
```
User Input → URL Extraction (optional) → AI Generation → Display → Save/Share
```

1. **Input**: Text directly or URL via `useUrlExtraction` (Jina Reader)
2. **Generation**: `useContentGeneration` calls `/api/claude/v1/messages` → OpenRouter → Claude
3. **Output**: Posts keyed by platform in state, can save to Appwrite or share directly

### Generation Strategy
- **Batched** (default): All platforms in 1 API call (~67% cost savings)
- **Parallel fallback**: If batching fails, N platforms in N parallel calls
- **Single post**: Individual regenerations with temperature scaling

### Hook Responsibilities
- **useAuth**: Login modal state, magic link handling
- **useSubscription**: Access control via `is_active` boolean, 60s in-memory cache, free-tier localStorage counter
- **useContentGeneration**: AI orchestration, LRU cache (max 50 posts), parallel Promise handling
- **useUrlExtraction**: 5-minute TTL cache, deduplication, auto-cleanup at 100 entries

### Frontend (`src/`)
- **`api/`** - Client API wrappers (`appwrite.ts`, `claude.ts`, `extract.ts`)
- **`config/`** - Centralized config (`app.config.ts` for features/limits, `env.config.ts` for validation)
- **`hooks/`** - Business logic (generation, extraction, subscription, auth)
- **`components/`** - UI (shadcn/ui + Radix), organized by type
- **`pages/`** - Routes (Landing, GeneratorV2, Settings, SignUp)
- **`libs/`** - Utilities (`promptBuilder.ts`, `api-client.ts`)

### Backend (`api/`)
Edge Functions with `runtime: 'edge'`. Each handles CORS and returns explicit status codes.

- **`claude/v1/messages.ts`** - Proxies to OpenRouter (maps `claude-3-5-sonnet-20241022` → `anthropic/claude-sonnet-4`)
- **`extract.ts`** - Jina Reader (free), 30s timeout, SSRF protection
- **`stripe/`** - Checkout and portal creation (JWT auth via Appwrite)
- **`stripe-webhook-simplified.ts`** - Webhook with idempotency via `processed_webhooks` collection
- **`utils/appwrite.ts`** - Server-side Appwrite SDK (node-appwrite) with JWT verification

### Database (Appwrite Cloud - Frankfurt)

**Project ID**: `698afdae002fb5faf679`
**Database ID**: `social_transformer`

**Collections:**
- `subscriptions` (14 attrs, 4 indexes) - Premium status (`is_active` SSOT), Stripe IDs, billing period
- `saved_posts` (3 attrs, 2 indexes) - User posts with document-level permissions
- `profiles` (7 attrs, 2 indexes) - Premium extraction tracking
- `generation_usage` (2 attrs, 2 indexes) - Generation tracking
- `pending_subscriptions` (12 attrs, 3 indexes) - In-progress subscription handling
- `processed_webhooks` (3 attrs, 1 unique index) - Webhook idempotency
- `webhook_anomalies` (5 attrs, 2 indexes) - Stripe anomaly detection

**Auth**: Email/Password + Magic URL via Appwrite Account service. JWT tokens for server-side verification.

## Key Patterns

**Premium Access**: `subscription.is_active` is single source of truth. Hooks cache for 60s.

**Free Tier Limits**: localStorage counter (`usage_YYYY-MM-DD`), checked against `config.limits.freeGenerationsPerDay`.

**API Proxy**: Claude API key stays server-side. Client calls Edge Function which adds OpenRouter key.

**Auth Flow**: Client creates JWT via `account.createJWT()` → sends as Bearer token → Edge Function verifies via `verifyJWT()` in `api/utils/appwrite.ts`.

**Document Permissions**: Saved posts use Appwrite document-level permissions (`Permission.read/update/delete(Role.user(userId))`).

**Temperature Scaling**: Base varies by platform (0.65 X, 0.7 default, 0.85 LinkedIn/Instagram). Regenerations increase progressively (0.75, 0.8, 0.85...).

**Prompt Format**: XML markers (`<instagram_descriptions>`) and explicit tags (`LINKEDIN:`, `X:`, `INSTAGRAM:`).

**Error Handling**: Sonner toasts in German. Status codes: 400 validation, 401 auth, 403 forbidden, 429 rate limit.

**Import Alias**: `@/` for `src/` (vite.config.ts).

## Environment Variables

**Client (VITE_ prefix)**:
- `VITE_APPWRITE_ENDPOINT` (required, `https://fra.cloud.appwrite.io/v1`)
- `VITE_APPWRITE_PROJECT_ID` (required)
- `VITE_STRIPE_PAYMENT_LINK_MONTHLY`, `VITE_STRIPE_PAYMENT_LINK_YEARLY`

**Server**:
- `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY` (Appwrite server SDK)
- `OPENROUTER_API_KEY` or `CLAUDE_API_KEY` (AI generation)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Important Behaviors

### Testing After Deployment
Wait ~45-60 seconds after `git push` for Vercel to deploy before testing production.

### Planning Before Implementation
- Read `app.config.ts` before making changes
- Ask for clarification rather than assuming
- Use EnterPlanMode for non-trivial tasks

### Adding Features
- **New platform**: `platforms.ts` → `useContentGeneration.ts` → `promptBuilder.ts` → UI
- **New feature flag**: `app.config.ts` under `features`
- **New Edge Function**: `api/` with `export const config = { runtime: 'edge' }`, implement CORS
- **Database change**: New collection via Appwrite MCP or Console

## Code Style
- TypeScript strict, React functional components
- TailwindCSS + shadcn/ui (Radix)
- ESLint flat config
- Files under 500 lines
- use zen mcp openrouter (ALWAYS!)
