import { createJWT } from './appwrite';

export type ExtractResult = {
  title?: string;
  byline?: string | null;
  excerpt?: string | null;
  content: string; // plain text
  length?: number;
  siteName?: string | null;
};

export type ExtractionStage = 'validating' | 'fetching' | 'processing' | 'complete' | 'error';

export type StageEvent = {
  stage: ExtractionStage;
  message?: string;
  data?: ExtractResult;
};

// Resolve base URL for API when running locally vs deployed
function apiBase() {
  // Use same origin during local dev/preview. In production, replace with your domain if needed.
  return '';
}

export async function extractFromUrl(url: string): Promise<ExtractResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const jwt = await createJWT();
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${apiBase()}/api/extract`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Extraction failed (${res.status}): ${t || res.statusText}`);
  }
  return res.json();
}

/**
 * Streaming extraction with real-time stage updates via SSE.
 * Calls onStage for each server-sent event (validating → fetching → processing → complete).
 * Returns the final ExtractResult or throws on error.
 */
export async function extractFromUrlStreaming(
  url: string,
  onStage: (event: StageEvent) => void,
): Promise<ExtractResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };

  const jwt = await createJWT();
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${apiBase()}/api/extract`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Extraction failed (${res.status}): ${t || res.statusText}`);
  }

  if (!res.body) {
    throw new Error('No response body for streaming');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result: ExtractResult | null = null;
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer (format: "data: {...}\n\n")
    const events = buffer.split('\n\n');
    // Keep the last incomplete chunk in buffer
    buffer = events.pop() || '';

    for (const eventStr of events) {
      const dataLine = eventStr.trim();
      if (!dataLine.startsWith('data: ')) continue;

      const json = dataLine.slice(6); // Remove "data: " prefix
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        // Malformed JSON - skip this event
        continue;
      }

      // Runtime validation: ensure parsed data has a valid stage field
      if (
        typeof parsed !== 'object' || parsed === null ||
        !('stage' in parsed) || typeof (parsed as Record<string, unknown>).stage !== 'string'
      ) {
        continue;
      }

      const event = parsed as StageEvent;
      onStage(event);

      if (event.stage === 'complete' && event.data) {
        result = event.data;
      }
      if (event.stage === 'error') {
        throw new Error(event.message || 'Extraction failed');
      }
    }
  }

  if (!result) {
    throw new Error('Stream ended without complete result');
  }

  return result;
}
