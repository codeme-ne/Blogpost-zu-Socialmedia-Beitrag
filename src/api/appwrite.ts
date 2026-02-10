import { Client, Account, Databases, ID, Query, Permission, Role, Models } from 'appwrite'

// Lazy-initialized singletons — created on first access, after env validation in main.tsx
let _client: Client | null = null
let _account: Account | null = null
let _databases: Databases | null = null

function getClient(): Client {
  if (!_client) {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
    if (!endpoint || !projectId) {
      throw new Error('Appwrite not configured: VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID required')
    }
    _client = new Client().setEndpoint(endpoint).setProject(projectId)
  }
  return _client
}

// Public accessors (lazy) — bind methods to real instance to preserve `this` context
export const account = new Proxy({} as Account, {
  get: (_target, prop: string | symbol) => {
    if (!_account) _account = new Account(getClient())
    const value = Reflect.get(_account, prop)
    return typeof value === 'function' ? value.bind(_account) : value
  },
})

export const databases = new Proxy({} as Databases, {
  get: (_target, prop: string | symbol) => {
    if (!_databases) _databases = new Databases(getClient())
    const value = Reflect.get(_databases, prop)
    return typeof value === 'function' ? value.bind(_databases) : value
  },
})

const DB_ID = 'social_transformer'
const COLLECTIONS = {
  saved_posts: 'saved_posts',
  subscriptions: 'subscriptions',
  profiles: 'profiles',
  generation_usage: 'generation_usage',
  pending_subscriptions: 'pending_subscriptions',
  processed_webhooks: 'processed_webhooks',
  webhook_anomalies: 'webhook_anomalies',
} as const

export { getClient as getAppwriteClient }
// Re-export client getter for Realtime subscriptions
export const client = new Proxy({} as Client, {
  get: (_target, prop: string | symbol) => Reflect.get(getClient(), prop),
})

// --- Types ---

export interface SavedPost {
  id: string
  content: string
  created_at: string
  user_id?: string | null
  platform?: 'linkedin' | 'x' | 'instagram'
}

export interface GenerationUsage {
  id: string
  user_id: string
  generated_at: string
  created_at: string
}

// Appwrite user model - compatible shape for consumers
export interface AppwriteUser {
  id: string
  email: string
  name: string
}

// Session-like wrapper for compatibility with Supabase patterns
export interface SessionData {
  user: AppwriteUser
  access_token: string
}

// --- Helpers ---

function mapDocument(doc: Models.Document): SavedPost {
  const d = doc as Models.Document & { content: string; user_id?: string; platform?: string }
  return {
    id: d.$id,
    content: d.content,
    created_at: d.$createdAt,
    user_id: d.user_id,
    platform: d.platform as SavedPost['platform'],
  }
}

function mapUserToAppwriteUser(user: Models.User<Models.Preferences>): AppwriteUser {
  return {
    id: user.$id,
    email: user.email,
    name: user.name,
  }
}

// --- Saved Posts CRUD ---

export const savePost = async (content: string, platform: 'linkedin' | 'x' | 'instagram' = 'linkedin') => {
  const user = await account.get()
  const userId = user.$id

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.saved_posts,
    ID.unique(),
    { user_id: userId, content, platform },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]
  )

  return mapDocument(doc)
}

export const getSavedPosts = async () => {
  const user = await account.get()

  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.saved_posts,
    [
      Query.equal('user_id', user.$id),
      Query.orderDesc('$createdAt'),
    ]
  )

  return response.documents.map(mapDocument)
}

// Full export needs all documents, not only the SDK default page size.
export const getSavedPostsForExport = async () => {
  const user = await account.get()
  const limit = 100
  let offset = 0
  const all: SavedPost[] = []

  while (true) {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.saved_posts,
      [
        Query.equal('user_id', user.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset),
      ]
    )

    const page = response.documents.map(mapDocument)
    all.push(...page)

    offset += page.length
    if (page.length === 0 || offset >= response.total) break
  }

  return all
}

export const deleteSavedPost = async (id: string) => {
  await databases.deleteDocument(DB_ID, COLLECTIONS.saved_posts, id)
}

export const updateSavedPost = async (id: string, content: string) => {
  await databases.updateDocument(DB_ID, COLLECTIONS.saved_posts, id, { content })
}

// --- Auth Helpers ---

const getRedirectUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  const envSiteUrl = (import.meta.env.VITE_SITE_URL || import.meta.env.VITE_BASE_URL) as string | undefined
  if (envSiteUrl && envSiteUrl.trim().length > 0) return envSiteUrl.trim().replace(/\/$/, '')

  return 'https://linkedin-posts-one.vercel.app'
}

