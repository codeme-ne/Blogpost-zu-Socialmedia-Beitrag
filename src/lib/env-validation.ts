/**
 * Environment Configuration Utilities
 * Adapted for Appwrite Cloud
 */

export interface EnvironmentVariables {
  // Appwrite (required)
  VITE_APPWRITE_ENDPOINT: string;
  VITE_APPWRITE_PROJECT_ID: string;

  // Appwrite server-side
  APPWRITE_ENDPOINT?: string;
  APPWRITE_PROJECT_ID?: string;
  APPWRITE_API_KEY?: string;

  // OpenRouter AI (server-side only for security)
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  VITE_OPENROUTER_MODEL?: string;

  // Stripe (payment links)
  VITE_STRIPE_PAYMENT_LINK?: string;
  VITE_STRIPE_PAYMENT_LINK_YEARLY?: string;
  VITE_STRIPE_PAYMENT_LINK_MONTHLY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_SECRET_KEY?: string;

  // LinkedIn (server-side only for security, no VITE_ prefix)
  LINKEDIN_ACCESS_TOKEN?: string;
  LINKEDIN_AUTHOR_URN?: string;

  // App configuration
  VITE_DOMAIN_NAME?: string;
  VITE_BASE_URL?: string;
  VITE_SITE_URL?: string;
  VITE_SUPPORT_EMAIL?: string;
  VITE_APP_VERSION?: string;
}

export interface EnvironmentValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Required environment variables for basic functionality
 */
const REQUIRED_CLIENT_VARS: (keyof EnvironmentVariables)[] = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID'
];

/**
 * Required environment variables for server-side functionality
 */
const REQUIRED_SERVER_VARS: (keyof EnvironmentVariables)[] = [
  'OPENROUTER_API_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'APPWRITE_API_KEY'
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_VARS: (keyof EnvironmentVariables)[] = [
  'VITE_STRIPE_PAYMENT_LINK_YEARLY',
  'VITE_STRIPE_PAYMENT_LINK_MONTHLY'
];

/**
 * Lightweight check for required client env vars (no Zod).
 * For full schema validation, use validateClientEnvironment from @/config/env.config.
 */
export function checkRequiredClientVars(): EnvironmentValidationResult {
  const missing = REQUIRED_CLIENT_VARS.filter(varName => !getEnvVar(varName));
  const warnings = RECOMMENDED_VARS.filter(varName => !getEnvVar(varName));

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Validate server-side environment variables (Node.js)
 */
export function checkServerVars(): EnvironmentValidationResult {
  if (typeof process === 'undefined') {
    return { isValid: false, missing: ['Node.js environment required'], warnings: [] };
  }

  const missing = REQUIRED_SERVER_VARS.filter(varName => !process.env[varName]);
  const warnings: string[] = [];

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Get environment variable (works in both client and server)
 */
export function getEnvVar(varName: keyof EnvironmentVariables): string | undefined {
  // Client-side (Vite)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteEnv = (import.meta as any)?.env;
    if (viteEnv) {
      return viteEnv[varName];
    }
  }

  // Server-side (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[varName];
  }

  return undefined;
}

/**
 * Get environment variable with fallback
 */
export function getEnvVarWithFallback(
  varName: keyof EnvironmentVariables,
  fallback: string
): string {
  return getEnvVar(varName) || fallback;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return (
    getEnvVar('NODE_ENV' as keyof EnvironmentVariables) === 'development' ||
    (import.meta && import.meta.env && import.meta.env.DEV)
  );
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return (
    getEnvVar('NODE_ENV' as keyof EnvironmentVariables) === 'production' ||
    (import.meta && import.meta.env && import.meta.env.PROD)
  );
}

/**
 * Get all Stripe payment links
 */
export function getStripePaymentLinks() {
  return {
    yearly: getEnvVar('VITE_STRIPE_PAYMENT_LINK_YEARLY'),
    monthly: getEnvVar('VITE_STRIPE_PAYMENT_LINK_MONTHLY'),
    legacy: getEnvVar('VITE_STRIPE_PAYMENT_LINK') // fallback
  };
}

/**
 * Get Appwrite configuration
 */
export function getAppwriteConfig() {
  return {
    endpoint: getEnvVar('VITE_APPWRITE_ENDPOINT'),
    projectId: getEnvVar('VITE_APPWRITE_PROJECT_ID'),
    // Server-side only
    apiKey: getEnvVar('APPWRITE_API_KEY'),
  };
}

/**
 * Get LinkedIn configuration (server-side only)
 */
export function getLinkedInConfig() {
  if (typeof process !== 'undefined' && process.env) {
    return {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      authorUrn: process.env.LINKEDIN_AUTHOR_URN,
      isEnabled: !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN)
    };
  }

  return {
    accessToken: undefined,
    authorUrn: undefined,
    isEnabled: false
  };
}

