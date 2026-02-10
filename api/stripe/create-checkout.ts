import Stripe from 'stripe'
import { verifyJWT } from '../utils/appwrite.js'
import { parseJsonSafely } from '../utils/safeJson.js'
import { createCorsResponse, handlePreflight } from '../utils/cors.js'

// Allowed origins for successUrl/cancelUrl to prevent open redirect
const ALLOWED_ORIGINS = [
  'https://linkedin-posts-one.vercel.app',
  'https://transformer.social',
  'http://localhost:5173',
  'http://localhost:3001',
];

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.some(origin => parsed.origin === origin);
  } catch {
    return false;
  }
}

export const config = {
  runtime: 'edge',
}

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Missing required env var: STRIPE_SECRET_KEY')
    _stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' })
  }
  return _stripe
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
    const stripe = getStripe()

    const parseResult = await parseJsonSafely<{
      priceId?: string;
      mode?: 'payment' | 'subscription';
      successUrl?: string;
      cancelUrl?: string;
    }>(req, 10 * 1024);

    if (!parseResult.success) {
      const errMsg = parseResult.error;
      return createCorsResponse(
        { error: errMsg },
        { status: errMsg.includes('too large') ? 413 : 400, origin }
      );
    }

    const { priceId, mode = 'payment', successUrl, cancelUrl } = parseResult.data

    if (!priceId) {
      return createCorsResponse({ error: 'Price ID is required' }, { status: 400, origin })
    }

    if (!successUrl || !cancelUrl) {
      return createCorsResponse({ error: 'Success and cancel URLs are required' }, { status: 400, origin })
    }

    // Validate redirect URLs against allowed origins to prevent open redirect
    if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
      return createCorsResponse({ error: 'Invalid redirect URL' }, { status: 400, origin })
    }

    if (!['payment', 'subscription'].includes(mode)) {
      return createCorsResponse({ error: 'Mode must be either "payment" or "subscription"' }, { status: 400, origin })
    }

    // Get user from Authorization header (Appwrite JWT)
    let user: { id: string; email: string } | null = null
    let clientReferenceId: string | null = null

    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        user = await verifyJWT(token)
        clientReferenceId = user?.id || null
      } catch {
        // Continue without user if token is invalid
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    }

    if (clientReferenceId) {
      sessionParams.client_reference_id = clientReferenceId
    }

    if (user?.email) {
      const existingCustomer = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (existingCustomer.data.length > 0) {
        sessionParams.customer = existingCustomer.data[0].id
      } else {
        sessionParams.customer_email = user.email
        sessionParams.customer_creation = 'always'
      }
    } else {
      sessionParams.customer_creation = 'always'
      sessionParams.tax_id_collection = { enabled: true }
    }

    if (mode === 'payment') {
      sessionParams.payment_intent_data = {
        setup_future_usage: 'on_session'
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return createCorsResponse({ url: session.url }, { status: 200, origin })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Stripe checkout creation error:', err)
    const isDevelopment = process.env.NODE_ENV === 'development'
    return createCorsResponse(
      { error: 'Failed to create checkout session.', ...(isDevelopment && { details: err.message }) },
      { status: 500, origin }
    )
  }
}
