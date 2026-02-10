import { verifyJWT, getServerDatabases, DB_ID, Query } from './utils/appwrite.js'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Missing or invalid authorization header', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user token via Appwrite JWT
    const user = await verifyJWT(token)

    if (!user) {
      return new Response('Invalid or expired token', { status: 401 })
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

    return new Response(
      JSON.stringify({
        success: true,
        activated: activatedCount,
        message: activatedCount > 0 ? 'Subscriptions activated successfully' : 'No pending subscriptions found'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Reconcile subscription error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
