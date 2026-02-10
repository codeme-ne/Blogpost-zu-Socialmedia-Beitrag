import { verifyJWT, getServerDatabases, DB_ID, Query } from './utils/appwrite.js'
import { createCorsResponse, handlePreflight } from './utils/cors.js'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return handlePreflight(origin)
  }

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, { status: 405, origin })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return createCorsResponse({ error: 'Missing or invalid authorization header' }, { status: 401, origin })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user token via Appwrite JWT
    const user = await verifyJWT(token)

    if (!user) {
      return createCorsResponse({ error: 'Invalid or expired token' }, { status: 401, origin })
    }

    const databases = getServerDatabases()

    // Check for pending subscriptions that need activation
    const pendingSubs = await databases.listDocuments(DB_ID, 'subscriptions', [
      Query.equal('user_id', user.id),
      Query.equal('is_active', false),
      Query.equal('status', 'paid'),
    ])

    let activatedCount = 0

    if (pendingSubs.documents.length > 0) {
      // Activate pending subscriptions
      for (const sub of pendingSubs.documents) {
        try {
          await databases.updateDocument(DB_ID, 'subscriptions', sub.$id, {
            is_active: true,
            activated_at: new Date().toISOString(),
          })
          activatedCount++
        } catch (err) {
          console.error('Error activating subscription:', err)
        }
      }
    }

    return createCorsResponse({
      success: true,
      activated: activatedCount,
      message: activatedCount > 0 ? 'Subscriptions activated successfully' : 'No pending subscriptions found'
    }, { status: 200, origin })

  } catch (error) {
    console.error('Reconcile subscription error:', error)
    return createCorsResponse({ error: 'Internal server error' }, { status: 500, origin })
  }
}
