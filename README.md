# Social Transformer

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Edge-000000?logo=vercel&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-29%20passing-green?logo=vitest&logoColor=white)
![CI](https://github.com/codeme-ne/linkedin-posts/actions/workflows/ci.yml/badge.svg)

**AI-powered content transformation platform that converts newsletters and articles into platform-optimized social media posts.**

[Live Demo](https://linkedin-posts-one.vercel.app/) · [Report Bug](https://github.com/codeme-ne/linkedin-posts/issues) · [Request Feature](https://github.com/codeme-ne/linkedin-posts/issues)

</div>

---

## Demo

https://github.com/user-attachments/assets/demo-video.mp4

> **[Try it live →](https://linkedin-posts-one.vercel.app/)**

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Platform Generation** | Create optimized posts for LinkedIn, X (Twitter), and Instagram from a single input |
| **Smart URL Extraction** | Extract content from any URL using Jina Reader with automatic cleaning |
| **Batched AI Processing** | Cost-optimized API calls - generates for all platforms in a single request |
| **Voice & Tone Control** | Customize output style with configurable tone presets |
| **Post Management** | Save, edit, and organize generated content with Appwrite backend |
| **One-Click Sharing** | Share directly to social platforms or copy to clipboard |
| **Freemium Model** | Free tier (3/day) with Pro subscriptions via Stripe |
| **Mobile-First Design** | Responsive UI with bottom sheet navigation on mobile/tablet |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React 19 + Vite 7)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pages/     │  │  Components/ │  │   Hooks/     │  │   Config/    │    │
│  │  GeneratorV2 │  │  shadcn/ui   │  │  useContent  │  │  app.config  │    │
│  │  Settings    │  │  Radix UI    │  │  Generation  │  │  env.config  │    │
│  │  Landing     │  │  Mobile UI   │  │  useAuth     │  │  platforms   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EDGE FUNCTIONS (Vercel)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ /api/openrouter ││ /api/extract │  │ /api/stripe  │  │ /api/share   │    │
│  │   Proxy to      ││ Jina Reader  │  │  Checkout    │  │  LinkedIn    │    │
│  │   OpenRouter    ││  Extraction  │  │   Portal     │  │   Share      │    │
│  └──────────────┘  └──────────────┘  │   Webhook    │  └──────────────┘    │
│                                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │  OpenRouter  │  │   Appwrite   │  │    Stripe    │
          │      AI      │  │  Auth + DB   │  │   Payments   │
          │              │  │ Auth + DB    │  │              │
          └──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

```
User Input → URL Extraction (optional) → AI Generation → Display → Save/Share
     │              │                          │            │          │
     └──────────────┴──────────────────────────┴────────────┴──────────┘
                            All operations use React hooks
                            with optimistic UI updates
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 | Modern SPA with strict type safety |
| **Styling** | TailwindCSS 3.4, shadcn/ui, Radix | Accessible, composable components |
| **State** | Custom hooks, React Context | Encapsulated business logic |
| **Backend** | Vercel Edge Functions | Serverless API with low latency |
| **Database** | Appwrite Cloud | Managed database + document permissions |
| **Auth** | Appwrite Auth | Magic link authentication |
| **AI** | OpenRouter | Content transformation |
| **Payments** | Stripe | Subscription management |
| **Testing** | Vitest, Testing Library | Unit tests with 29 test cases |
| **CI/CD** | GitHub Actions | Automated lint, type-check, test, deploy |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Appwrite account
- OpenRouter API key

### Installation

```bash
# Clone repository
git clone https://github.com/codeme-ne/linkedin-posts.git
cd linkedin-posts

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev:full
```

### Environment Variables

```env
# Required - Appwrite (client)
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id

# Required - Appwrite (server)
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=standard_your-api-key

# Required - AI
OPENROUTER_API_KEY=sk-or-v1-...

# Required - Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PAYMENT_LINK_MONTHLY=https://buy.stripe.com/...
VITE_STRIPE_PAYMENT_LINK_YEARLY=https://buy.stripe.com/...
```

### Appwrite MCP

If you want to manage Appwrite resources via an MCP-enabled IDE/LLM, see `docs/Appwrite-MCP.md`.

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:full` | Start frontend (5173) + API (3010) |
| `npm run build` | TypeScript + Vite production build |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | ESLint check |
| `npm run type-check` | TypeScript strict check |

### Project Structure

```
src/
├── api/           # API client wrappers (openrouter, extract, appwrite)
├── components/    # UI components (shadcn/ui based)
│   ├── ui/        # Base components (Button, Card, Dialog...)
│   ├── common/    # Shared components (UrlExtractor, PlatformSelector)
│   ├── mobile/    # Mobile-specific (BottomSheet)
│   └── modals/    # Modal dialogs (Upgrade, Login)
├── config/        # Centralized configuration
├── hooks/         # Business logic hooks
│   ├── useContentGeneration.ts  # AI generation orchestration
│   ├── useUrlExtraction.ts      # Content extraction
│   ├── useSubscription.ts       # Access control
│   └── useAuth.ts               # Authentication
├── pages/         # Route components
├── libs/          # Utilities (promptBuilder, api-client)
└── test/          # Test files

api/               # Vercel Edge Functions
├── openrouter/    # OpenRouter AI proxy
├── stripe/        # Payment endpoints
└── extract.ts     # URL extraction
```

---

## Key Implementation Details

### Batched Generation (Cost Optimization)

Multi-platform requests use a single API call, reducing costs by ~67%:

```typescript
// src/hooks/useContentGeneration.ts
if (selectedPlatforms.length > 1) {
  const batchedResult = await batchedPostsFromContent(inputText, selectedPlatforms)
  if (batchedResult) {
    newPosts = batchedResult // Single API call for all platforms
  } else {
    newPosts = await executeParallelGeneration(inputText, selectedPlatforms) // Fallback
  }
}
```

### Subscription Access Control

Single source of truth pattern via `is_active` boolean:

```typescript
// src/hooks/useSubscription.ts
const hasAccess = subscription?.is_active === true
const hasUsageRemaining = () => {
  if (hasAccess) return true
  return localStorage usage < config.limits.freeGenerationsPerDay
}
```

### Edge Function Security

OpenRouter API key never exposed to client - all requests proxied through edge:

```typescript
// api/openrouter/v1/chat.ts
export const config = { runtime: 'edge' }
// Uses OPENROUTER_API_KEY from server environment
```

---

## Testing

29 test cases covering core functionality:

```bash
npm run test:run

# Output:
✓ src/test/utils/validation.test.ts (8 tests)
✓ src/test/api/claude.test.ts (10 tests)
✓ src/test/hooks/useContentGeneration.test.ts (11 tests)

Test Files  3 passed (3)
     Tests  29 passed (29)
```

Test categories:
- **Hooks**: Generation lifecycle, error handling, state management
- **API**: Response parsing, error recovery, validation
- **Utils**: Input validation, content normalization

---

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables in dashboard
3. Deploy triggers automatically on push to `main`

CI/CD pipeline includes:
- ESLint validation
- TypeScript type checking
- Test suite (29 tests)
- Coverage reporting
- Production build verification

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/openrouter/v1/chat` | POST | Bearer | OpenRouter AI proxy |
| `/api/extract` | POST | - | URL content extraction |
| `/api/stripe/create-checkout` | POST | Bearer | Stripe checkout session |
| `/api/stripe/create-portal` | POST | Bearer | Customer portal link |
| `/api/stripe-webhook-simplified` | POST | Signature | Webhook handler |

---

## License

Private repository - All rights reserved.

---

## Author

**Lukas Zangerl**

- GitHub: [@codeme-ne](https://github.com/codeme-ne)
- LinkedIn: [Connect](https://linkedin.com/in/lukaszangerl)

---

<div align="center">

Built with React 19 · TypeScript · Vercel Edge · OpenRouter

**[View Live Demo →](https://linkedin-posts-one.vercel.app/)**

</div>
