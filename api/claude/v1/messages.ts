import { createCorsResponse, handlePreflight } from '../../utils/cors.js';
import { parseJsonSafely } from '../../utils/safeJson.js';
import { verifyJWT, getServerDatabases, DB_ID, Query } from '../../utils/appwrite.js';

export const config = {
  runtime: 'edge',
  regions: ['fra1'], // Frankfurt für niedrige Latenz in Europa
};

const DEFAULT_OPENROUTER_MODEL = (process.env.OPENROUTER_MODEL || 'openrouter/auto').trim() || 'openrouter/auto'
const FREE_GENERATIONS_PER_DAY = 3

function normalizeOpenRouterApiKey(rawKey: string | undefined): string | null {
  if (!rawKey) return null

  // Some env providers store secrets with escaped newlines.
  // OpenRouter keys must be single-line.
  const normalized = rawKey
    .replace(/\\n/g, '')
    .replace(/\r?\n/g, '')
    .trim()

  return normalized.length > 0 ? normalized : null
}

// Map Anthropic model names to OpenRouter model names
function mapModelToOpenRouter(model: string): string {
  const normalizedModel = model.trim()

  if (!normalizedModel) {
    return DEFAULT_OPENROUTER_MODEL
  }

  // Native OpenRouter model IDs are already in provider/model form.
  if (normalizedModel.includes('/')) {
    return normalizedModel
  }

  const modelMap: Record<string, string> = {
    'claude-3-5-sonnet-20241022': 'anthropic/claude-sonnet-4',
    'claude-3-5-sonnet-latest': 'anthropic/claude-sonnet-4',
    'claude-3-opus-20240229': 'anthropic/claude-3-opus',
    'claude-3-sonnet-20240229': 'anthropic/claude-3-sonnet',
    'claude-3-haiku-20240307': 'anthropic/claude-3-haiku',
    'claude-sonnet-4-20250514': 'anthropic/claude-sonnet-4',
    'claude-opus-4-20250514': 'anthropic/claude-opus-4',
  };

  return modelMap[normalizedModel] || `anthropic/${normalizedModel}`;
}

// Transform Anthropic-style request to OpenRouter format
function transformRequestToOpenRouter(body: Record<string, unknown>): Record<string, unknown> {
  const openRouterBody: Record<string, unknown> = {
    model: mapModelToOpenRouter((body.model as string | undefined) || DEFAULT_OPENROUTER_MODEL),
    messages: body.messages,
  };

  // Map common parameters
  if (body.max_tokens) openRouterBody.max_tokens = body.max_tokens;
  if (body.temperature !== undefined) openRouterBody.temperature = body.temperature;
  if (body.top_p !== undefined) openRouterBody.top_p = body.top_p;
  if (body.stop) openRouterBody.stop = body.stop;

  return openRouterBody;
}

