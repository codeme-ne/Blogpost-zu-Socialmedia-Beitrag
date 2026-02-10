// Vercel Function: File extraction (PDF/DOCX/Images OCR/Audio) → unified text
// Uses hosted providers so end users need no local setup.
// Providers (env-configured):
// - Unstructured API for documents/images OCR: UNSTRUCTURED_API_KEY, UNSTRUCTURED_API_URL (optional)
// - Deepgram for audio speech-to-text: DEEPGRAM_API_KEY

import { createCorsResponse, handlePreflight } from './utils/cors.js';

export const config = { runtime: 'edge' } as const;

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

function getEnv(name: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string | undefined> }).env) {
      return ((process as unknown as { env?: Record<string, string | undefined> }).env || {})[name];
    }
  } catch {
    // Environment variables not accessible
  }
  return undefined;
}

function chooseDocProvider() {
  const base = getEnv('UNSTRUCTURED_API_URL') || 'https://api.unstructuredapp.io';
  const key = getEnv('UNSTRUCTURED_API_KEY');
  return { base, key };
}

function chooseAudioProvider() {
  const key = getEnv('DEEPGRAM_API_KEY');
  return { key };
}

type UnstructuredElement = { text?: string; type?: string };
type ExtractResult = { text: string; title?: string; meta: Record<string, unknown> };

async function extractWithUnstructured(file: File): Promise<ExtractResult> {
  const { base, key } = chooseDocProvider();
  if (!key) {
    throw new Error('UNSTRUCTURED_API_KEY not configured');
  }
  const url = `${base.replace(/\/$/, '')}/general/v0/general?strategy=hi_res&ocr_languages=deu`;
  const form = new FormData();
  form.append('files', file, file.name);
  // Optional: languages hint e.g., 'deu'
  // form.append('ocr_languages', 'deu');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'unstructured-api-key': key,
      'Accept': 'application/json',
    },
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Unstructured error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  // data is typically an array of elements
  const elements: UnstructuredElement[] = Array.isArray(data) ? (data as UnstructuredElement[]) : [];
  const parts: string[] = [];
  let title: string | undefined;
  for (const el of elements) {
    const t = (el?.text ?? '').trim();
    if (t) parts.push(t);
    const et = String(el?.type || '');
    if (!title && /title|header/i.test(et) && t) title = t.split('\n')[0].slice(0, 140);
  }
  const text = parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text, title, meta: { provider: 'unstructured', elements: elements?.length ?? 0 } };
}

async function transcribeWithDeepgram(file: File): Promise<{ text: string; meta: Record<string, unknown> }> {
  const { key } = chooseAudioProvider();
  if (!key) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }
  const params = new URLSearchParams({ model: 'nova-2-general', smart_format: 'true', language: 'de' });
  const url = `https://api.deepgram.com/v1/listen?${params}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${key}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: (file as Blob).stream ? (file as Blob).stream() : file, // Edge supports Blob.stream()
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Deepgram error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data: unknown = await res.json();
  const dg = data as { 
    results?: { 
      channels?: { 
        alternatives?: { 
          transcript?: string; 
          paragraphs?: { transcript?: string } 
        }[] 
      }[] 
    }, 
    metadata?: { duration?: number } 
  };
  const alt = dg?.results?.channels?.[0]?.alternatives?.[0];
  const text = (alt?.paragraphs?.transcript || alt?.transcript || '').trim();
  return { text, meta: { provider: 'deepgram', duration: dg?.metadata?.duration } };
}

function pickKind(file: File): 'audio' | 'pdf' | 'docx' | 'image' | 'text' | 'unknown' {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || type.includes('officedocument.wordprocessingml.document')) return 'docx';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) return 'text';
  return 'unknown';
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handlePreflight(origin);
  }
  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, { status: 405, origin });
  }
  try {
    const form = await req.formData();
    const files = form.getAll('file').filter((v): v is File => v instanceof File);
    if (!files.length) {
      return createCorsResponse({ error: 'No file uploaded. Use field name "file".' }, { status: 400, origin });
    }
    const file = files[0];
    if (file.size > MAX_BYTES) {
      return createCorsResponse({ error: 'File too large. Max 20MB.' }, { status: 413, origin });
    }

    const kind = pickKind(file);
    const payload: ExtractResult = { text: '', title: undefined, meta: { kind, bytes: file.size } };

    if (kind === 'text') {
      payload.text = (await file.text()).trim();
    } else if (kind === 'audio') {
      const r = await transcribeWithDeepgram(file);
      payload.text = r.text;
      payload.meta = { ...payload.meta, ...r.meta };
    } else if (kind === 'pdf' || kind === 'docx' || kind === 'image' || kind === 'unknown') {
      // Route documents and images to Unstructured (unknown tries anyway)
      const r = await extractWithUnstructured(file);
      payload.text = r.text;
      payload.title = r.title;
      payload.meta = { ...payload.meta, ...r.meta };
    }

    if (!payload.text || payload.text.trim().length === 0) {
      return createCorsResponse({ error: 'Extraction produced empty text.' }, { status: 422, origin });
    }

    // Extract links from text for convenience (HTTP/HTTPS only)
    try {
      const linkSet = new Set<string>();
      const rx = /https?:\/\/[^\s<>"']+/gi;
      let m: RegExpExecArray | null;
      while ((m = rx.exec(payload.text)) !== null) {
        const url = m[0]
          .replace(/[)\]}>,.;:]+$/g, '') // trim trailing punctuation
          .replace(/^\((.*)\)$/g, '$1'); // trim wrapping parens
        try {
          const u = new URL(url);
          if (/^https?:$/.test(u.protocol)) linkSet.add(u.toString());
        } catch {
          // Invalid URL format, skip this link
        }
      }
      const links = Array.from(linkSet).slice(0, 100);
      payload.meta = { ...(payload.meta || {}), links };
    } catch { /* noop */ }

    return createCorsResponse(payload, { status: 200, origin });
  } catch (err: unknown) {
    console.error('extract-file error', err);
    const msg = (err as { message?: string })?.message || 'Internal error';
    return createCorsResponse({ error: msg }, { status: 500, origin });
  }
}
