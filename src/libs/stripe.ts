// Stripe utility functions for Social Transformer
// Based on Ship Fast best practices, adapted for Supabase

export interface CreateCustomerPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  couponId?: string;
  clientReferenceId?: string;
  user?: {
    id: string;
    email?: string;
    customerId?: string;
  };
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface StripeSession {
  id: string;
  url: string;
  customer?: string;
  line_items?: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        product: string;
        recurring?: {
          interval: 'month' | 'year';
        };
      };
    }>;
  };
}

/**
 * Create a Stripe Customer Portal session for subscription management
 * @param params - Portal creation parameters
 * @returns Promise<string> - Portal URL
 */
export async function createCustomerPortal(params: CreateCustomerPortalParams): Promise<string> {
  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    if (!portalSession.url) {
      throw new Error('Portal session URL not received from Stripe');
    }

    return portalSession.url;
  } catch (error) {
    console.error('Error creating customer portal:', error);
    throw new Error(
      error instanceof Error 
        ? `Portal creation failed: ${error.message}` 
        : 'Unknown portal creation error'
    );
  }
}

/**
 * Create a Stripe Checkout session for payments
 * @param params - Checkout creation parameters  
 * @returns Promise<string> - Checkout URL
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const extraParams: Record<string, unknown> = {};

    // Handle existing customer or create new one
    if (params.user?.customerId) {
      extraParams.customer = params.user.customerId;
    } else {
      if (params.mode === 'payment') {
        extraParams.customer_creation = 'always';
        extraParams.payment_intent_data = { setup_future_usage: 'on_session' };
      }
      if (params.user?.email) {
        extraParams.customer_email = params.user.email;
      }
      extraParams.tax_id_collection = { enabled: true };
    }

    const sessionParams = {
      mode: params.mode,
      allow_promotion_codes: true,
      client_reference_id: params.clientReferenceId,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      discounts: params.couponId
        ? [
            {
              coupon: params.couponId,
            },
          ]
        : [],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...extraParams,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new Error('Checkout session URL not received from Stripe');
    }

    return session.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error(
      error instanceof Error 
        ? `Checkout creation failed: ${error.message}` 
        : 'Unknown checkout creation error'
    );
  }
}

/**
 * Retrieve a checkout session with expanded line items
 * @param sessionId - Stripe session ID
 * @returns Promise<StripeSession | null> - Session data or null if not found
 */
export async function findCheckoutSession(sessionId: string): Promise<StripeSession | null> {
  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    return session as StripeSession;
  } catch (error) {
    console.error('Error finding checkout session:', error);
    return null;
  }
}

/**
 * Validate Stripe environment configuration
 * @throws Error if required environment variables are missing
 */
export function validateStripeConfig(): void {
  const requiredEnvVars = ['STRIPE_SECRET_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missingVars.join(', ')}`
    );
  }
}

/**
 * Format price from cents to display format
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'eur')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Check if an interval is valid
 * @param interval - Interval to check
 * @returns boolean
 */
export function isValidInterval(interval: string): interval is 'monthly' | 'yearly' {
  return ['monthly', 'yearly'].includes(interval);
}