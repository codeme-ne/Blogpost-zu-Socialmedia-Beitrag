# Configuration System

Ship Fast-inspired central configuration system for Social Transformer, providing type-safe, maintainable app configuration.

## Structure

### `app.config.ts`
**Central App Configuration**
- Stripe plan definitions with pricing and features
- Feature flags for different app capabilities
- App metadata and branding
- URL configuration
- Limits and quotas
- Theme settings

**Key Functions:**
```typescript
import { getStripePlan, formatPrice, isFeatureEnabled } from '@/config/app.config';

// Get specific plan
const lifetimePlan = getStripePlan('lifetime');

// Format pricing in German locale
const price = formatPrice(99); // "99,00 €"

// Check feature availability
const hasPremiumExtraction = isFeatureEnabled('premiumExtraction');
```

### `env.config.ts`
**Environment Variable Management**
- Type-safe environment variable access
- Client and server-side validation
- Configuration helpers for different services
- Environment-specific settings

**Key Functions:**
```typescript
import { env, getAppwriteConfig, isDevelopment } from '@/config';

// Type-safe environment access (server-side only)
const apiKey = env.get('OPENROUTER_API_KEY');

// Service-specific configuration
const appwrite = getAppwriteConfig();

// Environment checks
if (env.isDev) {
  console.log('Development mode');
}
```

### `platforms.ts` 
**Platform Definitions**
- TypeScript types for supported platforms
- Platform labels and constants
- All platforms array

### `index.ts`
**Centralized Exports**
- Single import point for all configuration
- Clean, organized exports
- Type definitions

## Usage Examples

### Component Configuration
```typescript
import config, { getDefaultStripePlan, formatPrice } from '@/config';

export function PricingComponent() {
  const { plans } = config.stripe;
  const defaultPlan = getDefaultStripePlan();
  
  return (
    <div>
      <h2>{config.appName}</h2>
      <p>Starting at {formatPrice(defaultPlan.price)}</p>
      {plans.map(plan => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
```

### Environment Validation
```typescript
import { env } from '@/config';

// Validate on app startup
try {
  env.init(); // Throws if required vars missing
  console.log('✅ Environment validation passed');
} catch (error) {
  console.error('❌ Environment validation failed:', error);
}
```

### Feature Flags
```typescript
import { isFeatureEnabled } from '@/config';

function AdvancedFeature() {
  if (!isFeatureEnabled('premiumExtraction')) {
    return <PaywallModal />;
  }
  
  return <PremiumExtractionUI />;
}
```

## Benefits

### 1. **Maintainability**
- Single source of truth for all app configuration
- Type-safe configuration access prevents runtime errors
- Easy to update pricing, features, and settings in one place

### 2. **Developer Experience**
- IntelliSense support for all configuration options
- Clear documentation and JSDoc comments
- Validation with helpful error messages

### 3. **Ship Fast Pattern**
- Follows Ship Fast's excellent configuration structure
- Proven pattern for SaaS applications
- Easy to extend and modify

### 4. **German Localization**
- Built-in German currency formatting
- Proper locale handling for pricing
- German app descriptions and metadata

## Environment Variables

The system validates these environment variables:

**Required (Client):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Required (Server):**
- `OPENROUTER_API_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

**Recommended:**
- `VITE_STRIPE_PAYMENT_LINK_LIFETIME`
- `VITE_STRIPE_PAYMENT_LINK_MONTHLY`
- `FIRECRAWL_API_KEY`

## Migration from Scattered Config

Old pattern:
```typescript
// Scattered throughout components
const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
const price = new Intl.NumberFormat('de-DE', { 
  style: 'currency', 
  currency: 'EUR' 
}).format(99);
```

New pattern:
```typescript
// Central configuration
import { getDefaultStripePlan, formatPrice } from '@/config';

const plan = getDefaultStripePlan();
const price = formatPrice(plan.price);
```

## Future Enhancements

- [ ] A/B testing configuration
- [ ] Multi-language support expansion
- [ ] Dynamic configuration updates
- [ ] Configuration management UI
- [ ] Environment-specific feature flags

The configuration system provides a solid foundation for scaling Social Transformer while maintaining code quality and developer productivity.
