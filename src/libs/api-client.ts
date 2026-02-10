// Enhanced API client for Social Transformer
// Based on Ship Fast patterns, adapted for Appwrite auth and German UI

import { createJWT, signOut } from '../api/appwrite';
import { toast } from 'sonner';

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
  body?: any;
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
  async request<T = any>(
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
      } catch (error) {
        console.warn('Failed to get auth token:', error);
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

    let responseData: any;
    
    try {
      if (isJson) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      responseData = null;
    }

    // Handle successful responses
    if (response.ok) {
      // Extract data field if present (common API pattern)
      return responseData?.data ?? responseData;
    }

    // Handle error responses
    if (!skipErrorHandling) {
      await this.handleHttpError(response, responseData);
    }

    // Create error object
    const apiError: ApiError = {
      message: responseData?.error || responseData?.message || `HTTP ${response.status}`,
      status: response.status,
      code: responseData?.code
    };

    throw apiError;
  }

  /**
   * Handle HTTP errors with appropriate user feedback
   */
  private async handleHttpError(response: Response, responseData: any): Promise<void> {
    const status = response.status;
    const errorMessage = responseData?.error || responseData?.message;

    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        toast.error('Anmeldung erforderlich. Du wirst zur Anmeldung weitergeleitet...');

        // Sign out user and redirect to signup
        try {
          await signOut();
          window.location.href = '/signup';
        } catch (error) {
          console.error('Error signing out user:', error);
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
      case 504:
        // Server errors
        toast.error('Serverfehler. Bitte versuche es später erneut.');
        break;

      default:
        // Generic error message
        const message = errorMessage || `Fehler ${status}`;
        toast.error(message);
    }
  }

  /**
   * Handle network and other errors
   */
  private handleError(error: any): void {
    if (error.name === 'AbortError') {
      toast.error('Anfrage-Timeout. Bitte versuche es erneut.');
    } else if (!navigator.onLine) {
      toast.error('Keine Internetverbindung. Überprüfe deine Verbindung.');
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      toast.error('Netzwerkfehler. Bitte versuche es später erneut.');
    } else {
      // Don't show toast for ApiError (already handled)
      if (!(error as ApiError).status) {
        console.error('API Client Error:', error);
        toast.error('Unbekannter Fehler aufgetreten.');
      }
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Create default API client instance
export const apiClient = new ApiClient({
  baseUrl: '', // Use relative URLs for same-origin requests
  timeout: 30000
});

// Export convenience functions
export const get = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
  apiClient.get<T>(endpoint, options);

export const post = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
  apiClient.post<T>(endpoint, body, options);

export const put = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
  apiClient.put<T>(endpoint, body, options);

export const del = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
  apiClient.delete<T>(endpoint, options);

export const patch = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
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

// === Anthropic Claude helper with timeout ===
export interface ClaudeMessageRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeMessageRequestBody {
  model: string;
  max_tokens: number;
  temperature?: number;
  messages: ClaudeMessageRequestMessage[];
}

export interface ClaudeContentBlock {
  type?: string;
  text: string;
}

export interface ClaudeMessageResponse {
  id?: string;
  type?: string;
  role?: string;
  content: ClaudeContentBlock[];
  stop_reason?: string | null;
  model?: string;
}

/**
 * Call Claude via our Edge Function with timeout and basic headers.
 * Uses apiClient.post under the hood to leverage timeout/error handling.
 */
export async function generateClaudeMessage(
  body: ClaudeMessageRequestBody,
  opts: { timeout?: number } = {}
): Promise<ClaudeMessageResponse> {
  return post<ClaudeMessageResponse>(
    '/api/claude/v1/messages',
    body,
    {
      headers: {
        'anthropic-version': '2023-06-01',
      },
      timeout: opts.timeout ?? 25000,
      // Claude proxy doesn't require auth; skip to avoid unnecessary header
      skipAuth: true,
    }
  );
}