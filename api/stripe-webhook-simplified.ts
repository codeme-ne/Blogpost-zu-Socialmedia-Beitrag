import Stripe from 'stripe'
import { getServerDatabases, getUserIdByEmail, createUser, DB_ID, Query } from './utils/appwrite.js'
import { ID } from 'node-appwrite'

// Fix TypeScript definition issues - some fields exist in API but not in types
declare module 'stripe' {
  namespace Stripe {
    interface Invoice {
      subscription?: string | Stripe.Subscription | null;
    }
  }
}

// Type for subscription item with period fields (API version 2025-08-27.basil)
interface SubscriptionItemWithPeriod extends Stripe.SubscriptionItem {
  current_period_start?: number;
  current_period_end?: number;
}

export const config = {
  runtime: 'edge',
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

// Initialize Stripe (lazy to allow clear error on missing env)
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-08-27.basil',
    })
  }
  return _stripe
}

let _webhookSecret: string | null = null
function getWebhookSecret(): string {
  if (!_webhookSecret) _webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
  return _webhookSecret
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let stripe: Stripe
  let webhookSecret: string
  try {
    stripe = getStripe()
    webhookSecret = getWebhookSecret()
  } catch (e) {
    console.error('Stripe not configured properly:', e)
    return new Response('Stripe configuration missing', { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('No stripe signature header')
    return new Response('No signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret, 300)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error(`Webhook signature verification failed: ${error.message}`)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const databases = getServerDatabases()

  // Idempotency protection
  try {
    await databases.createDocument(
      DB_ID,
      'processed_webhooks',
      ID.unique(),
      {
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString()
      }
    )
  } catch (e: any) {
    // Check for duplicate (Appwrite unique index violation)
    if (e?.code === 409 || e?.type === 'document_already_exists') {
      console.log(`Duplicate webhook event ${event.id}, skipping`)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    console.error('Webhook recording error:', e)
  }

  console.log(`Processing Stripe event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const customerId = session.customer as string
        const priceId = session.line_items?.data?.[0]?.price?.id
        const clientReferenceId = session.client_reference_id
        const amount = session.amount_total
        const currency = session.currency

        if (!customerId || !priceId || !amount) {
          console.error('Missing required session data', { customerId, priceId, amount })
          break
        }

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer

        let userId = clientReferenceId

        if (!userId && customer.email) {
          const existingUserId = await getUserIdByEmail(customer.email)

          if (existingUserId) {
            userId = existingUserId
          } else {
            const newUser = await createUser(customer.email)
            if (!newUser) {
              console.error('Failed to create user')
              break
            }
            userId = newUser.id
          }
        }

        if (!userId) {
          console.error('Unable to determine user ID for checkout session')
          break
        }

        // Determine subscription interval
        let interval = 'monthly'
        const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
        const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;

        const CORRECT_PRICES = {
          monthly: 2900,
          yearly: 29900,
        };

        switch (priceId) {
          case monthlyPriceId:
            interval = 'monthly';
            break;
          case yearlyPriceId:
            interval = 'yearly';
            break;
          default: {
            console.error('Unknown price ID received:', priceId)

            try {
              await databases.createDocument(DB_ID, 'webhook_anomalies', ID.unique(), {
                event_id: event.id,
                anomaly_type: 'unknown_price_id',
                details: JSON.stringify({
                  received_price_id: priceId,
                  expected_monthly: monthlyPriceId,
                  expected_yearly: yearlyPriceId,
                  session_id: session.id,
                  session_mode: session.mode,
                  amount: amount,
                  timestamp: new Date().toISOString(),
                }),
              })
            } catch (logErr) {
              console.error('Failed to log unknown price ID anomaly:', logErr)
            }

            interval = session.mode === 'subscription' ? 'monthly' : 'yearly';
            break;
          }
        }

        const expectedAmount = CORRECT_PRICES[interval as keyof typeof CORRECT_PRICES];
        if (amount !== expectedAmount) {
          console.error('Price mismatch detected:', { expected: expectedAmount, received: amount })

          try {
            await databases.createDocument(DB_ID, 'webhook_anomalies', ID.unique(), {
              event_id: event.id,
              anomaly_type: 'price_mismatch',
              expected_value: expectedAmount,
              received_value: amount,
              details: JSON.stringify({
                interval,
                session_id: session.id,
                price_id: priceId,
                customer_id: customerId,
                difference_cents: amount - expectedAmount,
                timestamp: new Date().toISOString(),
              }),
            })
          } catch (logErr) {
            console.error('Failed to log price mismatch anomaly:', logErr)
          }
        }
        const validatedAmount = expectedAmount;

        // Check if subscription already exists for this user
        const existingSubs = await databases.listDocuments(DB_ID, 'subscriptions', [
          Query.equal('user_id', userId),
          Query.limit(1),
        ])

        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_payment_intent_id: session.payment_intent as string || '',
          stripe_subscription_id: session.subscription as string || '',
          status: 'active',
          is_active: true,
          amount: validatedAmount,
          currency: currency || 'eur',
          interval,
          stripe_price_id: priceId,
          current_period_start: new Date().toISOString(),
          current_period_end: interval === 'yearly'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }

        if (existingSubs.documents.length > 0) {
          await databases.updateDocument(DB_ID, 'subscriptions', existingSubs.documents[0].$id, subscriptionData)
        } else {
          await databases.createDocument(DB_ID, 'subscriptions', ID.unique(), subscriptionData)
        }

        console.log(`Subscription activated for user ${userId}`)

        await sendWelcomeEmail(customer.email || '', {
          amount: amount / 100,
          currency: currency || 'eur',
          interval,
        }).catch(err => console.error('Email sending failed:', err))

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const firstItem = subscription.items?.data?.[0] as SubscriptionItemWithPeriod | undefined
        const periodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000)
        const periodEnd = firstItem?.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)

        // Find subscription by stripe_subscription_id
        const subs = await databases.listDocuments(DB_ID, 'subscriptions', [
          Query.equal('stripe_subscription_id', subscription.id),
          Query.limit(1),
        ])

        if (subs.documents.length > 0) {
          await databases.updateDocument(DB_ID, 'subscriptions', subs.documents[0].$id, {
            status: subscription.status,
            is_active: subscription.status === 'active',
            current_period_start: new Date(periodStart * 1000).toISOString(),
            current_period_end: new Date(periodEnd * 1000).toISOString(),
          })
          console.log(`Subscription updated: ${subscription.id}`)
        } else {
          console.error('Subscription not found for update:', subscription.id)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const subs = await databases.listDocuments(DB_ID, 'subscriptions', [
          Query.equal('stripe_subscription_id', subscription.id),
          Query.limit(1),
        ])

        if (subs.documents.length > 0) {
          await databases.updateDocument(DB_ID, 'subscriptions', subs.documents[0].$id, {
            status: 'canceled',
            is_active: false,
          })
          console.log(`Subscription canceled: ${subscription.id}`)
        } else {
          console.error('Subscription not found for cancellation:', subscription.id)
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const subs = await databases.listDocuments(DB_ID, 'subscriptions', [
            Query.equal('stripe_subscription_id', invoice.subscription as string),
            Query.limit(1),
          ])

          if (subs.documents.length > 0) {
            await databases.updateDocument(DB_ID, 'subscriptions', subs.documents[0].$id, {
              status: 'active',
              is_active: true,
            })
            console.log(`Recurring payment processed for subscription: ${invoice.subscription}`)
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          console.log(`Payment failed for subscription: ${invoice.subscription}`)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`Webhook processing error for ${event.type}:`, err)
    return new Response('Webhook processing error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

async function sendWelcomeEmail(email: string, details: {
  amount: number
  currency: string
  interval: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !email) return

  const subject = details.interval === 'yearly'
    ? 'Willkommen bei Social Transformer - Ihr Jahres-Abo ist aktiv!'
    : 'Willkommen bei Social Transformer - Ihr Pro-Abo ist aktiv!'

  const euros = details.amount.toFixed(2)
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6; color:#0f172a;">
      <h2 style="margin:0 0 16px; color:#1f2937;">Willkommen bei Social Transformer!</h2>
      <p>Vielen Dank fuer Ihren Kauf. Ihr ${details.interval === 'yearly' ? 'Jahres-Abo' : 'Pro-Abo'} ist jetzt aktiv!</p>

      <div style="background:#f8fafc; padding:16px; border-radius:8px; margin:16px 0;">
        <h3 style="margin:0 0 8px; color:#374151;">Ihre Bestellung:</h3>
        <p style="margin:4px 0;"><strong>Plan:</strong> ${details.interval === 'yearly' ? 'Yearly Pro' : 'Monthly Pro'}</p>
        <p style="margin:4px 0;"><strong>Betrag:</strong> EUR ${euros}</p>
      </div>

      <p><strong>Jetzt loslegen:</strong><br>
      <a href="https://transformer.social/app" style="color:#2563eb; text-decoration:none;">Social Transformer App oeffnen</a></p>

      <p>Sie haben jetzt Zugang zu allen Premium-Features:</p>
      <ul>
        <li>Unbegrenzte Content-Generierung</li>
        <li>Premium URL-Extraktion mit JavaScript-Support</li>
        <li>Posts speichern & verwalten</li>
        <li>Alle Plattformen (LinkedIn, X, Instagram)</li>
      </ul>

      <p style="margin-top:24px; font-size:14px; color:#6b7280;">
        Bei Fragen antworten Sie einfach auf diese E-Mail.<br>
        Viel Erfolg mit Social Transformer!
      </p>
    </div>
  `

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Social Transformer <welcome@transformer.social>',
        to: email,
        subject,
        html
      })
    })
  } catch (error) {
    console.error('Welcome email failed:', error)
  }
}
