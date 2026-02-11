import { ensureTracing, getTracer, SpanStatusCode } from './tracing.js';

interface GuardrailResult {
  factual_accuracy: number;
  source_fidelity: number;
  pii_detected: boolean;
  issues: string[];
}

const GUARDRAIL_PROMPT = `Du bist ein Quality-Assurance-System fuer Social-Media-Posts.

Du bekommst zwei Texte:
1. QUELLTEXT: Der originale Blogpost/Artikel
2. GENERIERTER POST: Ein daraus erstellter Social-Media-Post

Bewerte den generierten Post nach diesen Kriterien:

FACTUAL_ACCURACY (1-5):
- 5: Alle Fakten, Zahlen und Aussagen stimmen exakt mit dem Quelltext ueberein
- 4: Kleine Vereinfachungen, aber keine falschen Aussagen
- 3: Leichte Ungenauigkeiten oder uebertriebene Formulierungen
- 2: Mindestens eine falsche oder erfundene Behauptung
- 1: Mehrere erfundene Fakten oder grob falsche Aussagen

SOURCE_FIDELITY (1-5):
- 5: Post behandelt ausschliesslich Themen aus dem Quelltext
- 4: Post bleibt beim Thema, ergaenzt allgemein bekanntes Wissen
- 3: Post weicht teilweise vom Quelltext ab
- 2: Post enthaelt wesentliche Inhalte, die nicht im Quelltext stehen
- 1: Post hat kaum noch Bezug zum Quelltext

PII_DETECTED (true/false):
- true: Post enthaelt personenbezogene Daten wie E-Mail-Adressen, Telefonnummern, Adressen oder andere identifizierende Informationen aus dem Quelltext
- false: Keine personenbezogenen Daten erkannt

ISSUES: Liste konkret jedes gefundene Problem auf. Bei keinen Problemen: leeres Array.`;

const GUARDRAIL_SCHEMA = {
  type: 'object' as const,
  properties: {
    factual_accuracy: { type: 'integer' as const },
    source_fidelity: { type: 'integer' as const },
    pii_detected: { type: 'boolean' as const },
    issues: {
      type: 'array' as const,
      items: { type: 'string' as const },
    },
  },
  required: ['factual_accuracy', 'source_fidelity', 'pii_detected', 'issues'] as const,
  additionalProperties: false,
};

/**
 * Run a guardrail quality check on a generated post via OpenRouter.
 * Uses Claude Haiku for low cost and fast execution.
 * Logs results as OpenTelemetry span attributes for Dynatrace.
 *
 * Designed to run fire-and-forget — errors are caught and logged, never thrown.
 */
export async function runGuardrailCheck(
  sourceText: string,
  generatedPost: string,
  openRouterApiKey: string,
  origin: string | null
): Promise<GuardrailResult | null> {
  ensureTracing();
  const tracer = getTracer();
  const span = tracer.startSpan('guardrail-check', {
    attributes: {
      'gen_ai.system': 'openrouter',
      'gen_ai.operation.name': 'guardrail',
      'gen_ai.request.model': 'anthropic/claude-haiku-4-5-20251001',
      'guardrail.source_length': sourceText.length,
      'guardrail.post_length': generatedPost.length,
    },
  });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': origin || 'https://linkedin-posts-one.vercel.app',
        'X-Title': 'Social Transformer Guardrail',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5-20251001',
        max_tokens: 512,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `${GUARDRAIL_PROMPT}\n\n---\nQUELLTEXT:\n${sourceText.slice(0, 3000)}\n\n---\nGENERIERTER POST:\n${generatedPost}`,
        }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'guardrail_result',
            strict: true,
            schema: GUARDRAIL_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      span.setAttributes({
        'guardrail.error': `HTTP ${response.status}`,
      });
      span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
      span.end();
      return null;
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      span.setAttribute('guardrail.error', 'empty_response');
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Empty response' });
      span.end();
      return null;
    }

    const result: GuardrailResult = JSON.parse(content);

    // Compute pass/warn/fail label
    const minScore = Math.min(result.factual_accuracy, result.source_fidelity);
    const label = result.pii_detected
      ? 'fail'
      : minScore >= 4
        ? 'pass'
        : minScore >= 3
          ? 'warn'
          : 'fail';

    span.setAttributes({
      'guardrail.factual_accuracy': result.factual_accuracy,
      'guardrail.source_fidelity': result.source_fidelity,
      'guardrail.pii_detected': result.pii_detected,
      'guardrail.issues_count': result.issues.length,
      'guardrail.result': label,
      'gen_ai.usage.input_tokens': data.usage?.prompt_tokens || 0,
      'gen_ai.usage.output_tokens': data.usage?.completion_tokens || 0,
      'gen_ai.response.finish_reason': data.choices?.[0]?.finish_reason || '',
    });

    if (result.issues.length > 0) {
      span.setAttribute('guardrail.issues', JSON.stringify(result.issues));
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return result;
  } catch (error) {
    span.setAttribute('guardrail.error', String(error));
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    span.end();
    return null;
  }
}
