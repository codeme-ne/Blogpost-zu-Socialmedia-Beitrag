/**
 * Central App Configuration for Social Transformer
 * Based on Ship Fast patterns, adapted for German SaaS with Appwrite
 */

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'EUR' | 'USD';
  interval: 'monthly' | 'yearly';
  // ShipFast pattern: priceId for Checkout Sessions + fallback paymentLink
  priceId: string;
  paymentLink?: string; // Fallback for existing components
  features: string[];
  popular?: boolean;
  badge?: string;
}

export interface AppFeature {
  name: string;
  description: string;
  enabled: boolean;
  requiresAuth?: boolean;
  requiresSubscription?: boolean;
}

export interface AppConfig {
  // App metadata
  appName: string;
  appDescription: string;
  domainName: string;
  companyName: string;
  
  // URLs
  urls: {
    app: string;
    landing: string;
    signup: string;
    settings: string;
    generator: string;
  };
  
  // Stripe configuration
  stripe: {
    plans: StripePlan[];
    defaultPlan: string;
    features: {
      free: string[];
      premium: string[];
    };
  };
  
  // Feature flags
  features: {
    linkedinPosting: AppFeature;
    postSaving: AppFeature;
    multiPlatform: AppFeature;
    directPosting: AppFeature;
  };
  
  // Email configuration
  resend?: {
    fromNoReply: string;
    fromAdmin: string;
  };
  
  // Theme and branding
  theme: {
    primaryColor: string;
    accentColor: string;
    brandColors: {
      gradient: string;
      hover: string;
    };
  };
  
  // Auth configuration
  auth: {
    loginUrl: string;
    callbackUrl: string;
    redirectAfterAuth: string;
  };
  
  // Limits and quotas
  limits: {
    maxPostLength: {
      linkedin: number;
      x: number;
      instagram: number;
    };
    freeGenerationsPerDay: number;
  };
  
  // Environment-specific settings
  env: {
    isDevelopment: boolean;
    isProduction: boolean;
    baseUrl: string;
  };
}

/**
 * Main application configuration
 * German-first SaaS for social media content transformation
 */
const config: AppConfig = {
  appName: "Social Transformer",
  appDescription: "KI-gestützte Social Media Content-Erstellung für LinkedIn, X und Instagram",
  domainName: import.meta.env.VITE_DOMAIN_NAME || "transformer.social",
  companyName: "Social Transformer",
  
  urls: {
    app: "/app",
    landing: "/",
    signup: "/signup", 
    settings: "/settings",
    generator: "/app",
  },
  
  stripe: {
    plans: [
      {
        id: "monthly",
        name: "Monthly",
        description: "Flexibles Monatsabo",
        price: 29,
        currency: "EUR",
        interval: "monthly",
        // ShipFast pattern: priceId for dynamic checkout sessions
        priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || "",
        paymentLink: import.meta.env.VITE_STRIPE_PAYMENT_LINK_MONTHLY || "", // Fallback
        features: [
          "Unbegrenzte Posts",
          "Alle Plattformen (LinkedIn, X, Instagram)",
          "Premium URL-Extraktion (JavaScript-Support)",
          "Posts speichern & verwalten",
          "Direct-Posting zu Social Media"
        ]
      },
      {
        id: "yearly",
        name: "Pro - Yearly",
        description: "Jährliches Abo mit Rabatt",
        price: 299,
        currency: "EUR",
        interval: "yearly",
        // ShipFast pattern: priceId for dynamic checkout sessions
        priceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || "",
        paymentLink: import.meta.env.VITE_STRIPE_PAYMENT_LINK_YEARLY || "", // Fallback
        features: [
          "Unbegrenzte Posts",
          "Alle Plattformen (LinkedIn, X, Instagram)",
          "Premium URL-Extraktion (JavaScript-Support)",
          "Posts speichern & verwalten",
          "Direct-Posting zu Social Media",
          "2 Monate gratis im Vergleich zum Monatsabo"
        ],
        popular: true,
        badge: "BESTER WERT"
      }
    ],
    defaultPlan: "yearly",
    features: {
      free: [
        "Standard URL-Extraktion",
        "Basis Content-Generation",
        "3 Plattformen"
      ],
      premium: [
        "Premium URL-Extraktion mit JavaScript-Support",
        "Unbegrenzte Content-Generation",
        "Posts speichern & verwalten", 
        "Direct-Posting zu Social Media",
        "Priority Support"
      ]
    }
  },
  
  features: {
    linkedinPosting: {
      name: "LinkedIn Direct Posting",
      description: "Direkt zu LinkedIn posten",
      // Feature controlled server-side - token never exposed to client
      enabled: false,
      requiresAuth: true,
      requiresSubscription: true
    },
    postSaving: {
      name: "Posts speichern",
      description: "Generierte Posts speichern und verwalten",
      enabled: true,
      requiresAuth: true
    },
    multiPlatform: {
      name: "Multi-Platform Support",
      description: "LinkedIn, X und Instagram Support",
      enabled: true,
      requiresAuth: true
    },
    directPosting: {
      name: "Direct Social Media Posting",
      description: "Direkt zu sozialen Netzwerken posten",
      enabled: true,
      requiresAuth: true,
      requiresSubscription: true
    }
  },
  
  resend: {
    fromNoReply: "Social Transformer <noreply@transformer.social>",
    fromAdmin: "Social Transformer Team <team@transformer.social>"
  },
  
  theme: {
    primaryColor: "hsl(var(--primary))",
    accentColor: "hsl(var(--accent))", 
    brandColors: {
      gradient: "from-primary to-accent",
      hover: "from-primary/90 to-accent/90"
    }
  },
  
  auth: {
    loginUrl: "/signup",
    callbackUrl: "/app",
    redirectAfterAuth: "/app"
  },
  
  limits: {
    maxPostLength: {
      linkedin: 3000,
      x: 280,
      instagram: 2200
    },
    freeGenerationsPerDay: 3
  },
  
  env: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    baseUrl: import.meta.env.VITE_BASE_URL || 
             (import.meta.env.DEV ? "http://localhost:5173" : "https://transformer.social")
  }
};

/**
 * Get a specific Stripe plan by ID
 */
export function getStripePlan(planId: string): StripePlan | undefined {
  return config.stripe.plans.find(plan => plan.id === planId);
}

/**
 * Get the default/recommended Stripe plan
 */
export function getDefaultStripePlan(): StripePlan {
  return getStripePlan(config.stripe.defaultPlan) || config.stripe.plans[0];
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof AppConfig['features']): boolean {
  return config.features[featureName]?.enabled || false;
}

/**
 * Get payment link for a plan (fallback method)
 */
export function getPaymentLink(planId: string): string {
  const plan = getStripePlan(planId);
  return plan?.paymentLink || "";
}

/**
 * Get Stripe price ID for a plan (ShipFast pattern)
 */
export function getPriceId(planId: string): string {
  const plan = getStripePlan(planId);
  return plan?.priceId || "";
}

/**
 * Format price with German locale
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);

  return {
    isValid: missing.length === 0,
    missing
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    appwrite: {
      endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID
    },
    stripe: {
      paymentLinks: {
        yearly: import.meta.env.VITE_STRIPE_PAYMENT_LINK_YEARLY,
        monthly: import.meta.env.VITE_STRIPE_PAYMENT_LINK_MONTHLY,
        legacy: import.meta.env.VITE_STRIPE_PAYMENT_LINK
      }
    },
    tracking: {}
  };
}

// Validate environment on module load in development
if (config.env.isDevelopment) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('Missing required environment variables:', validation.missing);
  }
}

export default config;