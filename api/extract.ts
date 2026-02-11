// Serverless function: Extract main article content from a URL using Jina Reader
// Simple, robust, and free content extraction

export const config = {
  runtime: 'edge', // Now using Edge runtime since no Node dependencies needed
  regions: ['fra1'], // Frankfurt for low latency in Europe
};

type ExtractResponse = {
  title?: string;
  byline?: string | null;
  excerpt?: string | null;
  content: string; // plain text/markdown
  length?: number;
  siteName?: string | null;
};

// Simple function to truncate content at common footer markers
function truncateContent(content: string): string {
  // End markers that usually indicate footer/archive sections
  const endMarkers = [
    // English - Newsletter specific
    'read past issues',
    'newsletter archive',
    'browse our archive',
    'subscribe',
    'unsubscribe',
    'view in browser',
    'forward to a friend',
    'forward to friend',
    'update preferences',
    'manage preferences',
    'email preferences',
    'update your preferences',
    'update subscription',
    'manage subscription',
    'why am i getting this',
    'you are receiving this',
    'sent to you because',
    'mailing list',
    
    // English - Blog specific
    'related posts',
    'you might also like',
    'you may also like',
    'see also',
    'continue reading',
    'read more posts',
    'more articles',
    'similar articles',
    'related articles',
    'recommended for you',
    'more from',
    
    // German - Newsletter specific
    'abmelden',
    'abbestellen',
    'newsletter abbestellen',
    'im browser ansehen',
    'im browser anzeigen',
    'an einen freund weiterleiten',
    'weiterleiten',
    'einstellungen verwalten',
    'einstellungen ändern',
    'präferenzen verwalten',
    'e-mail-einstellungen',
    'mehr anzeigen',
    
    // German - Blog specific
    'weitere artikel',
    'ähnliche beiträge',
    'verwandte artikel',
    'mehr lesen',
    'weiterlesen',
    'das könnte sie auch interessieren',
    'das könnte dich auch interessieren',
    'siehe auch',
    'empfohlene artikel',
    'mehr aus',
    'verwandte beiträge',
    
    // Common footer markers (multilingual)
    '©',
    'copyright',
    'impressum',
    'datenschutz',
    'privacy policy',
    'terms of service',
    'contact us',
    'kontakt',
    'about us',
    'über uns',
  ];
  
  // Search from 20% of content (newsletter archives can appear early)
  const searchStart = Math.floor(content.length * 0.2);
  const lowerContent = content.toLowerCase();
  
  for (const marker of endMarkers) {
    const index = lowerContent.indexOf(marker, searchStart);
    if (index !== -1) {
      return content.slice(0, index).trim();
    }
  }
  
  return content;
}

import { getCorsHeaders } from './utils/cors.js';
import { isUrlSafe } from './utils/urlValidation.js';
import { verifyJWT } from './utils/appwrite.js';
import { checkRateLimit, getClientIp } from './utils/rateLimit.js';

// SSE helper: format a Server-Sent Event
function sseEvent(stage: string, data?: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ stage, ...data })}\n\n`;
}

// Phase 1: Fetch raw content from Jina Reader
async function fetchFromJina(url: string, signal: AbortSignal): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

  // NOTE: Some Jina Reader edges reject custom browser User-Agent strings with 403.
  // Keep headers minimal and retry without custom extraction headers on auth/forbidden.
  let response = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/markdown, text/plain',
      'x-remove-selector': 'nav,header,footer,.newsletter,.subscribe,.archive,.sidebar,.social',
      'x-respond-with': 'markdown',
    },
    signal,
  });

  if (response.status === 401 || response.status === 403) {
    response = await fetch(jinaUrl, { signal });
  }

  if (!response.ok) {
    throw new Error(`Content extraction failed with status: ${response.status}`);
  }

  const content = await response.text();

  if (!content || content.trim().length < 100) {
    throw Object.assign(new Error('Could not extract meaningful content from the URL'), { statusCode: 422 });
  }

  return content;
}

// Phase 2: Process raw content into structured response
function processContent(rawContent: string, url: string): ExtractResponse {
  const content = truncateContent(rawContent);

  const titleMatch = content.match(/^#\s+(.+?)$/m);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  const urlObj = new URL(url);
  const siteName = urlObj.hostname.replace(/^www\./, '');

  const cleanContent = content.replace(/\n{3,}/g, '\n\n').trim();

  return {
    title,
    byline: null,
    excerpt: null,
    content: cleanContent,
    length: cleanContent.length,
    siteName,
  };
}

export default async function handler(req: Request) {
  // Get CORS headers
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Determine if client wants SSE streaming
  const wantsStream = req.headers.get('accept')?.includes('text/event-stream');

  try {
    // Rate limiting: 30 requests per minute per IP
    const ip = getClientIp(req);
    const rl = checkRateLimit(`extract:${ip}`, { maxRequests: 30, windowMs: 60_000 });
    if (rl.limited) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfterSeconds) },
      });
    }

    // Verify JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.split(' ')[1];
    const user = await verifyJWT(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { url } = (await req.json()) as { url?: string };

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // SSRF Protection: Validate URL safety
    const validation = isUrlSafe(url);
    if (!validation.safe) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // --- SSE STREAMING PATH ---
    if (wantsStream) {
      const stream = new ReadableStream({
        async start(streamController) {
          const encoder = new TextEncoder();
          const send = (stage: string, data?: Record<string, unknown>) => {
            streamController.enqueue(encoder.encode(sseEvent(stage, data)));
          };

          try {
            send('validating', { message: 'URL wird validiert...' });

            send('fetching', { message: 'Lade Webseite über Jina Reader...' });
            const rawContent = await fetchFromJina(url, controller.signal);
            clearTimeout(timeoutId);

            send('processing', { message: 'Verarbeite und bereinige Content...' });
            const payload = processContent(rawContent, url);

            send('complete', { data: payload });
          } catch (err) {
            clearTimeout(timeoutId);
            const isTimeout = err instanceof Error && err.name === 'AbortError';
            const message = isTimeout
              ? 'Request timed out. The page took too long to load.'
              : err instanceof Error ? err.message : 'Failed to extract content';
            send('error', { message });
          } finally {
            streamController.close();
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // --- NON-STREAMING FALLBACK ---
    try {
      const rawContent = await fetchFromJina(url, controller.signal);
      clearTimeout(timeoutId);
      const payload = processContent(rawContent, url);

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timed out. The page took too long to load.' }),
          { status: 504, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Extract error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to extract content';
    const statusCode = (error as { statusCode?: number }).statusCode || 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'Unable to extract content from this URL. Please ensure the URL is accessible and contains readable content.'
      }),
      {
        status: statusCode,
        headers: { ...cors, 'Content-Type': 'application/json' }
      }
    );
  }
}