// Magic URL Login
export const signInWithEmail = async (email: string) => {
  try {
    await account.createMagicURLToken(
      ID.unique(),
      email,
      `${getRedirectUrl()}/auth/verify`
    )
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Sign Up + Magic Link verification (no auto-login)
export const signUpAndSendMagicLink = async (email: string, password: string) => {
  try {
    await account.create(ID.unique(), email, password)
    await account.createMagicURLToken(
      ID.unique(),
      email,
      `${getRedirectUrl()}/auth/verify`
    )
    return { data: { emailSent: true }, error: null }
  } catch (error: unknown) {
    return { data: null, error }
  }
}

// Password-based Sign Up
export const signUpWithPassword = async (email: string, password: string) => {
  try {
    await account.create(ID.unique(), email, password)
    // Auto-login after registration
    await account.createEmailPasswordSession(email, password)
    const user = await account.get()
    return {
      data: {
        user: mapUserToAppwriteUser(user),
        session: true,
      },
      error: null,
    }
  } catch (error: unknown) {
    return { data: { user: null, session: null }, error }
  }
}

// Password-based Sign In
export const signInWithPassword = async (email: string, password: string) => {
  try {
    await account.createEmailPasswordSession(email, password)
    const user = await account.get()
    return {
      data: {
        user: mapUserToAppwriteUser(user),
        session: true,
      },
      error: null,
    }
  } catch (error: unknown) {
    return { data: { user: null, session: null }, error }
  }
}

// Password Reset - send recovery email
export const resetPasswordForEmail = async (email: string) => {
  try {
    await account.createRecovery(email, `${getRedirectUrl()}/reset-password`)
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Update Password (after reset) - requires userId and secret from recovery URL
export const updatePassword = async (newPassword: string, userId?: string, secret?: string) => {
  try {
    if (userId && secret) {
      await account.updateRecovery(userId, secret, newPassword)
    } else {
      await account.updatePassword(newPassword)
    }
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export const signOut = async () => {
  try {
    await account.deleteSession('current')
  } catch {
    // Session may already be expired
  }
}

// Get current session / user
export const getSession = async (): Promise<{
  data: { session: SessionData | null }
}> => {
  try {
    const user = await account.get()
    // Create JWT for API calls
    let accessToken = ''
    try {
      const jwt = await account.createJWT()
      accessToken = jwt.jwt
    } catch {
      // JWT creation may fail - non-critical
    }

    return {
      data: {
        session: {
          user: mapUserToAppwriteUser(user),
          access_token: accessToken,
        },
      },
    }
  } catch {
    return { data: { session: null } }
  }
}

// Get current user directly (simpler API for Appwrite)
export const getCurrentUser = async (): Promise<AppwriteUser | null> => {
  try {
    const user = await account.get()
    return mapUserToAppwriteUser(user)
  } catch {
    return null
  }
}

// Create JWT for server-side auth
export const createJWT = async (): Promise<string | null> => {
  try {
    const jwt = await account.createJWT()
    return jwt.jwt
  } catch {
    return null
  }
}

// Auth state change listener
// Appwrite uses Realtime subscriptions for account changes
export const onAuthStateChange = (
  callback: (event: string, session: SessionData | null) => void
) => {
  try {
    // Subscribe to account events via Appwrite Realtime
    const unsubscribe = client.subscribe('account', async (response) => {
      // Determine event type from Appwrite events
      const events = response.events || []
      const isSessionCreate = events.some((e: string) => e.includes('sessions') && e.includes('create'))
      const isSessionDelete = events.some((e: string) => e.includes('sessions') && e.includes('delete'))

      if (isSessionDelete) {
        callback('SIGNED_OUT', null)
        return
      }

      if (isSessionCreate) {
        try {
          const user = await account.get()
          let accessToken = ''
          try {
            const jwt = await account.createJWT()
            accessToken = jwt.jwt
          } catch {
            // non-critical
          }
          callback('SIGNED_IN', {
            user: mapUserToAppwriteUser(user),
            access_token: accessToken,
          })
        } catch {
          callback('SIGNED_OUT', null)
        }
        return
      }

      // For other account events, check current state and issue fresh JWT
      try {
        const user = await account.get()
        let accessToken = ''
        try {
          const jwt = await account.createJWT()
          accessToken = jwt.jwt
        } catch {
          // JWT creation may fail — non-critical
        }
        callback('TOKEN_REFRESHED', {
          user: mapUserToAppwriteUser(user),
          access_token: accessToken,
        })
      } catch {
        callback('SIGNED_OUT', null)
      }
    })

    // Return compatible subscription object
    return {
      data: {
        subscription: {
          unsubscribe,
        },
      },
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to subscribe to auth state changes:', error)
    // Return no-op subscription to prevent crashes
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }
  }
}

// Magic URL session verification (called after user clicks magic link)
export const verifyMagicURL = async (userId: string, secret: string) => {
  try {
    await account.updateMagicURLSession(userId, secret)
    const user = await account.get()
    return {
      data: { user: mapUserToAppwriteUser(user) },
      error: null,
    }
  } catch (error) {
    return { data: { user: null }, error }
  }
}

// --- Database Queries (for hooks that query directly) ---

export const querySubscription = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.subscriptions,
      [Query.equal('user_id', userId), Query.limit(1)]
    )

    if (response.documents.length === 0) {
      return { data: null, error: null }
    }

    const doc = response.documents[0]
    return {
      data: {
        id: doc.$id,
        user_id: doc.user_id,
        stripe_customer_id: doc.stripe_customer_id,
        stripe_subscription_id: doc.stripe_subscription_id,
        stripe_payment_intent_id: doc.stripe_payment_intent_id,
        status: doc.status,
        is_active: doc.is_active,
        interval: doc.interval,
        amount: doc.amount,
        currency: doc.currency,
        current_period_end: doc.current_period_end,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}
