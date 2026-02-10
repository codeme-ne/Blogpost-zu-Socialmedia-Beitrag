// Enhanced API client for Social Transformer
// Based on Ship Fast patterns, adapted for Appwrite auth and German UI

import { createJWT, signOut } from '../api/appwrite';
import { toast } from 'sonner';
import { OPENROUTER_CHAT_ENDPOINT } from '@/config/ai';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Make an API request with automatic error handling and auth injection
   */
  async request<T = unknown>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.timeout,
      skipAuth = false,
      skipErrorHandling = false
    } = options;

    // Build full URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add auth token if not skipped
    if (!skipAuth) {
      try {
        const jwt = await createJWT();
        if (jwt) {
          requestHeaders['Authorization'] = `Bearer ${jwt}`;
        }
      } catch {
        if (import.meta.env.DEV) console.warn('Failed to get auth token');
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Make the request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      const responseData = await this.handleResponse<T>(response, skipErrorHandling);
      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);

      if (!skipErrorHandling) {
        this.handleError(error);
      }
      
      throw error;
    }
  }

  /**
   * Handle fetch response with error checking
   */
  private async handleResponse<T>(
    response: Response, 
    skipErrorHandling: boolean
  ): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let responseData: unknown;
    
    try {
      if (isJson) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch {
      responseData = null;
    }

    // Handle successful responses
    if (response.ok) {
      // Extract data field if present (common API pattern)
      const data = responseData as Record<string, unknown> | null;
      return (data?.data ?? responseData) as T;
    }

    // Handle error responses
    if (!skipErrorHandling) {
      await this.handleHttpError(response, responseData);
    }

    // Create error object
    const errorData = responseData as Record<string, string> | null;
    const apiError: ApiError = {
      message: errorData?.message || errorData?.error || `HTTP ${response.status}`,
      status: response.status,
      code: errorData?.code
    };

    throw apiError;
  }

  /**
   * Handle HTTP errors with appropriate user feedback
   */
  private async handleHttpError(response: Response, responseData: unknown): Promise<void> {
    const status = response.status;
    const errData = responseData as Record<string, string> | null;
    const errorMessage = errData?.message || errData?.error;

    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        toast.error('Anmeldung erforderlich. Du wirst zur Anmeldung weitergeleitet...');

        // Sign out user and redirect to signup
        try {
          await signOut();
          window.location.href = '/signup';
        } catch {
          window.location.href = '/signup';
        }
        break;

      case 403:
        // Forbidden - usually means subscription needed
        if (errorMessage?.toLowerCase().includes('subscription') ||
            errorMessage?.toLowerCase().includes('upgrade') ||
            errorMessage?.toLowerCase().includes('plan')) {
          toast.error('Upgrade erforderlich. Diese Funktion ist nur für Pro-Nutzer verfügbar.');
        } else {
          toast.error('Zugriff verweigert. Überprüfe deine Berechtigung.');
        }
        break;

      case 404:
        toast.error('Seite oder Ressource nicht gefunden.');
        break;

      case 429:
        // Rate limited
        toast.error('Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.');
        break;

      case 500:
      case 502:
      case 503:
        if (errData?.code === 'CONFIGURATION_ERROR') {
          toast.error('OpenRouter ist nicht konfiguriert. Bitte OPENROUTER_API_KEY setzen.');
          break;
        }
        if (errData?.hint) {
          toast.error(`API nicht erreichbar. ${errData.hint}`);
          break;
        }
        toast.error(errorMessage || 'Serverfehler. Bitte versuche es später erneut.');
        break;

      case 504:
        toast.error('Serverfehler. Bitte versuche es später erneut.');
        break;

      default: {
        // Generic error message
        const message = errorMessage || `Fehler ${status}`;
        toast.error(message);
      }
    }
  }

  /**
   * Handle network and other errors
   */
  private handleError(error: unknown): void {
    if (error instanceof Error && error.name === 'AbortError') {
      toast.error('Anfrage-Timeout. Bitte versuche es erneut.');
    } else if (!navigator.onLine) {
      toast.error('Keine Internetverbindung. Überprüfe deine Verbindung.');
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      toast.error('Netzwerkfehler. Bitte versuche es später erneut.');
    } else {
      // Don't show toast for ApiError (already handled)
      if (!(error as ApiError).status) {
        if (import.meta.env.DEV) console.error('API Client Error:', error);
        toast.error('Unbekannter Fehler aufgetreten.');
      }
    }
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Create default API client instance
export const apiClient = new ApiClient({
  baseUrl: '', // Use relative URLs for same-origin requests
  timeout: 30000
});

// Export convenience functions
export const get = <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  apiClient.get<T>(endpoint, options);

export const post = <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient.post<T>(endpoint, body, options);

export const put = <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient.put<T>(endpoint, body, options);

export const del = <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  apiClient.delete<T>(endpoint, options);

export const patch = <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient.patch<T>(endpoint, body, options);

// Customer Portal specific function
export const createCustomerPortal = async (returnUrl: string): Promise<{ url: string }> => {
  return post('/api/stripe/create-portal', { returnUrl });
};

export const createCheckoutSession = async (data: {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> => {
  return post('/api/stripe/create-checkout', data);
};

export default apiClient;

// === OpenRouter helper with timeout ===
export interface OpenRouterMessageRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterMessageRequestBody {
  model: string;
  max_tokens: number;
  temperature?: number;
  messages: OpenRouterMessageRequestMessage[];
}

export interface OpenRouterContentBlock {
  type?: string;
  text: string;
}

export interface OpenRouterMessageResponse {
  id?: string;
  type?: string;
  role?: string;
  content: OpenRouterContentBlock[];
  stop_reason?: string | null;
  model?: string;
}

/**
 * Call OpenRouter via our Edge Function with timeout and basic headers.
 * Uses apiClient.post under the hood to leverage timeout/error handling.
 */
export async function generateOpenRouterMessage(
  body: OpenRouterMessageRequestBody,
  opts: { timeout?: number } = {}
): Promise<OpenRouterMessageResponse> {
  try {
    return await post<OpenRouterMessageResponse>(
      OPENROUTER_CHAT_ENDPOINT,
      body,
      {
        headers: {
          'anthropic-version': '2023-06-01',
        },
        timeout: opts.timeout ?? 25000,
        skipAuth: true,
      }
    );
  } catch (error) {
    const apiError = error as ApiError | undefined;

    if (apiError?.status === 404) {
      throw new Error('OpenRouter API-Route nicht gefunden. Starte `npm run dev:full` oder `npm run dev:api`.');
    }

    throw error;
  }
}

// Backward-compatible alias during migration.
export const generateClaudeMessage = generateOpenRouterMessage

export type ClaudeMessageRequestMessage = OpenRouterMessageRequestMessage
export type ClaudeMessageRequestBody = OpenRouterMessageRequestBody
export type ClaudeContentBlock = OpenRouterContentBlock
export type ClaudeMessageResponse = OpenRouterMessageResponse
