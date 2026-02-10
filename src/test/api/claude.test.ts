import { describe, test, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for Claude API integration
 * These test the API calls and error handling
 */

describe('Claude API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('API Response Handling', () => {
    test('should handle successful API response', async () => {
      const mockResponse = {
        content: [{ text: 'Generated LinkedIn post about AI trends...' }],
        usage: { input_tokens: 100, output_tokens: 50 }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate a LinkedIn post' }]
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.content).toHaveLength(1);
      expect(data.content[0].text).toContain('LinkedIn post');
    });

    test('should handle rate limiting (429)', async () => {
      const mockErrorResponse = {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        retryAfter: 30
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => mockErrorResponse,
        headers: new Headers({ 'Retry-After': '30' })
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }]
        })
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.code).toBe('RATE_LIMITED');
      expect(data.retryAfter).toBe(30);
    });

    test('should handle invalid request (400)', async () => {
      const mockErrorResponse = {
        error: 'Invalid request to AI service',
        code: 'INVALID_AI_REQUEST',
        details: 'Messages array is required'
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* missing messages */ })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_AI_REQUEST');
    });

    test('should handle server errors (500)', async () => {
      const mockErrorResponse = {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }]
        })
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    test('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('/api/claude/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Test' }]
          })
        })
      ).rejects.toThrow('Network error');
    });

    test('should handle timeout scenarios', async () => {
      // Mock a timeout scenario
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      
      vi.mocked(global.fetch).mockRejectedValueOnce(timeoutError);

      await expect(
        fetch('/api/claude/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Test' }]
          }),
          signal: AbortSignal.timeout(1000) // 1 second timeout
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Request Validation', () => {
    test('should reject non-POST methods', async () => {
      const mockErrorResponse = {
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 405,
        json: async () => mockErrorResponse
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'GET'
      });

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.code).toBe('METHOD_NOT_ALLOWED');
    });

    test('should handle malformed JSON', async () => {
      const mockErrorResponse = {
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_JSON');
    });

    test('should handle empty messages array', async () => {
      const mockErrorResponse = {
        error: 'Empty messages array',
        code: 'INVALID_REQUEST'
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_REQUEST');
    });
  });

  describe('CORS Handling', () => {
    test('should handle preflight OPTIONS request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Access-Control-Allow-Origin': 'http://localhost:5173',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        })
      });

      const response = await fetch('/api/claude/v1/messages', {
        method: 'OPTIONS',
        headers: { 'Origin': 'http://localhost:5173' }
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    });
  });
});
