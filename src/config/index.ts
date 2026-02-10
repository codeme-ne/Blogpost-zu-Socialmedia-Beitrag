/**
 * Configuration Module Exports
 * Centralized access to all configuration utilities
 */

// Main app configuration
export { default as config } from './app.config';
export type { AppConfig, StripePlan, AppFeature } from './app.config';
export {
  getStripePlan,
  getDefaultStripePlan,
  isFeatureEnabled,
  getPaymentLink,
  formatPrice,
  validateEnvironment,
  getEnvironmentConfig
} from './app.config';

// Environment configuration
export {
  env,
  getEnvVar,
  getEnvVarWithFallback,
  isDevelopment,
  isProduction,
  getStripePaymentLinks,
  getAppwriteConfig,
  getLinkedInConfig,
  getClaudeConfig,
  getAppUrls,
  initializeEnvironment
} from '../lib/env-validation';
export type {
  EnvironmentVariables,
  EnvironmentValidationResult
} from '../lib/env-validation';

// Platform configuration
export type { Platform } from './platforms';
export { PLATFORM_LABEL, ALL_PLATFORMS } from './platforms';