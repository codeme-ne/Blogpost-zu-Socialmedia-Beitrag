import Stripe from 'stripe'
import { verifyJWT } from '../utils/appwrite.js'
import { parseJsonSafely } from '../utils/safeJson.js'

export const config = {
  runtime: 'edge',
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing required env var: STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2025-08-27.basil' })
}

const stripe = getStripe()

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const parseResult = await parseJsonSafely<{
      priceId?: string;
      mode?: 'payment' | 'subscription';
      successUrl?: string;
      cancelUrl?: string;
    }>(req, 10 * 1024);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: parseResult.error }),
        { status: parseResult.error.includes('too large') ? 413 : 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { priceId, mode = 'payment', successUrl, cancelUrl } = parseResult.data

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Price ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Success and cancel URLs are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!['payment', 'subscription'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Mode must be either "payment" or "subscription"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
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

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Stripe checkout creation error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