// Transform OpenRouter response to Anthropic-style format (for client compatibility)
function transformResponseToAnthropic(openRouterResponse: Record<string, unknown>): Record<string, unknown> {
  const choices = openRouterResponse.choices as Array<{ message: { content: string; role: string } }>;

  if (!choices || choices.length === 0) {
    throw new Error('Invalid OpenRouter response: no choices');
  }

  const firstChoice = choices[0];
  const content = firstChoice.message?.content || '';

  // Transform to Anthropic format expected by the client
  return {
    id: openRouterResponse.id,
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: content }],
    model: openRouterResponse.model,
    stop_reason: firstChoice.finish_reason || null,
    usage: openRouterResponse.usage,
  };
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(origin);
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    return createCorsResponse({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are supported'
    }, { status: 405, origin });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createCorsResponse({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401, origin });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyJWT(token);
    if (!user) {
      return createCorsResponse({
        error: 'Invalid or expired token',
        code: 'AUTH_INVALID'
      }, { status: 401, origin });
    }

    // Server-side free tier enforcement: check subscription and daily usage
    const databases = getServerDatabases();
    const subs = await databases.listDocuments(DB_ID, 'subscriptions', [
      Query.equal('user_id', user.id),
      Query.equal('is_active', true),
      Query.limit(1),
    ]);
    const isPremium = subs.documents.length > 0;

    if (!isPremium) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const usage = await databases.listDocuments(DB_ID, 'generation_usage', [
        Query.equal('user_id', user.id),
        Query.greaterThanEqual('generated_at', todayStart.toISOString()),
        Query.limit(FREE_GENERATIONS_PER_DAY + 1),
      ]);
      if (usage.documents.length >= FREE_GENERATIONS_PER_DAY) {
        return createCorsResponse({
          error: 'Tageslimit erreicht. Upgrade auf Pro fuer unbegrenzte Generierungen.',
          code: 'FREE_TIER_LIMIT_REACHED'
        }, { status: 429, origin });
      }
    }

    // Validate and parse request body with size limit (100KB for AI prompts)
    const parseResult = await parseJsonSafely<{ messages?: unknown[]; [key: string]: unknown }>(req, 100 * 1024);
    if (!parseResult.success) {
      return createCorsResponse({
        error: parseResult.error,
        code: parseResult.error.includes('too large') ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON'
      }, { status: parseResult.error.includes('too large') ? 413 : 400, origin });
    }
    const body = parseResult.data;

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return createCorsResponse({
        error: 'Invalid request body - messages array required',
        code: 'INVALID_REQUEST',
        details: 'Request must include a "messages" array'
      }, { status: 400, origin });
    }

    if (body.messages.length === 0) {
      return createCorsResponse({
        error: 'Empty messages array',
        code: 'INVALID_REQUEST'
      }, { status: 400, origin });
    }

    // OpenRouter API Key from environment variable
    const apiKey = normalizeOpenRouterApiKey(process.env.OPENROUTER_API_KEY);

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      return createCorsResponse({
        error: 'OpenRouter is not configured',
        code: 'CONFIGURATION_ERROR',
        message: 'Set OPENROUTER_API_KEY in your environment variables'
      }, { status: 503, origin });
    }

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      // Transform request to OpenRouter format
      const openRouterBody = transformRequestToOpenRouter(body);

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': origin || 'https://linkedin-posts-one.vercel.app',
          'X-Title': 'Social Transformer',
        },
        body: JSON.stringify(openRouterBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle OpenRouter API errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: 'Unknown error' }
        }));

        // Rate limiting
        if (response.status === 429) {
          return createCorsResponse({
            error: 'Too many requests. Please try again in 30 seconds.',
            code: 'RATE_LIMITED',
            retryAfter: 30
          }, {
            status: 429,
            origin,
            headers: { 'Retry-After': '30' }
          });
        }

        // Bad request (invalid prompt, etc.)
        if (response.status === 400) {
          return createCorsResponse({
            error: 'Invalid request to AI service',
            code: 'INVALID_AI_REQUEST',
            details: errorData.error?.message || 'Request validation failed',
            type: errorData.error?.type || 'validation_error'
          }, { status: 400, origin });
        }

        // Authentication/authorization errors
        if (response.status === 401 || response.status === 403) {
          console.error('OpenRouter API authentication error:', response.status);
          return createCorsResponse({
            error: 'AI service authentication failed',
            code: 'AUTH_ERROR'
          }, { status: 503, origin });
        }

        // Server errors
        if (response.status >= 500) {
          console.error('OpenRouter API server error:', response.status, errorData);
          return createCorsResponse({
            error: 'AI service temporarily unavailable',
            code: 'SERVICE_ERROR',
            message: 'Please try again in a few moments'
          }, { status: 503, origin });
        }

        // Other errors
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      // Parse successful response
      const openRouterData = await response.json();

      // Transform OpenRouter response to Anthropic format for client compatibility
      const anthropicFormatData = transformResponseToAnthropic(openRouterData);

      // Record usage for free-tier tracking (fire-and-forget)
      if (!isPremium) {
        const { ID } = await import('node-appwrite');
        databases.createDocument(DB_ID, 'generation_usage', ID.unique(), {
          user_id: user.id,
          generated_at: new Date().toISOString(),
        }).catch(() => { /* non-critical */ });
      }

      return createCorsResponse(anthropicFormatData, { status: 200, origin });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return createCorsResponse({
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT',
          message: 'The request took too long to complete'
        }, { status: 408, origin });
      }

      // Network errors
      if (fetchError instanceof Error && fetchError.message.includes('fetch')) {
        console.error('Network error calling OpenRouter API:', fetchError);
        return createCorsResponse({
          error: 'Network error connecting to AI service',
          code: 'NETWORK_ERROR'
        }, { status: 502, origin });
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('Error in OpenRouter edge function:', error);

    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    return createCorsResponse({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error)
      })
    }, { status: 500, origin });
  }
}