/**
 * Get OpenRouter configuration (server-side only for security)
 */
export function getOpenRouterConfig() {
  return {
    serverApiKey: getEnvVar('OPENROUTER_API_KEY'),
    model: getEnvVarWithFallback('OPENROUTER_MODEL', getEnvVarWithFallback('VITE_OPENROUTER_MODEL', 'openrouter/auto')),
    isConfigured: !!getEnvVar('OPENROUTER_API_KEY')
  };
}

// Backward-compatible alias during migration.
export const getClaudeConfig = getOpenRouterConfig

/**
 * Get application URLs based on environment
 */
export function getAppUrls() {
  const baseUrl = getEnvVarWithFallback('VITE_BASE_URL',
    isDevelopment() ? 'http://localhost:5173' : 'https://transformer.social'
  );

  return {
    base: baseUrl,
    app: `${baseUrl}/app`,
    landing: baseUrl,
    signup: `${baseUrl}/signup`,
    settings: `${baseUrl}/settings`
  };
}

/**
 * Get application configuration
 */
export function getAppConfig() {
  return {
    supportEmail: getEnvVarWithFallback('VITE_SUPPORT_EMAIL', 'support@example.com'),
    version: getEnvVarWithFallback('VITE_APP_VERSION', '1.0.0'),
    domainName: getEnvVarWithFallback('VITE_DOMAIN_NAME', 'Social Transformer')
  };
}

/**
 * Initialize and validate environment on startup
 */
export function initializeEnvironment(): void {
  const validation = checkRequiredClientVars();

  if (!validation.isValid) {
    const errorMessage = `Missing required environment variables: ${validation.missing.join(', ')}`;

    if (isDevelopment()) {
      console.error('Environment Validation Failed:', errorMessage);
      console.error('Please check your .env file and ensure all required variables are set.');
    }

    throw new Error(errorMessage);
  }

  if (validation.warnings.length > 0 && isDevelopment()) {
    console.warn('Missing recommended environment variables:', validation.warnings.join(', '));
  }

  if (isDevelopment()) {
    console.log('Environment validation passed');
  }
}

/**
 * Export a typed interface for all environment access
 */
export const env = {
  // Getters
  get: getEnvVar,
  getWithFallback: getEnvVarWithFallback,

  // Configuration objects (lazy — evaluated on access, not at import time)
  get appwrite() { return getAppwriteConfig() },
  get openrouter() { return getOpenRouterConfig() },
  get claude() { return getClaudeConfig() },
  get linkedin() { return getLinkedInConfig() },
  get stripe() { return getStripePaymentLinks() },
  get urls() { return getAppUrls() },
  get app() { return getAppConfig() },

  // Environment checks (lazy)
  get isDev() { return isDevelopment() },
  get isProd() { return isProduction() },

  // Validation
  validate: checkRequiredClientVars,
  validateServer: checkServerVars,
  init: initializeEnvironment
} as const;
