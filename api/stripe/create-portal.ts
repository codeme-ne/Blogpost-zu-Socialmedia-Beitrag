import { verifyJWT, getServerDatabases, DB_ID, Query } from '../utils/appwrite.js'

export const config = {
  runtime: 'edge',
};

interface RequestBody {
  returnUrl: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Validate authentication via Appwrite JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Nicht angemeldet', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyJWT(token);

    if (!user) {
      return new Response('Ungueltiger Auth Token', { status: 401 });
    }

    // Parse request body
    const body: RequestBody = await req.json();

    if (!body.returnUrl) {
      return new Response('Return URL ist erforderlich', { status: 400 });
    }

    // Get user's subscription with customerId
    const databases = getServerDatabases();
    const subs = await databases.listDocuments(DB_ID, 'subscriptions', [
      Query.equal('user_id', user.id),
      Query.limit(1),
    ]);

    if (subs.documents.length === 0) {
      return new Response('Du hast noch kein Billing-Konto. Kaufe zuerst ein Abo.', { status: 400 });
    }

    const subscription = subs.documents[0];

    if (!subscription.stripe_customer_id) {
      return new Response('Kein Stripe Customer ID gefunden. Kontaktiere den Support.', { status: 400 });
    }

    // Initialize Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Missing required env var: STRIPE_SECRET_KEY');
    const stripe = new (await import('stripe')).default(stripeKey);

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: body.returnUrl,
    });

    if (!portalSession.url) {
      throw new Error('Portal session URL nicht erhalten');
    }

    return new Response(JSON.stringify({
      url: portalSession.url
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Customer Portal Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
